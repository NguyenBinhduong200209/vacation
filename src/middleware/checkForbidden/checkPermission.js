import Vacations from '#root/model/vacation/vacations';
import Albums from '#root/model/albums';
import _throw from '#root/utils/_throw';
import asyncWrapper from '#root/middleware/asyncWrapper';
import Posts from '#root/model/vacation/posts';

function checkPermission(type) {
  return asyncWrapper(async (req, res, next) => {
    const crUserId = req.userInfo._id;
    const id = req.params?.id || req.query?.id || req.body?.vacationId;
    const modelType = type || req.query?.type;

    if (['vacation', 'album', 'post'].includes(modelType)) {
      //Find document based on params id
      let result;
      switch (modelType) {
        case 'vacation':
          result = await Vacations.findById(id);
          break;

        case 'album':
          result = await Albums.findById(id);
          break;

        case 'post':
          //Find Post
          const foundPost = await Posts.findById(id);

          //Throw an error if cannot find post
          !foundPost && _throw({ code: 404, errors: [{ field: 'id', message: 'invalid' }], message: 'post not found' });

          //Find vacation based on vacationId in foundPost
          result = await Vacations.findById(foundPost.vacationId);
          break;

        default:
          break;
      }

      //Throw an error if cannot find Type
      !result && _throw({ code: 404, errors: [{ field: 'id', message: 'invalid' }], message: `${modelType} not found` });

      const { shareList, shareStatus, userId } = result;
      switch (shareStatus) {
        //Throw an error if userId login is not author of this modelType
        case 'onlyme':
          crUserId.toString() !== userId.toString() &&
            _throw({
              code: 403,
              errors: [{ field: 'shareList', message: `user have no permission to access this ${modelType}` }],
              message: 'Forbidden',
            });
          break;

        case 'protected':
          //Throw an error if userId login is not in shareList of this modelType
          !shareList.includes(crUserId) &&
            _throw({
              code: 403,
              errors: [{ field: 'shareList', message: `user is not in shareList of this ${modelType}` }],
              message: 'Forbidden',
            });
          break;

        default:
          break;
      }

      //Send result to next middleware
      req.doc = result;
    }

    next();
  });
}

export default checkPermission;
