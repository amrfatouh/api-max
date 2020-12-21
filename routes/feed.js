const express = require("express");

const feedController = require("../controllers/feed");

const feedRouter = express.Router();

feedRouter.get("/posts", feedController.getPosts);

feedRouter.post("/post", feedController.createPost);

module.exports = feedRouter;
