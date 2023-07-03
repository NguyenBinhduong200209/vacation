import asyncWrapper from '#root/middleware/asyncWrapper';
import _throw from '#root/utils/_throw';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const upload = asyncWrapper(async (req, res, next) => {
  //Throw an error if user has not uploaded any files
  !req.file && _throw({ code: 400, message: 'user has not upload yet' });

  //Create random unique Suffix
  const maxLength = 6;
  const ranNumber = Math.round(Math.random() * (Math.pow(10, maxLength) - 1));
  const uniqueSuffix = Date.now() + '-' + String(ranNumber).padStart(6, '0');

  //Define location to upload file
  const path = `${uniqueSuffix}/${req.file.originalname}`;
  const storageRef = ref(getStorage(), path);

  //Upload file
  const result = await uploadBytes(storageRef, req.file.buffer);

  //Get url and transmit url to next middleware
  const url = await getDownloadURL(result.ref);

  req.file.url = url;

  console.log('upload done');

  next();
});

export default upload;
