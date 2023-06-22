import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import errHandler from '#root/middleware/errHandler';
import authRoute from '#root/routes/user/auth';
import userinforRoute from '#root/routes/user/userinfor';
import friendRoute from '#root/routes/user/friend';
import locationRoute from '#root/routes/vacation/location';
import vacationRoute from '#root/routes/vacation/vacation';
import postRoute from '#root/routes/vacation/post';
import testRoute from '#root/routes/test';
import likeRoute from '#root/routes/interaction/like';
import commentRoute from '#root/routes/interaction/comment';
import searchRoute from '#root/routes/search/search';
import albumsRoute from '#root/routes/albums';
import resourceRoute from '#root/routes/resource';
import credentials from '#root/middleware/credentials';
import dbConnect from '#root/config/dbConnect';
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
app.use('/auth', authRoute);
app.use('/location', locationRoute);
app.use('/vacation', vacationRoute);
app.use('/post', postRoute);
app.use('/like', likeRoute);
app.use('/comment', commentRoute);
app.use('/search', searchRoute);
app.use('/userinfor', userinforRoute);
app.use('/friend', friendRoute);
app.use('/albums', albumsRoute);
app.use('/resource', resourceRoute);
app.use('/test', testRoute);

// use middleware for handling errors
app.use(errHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose.connection.once('open', () => console.log('Connected to MongoDB')).on('error', err => console.log(err));
});
