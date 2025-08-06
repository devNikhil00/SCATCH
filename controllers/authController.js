const userModel = require("../models/user-model");
const bcrypt = require("bcrypt");
const { generateToken } = require("../utils/generateToken");

// Register new user
const registerUser = async (req, res) => {
  try {
    const { email, fullname, password } = req.body;

    // Basic validation
    if (!email || !fullname || !password) {
      return res.status(400).send("All fields are required");
    }

    // Check if user already exists
    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(400).send("You already have an account, please login");
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Create user in DB
    const user = await userModel.create({
      email,
      fullname,
      password: hash,
    });

    // Generate JWT token
    const token = generateToken(user);

    // Send token in a cookie
    res.cookie("token", token, { httpOnly: true });
    return res.status(201).send("User registered successfully");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
};

// Login existing user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Basic validation
    if (!email || !password) {
      return res.status(400).send("Email and password are required");
    }

    // Find user by email
    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(400).send("Email or password is incorrect");
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send("Email or password is incorrect");
    }

    // Generate token
    const token = generateToken(user);
    res.cookie("token", token, { httpOnly: true });
    return res.redirect("/shop");
  } catch (error) {
    console.error(error);
    return res.status(500).send("Server error");
  }
};

// Logout user
const logout = (req, res) => {
  res.clearCookie("token"); // clear the auth cookie
  return res.redirect("/shop");
};

module.exports = { registerUser, loginUser, logout };
