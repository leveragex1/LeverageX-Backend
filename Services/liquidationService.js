const User = require('../Models/userModel');

const LIQUIDATION_DROP = 0.1;

async function checkLiquidation(stockName, currentPrice) {
  if (!Number.isFinite(currentPrice) || currentPrice < 0) {
    return;
  }

  const users = await User.find({ 'stocks.stockName': stockName });

  for (const user of users) {
    let modified = false;

    user.stocks = user.stocks.filter((position) => {
      if (position.stockName !== stockName) {
        return true;
      }

      const buyPrice = Number(position.buyPrice);
      if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
        return true;
      }

      const liquidationPrice = buyPrice * (1 - LIQUIDATION_DROP);
      if (currentPrice <= liquidationPrice) {
        modified = true;
        return false;
      }

      return true;
    });

    if (modified) {
      await user.save();
    }
  }
}

module.exports = { checkLiquidation, LIQUIDATION_DROP };
