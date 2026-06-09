const MAX_STOCK_VALUE = 1_000_000;
const MIN_STOCK_VALUE = 0.01;

function isValidStockNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= MIN_STOCK_VALUE && parsed <= MAX_STOCK_VALUE;
}

function validateStockFields({ price, a, b }) {
  if (!isValidStockNumber(price)) {
    return { ok: false, message: `Price must be between ${MIN_STOCK_VALUE} and ${MAX_STOCK_VALUE}.` };
  }
  if (!isValidStockNumber(a)) {
    return { ok: false, message: `A must be between ${MIN_STOCK_VALUE} and ${MAX_STOCK_VALUE}.` };
  }
  if (!isValidStockNumber(b)) {
    return { ok: false, message: `B must be between ${MIN_STOCK_VALUE} and ${MAX_STOCK_VALUE}.` };
  }
  return { ok: true };
}

function sanitizePrice(value, fallback = MIN_STOCK_VALUE) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  return Math.min(MAX_STOCK_VALUE, Math.max(MIN_STOCK_VALUE, parsed));
}

module.exports = {
  MAX_STOCK_VALUE,
  MIN_STOCK_VALUE,
  isValidStockNumber,
  validateStockFields,
  sanitizePrice,
};
