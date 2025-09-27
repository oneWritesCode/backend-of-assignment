dotenv.config();

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { userRoutes } from "./routes/user/index.js";
import { teamRoutes } from "./routes/team/index.js";
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    import { notesRoutes } from "./routes/notes/index.js";
import initializeDatabase from "./initDb.js";

const PORT = process.env.PORT || 3000;
const app = express();

app.use(cors({
    origin: 'http://localhost:5173', 
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());

initializeDatabase().catch(console.error);                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  

app.get("/health", (req, res) => {
    res.json({ status: "ok", message: "Team Management API is running" });
});

app.use("/api/users", userRoutes);
app.use("/api/teams", teamRoutes);
app.use("/api/notes", notesRoutes);

app.get("/", (req, res) => {
    res.json({ 
        message: "Team Management API", 
        endpoints: {
            "POST /api/users/register": "Register a new user account",
            "POST /api/users/login": "Login to access team data",
            "GET /api/users/profile": "Get user profile (requires token)",
            "POST /api/teams/create-team": "Create a new team",
            "POST /api/teams/join-team": "Join an existing team",
            "GET /api/teams/members": "Get team members (requires token)",
            "GET /api/teams/:teamName": "Get teams details (requires token)",
            "POST /api/notes/create": "Create a new note",
            "GET /api/notes/team/:teamName": "Get notes for a specific team",
            "GET /api/notes": "Get all notes",
            "GET /api/notes/:id": "Get a specific note by ID",
            "PUT /api/notes/:id": "Update a note",
            "DELETE /api/notes/:id": "Delete a note"
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`API Documentation: http://localhost:${PORT}`);
});