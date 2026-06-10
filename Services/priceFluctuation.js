const { sanitizePrice, isValidStockNumber } = require('../utils/stockValidation');
const { checkLiquidation } = require('./liquidationService');

const TREND_TARGET_UP = 100000;
const TREND_TARGET_DOWN = 0;
const TREND_BIAS = 0.88;
const TREND_MIN_STEP = 0.03;
const TREND_MAX_STEP = 0.12;

const state = global.__leveragePriceState || (global.__leveragePriceState = {
  intervalId: null,
  trendIntervalId: null,
  activeTrends: new Map(),
  models: [],
});

function trendKey(watchlistKey, stockId) {
  return `${watchlistKey}:${String(stockId)}`;
}

function setStockTrend(watchlistKey, stockId, trend) {
  const key = trendKey(watchlistKey, stockId);
  if (trend === 'up' || trend === 'down') {
    state.activeTrends.set(key, trend);
    return;
  }
  state.activeTrends.delete(key);
}

function getStockTrend(watchlistKey, stockId, stockDoc) {
  const key = trendKey(watchlistKey, stockId);
  if (state.activeTrends.has(key)) {
    return state.activeTrends.get(key);
  }

  const storedTrend = stockDoc?.priceTrend;
  if (storedTrend === 'up' || storedTrend === 'down') {
    state.activeTrends.set(key, storedTrend);
    return storedTrend;
  }

  return null;
}

function hasActiveTrend(watchlistKey, stockId) {
  return state.activeTrends.has(trendKey(watchlistKey, stockId));
}

function toNumber(value, fallback = NaN) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function roundPrice(value) {
  return Math.round(value * 100) / 100;
}

function randomStep() {
  return TREND_MIN_STEP + Math.random() * (TREND_MAX_STEP - TREND_MIN_STEP);
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

function stepTrendingPrice(currentPrice, targetPrice) {
  const delta = randomStep();
  const distanceToTarget = targetPrice - currentPrice;

  if (Math.abs(distanceToTarget) <= 0.01) {
    return targetPrice;
  }

  const moveTowardTarget = Math.random() < TREND_BIAS;
  const direction = moveTowardTarget
    ? (distanceToTarget >= 0 ? 1 : -1)
    : (distanceToTarget >= 0 ? -1 : 1);

  let nextPrice = currentPrice + direction * delta;

  if (targetPrice === TREND_TARGET_DOWN) {
    nextPrice = Math.max(TREND_TARGET_DOWN, nextPrice);
    if (nextPrice <= 0.01) {
      return TREND_TARGET_DOWN;
    }
  } else if (targetPrice === TREND_TARGET_UP) {
    nextPrice = Math.min(TREND_TARGET_UP, nextPrice);
    if (nextPrice >= TREND_TARGET_UP - 0.01) {
      return TREND_TARGET_UP;
    }
  }

  return nextPrice;
}

async function applyTrendingPrice(stock, trend, watchlistKey) {
  let currentPrice = toNumber(stock.price);
  if (!Number.isFinite(currentPrice)) {
    return stock;
  }

  const targetPrice = trend === 'up' ? TREND_TARGET_UP : TREND_TARGET_DOWN;
  currentPrice = stepTrendingPrice(currentPrice, targetPrice);
  const nextPrice = roundPrice(currentPrice);
  const reachedTarget = currentPrice === targetPrice;

  const update = reachedTarget
    ? { $set: { price: nextPrice }, $unset: { priceTrend: 1 } }
    : { $set: { price: nextPrice, priceTrend: trend } };

  await stock.constructor.findByIdAndUpdate(stock._id, update);

  if (reachedTarget) {
    setStockTrend(watchlistKey, stock._id, null);
    stock.priceTrend = undefined;
  } else {
    stock.priceTrend = trend;
  }

  stock.price = nextPrice;
  await checkLiquidation(stock.name, nextPrice);
  return stock;
}

async function applyNormalFluctuation(stock, aField, bField) {
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
  await checkLiquidation(stock.name, stock.price);
}

async function runTrendStep(Model, stockId, watchlistKey) {
  const stock = await Model.findById(stockId);
  if (!stock) {
    return null;
  }

  const trend = getStockTrend(watchlistKey, stockId, stock);
  if (trend !== 'up' && trend !== 'down') {
    return stock;
  }

  return applyTrendingPrice(stock, trend, watchlistKey);
}

async function setWatchlistTrend(watchlistKey, trend) {
  const config = state.models.find((entry) => entry.key === watchlistKey);
  if (!config) {
    return { updated: 0 };
  }

  const stocks = await config.Model.find();
  let updated = 0;

  for (const stock of stocks) {
    setStockTrend(watchlistKey, stock._id, trend);
    await config.Model.findByIdAndUpdate(stock._id, { $set: { priceTrend: trend } });
    await runTrendStep(config.Model, stock._id, watchlistKey);
    updated += 1;
  }

  return { updated };
}

async function processActiveTrends() {
  if (!state.activeTrends.size || !state.models.length) {
    return;
  }

  for (const [key, trend] of state.activeTrends.entries()) {
    const separatorIndex = key.indexOf(':');
    const watchlistKey = key.slice(0, separatorIndex);
    const stockId = key.slice(separatorIndex + 1);
    const config = state.models.find((entry) => entry.key === watchlistKey);

    if (!config) {
      continue;
    }

    try {
      const stock = await config.Model.findById(stockId);
      if (!stock) {
        setStockTrend(watchlistKey, stockId, null);
        continue;
      }

      await applyTrendingPrice(stock, trend, watchlistKey);
    } catch (error) {
      console.error(`Trend processing error for ${key}:`, error);
    }
  }
}

async function processNormalFluctuation() {
  for (const { key, Model, aField, bField } of state.models) {
    try {
      const stocks = await Model.find();
      for (const stock of stocks) {
        if (hasActiveTrend(key, stock._id)) {
          continue;
        }
        await applyNormalFluctuation(stock, aField, bField);
      }
    } catch (error) {
      console.error(`Normal fluctuation error for ${key}:`, error);
    }
  }
}

async function hydrateTrends() {
  for (const { key, Model } of state.models) {
    try {
      const stocks = await Model.find({ priceTrend: { $in: ['up', 'down'] } });
      for (const stock of stocks) {
        setStockTrend(key, stock._id, stock.priceTrend);
      }
    } catch (error) {
      console.error(`Failed to hydrate trends for ${key}:`, error);
    }
  }
}

function startPriceFluctuation(models) {
  state.models = models;

  if (state.intervalId) {
    clearInterval(state.intervalId);
  }
  if (state.trendIntervalId) {
    clearInterval(state.trendIntervalId);
  }

  hydrateTrends().catch((error) => {
    console.error('Trend hydration error:', error);
  });

  state.trendIntervalId = setInterval(() => {
    processActiveTrends().catch((error) => {
      console.error('Active trend loop error:', error);
    });
  }, 1000);

  state.intervalId = setInterval(() => {
    processNormalFluctuation().catch((error) => {
      console.error('Normal fluctuation loop error:', error);
    });
  }, 1000);
}

module.exports = {
  startPriceFluctuation,
  setStockTrend,
  setWatchlistTrend,
  runTrendStep,
};
