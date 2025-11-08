import { useState } from "react";

function PostForm({ onSubmit }) {
  const [header, setHeader] = useState("");
  const [image, setImage] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = () => {
    const newPost = {
      postId: Date.now(),
      postedById: 0,
      header,
      postedTime: new Date().toISOString(),
      image,
      description,
      likes: 1,
      dislikes: 0,
      views: 1,
    };

    onSubmit(newPost);

    setHeader("");
    setImage("");
    setDescription("");
  };

  return (
    <div className="form-container">
      <input
        className="form-input"
        placeholder="Post Title"
        value={header}
        onChange={(e) => setHeader(e.target.value)}
      />
      <input
        className="form-input"
        placeholder="Image"
        value={image}
        onChange={(e) => setImage(e.target.value)}
      />
      <textarea
        className="form-textarea"
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <button className="form-button" onClick={handleSubmit}>
        Post
      </button>
    </div>
  );
}

export default PostForm;
