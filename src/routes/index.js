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
import albumspagesRoute from '#root/routes/albumspages';
import resourceRoute from '#root/routes/resource/resource';
import notiRoute from '#root/routes/interaction/notification';
import statusRoute from '#root/routes/statusList';

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

  //Path related to album
  { path: '/albumpage', route: albumspagesRoute },
  { path: '/album', route: albumsRoute },

  //Other path
  { path: '/search', route: searchRoute },
  { path: '/list', route: statusRoute },
  { path: '/resource', route: resourceRoute },
  { path: '/test', route: testRoute },
];

export default pathArr;
