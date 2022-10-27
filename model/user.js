const mongoose = require('mongoose');

const transationModel = new mongoose.Schema({
    "sender": String,
    "receiver": String,
    "amount": Number,
    "status": String
});

const walletSchema = new mongoose.Schema({
    wallet_id: {
        type: String,
        unique: true,
        required: true
    },
    email: {
        type: String,
        unique: true,
        required: true
    },
    password: {
        type: String,
        default: false,
        required: true
    },
    balance: {
        type: Number,
        default: 0,
    },
    transactions: {
        type: [transationModel],
        default: []
    }
});

module.exports = mongoose.model("wallet", walletSchema)
