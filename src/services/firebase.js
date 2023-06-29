import admin from 'firebase-admin';
import path from 'path';
import { __dirname } from '#root/config/path';

admin.initializeApp({
  credential: admin.credential.cert(path.join(__dirname, 'config', 'firebase.json')),
  storageBucket: 'vacation-d50de.appspot.com',
});

export const bucket = admin.storage().bucket();
