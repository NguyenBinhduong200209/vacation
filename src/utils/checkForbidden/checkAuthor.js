import Vacations from '#root/model/vacation/vacations';
import Posts from '#root/model/vacation/posts';
import Comments from '#root/model/interaction/comments';
import _throw from '#root/utils/_throw';
import mongoose from 'mongoose';

async function checkAuthor({ modelType, modelId, userId }) {
  const model =
    modelType === 'vacation'
      ? 'Vacations'
      : modelType === 'post'
      ? 'Posts'
      : modelType === 'comment'
      ? 'Comments'
      : modelType === 'notification'
      ? 'Notifications'
      : undefined;

  !model &&
    _throw({
      code: 400,
      errors: [{ field: 'modelType', message: `invalid` }],
      message: 'invalid modelType',
    });

  const foundDoc = await mongoose.model(model).findById(modelId);
  //Throw an error if cannot find post based on id params
  !foundDoc &&
    _throw({
      code: 404,
      errors: [{ field: modelType, message: `${modelType}Id not found` }],
      message: `invalid ${modelType}Id`,
    });

  //Throw an error if user login is not author of this post
  foundDoc.userId.toString() !== userId.toString() &&
    _throw({
      code: 403,
      errors: [{ field: `${modelType}Id`, message: `user is not author of this ${modelType}` }],
      message: 'invalid userId',
    });

  return foundDoc;
}

export default checkAuthor;
