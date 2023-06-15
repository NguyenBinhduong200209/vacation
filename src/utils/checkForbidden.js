import Vacations from '#root/model/vacations';
import _throw from '#root/utils/_throw';

async function checkForbidden(foundUserId, vacationId) {
  try {
    const foundVacation = await Vacations.findById(vacationId);
    //Throw an error if cannot find vacation
    !foundVacation &&
      _throw({ code: 400, errors: [{ field: 'id', message: 'invalid' }], message: 'vacation not found' });

    const { shareList, shareStatus, userId } = foundVacation;
    switch (shareStatus) {
      //Throw an error if userId login is not author of this vacation
      case 'onlyme':
        foundUserId.toString() !== userId.toString() &&
          _throw({
            code: 403,
            errors: [{ field: 'shareList', message: 'user have no permission to access this vacation' }],
            message: 'Forbidden',
          });
        break;

      case 'protected':
        //Throw an error if userId login is not in shareList of this vacation
        !shareList.includes(foundUserId) &&
          _throw({
            code: 403,
            errors: [{ field: 'shareList', message: 'user is not in shareList of this vacation' }],
            message: 'Forbidden',
          });
        break;

      default:
        break;
    }

    //Return vacation found
    return foundVacation;
  } catch (error) {
    throw error;
  }
}

export default checkForbidden;
