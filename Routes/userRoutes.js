// routes/userRoutes.js
const express = require('express');

const {
  getUsers,
  getUserBalance,
  updateUserBalance,
  updateStockPrices,
  fetchStockPrices,
  sellStock,
  getUserStockPrices,
} = require('../Controllers/userController');
const User = require('../Models/userModel');
const WatchList1Stock = require('../Models/watchList1Model');
const WatchList2Stock = require('../Models/watchList2Model');
const { isValidStockNumber } = require('../utils/stockValidation');
const router = express.Router();

// Route to get all users (for admin or general use)
router.get('/', getUsers);

// Route to get user balance by userId
router.get('/balance/:userId', getUserBalance);

// Route to update user balance by userId
router.put('/balance/:userId', updateUserBalance);

// Route to update stock prices (admin task)
router.post('/stocks/update', updateStockPrices);

// Route to fetch stock prices for a user (for PnL page)
router.get('/stocks/:userId/prices', fetchStockPrices);

// Route to fetch user stocks (this route will return the user's stocks for the PnL page)
router.get('/stocks/:userId', async (req, res) => {
  const { userId } = req.params;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    res.status(200).json({
      stocks: user.stocks, // Assuming 'stocks' is an array in the User model
      balance: user.balance,
    });
  } catch (error) {
    console.error('Error fetching user stocks:', error);
    res.status(500).json({ message: 'Error fetching user stocks' });
  }
});

// Route to sell a stock and update user balance and stocks
router.post('/stocks/sell', sellStock);

const getCurrentStockPrice = async (stockName, watchlistType = 1) => {
  try {
    const Model = Number(watchlistType) === 2 ? WatchList2Stock : WatchList1Stock;
    const stock = await Model.findOne({ name: stockName });
    const price = Number(stock?.price);
    if (!isValidStockNumber(price)) {
      return null;
    }
    return price;
  } catch (error) {
    console.error('Error fetching stock price:', error);
    return null;
  }
};


// Direct sell stock route
// Direct sell stock route
router.post('/sell', async (req, res) => {
  const { userId, stockName, quantity, watchlistType, autoSell = false } = req.body;

  try {
    console.log("Received sell request:", { userId, stockName, quantity, watchlistType, autoSell });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const stock = user.stocks.find((s) => s.stockName === stockName);
    if (!stock) {
      console.log("Stock not found in portfolio");
      return res.status(404).json({ message: 'Stock not found in portfolio' });
    }

    if (stock.quantity < quantity) {
      console.log("Not enough stock to sell");
      return res.status(400).json({ message: 'Not enough stock to sell' });
    }

    const currentPrice = await getCurrentStockPrice(stockName, watchlistType);
    if (!currentPrice) {
      console.log("Unable to retrieve stock price");
      return res.status(500).json({ message: 'Unable to retrieve stock price' });
    }

    // Calculate sale amount
    const saleAmount = currentPrice * quantity;
    const nextBalance = Number(user.balance) + saleAmount;

    if (!Number.isFinite(nextBalance) || nextBalance < 0) {
      return res.status(400).json({ message: 'Invalid balance after sale' });
    }

    user.balance = nextBalance;

    // Update stock quantity or remove stock if fully sold
    if (stock.quantity > quantity) {
      stock.quantity -= quantity;
    } else {
      user.stocks = user.stocks.filter((s) => s.stockName !== stockName);
    }

    await user.save(); // Save updated user data
    console.log("Stock sold successfully", { updatedBalance: user.balance });
    res.status(200).json({ message: 'Stock sold successfully', updatedBalance: user.balance });
  } catch (error) {
    console.error('Error selling stock:', error);
    res.status(500).json({ message: 'Error selling stock', error: error.message });
  }
});



 

// Fetch stock prices for both WatchLists (used in PnL and WatchList)
router.get('/:userId/stock-prices', getUserStockPrices);

module.exports = router;