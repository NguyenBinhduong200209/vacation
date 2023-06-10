import mongoose from "mongoose";
import _throw from "#root/utils/throw";

const placeSchema = new mongoose.Schema({
    province: {
        type: mongoose.ObjectId,
        required: "province required",
    },
    city: {
        type: mongoose.ObjectId,
        required: "city required",
    },
    title: {
        type: String,
        required: "title required",
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
    description: {
        type: String,
        required: "Description required",
        trim: true,
        maxlength: 30000,
    },
    dateCreated: {
        type: Date,
        max: new Date(),
        required: "Date Created required",
    },
    image: {
        type: String,
        required: "Image required",
    },
    longitude: {
        type: Number,
        required: true,
    },
    latitude: {
        type: Number,
        required: true,
    },
});

const Place = mongoose.model("Place", placeSchema);

export default Place;
