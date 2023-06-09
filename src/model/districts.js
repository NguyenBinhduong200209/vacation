import mongoose from "mongoose";
import _throw from "#root/utils/throw";
import Cities from "#root/utils/cities";

const districtSchema = new mongoose.Schema({
  cityId: {
    type: mongoose.ObjectId,
    required: "cityId required",
    validate: async function (value) {
      const foundCity = await Cities.findById(value);
      !foundCity &&
        _throw({
          code: 400,
          errors: [{ field: "cityId", message: "invalid cityId" }],
          message: "invalid cityId",
        });
    },
  },
  title: {
    type: String,
    required: "district required",
  },
});

const Districts = mongoose.model("Districts", districtSchema);

export default Districts;
