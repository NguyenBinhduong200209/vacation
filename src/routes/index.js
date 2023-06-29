import express from 'express';
import verifyJWT from '#root/middleware/verifyJWT';
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
import notiRoute from '#root/routes/interaction/notification';

const pathArr = [
  //Path related to user
  { path: '/auth', route: authRoute },
  { path: '/userinfor', route: userinforRoute },
  { path: '/friend', route: friendRoute },

  //Path related to vacation
  { path: '/vacation', route: vacationRoute },
  { path: '/location', route: locationRoute },
  { path: '/post', route: postRoute },

  //Path related to interaction
  { path: '/like', route: likeRoute },
  { path: '/comment', route: commentRoute },
  { path: '/notification', route: notiRoute },

  //Other path
  { path: '/search', route: searchRoute },
  { path: '/resource', route: resourceRoute },
  { path: '/album', route: albumsRoute },
  { path: '/test', route: testRoute },
];

export default pathArr;
