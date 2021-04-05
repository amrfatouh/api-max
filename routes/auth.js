const authRouter = require("express").Router();
const { body } = require("express-validator");

const authController = require("../controllers/auth");

const User = require("../models/User");

authRouter.post(
  "/signup",
  [
    body("email")
      .isEmail()
      .custom((value) => {
        return User.findOne({ email: value }).then((user) => {
          if (user) return Promise.reject();
        });
      })
      .trim(),
    body("password").isLength({ min: 5 }),
  ],
  authController.postSignup
);

authRouter.post(
  "/login",
  [body("email").isEmail().trim(), body("password").isLength({ min: 5 })],
  authController.postLogin
);

module.exports = authRouter;
