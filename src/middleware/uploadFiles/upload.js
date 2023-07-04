import asyncWrapper from '#root/middleware/asyncWrapper';
import _throw from '#root/utils/_throw';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const handleUpload = asyncWrapper(async (req, res, next) => {
  //Throw an error if user has not uploaded any file
  !(req.file || req.files) && _throw({ code: 400, message: 'user has not upload yet' });

  //Convert to array if user upload one file
  const filesUpload = req.file ? [req.file] : req.files;

  //Create random unique Suffix
  const maxLength = 6;
  const ranNumber = Math.round(Math.random() * (Math.pow(10, maxLength) - 1));
  const uniqueSuffix = Date.now() + '-' + String(ranNumber).padStart(maxLength, '0');

  let filesArr = [];
  for (const file of filesUpload) {
    //Define location to upload file
    const path = `${uniqueSuffix}/${file.originalname}`;
    const storageRef = ref(getStorage(), path);

    //Upload file
    const result = await uploadBytes(storageRef, file.buffer);

    //Get url and transmit url to next middleware
    const url = await getDownloadURL(result.ref);

    //Add key url to each file of fileUpload
    file.url = url;

    //Push file to filesArr has already declared above
    filesArr.push(file);
  }

  //Send filesArr to next middleware
  req.filesArr = filesArr;

  //Next to middleware
  next();
});

export default handleUpload;
