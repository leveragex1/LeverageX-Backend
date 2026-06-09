const mongoose = require('mongoose');
const congratsSchema = new mongoose.Schema({
    Username: {
        type : String,
        required: true,
    },
    Pancard: {
        type : String,
        required: true,
    },
    UpiId: {
        type : String,
        required: true,
    }
})

const Congrats = mongoose.model('Congrats', congratsSchema);
module.exports = Congrats;