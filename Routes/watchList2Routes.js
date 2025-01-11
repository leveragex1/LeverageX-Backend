const express = require('express');
const router = express.Router();
const WatchList2Stock = require('../Models/watchList2Model'); // Correct model
const { startPriceFluctuation, buyStock } = require('../Controllers/watchList2Controller'); // Import fluctuation logic

// Fetch all stocks for WatchList2
router.get('/', async (req, res) => {
    try {
        const stocks = await WatchList2Stock.find();
        res.json(stocks);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// Add new stock to WatchList2
router.post('/', async (req, res) => {
    const stock = new WatchList2Stock({
        name: req.body.name,
        price: req.body.price,
        watchlist2_A: req.body.watchlist2_A,
        watchlist2_B: req.body.watchlist2_B
    });
    try {
        const newStock = await stock.save();
        res.status(201).json(newStock);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Update stock price and A/B values for WatchList2
router.put('/:id', async (req, res) => {
    const { A, B } = req.body; // Get A and B from request body
    try {
        // Find stock by ID and update A and B values
        const stock = await WatchList2Stock.findByIdAndUpdate(req.params.id, { watchlist2_A: A, watchlist2_B: B }, { new: true });
        
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ error: 'Error updating stock A and B values' });
    }
});

// Start price fluctuation when the route is initialized
startPriceFluctuation();

// Route to buy a stock
router.post('/buy', buyStock);

module.exports = router;
