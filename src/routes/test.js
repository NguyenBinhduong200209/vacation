import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import verifyJWT from '#root/middleware/verifyJWT';
import mongoose from 'mongoose';
import { setDoc, collection, getDoc, getDocs, query, where, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '#root/app';

const updatePost = async (req, res) => {
  const notiRef = collection(firestore, 'notifications');
  const querySnapshot = (await getDocs(notiRef)).docs.map(doc => Object.assign({ id: doc.id }, doc.data()));
  querySnapshot.forEach(item => {
    updateDoc(doc(notiRef, item.id), {
      isSeen: false,
    });
  });
  return res.json({ data: querySnapshot.length });
};

router.get('/', updatePost);

export default router;
