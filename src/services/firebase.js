import { initializeApp } from 'firebase/app';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: 'AIzaSyB8JHwvoLBqbVykDW6IxejPKrA3aYts20s',
  authDomain: 'vacation-social-media.firebaseapp.com',
  projectId: 'vacation-social-media',
  storageBucket: 'vacation-social-media.appspot.com',
  messagingSenderId: '136338690513',
  appId: '1:136338690513:web:51dc665792f7d7d97050f0',
  measurementId: 'G-38Z6R9PQDP',
};

// Initialize Firebase
const firebase = () => initializeApp(firebaseConfig);

export default firebase;
