import _throw from '#root/utils/_throw';
import mongoose from 'mongoose';
import asyncWrapper from '#root/middleware/asyncWrapper';

function checkAuthor({ modelType, field }) {
  return asyncWrapper(async (req, res, next) => {
    const userId = req.userInfo._id;
    const id = req.params?.id || req.query?.id;
    !field && (field = req.params?.field || req.query?.field);

    //Config model to findById
    !modelType &&
      (modelType = field
        ? field === 'cover'
          ? 'vacations'
          : field === 'avatar'
          ? 'users'
          : field === 'post'
          ? 'posts'
          : undefined
        : req.query?.type || req.params?.type);

    //Throw an error if value of modelType did not meed the condition
    (!modelType || !/(vacations|posts|users|resources|likes|comments)/.test(modelType)) &&
      _throw({ code: 400, errors: [{ field: 'type', message: 'invalid' }], message: 'invalid type' });

    //Only check Author for other model except User model
    if (modelType !== 'users') {
      //Throw an error if cannot find post based on id params
      const foundDoc = await mongoose.model(modelType).findById(id);

      !foundDoc &&
        _throw({
          code: 404,
          errors: [{ field: modelType, message: `${modelType}Id not found` }],
          message: `invalid ${type}Id`,
        });

      //Throw an error if user login is not author of this post
      foundDoc.userId.toString() !== userId.toString() &&
        _throw({
          code: 403,
          errors: [{ field: `${modelType}Id`, message: `user is not author of this ${modelType}` }],
          message: 'invalid userId',
        });

      req.doc = foundDoc;
    }

    next();
  });
}

export default checkAuthor;
