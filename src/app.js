import * as dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import express from 'express';
import mongoose from 'mongoose';
import errHandler from '#root/middleware/errHandler';
import authRoute from '#root/routes/auth';
import locationRoute from '#root/routes/location';
import vacationRoute from '#root/routes/vacation';
import postRoute from '#root/routes/post';
import testRoute from '#root/routes/test';
import credentials from '#root/middleware/credentials';
import dbConnect from '#root/config/dbConnect';
import userinforRoute from '#root/routes/userinfor';
import friendRoute from '#root/routes/friend';
import albumsRoute from '#root/routes/albums';


// create an instance of an Express application
const app = express();
// set the port number for the server to listen on
const PORT = 3100;

//Connect to database
await dbConnect();

//Handle options credentials check
app.use(credentials);

//build-in middleware to handle urlencoded data
app.use(express.urlencoded({ extended: true }));

// Enable Cross-Origin Resource Sharing
app.use(cors());

// Parse JSON request bodies
app.use(express.json());

// use router for handling requests
app.use('/auth', authRoute);
app.use('/location', locationRoute);
app.use('/vacation', vacationRoute);
app.use('/post', postRoute);
app.use('/test', testRoute);

//
app.use('/userinfor', userinforRoute);
app.use('/friend', friendRoute);
app.use('/albums', albumsRoute);
// use middleware for handling errors
app.use(errHandler);

// Start server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  mongoose.connection.once('open', () => console.log('Connected to MongoDB')).on('error', err => console.log(err));
});
