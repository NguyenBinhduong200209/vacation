import * as dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import errHandler from "#root/middleware/errHandler";
import authRoute from "#root/routes/auth";

// create an instance of an Express application
const app = express();
// set the port number for the server to listen on
const PORT = 3100;

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// use router for handling requests
app.use("/auth", authRoute);

// use middleware for handling errors
app.use(errHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose.connection
    .once("open", () => console.log("Connected to MongoDB"))
    .on("error", (err) => console.log(err));
});
