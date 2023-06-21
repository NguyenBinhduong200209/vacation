import Vacations from '#root/model/vacation/vacations';
import Posts from '#root/model/vacation/posts';
import Comments from '#root/model/interaction/comments';
import _throw from '#root/utils/_throw';

async function checkAuthor({ modelType, modelId, userId }) {
  switch (modelType) {
    case 'vacation':
      //Throw an error if cannot find post based on id params
      const foundVacation = await Vacations.findById(modelId);
      !foundVacation &&
        _throw({
          code: 404,
          errors: [{ field: modelType, message: `${modelType}Id not found` }],
          message: `invalid ${modelType}Id`,
        });

      //Throw an error if user login is not author of this post
      foundVacation.userId.toString() !== userId.toString() &&
        _throw({
          code: 403,
          errors: [{ field: `${modelType}Id`, message: `user is not author of this ${modelType}` }],
          message: 'invalid userId',
        });
      return foundVacation;

    case 'post':
      //Throw an error if cannot find post based on id params
      const foundPost = await Posts.findById(modelId);
      !foundPost &&
        _throw({
          code: 404,
          errors: [{ field: modelType, message: `${modelType}Id not found` }],
          message: `invalid ${modelType}Id`,
        });

      //Throw an error if user login is not author of this post
      foundPost.userId.toString() !== userId.toString() &&
        _throw({
          code: 403,
          errors: [{ field: `${modelType}Id`, message: `user is not author of this ${modelType}` }],
          message: 'invalid userId',
        });
      return foundPost;

    case 'comment':
      //Throw an error if cannot find comment based on id params
      const foundComment = await Comments.findById(modelId);
      !foundComment &&
        _throw({
          code: 404,
          errors: [{ field: modelType, message: `${modelType}Id not found` }],
          message: `invalid ${modelType}Id`,
        });

      //Throw an error if user login is not author of this comment
      foundComment.userId.toString() !== userId.toString() &&
        _throw({
          code: 403,
          errors: [{ field: `${modelType}Id`, message: `user is not author of this ${modelType}` }],
          message: 'invalid userId',
        });
      return foundComment;

    default:
      break;
  }
}

export default checkAuthor;
