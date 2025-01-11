const Stock = require('../Models/watchList2Model');
const User = require('../Models/userModel');

// Function to generate small alternating increments or decrements
function getSmallIncrementOrDecrement(currentPrice, targetPrice) {
  const direction = targetPrice > currentPrice ? 1 : -1;
  const change = Math.random() * 0.5 * direction;
  return currentPrice + change;
}

async function fluctuatePrice(stock) {
  let currentPrice = stock.price;
  const A = stock.watchlist2_A;
  const B = stock.watchlist2_B;

  if (A < B) {
    if (currentPrice < B) {
      currentPrice = getSmallIncrementOrDecrement(currentPrice, B);
      if (currentPrice >= B) currentPrice = B;
    } else {
      currentPrice = Math.random() * (B + 3 - (B - 3)) + (B - 3);
    }
  } else {
    if (currentPrice > B) {
      currentPrice = getSmallIncrementOrDecrement(currentPrice, B);
      if (currentPrice <= B) currentPrice = B;
    } else {
      currentPrice = Math.random() * (B + 3 - (B - 3)) + (B - 3);
    }
  }

  stock.price = currentPrice;
  await stock.save();
}

// Schedule price fluctuation for all WatchList2 stocks
function startPriceFluctuation() {
  setInterval(() => {
    Stock.find()
      .then(stocks => {
        stocks.forEach(fluctuatePrice);
      })
      .catch(err => {
        console.error('Error fetching stocks:', err);
      });
  }, 1000); // Run every 1 second (adjust as needed)
}

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
    const investedAmount = stock.price * quantity;

    // 4. Check if the user has enough balance
    if (user.balance < investedAmount) {
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // 5. Deduct balance and save the stock purchase to user's portfolio
    user.balance -= investedAmount;
    user.stocks.push({
      stockName: stock.name,  // Store stock name instead of stockId
      buyPrice: stock.price,
      quantity: quantity,
      investedAmount: investedAmount
    });

    await user.save();

    res.status(200).json({ message: 'Stock purchased successfully', updatedBalance: user.balance });
  } catch (error) {
    console.error('Error during stock purchase:', error);
    res.status(500).json({ message: 'Error purchasing stock' });
  }
};

// Endpoint to fetch all WatchList2 stocks with updated prices
const getStocks = async (req, res) => {
  try {
    const stocks = await Stock.find();
    res.status(200).json(stocks);
  } catch (error) {
    console.error('Error fetching stocks:', error);
    res.status(500).json({ message: 'Error fetching stocks' });
  }
};

module.exports = { startPriceFluctuation, buyStock, getStocks };
