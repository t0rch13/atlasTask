const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const userSchema = new Schema ({
    username: String,
    password: String,
    creation_date: Date,
    update_date: Date,
    weather_history: [
        {
            city: String,
            temp: Number,
            description: String,
            imgURL: String,
            coordinates: {
                lon: Number,
                lat: Number
            },
            feelsLike: Number,
            humidity: Number,
            windSpeed: Number,
            countryCode: String,
        }
    ]
});

const User = mongoose.model('User', userSchema);
module.exports = User;