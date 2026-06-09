const mongoose = require('mongoose');

const watchList1StockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    watchlist1_A: { type: Number, required: true },
    watchlist1_B: { type: Number, required: true }
});

module.exports = mongoose.model('WatchList1Stock', watchList1StockSchema);
