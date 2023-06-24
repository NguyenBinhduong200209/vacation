import Vacations from '#root/model/vacation/vacations';
import Albums from '#root/model/albums';
import _throw from '#root/utils/_throw';

async function checkForbidden({ crUserId, modelType, modelId }) {
  let result;
  switch (modelType) {
    case 'vacation':
      result = await Vacations.findById(modelId);
      break;

    case 'album':
      result = await Albums.findById(modelId);

    default:
      _throw({
        code: 400,
        errors: [{ field: modelType, message: `invalid ${modelType}Id` }],
        message: `invalid ${modelType}Id`,
      });
      break;
  }

  //Throw an error if cannot find modelType
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

  //Return model found
  return result;
}

export default checkForbidden;
