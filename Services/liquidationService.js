const User = require('../Models/userModel');

const LIQUIDATION_DROP = 0.1;
const LIQUIDATION_DELAY_MS = 3000;
const pendingLiquidations = new Map();

function pendingKey(userId, stockName) {
  return `${userId}:${stockName}`;
}

async function liquidateUserAccount(user) {
  user.balance = 0;
  user.stocks = [];
  user.isLiquidated = true;
  await user.save();
}

function isBreached(position, stockName, currentPrice) {
  if (position.stockName !== stockName) {
    return false;
  }

  const buyPrice = Number(position.buyPrice);
  if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
    return false;
  }

  return currentPrice <= buyPrice * (1 - LIQUIDATION_DROP);
}

async function checkLiquidation(stockName, currentPrice) {
  if (!Number.isFinite(currentPrice) || currentPrice < 0) {
    return;
  }

  const users = await User.find({
    'stocks.stockName': stockName,
    isLiquidated: { $ne: true },
  });

  for (const user of users) {
    const key = pendingKey(user._id, stockName);
    const breached = user.stocks.some((position) =>
      isBreached(position, stockName, currentPrice)
    );

    if (!breached) {
      if (pendingLiquidations.has(key)) {
        clearTimeout(pendingLiquidations.get(key));
        pendingLiquidations.delete(key);
      }
      continue;
    }

    if (pendingLiquidations.has(key)) {
      continue;
    }

    const timer = setTimeout(async () => {
      pendingLiquidations.delete(key);
      try {
        const freshUser = await User.findById(user._id);
        if (!freshUser || freshUser.isLiquidated) {
          return;
        }

        const stillHolding = freshUser.stocks.some(
          (position) => position.stockName === stockName
        );
        if (!stillHolding) {
          return;
        }

        const stock = await require('../Models/watchList1Model').findOne({ name: stockName });
        const latestPrice = Number(stock?.price);
        const stillBreached = freshUser.stocks.some((position) =>
          isBreached(position, stockName, latestPrice)
        );

        if (stillBreached) {
          await liquidateUserAccount(freshUser);
        }
      } catch (error) {
        console.error('Delayed liquidation error:', error);
      }
    }, LIQUIDATION_DELAY_MS);

    pendingLiquidations.set(key, timer);
  }
}

module.exports = {
  checkLiquidation,
  liquidateUserAccount,
  LIQUIDATION_DROP,
};
