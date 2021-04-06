const fs = require("fs");
const path = require("path");

const { validationResult } = require("express-validator");
const Post = require("../models/Post");
const User = require("../models/User");
const mongoose = require("mongoose")

const POSTS_PER_PAGE = 3;

exports.getPosts = async (req, res, next) => {
  try {
    const currentPage = +req.query.page || 1;
      const count = await Post.find().countDocuments();
    const lastPage = Math.ceil(count  /  POSTS_PER_PAGE) || 1;
    const pagination = {
      currentPage: currentPage,
      previousPage: currentPage - 1,
      nextPage: currentPage + 1,
      lastPage: lastPage,
      hasPrev: currentPage > 1,
      hasNext: currentPage < lastPage,
    };
    const posts = await Post.find()
      .skip((currentPage - 1) * POSTS_PER_PAGE).limit(POSTS_PER_PAGE);
    res.status(200).json({ posts, pagination });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
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
  
  try {
    await post.save()
    const user = await User.findOne({_id: req.userId})
    user.posts.push(post);
    await user.save();
    res.status(201).json({
      message: "post successfully created!",
      post: { title, content, imageUrl, creator: req.userId },
    });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.getPost = async (req, res, next) => {
  const postId = req.params.postId;
  try {
    const post = await Post.findOne({_id: postId})
    if (!post) {
      const error = new Error("post not found");
      error.statusCode = 404;
      throw error
    }
    res.json({post});
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
}

exports.updatePost = async (req,res,next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the inputs are invalid");
    error.statusCode = 422;
    error.errorSources = errors.array().map((e) => e.param);
    throw error;
  }
  
  try {
    const {title, content} = req.body;
    const postId = req.params.postId;
    const post = await Post.findOne({_id: postId})
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
    await post.save();
    res.json({post}) 
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
} 

exports.deletePost = async (req, res, next) => {
  try {
    const post = await Post.findOne({_id: req.params.postId})
    if (post.creator.toString() !== req.userId.toString()) {
      const error = new Error("you're not authorized to delete that post");
      error.statusCode = 401;
      throw error;
    } 
    deleteImage(post.imageUrl);
    await Post.deleteOne({_id: req.params.postId})
    const user = await User.findOne({_id: req.userId})
    user.posts.pull(req.params.postId);
    await user.save()
    res.json({message: "post deleted successfully"});
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
}

const deleteImage = (filePath) => {
  filePath = path.join(__dirname, "..", filePath);
  fs.unlink(filePath, err => console.log(err));
}
exports.deleteImage = deleteImage;
