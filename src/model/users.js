import mongoose from "mongoose";
import validator from "validator";
import _throw from "#root/utils/throw.js";

const userSchema = new mongoose.Schema({
  firstName: {
    type: String,
    trim: true,
    required: "Firstname required",
    minlength: 100,
    validate: (value) => {
      !validator.isAlpha(value, "vi-VN", { ignore: " -" }) && _throw(400, "Invalid firstname");
    },
  },
  lastName: {
    type: String,
    trim: true,
    required: "Lastname required",
    minlength: 100,
    validate: (value) => {
      !validator.isAlpha(value, "vi-VN", { ignore: " -" }) && _throw(400, "Invalid lastname");
    },
  },
  userName: {
    type: String,
    trim: true,
    required: "Username required",
    minlength: 100,
    validate: (value) => {
      !validator.isAlpha(value, "vi-VN", { ignore: "-_" }) && _throw(400, "Invalid username");
    },
  },
  email: {
    type: String,
    required: "Email required",
    validate: (value) => {
      !validator.isEmail(value) && _throw(400, "Invalid email");
    },
  },
  avatar: {
    type: String,
    required: "Avatar required",
  },
  dateOfBirth: {
    type: Date,
    min: new Date(),
    required: "Date of Birth required",
  },
  gender: {
    type: String,
    required: "Gender required",
    enum: ["Men", "Women"],
    default: "Men",
  },
  description: {
    type: String,
    minlength: 65000,
  },
  password: {
    type: String,
    minlength: 8,
    validate: (value) => {
      !validator.isStrongPassword(value) && _throw(400, "Password is weak");
    },
  },
});

const Users = mongoose.model("Users", userSchema);

export default Users;
