import express from 'express';
const router = express.Router();
import asyncWrapper from '#root/middleware/asyncWrapper';
import verifyJWT from '#root/middleware/verifyJWT';
import mongoose from 'mongoose';
import { setDoc, collection, getDoc, getDocs, query, where, doc } from 'firebase/firestore';
import { firestore } from '#root/app';

const updatePost = async (req, res) => {
  const notiRef = collection(firestore, 'notifications');
  const queryCondition = query(notiRef, where('modelId', '==', '6486f0b7bf997eadb3cfed12'));
  const foundDocument = (await getDocs(queryCondition)).docs.map(doc => Object.assign({ id: doc.id }, doc.data()));

  return res.json(foundDocument);
};

router.get('/', updatePost);

export default router;
