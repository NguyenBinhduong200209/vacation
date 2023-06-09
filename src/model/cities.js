import mongoose from "mongoose";
import _throw from "#root/utils/throw";

const citySchema = new mongoose.Schema({
  title: {
    type: String,
    required: "city required",
  },
});

const Cities = mongoose.model("Cities", citySchema);

export default Cities;
