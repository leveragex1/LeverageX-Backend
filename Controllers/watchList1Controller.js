const Stock = require('../Models/watchList1Model');
const User = require('../Models/userModel');
const { isValidStockNumber } = require('../utils/stockValidation');

const buyStock = async (req, res) => {
  const { userId, stockName, quantity } = req.body;

  try {
    // 1. Validate the user
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 2. Validate the stock by stockName
    const stock = await Stock.findOne({ name: stockName });
    if (!stock) return res.status(404).json({ message: 'Stock not found' });

    // 3. Calculate the total invested amount
    const stockPrice = Number(stock.price);
    const qty = Number(quantity);
    const investedAmount = stockPrice * qty;

    if (!isValidStockNumber(stockPrice)) {
      return res.status(400).json({ message: 'Stock price is invalid. Contact admin.' });
    }

    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: 'Invalid quantity' });
    }

    // 4. Check if the user has enough balance
    if (user.balance < investedAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 5. Deduct balance and save the stock purchase to user's portfolio
    user.balance -= investedAmount; // Deduct the amount
    user.stocks.push({
      stockName: stock.name, // Store stock name instead of stockId
      buyPrice: stock.price,
      quantity: qty,
      investedAmount: investedAmount
    });

    await user.save(); // Save user with updated balance and stocks

    res.status(200).json({ message: 'Stock purchased successfully', updatedBalance: user.balance });
  } catch (error) {
    console.error('Error during stock purchase:', error);
    res.status(500).json({ message: 'Error purchasing stock' });
  }
};


module.exports = { buyStock };
