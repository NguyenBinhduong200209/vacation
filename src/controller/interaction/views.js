import Views from '#root/model/interaction/views';
// import _throw from '#root/utils/_throw';

const viewController = {
  update: async ({ modelType, modelId, userId }) => {
    const foundView = await Views.findOne({ modelType, modelId, userId });

    //If view can be found, then increase view by 1, if view is already hit to max_view, then do not increase
    if (foundView) {
      if (foundView.quantity < process.env.MAX_VIEW) {
        foundView.quantity += 1;
        await foundView.save();
      }
      return foundView;
    }

    //If view not found, then create a new view with default view is 1
    else {
      const newView = await Views.create({ modelType, modelId, userId, createdAt: new Date() });
      return newView;
    }
  },
};

export default viewController;
