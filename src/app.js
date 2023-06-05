import * as dotenv from "dotenv";
dotenv.config();
import cors from "cors";
import express from "express";
import mongoose from "mongoose";
import errHandler from "#root/middleware/errHandler";
import dbConnect from "#root/config/dbConnect";

// Set up Express server
const app = express(); // create an instance of an Express application
const PORT = 3100; // set the port number for the server to listen on

await dbConnect();

// Enable Cross-Origin Resource Sharing
app.use(cors());

app.use(express.json()); // parse JSON request bodies

// use router for handling requests

// use middleware for handling errors
app.use(errHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose.connection
    .once("open", () => console.log("Connected to MongoDB"))
    .on("error", (err) => console.log(err));
});
