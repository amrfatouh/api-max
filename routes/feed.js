const express = require("express");
const { body } = require("express-validator");

const feedController = require("../controllers/feed");
const isAuth = require("../middlewares/is-auth");

const feedRouter = express.Router();

feedRouter.get("/posts", feedController.getPosts);

feedRouter.post(
  "/post",
  [
    body("title").isLength({ min: 5 }).trim(),
    body("content").isLength({ min: 5 }).trim(),
  ],
  isAuth,
  feedController.createPost
);

feedRouter.get("/post/:postId", feedController.getPost);

feedRouter.put(
  "/post/:postId",
  [
    body("title").isLength({ min: 5 }).trim(),
    body("content").isLength({ min: 5 }).trim(),
  ],
  isAuth,
  feedController.updatePost
);

feedRouter.delete("/post/:postId", isAuth, feedController.deletePost);

module.exports = feedRouter;
