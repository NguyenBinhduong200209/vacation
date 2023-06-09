import mongoose from "mongoose";
import _throw from "#root/utils/_throw";

const userUserSchema = new mongoose.Schema({
  userId1: {
    type: mongoose.ObjectId,
    required: "UserId required",
    validate: async (value) => {
      const foundUser = await Users.findById(value);
      !foundUser &&
        _throw({
          code: 400,
          errors: [{ field: "userId", message: "invalid userId" }],
          message: "invalid userId",
        });
    },
  },
  userId2: {
    type: mongoose.ObjectId,
    required: "UserId required",
    validate: async (value) => {
      const foundUser = await Users.findById(value);
      !foundUser &&
        _throw({
          code: 400,
          errors: [{ field: "userId", message: "invalid userId" }],
          message: "invalid userId",
        });
    },
  },
});

const User_User = mongoose.model("User_User", userUserSchema);

export default User_User;
