import mongoose from "mongoose";
import _throw from "#root/utils/_throw";
import Cities from "#root/utils/cities";
import Districts from "#root/utils/districts";

const locationSchema = new mongoose.Schema({
  districtId: {
    type: mongoose.ObjectId,
    required: "districtId required",
    validate: async function (value) {
      const foundDistrict = await Districts.findById(value);
      !foundDistrict &&
        _throw({
          code: 400,
          errors: [{ field: "districtId", message: "invalid districtId" }],
          message: "invalid districtId",
        });
      foundDistrict.cityId.toString() !== this.cityId.toString() &&
        _throw({
          code: 400,
          errors: [{ field: "districtId", message: "district not in city" }],
          message: "invalid districtId",
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

  title: {
    type: String,
    required: "title required",
    maxlength: 1000,
    trim: true,
  },

  description: {
    type: String,
    required: "description required",
    trim: true,
    maxlength: 65000,
  },

  longitude: {
    type: String,
    trim: true,
    required: "longitude required",
  },

  latitude: {
    type: String,
    trim: true,
    required: "latitude required",
  },

  createdAt: {
    type: Date,
    default: new Date(),
  },
});

const Locations = mongoose.model("Locations", locationSchema);

export default Locations;
