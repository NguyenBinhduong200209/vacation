import Vacations from '#root/model/vacations';
import Posts from '#root/model/posts';
import _throw from '#root/utils/_throw';

async function checkAuthor({ type, postId, vacationId, userId }) {
  try {
    switch (type) {
      case 'vacation':
        //Throw an error if cannot find post based on id params
        const foundVacation = await Vacations.findById(vacationId);
        !foundVacation &&
          _throw({ code: 400, errors: [{ field: 'id', message: 'vacationId not found' }], message: 'invalid id' });

        //Throw an error if user login is not author of this post
        foundVacation.userId.toString() !== userId.toString() &&
          _throw({
            code: 400,
            errors: [{ field: 'userId', message: 'user is not author of this vacation' }],
            message: 'invalid userId',
          });
        return foundVacation;

      case 'post':
        //Throw an error if cannot find post based on id params
        const foundPost = await Posts.findById(postId);
        !foundPost &&
          _throw({ code: 400, errors: [{ field: 'id', message: 'postId not found' }], message: 'invalid id' });

        //Throw an error if user login is not author of this post
        foundPost.userId.toString() !== userId.toString() &&
          _throw({
            code: 400,
            errors: [{ field: 'userId', message: 'user is not author of this post' }],
            message: 'invalid userId',
          });
        return foundPost;

      default:
        break;
    }
  } catch (error) {
    throw error;
  }
}

export default checkAuthor;
