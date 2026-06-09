const { sanitizePrice, isValidStockNumber } = require('../utils/stockValidation');

let intervalId = null;

function toNumber(value, fallback = NaN) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundPrice(value) {
  return Math.round(value * 100) / 100;
}

function clampAroundTarget(price, target) {
  const min = Math.max(0.01, target - 3);
  const max = target + 3;
  return Math.min(max, Math.max(min, price));
}

function stepTowardTarget(currentPrice, targetPrice) {
  const direction = targetPrice > currentPrice ? 1 : -1;
  return currentPrice + Math.random() * 0.5 * direction;
}

async function fluctuateStock(stock, aField, bField) {
  const A = sanitizePrice(toNumber(stock[aField]));
  const B = sanitizePrice(toNumber(stock[bField]));
  let currentPrice = sanitizePrice(toNumber(stock.price, B));

  if (!isValidStockNumber(A) || !isValidStockNumber(B) || !isValidStockNumber(currentPrice)) {
    return;
  }

  if (A < B) {
    if (currentPrice < B) {
      currentPrice = stepTowardTarget(currentPrice, B);
      if (currentPrice >= B) {
        currentPrice = B;
      }
    } else {
      currentPrice = clampAroundTarget(Math.random() * 6 + (B - 3), B);
    }
  } else if (A > B) {
    if (currentPrice > B) {
      currentPrice = stepTowardTarget(currentPrice, B);
      if (currentPrice <= B) {
        currentPrice = B;
      }
    } else {
      currentPrice = clampAroundTarget(Math.random() * 6 + (B - 3), B);
    }
  } else {
    currentPrice = clampAroundTarget(Math.random() * 6 + (B - 3), B);
  }

  stock.price = roundPrice(clampAroundTarget(currentPrice, B));
  await stock.save();
}

function startPriceFluctuation(models) {
  if (intervalId) {
    return;
  }

  intervalId = setInterval(async () => {
    for (const { Model, aField, bField } of models) {
      try {
        const stocks = await Model.find();
        for (const stock of stocks) {
          await fluctuateStock(stock, aField, bField);
        }
      } catch (error) {
        console.error('Price fluctuation error:', error);
      }
    }
  }, 1000);
}

module.exports = { startPriceFluctuation };
