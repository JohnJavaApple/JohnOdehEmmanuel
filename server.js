const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = "your_jwt_secret"; // Replace with a secure secret in production

// Middleware
app.use(express.json());
app.use(cors());

// MongoDB connection (replace <your_mongo_uri> with your MongoDB URI)
mongoose.connect("<your_mongo_uri>", { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

// User Schema
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true }
});
const User = mongoose.model("User", userSchema);

// Task Schema
const taskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  deadline: Date,
  priority: { type: String, enum: ["low", "medium", "high"], default: "low" },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }
});
const Task = mongoose.model("Task", taskSchema);

// User Registration
app.post("/auth/register", async (req, res) => {
  const { email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword });
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: "User registration failed" });
  }
});

// User Login
app.post("/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: "Invalid email or password" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, { expiresIn: "1h" });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: "Login failed" });
  }
});

// Authentication Middleware
const authenticate = (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Get All Tasks for Authenticated User
app.get("/tasks", authenticate, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.userId });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: "Failed to retrieve tasks" });
  }
});

// Create New Task
app.post("/tasks", authenticate, async (req, res) => {
  const { title, description, deadline, priority } = req.body;
  try {
    const task = await Task.create({ title, description, deadline, priority, userId: req.userId });
    res.status(201).json(task);
  } catch (error) {
    res.status(400).json({ error: "Failed to create task" });
  }
});

// Update a Task
app.put("/tasks/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  const { title, description, deadline, priority } = req.body;
  try {
    const task = await Task.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { title, description, deadline, priority },
      { new: true }
    );
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json(task);
  } catch (error) {
    res.status(400).json({ error: "Failed to update task" });
  }
});

// Delete a Task
app.delete("/tasks/:id", authenticate, async (req, res) => {
  const { id } = req.params;
  try {
    const task = await Task.findOneAndDelete({ _id: id, userId: req.userId });
    if (!task) return res.status(404).json({ error: "Task not found" });
    res.json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete task" });
  }
});

// Start the server
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
