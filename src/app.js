import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import errHandler from '#root/middleware/errHandler';
import credentials from '#root/middleware/credentials';
import dbConnect from '#root/config/dbConnect';
import pathArr from '#root/routes/index';
import path from 'path';
import { fileURLToPath } from 'url';

// create an instance of an Express application
const app = express();
// set the port number for the server to listen on
const PORT = 3100;

//build-in middleware for static files
const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const __publicPath = path.join(__dirname, '..', 'public');
app.use('/static', express.static(__publicPath));

//Connect to database
await dbConnect();

//Handle options credentials check
app.use(credentials);

//build-in middleware to handle urlencoded data
app.use(express.urlencoded({ extended: true, limit: '100kb' }));

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse JSON request bodies
app.use(express.json({ limit: '100kb' }));

// use router for handling requests
pathArr.forEach(({ path, route }) => app.use(path, route));

// use middleware for handling errors
app.use(errHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose.connection.once('open', () => console.log('Connected to MongoDB')).on('error', err => console.log(err));
});
