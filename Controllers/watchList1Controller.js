const Stock = require('../Models/watchList1Model');
const User = require('../Models/userModel');

// Function to generate small alternating increments or decrements
function getSmallIncrementOrDecrement(currentPrice, targetPrice) {
  const direction = targetPrice > currentPrice ? 1 : -1; // Decide increment or decrement based on target
  const change = Math.random() * 0.5 * direction; // Small change (average 0.5)
  return currentPrice + change;
}

async function fluctuatePrice(WatchList1Stock) {
  let currentPrice = WatchList1Stock.price;
  const A = WatchList1Stock.watchlist1_A;
  const B = WatchList1Stock.watchlist1_B;

  if (A < B) {
    // Case 1: A < B (Move from A to B with small increments/decrements)
    if (currentPrice < B) {
      currentPrice = getSmallIncrementOrDecrement(currentPrice, B);
      if (currentPrice >= B) currentPrice = B; // Stop at B
    } else {
      // After reaching B, fluctuate between B-3 and B+3
      currentPrice = Math.random() * (B + 3 - (B - 3)) + (B - 3);
    }
  } else {
    // Case 2: A > B (Move from A to B with small decrements/increments)
    if (currentPrice > B) {
      currentPrice = getSmallIncrementOrDecrement(currentPrice, B);
      if (currentPrice <= B) currentPrice = B; // Stop at B
    } else {
      // After reaching B, fluctuate between B-3 and B+3
      currentPrice = Math.random() * (B + 3 - (B - 3)) + (B - 3);
    }
  }

  // Update the stock price and save to the database
  WatchList1Stock.price = currentPrice;
  await WatchList1Stock.save();
}

// Schedule price fluctuation for all stocks
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
    user.balance -= investedAmount; // Deduct the amount
    user.stocks.push({
      stockName: stock.name, // Store stock name instead of stockId
      buyPrice: stock.price,
      quantity: quantity,
      investedAmount: investedAmount
    });

    await user.save(); // Save user with updated balance and stocks

    res.status(200).json({ message: 'Stock purchased successfully', updatedBalance: user.balance });
  } catch (error) {
    console.error('Error during stock purchase:', error);
    res.status(500).json({ message: 'Error purchasing stock' });
  }
};


module.exports = { startPriceFluctuation, buyStock };
