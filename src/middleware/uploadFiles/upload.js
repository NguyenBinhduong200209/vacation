import asyncWrapper from '#root/middleware/asyncWrapper';
import _throw from '#root/utils/_throw';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const upload = asyncWrapper(async (req, res, next) => {
  !(req.file || req.files) && _throw({ code: 400, message: 'user has not upload yet' });

  //Create random unique Suffix
  const maxLength = 6;
  const ranNumber = Math.round(Math.random() * (Math.pow(10, maxLength) - 1));
  const uniqueSuffix = Date.now() + '-' + String(ranNumber).padStart(6, '0');

  const filesArr = req.file ? [req.file] : req.files;

  let urlArr = [];
  for (const file of filesArr) {
    const path = `${uniqueSuffix}/${file.originalname}`;

    //Define location to upload file
    const storageRef = ref(getStorage(), path);

    //Upload file
    const result = await uploadBytes(storageRef, file.buffer);

    //Get url and transmit url to next middleware
    const url = await getDownloadURL(result.ref);
    urlArr.push(url);
  }

  req.url = urlArr;
  next();
});

export default upload;
