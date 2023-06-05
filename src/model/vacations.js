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
    minlength: 100,
    validate: (value) => {
      !validator.isAlpha(value, "vi-VN", { ignore: " -_" }) && _throw(400, "Invalid title");
    },
  },
  description: {
    type: String,
    required: "Description required",
    trim: true,
    minlength: 65000,
  },
  memberList: [
    {
      type: mongoose.ObjectId,
      validate: async (value) => {
        const foundUser = await Users.findOne(value);
        !foundUser && _throw(400, "Invalid MemberId");
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
        !foundUser && _throw(400, "Invalid MemberId");
      },
    },
  ],
  startingTime: {
    type: Date,
    required: "starting Time required",
    validate: (value) => {
      !validator.isDate(value) && _throw(400, "Invalid Date");
    },
  },
  endingTime: {
    type: Date,
    validate: (value) => {
      !validator.isDate(value) && _throw(400, "Invalid Date");
    },
  },
});

const Vacations = mongoose.model("Vacations", vacationSchema);

export default Vacations;
