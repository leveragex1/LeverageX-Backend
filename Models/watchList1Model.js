const mongoose = require('mongoose');

const watchList1StockSchema = new mongoose.Schema({
    name: { type: String, required: true },
    price: { type: Number, required: true },
    watchlist1_A: { type: Number, required: true },
    watchlist1_B: { type: Number, required: true },
    priceTrend: { type: String, enum: ['up', 'down'] },
});

let WatchList1Stock;
if (mongoose.models.WatchList1Stock) {
    WatchList1Stock = mongoose.model('WatchList1Stock');
    if (!WatchList1Stock.schema.paths.priceTrend) {
        WatchList1Stock.schema.add({ priceTrend: { type: String, enum: ['up', 'down'] } });
    }
} else {
    WatchList1Stock = mongoose.model('WatchList1Stock', watchList1StockSchema);
}

module.exports = WatchList1Stock;
