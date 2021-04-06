const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");

exports.postSignup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the inputs are invalid");
    error.statusCode = 422;
    error.errorSources = errors.array().map((e) => e.param);
    throw error;
  }

  try {
    const { email, password, name } = req.body;
    hashedPassword = await bcrypt.hash(password, 12);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    res.json({ message: "user added successfully" });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};

exports.postLogin = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new Error("the inputs are invalid");
    error.statusCode = 422;
    error.errorSources = errors.array().map((e) => e.param);
    throw error;
  }

  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });;;;
    if (!user) {
      const error = new Error("wrong email or password");
      error.statusCode = 401;
      throw error;
    }
    const isEqual = await bcrypt.compare(password, user.password);
    if (!isEqual) {
      const error = new Error("wrong email or password");
      error.statusCode = 401;
      throw error;
    }
    const token = jwt.sign(
      {
        email: loginUser.email,
        userId: loginUser._id.toString(),
      },
      "somesupersecretsecret",
      { expiresIn: "1h" }
    );
    res.json({ token: token, userId: loginUser._id.toString() });
  } catch (err) {
    if (!err.statusCode) err.statusCode = 500;
    next(err);
  }
};
