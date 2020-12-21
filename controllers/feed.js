exports.getPosts = (req, res, next) => {
  res.status(200).json({
    posts: [{ title: "1st post", content: "content of first post" }],
  });
};

exports.createPost = (req, res, next) => {
  const { title, content } = req.body;
  //do something with the data
  res.status(201).json({
    message: "post successfully created!",
    post: { id: new Date().toISOString(), title, content },
  });
};
