const mongoose = require('mongoose');

const watchList2StockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    watchlist2_A: { type: Number, required: true },
    watchlist2_B: { type: Number, required: true }
});

module.exports = mongoose.model('WatchList2Stock', watchList2StockSchema);
