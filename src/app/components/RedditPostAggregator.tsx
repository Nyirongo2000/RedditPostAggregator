"use client";
import React, { useState, useEffect, useCallback } from "react";

function RedditPostAggregator() {
  const [subreddits, setSubreddits] = useState("");
  const [posts, setPosts] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch top posts from a single subreddit
  const fetchTopPosts = useCallback(async (subreddit) => {
    try {
      const response = await fetch(
        `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=10`
      );
      if (!response.ok) {
        throw new Error(
          `Failed to fetch posts from r/${subreddit}. Status: ${response.status}`
        );
      }
      const data = await response.json();
      return data.data.children.map((post) => ({
        ...post.data,
        subreddit,
      }));
    } catch (error) {
      console.error(`Error fetching posts from r/${subreddit}:`, error);
      throw error; // Re-throw the error to handle it in the caller
    }
  }, []);

  // Fetch top posts from all subreddits
  const fetchAllPosts = useCallback(async () => {
    if (!subreddits.trim()) {
      setError("Please enter at least one subreddit.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const subredditList = subreddits
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s);

    try {
      const allPosts = await Promise.all(
        subredditList.map((subreddit) => fetchTopPosts(subreddit))
      );
      setPosts(allPosts.flat());
    } catch (error) {
      console.error("Error fetching posts:", error);
      setError(
        error.message.includes("404")
          ? `Subreddit not found: ${error.message}`
          : "An error occurred while fetching posts. Please try again later."
      );
    } finally {
      setIsLoading(false);
    }
  }, [subreddits, fetchTopPosts]);

  // Automatically fetch posts every week
  useEffect(() => {
    if (subreddits) {
      fetchAllPosts();
      const interval = setInterval(fetchAllPosts, 7 * 24 * 60 * 60 * 1000); // Refresh every week
      return () => clearInterval(interval);
    }
  }, [subreddits, fetchAllPosts]);

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1>Reddit Post Aggregator</h1>
      <p>
        Enter subreddits (comma-separated) to fetch the top 10 posts from each:
      </p>
      <input
        type="text"
        value={subreddits}
        onChange={(e) => setSubreddits(e.target.value)}
        placeholder="e.g., reactjs, javascript, webdev"
        aria-label="Enter subreddits"
        style={{ width: "100%", padding: "8px", marginBottom: "10px" }}
      />
      <button
        onClick={fetchAllPosts}
        disabled={isLoading}
        aria-label="Fetch posts"
        style={{
          padding: "8px 16px",
          backgroundColor: isLoading ? "#ccc" : "#0079d3",
          color: "#fff",
          border: "none",
          cursor: "pointer",
        }}
      >
        {isLoading ? "Fetching..." : "Fetch Posts"}
      </button>

      {error && <p style={{ color: "red", marginTop: "10px" }}>{error}</p>}

      <div style={{ marginTop: "20px" }}>
        {isLoading ? (
          <p>Loading posts...</p>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div
              key={post.id}
              style={{
                marginBottom: "20px",
                borderBottom: "1px solid #ccc",
                paddingBottom: "10px",
              }}
            >
              <h3>
                <a
                  href={`https://reddit.com${post.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read more about ${post.title}`}
                  style={{ color: "#0079d3", textDecoration: "none" }}
                >
                  {post.title}
                </a>
              </h3>
              <p>
                <strong>Subreddit:</strong> r/{post.subreddit} |{" "}
                <strong>Upvotes:</strong> {post.ups} |{" "}
                <strong>Comments:</strong> {post.num_comments}
              </p>
            </div>
          ))
        ) : (
          <p>No posts found.</p>
        )}
      </div>
    </div>
  );
}

export default React.memo(RedditPostAggregator);
