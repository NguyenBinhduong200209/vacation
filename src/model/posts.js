import mongoose from "mongoose";
import validator from "validator";
import _throw from "#root/utils/throw";
import Users from "#root/model/users";
import Vacations from "#root/model/vacations";
import Locations from "#root/model/locations";

const postSchema = new mongoose.Schema({
  vacationId: {
    type: mongoose.ObjectId,
    required: "vacationId required",
    validate: async (value) => {
      const foundVacation = await Vacations.findById(value);
      !foundVacation &&
        _throw({
          code: 400,
          errors: [{ field: "vacationId", message: "invalid vacationId" }],
          message: "invalid vacationId",
        });
    },
  },

  userId: {
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

  locationId: {
    type: mongoose.ObjectId,
    required: "locationId required",
    validate: async (value) => {
      const foundLocation = await Locations.findById(value);
      !foundLocation &&
        _throw({
          code: 400,
          errors: [{ field: "locationId", message: "invalid locationId" }],
          message: "invalid locationId",
        });
    },
  },

  title: {
    type: String,
    trim: true,
    required: "Title required",
    maxlength: 100,
    validate: (value) => {
      !validator.isAlpha(value, "vi-VN", { ignore: " -_" }) &&
        _throw({
          code: 400,
          errors: [{ field: "title", message: "invalid title" }],
          message: "invalid title",
        });
    },
  },

  content: {
    type: String,
    required: "content required",
    trim: true,
    maxlength: 65000,
  },

  subAlbum: [
    {
      type: String,
      validate: async (value) => {
        !validator.isURL(value) &&
          _throw({
            code: 400,
            errors: [{ field: "subAlbum", message: "upload failed" }],
            message: "upload failed",
          });
      },
    },
  ],

  createdAt: {
    type: Date,
  },

  lastUpdateAt: {
    type: Date,
    default: new Date(),
  },
});

const Posts = mongoose.model("Posts", postSchema);

export default Posts;
