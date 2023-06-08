import mongoose from "mongoose";
import validator from "validator";
import _throw from "#root/utils/throw";
import Users from "#root/model/users";

const vacationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.ObjectId,
    required: "UserId required",
    validate: async (value) => {
      const foundUser = await Users.findOne(value);
      !foundUser && _throw(400, "Invalid UserId");
    },
  },
  title: {
    type: String,
    trim: true,
    required: "Title required",
    maxlength: 100,
    validate: (value) => {
      !validator.isAlpha(value, "vi-VN", { ignore: " -_" }) && _throw(400, "Invalid title");
    },
  },
  description: {
    type: String,
    required: "Description required",
    trim: true,
    maxlength: 65000,
  },
  memberList: [
    {
      type: mongoose.ObjectId,
      validate: async (value) => {
        const foundUser = await Users.findOne(value);
        !foundUser &&
          _throw({
            code: 400,
            errors: [{ field: "memberId", message: "invalid userId" }],
            message: "invalid userId",
          });
      },
    },
  ],
  shareStatus: {
    type: String,
    required: "Share Status required",
    enum: ["public", "protected", "onlyme"],
    default: "public",
  },
  shareList: [
    {
      type: mongoose.ObjectId,
      validate: async (value) => {
        const foundUser = await Users.findOne(value);
        !foundUser &&
          _throw({
            code: 400,
            errors: [{ field: "memberId", message: "invalid userId" }],
            message: "invalid userId",
          });
      },
    },
  ],
  startingTime: {
    type: Date,
    required: "starting Time required",
    validate: (value) => {
      !validator.isDate(value) &&
        _throw({
          code: 400,
          errors: [{ field: "startingTime", message: "invalid time" }],
          message: "invalid time",
        });
    },
  },
  endingTime: {
    type: Date,
    validate: (value) => {
      !validator.isDate(value) &&
        _throw({
          code: 400,
          errors: [{ field: "endingTime", message: "invalid time" }],
          message: "invalid time",
        });
    },
  },
});

const Vacations = mongoose.model("Vacations", vacationSchema);

export default Vacations;
