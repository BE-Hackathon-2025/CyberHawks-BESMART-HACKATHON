import React from "react";
import { react } from "react";

const Posts = ({ post }) => {
  return (
    <>
      <article key={post.id} className="feed-item">
        <div className="feed-item-avatar">
          {(post.title || "C").charAt(0).toUpperCase()}
        </div>
        <div className="feed-item-content">
          <div className="feed-item-header">
            <span className="feed-item-title">
              {post.header || "Prototype Post Title"}
            </span>
            <span className="feed-item-meta">
              posted by{" "}
              <span className="feed-item-owner">{post.owner || "unknown"}</span>
            </span>
          </div>
          <div className="feed-item-body">
            <p>
              {post.description ||
                "Prototype content. Later, this will be a real event, deal, or opportunity."}
            </p>
          </div>
          
        </div>
      </article>
    </>
  );
};

export default Posts;
