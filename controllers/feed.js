const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");
const Post = require("../models/Post");
const User = require("../models/User");
const mongoose = require("mongoose")

const POSTS_PER_PAGE = 3;

exports.getPosts = (req, res, next) => {
  const currentPage = +req.query.page || 1;
  let pagination;

  Post.find().countDocuments().then(count => {
    const lastPage = Math.ceil(count/POSTS_PER_PAGE) || 1;
    console.log(count)
    console.log(lastPage);
    pagination = {
      currentPage: currentPage,
      previousPage: currentPage - 1,
      nextPage: currentPage + 1,
      lastPage: lastPage,
      hasPrev: currentPage > 1,
      hasNext: currentPage < lastPage
    };
    return Post.find().skip((currentPage - 1) * POSTS_PER_PAGE)
    .limit(POSTS_PER_PAGE)
  }).then(posts => {
    res.status(200).json({ posts, pagination });
  }).catch(err => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  })

  
};

exports.createPost = (req, res, next) => {
  const { title, content } = req.body;
  const image = req.file;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the inputs are invalid");
    error.statusCode = 422;
    error.errorSources = errors.array().map((e) => e.param);
    throw error;
  }

  if (!image) {
    const error = new Error("post image is missing");
    error.statusCode = 422;
    error.errorSources = ["image"];
    throw error;
  }

  const imageUrl = image.path;
  
  const post = new Post({
    _id: mongoose.Schema.Types.ObjectId(),
    title,
    content,
    imageUrl,
    creator: req.userId 
  });
  post.save().then((result) => {
    return User.findOne({_id: req.userId})
  }).then(user => {
    user.posts.push(post);
    return user.save();
  }).then(() => {
    res.status(201).json({
      message: "post successfully created!",
      post: { title, content, imageUrl, creator: req.userId },
    });
  })
  .catch(err => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  });
};

exports.getPost = (req, res, next) => {
  const postId = req.params.postId;
  Post.findOne({_id: postId}).then(post => {
    if (!post) {
      const error = new Error("post not found");
      error.statusCode = 404;
      throw error
    }
    res.json({post});
  }).catch(err => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  })
}

exports.updatePost = (req,res,next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the inputs are invalid");
    error.statusCode = 422;
    error.errorSources = errors.array().map((e) => e.param);
    throw error;
  }
  
  const {title, content} = req.body;
  const postId = req.params.postId;
  let updatedPost;
  Post.findOne({_id: postId}).then(post => {
    if (!post) {
      const error = new Error("post not found");
      error.statusCode = 404;
      throw error;
    }
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("you're not authorized to edit that post");
      error.statusCode = 401;
      throw error;
    } 
    let imageUrl = post.imageUrl;
    if (req.file) {
      deleteImage(imageUrl);
      imageUrl = req.file.path;
    }
    post.title = title;
    post.content = content;
    post.imageUrl = imageUrl;
    updatedPost = post;
    return post.save();
  })
  .then(() => { res.json({post: updatedPost}) })
  .catch(err => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  })
} 

exports.deletePost = (req, res, next) => {
  Post.findOne({_id: req.params.postId}).then((post) => {
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("you're not authorized to delete that post");
      error.statusCode = 401;
      throw error;
    } 
    deleteImage(post.imageUrl);
    return Post.deleteOne({_id: req.params.postId})
  }).then(() => {
    return User.findOne({_id: req.userId})
  }).then(user => {
    user.posts.pull(req.params.postId);
    return user.save()
  }).then(() => {
    res.json({message: "post deleted successfully"});
  }).catch (err => {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  });
}

const deleteImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, err => console.log(err));
}
exports.deleteImage = deleteImage;
