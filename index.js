// Load environment variables
dotenv.config();

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { userRoutes } from "./routes/user/index.js";
import { teamRoutes } from "./routes/team/index.js";
import initializeDatabase from "./initDb.js";

const PORT = process.env.PORT || 3000;
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database on startup
initializeDatabase().catch(console.error);

// Health check
app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Team Management API is running" });
});

// API Routes
app.use("/api/users", userRoutes);
// app.use("/api/teams", teamRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({ 
        message: "Team Management API", 
        endpoints: {
            "POST /api/users/register": "Register a new user account",
            "POST /api/users/login": "Login to access team data",
            "GET /api/users/profile": "Get user profile (requires token)",
            "POST /api/teams/create": "Create a new team",
            "POST /api/teams/join": "Join an existing team",
            "GET /api/teams/members": "Get team members (requires token)"
        }
    });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📋 API Documentation: http://localhost:${PORT}`);
});