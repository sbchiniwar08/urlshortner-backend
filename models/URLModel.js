const mongoose = require('mongoose');
const validator = require('validator');

const URLSchema = new mongoose.Schema({
    url:{
        type: String,
        required: true
    },
    shorturl:{
        type: String,
        required: true
    }
});
const urls = mongoose.model("url",URLSchema);
module.exports = urls;