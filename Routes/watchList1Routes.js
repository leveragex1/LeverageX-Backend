const express = require('express');
const router = express.Router();
const WatchList1Stock = require('../Models/watchList1Model');
const { buyStock } = require('../Controllers/watchList1Controller');
const { validateStockFields } = require('../utils/stockValidation');

const parseNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
};

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
    const name = String(req.body.name || '').trim();
    const price = parseNumber(req.body.price);
    const watchlist1_A = parseNumber(req.body.watchlist1_A);
    const watchlist1_B = parseNumber(req.body.watchlist1_B);

    if (!name || price === null || watchlist1_A === null || watchlist1_B === null) {
        return res.status(400).json({ message: 'Valid stock name, price, A, and B values are required.' });
    }

    const validation = validateStockFields({ price, a: watchlist1_A, b: watchlist1_B });
    if (!validation.ok) {
        return res.status(400).json({ message: validation.message });
    }

    const stock = new WatchList1Stock({
        name,
        price,
        watchlist1_A,
        watchlist1_B
    });
    try {
        const newStock = await stock.save();
        res.status(201).json(newStock);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

router.put('/:id', async (req, res) => {
    const A = parseNumber(req.body.A);
    const B = parseNumber(req.body.B);

    if (A === null || B === null) {
        return res.status(400).json({ error: 'Valid A and B values are required.' });
    }

    const validation = validateStockFields({ price: B, a: A, b: B });
    if (!validation.ok) {
        return res.status(400).json({ error: validation.message });
    }

    try {
        const stock = await WatchList1Stock.findByIdAndUpdate(
            req.params.id,
            { watchlist1_A: A, watchlist1_B: B },
            { new: true }
        );
        
        if (!stock) {
            return res.status(404).json({ error: 'Stock not found' });
        }
        res.status(200).json(stock);
    } catch (error) {
        res.status(500).json({ error: 'Error updating stock A and B values' });
    }
});

// Route to buy a stock
router.post('/buy', buyStock);

module.exports = router;
