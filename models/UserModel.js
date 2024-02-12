const mongoose = require('mongoose');
const { Schema, Types } = mongoose;
const ObjectId = Schema.ObjectId;

const userSchema = new Schema ({
    username: String,
    password: String,
    creation_date: Date,
    update_date: Date,
    is_admin: Boolean
});

const userRequestSchema = new Schema ({
    user: ObjectId,
    request_route: String,
    request_data: String,
    timestamp: Date,
    response_data: Schema.Types.Mixed
});


const User = mongoose.model('User', userSchema);
const UserRequest = mongoose.model('UserRequest', userRequestSchema);
module.exports = {User, UserRequest};