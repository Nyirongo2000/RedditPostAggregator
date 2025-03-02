"use client";
import React, { useState, useEffect, useCallback } from "react";

// Define the type for a Reddit post
interface RedditPost {
  id: string;
  title: string;
  ups: number;
  num_comments: number;
  permalink: string;
  subreddit: string;
}

// Define the type for the Reddit API response
interface RedditApiResponse {
  data: {
    children: {
      data: {
        id: string;
        title: string;
        ups: number;
        num_comments: number;
        permalink: string;
      };
    }[];
  };
}

function RedditPostAggregator() {
  const [subreddits, setSubreddits] = useState("");
  const [posts, setPosts] = useState<RedditPost[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch top posts from a single subreddit
  const fetchTopPosts = useCallback(
    async (subreddit: string): Promise<RedditPost[]> => {
      try {
        const response = await fetch(
          `https://www.reddit.com/r/${subreddit}/top.json?t=week&limit=10`
        );
        if (!response.ok) {
          throw new Error(
            `Failed to fetch posts from r/${subreddit}. keep searching `
            // `Failed to fetch posts from r/${subreddit}. Status: ${response.status}`
          );
        }
        const data: RedditApiResponse = await response.json();
        return data.data.children.map((post) => ({
          id: post.data.id,
          title: post.data.title,
          ups: post.data.ups,
          num_comments: post.data.num_comments,
          permalink: post.data.permalink,
          subreddit: subreddit,
        }));
      } catch (error) {
        console.error(`Error fetching posts from r/${subreddit}:`, error);
        throw error; // Re-throw the error to handle it in the caller
      }
    },
    []
  );

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
        error instanceof Error && error.message.includes("404")
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
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-4">Reddit Post Aggregator</h1>
      <p className="text-gray-700 mb-4">
        Enter subreddits (comma-separated) to fetch the top 10 posts from each:
      </p>
      <input
        type="text"
        value={subreddits}
        onChange={(e) => setSubreddits(e.target.value)}
        placeholder="e.g., reactjs, javascript, webdev"
        aria-label="Enter subreddits"
        className="w-full p-2 border border-gray-300 rounded-md mb-4"
      />
      <button
        onClick={fetchAllPosts}
        disabled={isLoading}
        aria-label="Fetch posts"
        className={`px-4 py-2 rounded-md text-white ${
          isLoading
            ? "bg-gray-400 cursor-not-allowed"
            : "bg-blue-900 hover:bg-blue-800"
        }`}
      >
        {isLoading ? "Fetching..." : "Fetch Posts"}
      </button>

      {error && <p className="text-red-500 mt-4">{error}</p>}

      <div className="mt-6">
        {isLoading ? (
          <p className="text-gray-700">Loading posts...</p>
        ) : posts.length > 0 ? (
          posts.map((post) => (
            <div key={post.id} className="mb-6 pb-4 border-b border-gray-200">
              <h3 className="text-xl font-semibold">
                <a
                  href={`https://reddit.com${post.permalink}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Read more about ${post.title}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {post.title}
                </a>
              </h3>
              <p className="text-gray-600">
                <strong>Subreddit:</strong> r/{post.subreddit} |{" "}
                <strong>Upvotes:</strong> {post.ups} |{" "}
                <strong>Comments:</strong> {post.num_comments}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-700">No posts found.</p>
        )}
      </div>
    </div>
  );
}

export default React.memo(RedditPostAggregator);
