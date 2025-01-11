const express = require('express');
const router = express.Router();
const WatchList1Stock = require('../Models/watchList1Model');
const { startPriceFluctuation, buyStock } = require('../Controllers/watchList1Controller');

// Fetch all stocks for WatchList1
router.get('/', async (req, res) => {
    try {
        const stocks = await WatchList1Stock.find();
        res.json(stocks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new stock to WatchList1
router.post('/', async (req, res) => {
    const stock = new WatchList1Stock({
        name: req.body.name,
        price: req.body.price,
        watchlist1_A: req.body.watchlist1_A,
        watchlist1_B: req.body.watchlist1_B
    });
    try {
        const newStock = await stock.save();
        res.status(201).json(newStock);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const { A, B } = req.body; // Get A and B from request body
    try {
        // Find stock by ID and update A and B values
        const stock = await WatchList1Stock.findByIdAndUpdate(req.params.id, { watchlist1_A: A, watchlist1_B: B }, { new: true });
        
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ error: 'Error updating stock A and B values' });
    }
});

// Start price fluctuation
startPriceFluctuation();

// Route to buy a stock
router.post('/buy', buyStock);

module.exports = router;
