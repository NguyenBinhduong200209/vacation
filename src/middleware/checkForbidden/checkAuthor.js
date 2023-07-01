import _throw from '#root/utils/_throw';
import mongoose from 'mongoose';
import asyncWrapper from '#root/middleware/asyncWrapper';

function checkAuthor(type) {
  return asyncWrapper(async (req, res, next) => {
    const userId = req.userInfo._id;
    const { id } = req.params;

    const modelType = type || req.query.type;

    const model =
      modelType === 'vacation'
        ? 'Vacations'
        : modelType === 'post'
        ? 'Posts'
        : modelType === 'comment'
        ? 'Comments'
        : modelType === 'notification'
        ? 'Notifications'
        : modelType === 'resource'
        ? 'Resources'
        : undefined;

    !model &&
      _throw({
        code: 400,
        errors: [{ field: 'modelType', message: `invalid` }],
        message: 'invalid modelType',
      });

    //Throw an error if cannot find post based on id params
    const foundDoc = await mongoose.model(model).findById(id);
    !foundDoc &&
      _throw({
        code: 404,
        errors: [{ field: type, message: `${type}Id not found` }],
        message: `invalid ${type}Id`,
      });

    //Throw an error if user login is not author of this post
    foundDoc.userId.toString() !== userId.toString() &&
      _throw({
        code: 403,
        errors: [{ field: `${type}Id`, message: `user is not author of this ${type}` }],
        message: 'invalid userId',
      });

    req.doc = foundDoc;
    next();
  });
}

export default checkAuthor;
