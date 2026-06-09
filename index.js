// index.js
const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();
require('./Models/db'); // Ensure database connection

// Import routes
const AuthRouter = require('./Routes/authRoutes.js');
const plansRouter = require('./Routes/plansRouter');
const stockRoutes = require('./Routes/stockRoutes.js');
const userRoutes = require('./Routes/userRoutes.js');
const watchList1Routes = require('./Routes/watchList1Routes.js');
const watchList2Routes = require('./Routes/watchList2Routes.js');
const pnlRoute = require('./Routes/pnlRoute.js');
const Congrats = require('./Models/congrats.js');
const Balance = require('./Models/BalanceHistory.js');

const payoutRoutes = require('./Routes/payout.js');
const WatchList1Stock = require('./Models/watchList1Model');
const WatchList2Stock = require('./Models/watchList2Model');
const { startPriceFluctuation } = require('./Services/priceFluctuation');

const PORT = process.env.PORT || 8080;

// CORS configuration to allow requests from multiple domains, including local dev
const allowedOrigins = [
  // 'https://leveragex.onrender.com',  // Old domain
  // 'https://leveragex.in',            // New domain
  // 'https://leveragex-frontend.onrender.com',
  // 'https://leveragex-kuxu.onrender.com',  // 11-jan-2025
  // 'https://leveragex-9ndu.onrender.com',     // 31-march-2025
  // 'https://leveragex-4p2t.onrender.com',
  'https://leveragex-oqsf.onrender.com',        // 31-may-2025
  'https://leveragex-rrf8.onrender.com',        // 1-aug-2025
  'http://localhost:3000',            // Local development environment
];

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests from specified origins or requests without origin (like postman)
    if (allowedOrigins.includes(origin) || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: 'GET,POST,PUT,DELETE',
  credentials: true,  // Enable credentials if needed for cookies or authentication
  optionsSuccessStatus: 200  // For legacy browser support
};

// Middleware setup
app.use(bodyParser.json());  // For parsing application/json
app.use(cors(corsOptions));  // Enable CORS

// Preflight request handling for all routes (important for CORS)
app.options('*', cors(corsOptions));  // Handle preflight requests for all routes

// Route Definitions
app.use('/auth', AuthRouter);  // Authentication routes (login, signup)
app.use('/api/plans', plansRouter);  // Plans routes (buy, get plans)
app.use('/api/stocks', stockRoutes);  // Stock-related routes
app.use('/api/users', userRoutes);  // User actions (balance, buy/sell stocks)
app.use('/api/watchlist1', watchList1Routes);  // WatchList 1 (Rapid plan)
app.use('/api/watchlist2', watchList2Routes);  // WatchList 2 (Evolution, Prime plans)
app.use('/api', pnlRoute);  // Profit and Loss route

app.use('/api/payout', payoutRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  if (err instanceof Error) {
    // Handle CORS errors specifically
    if (err.message === 'Not allowed by CORS') {
      return res.status(403).json({ message: 'CORS Error: Request blocked.' });
    }
  }
  next(err);
});

app.post('/congrats', async (req, res) => {
  const {Username , Pancard , UpiId} = req.body;
  try {
      const NewCongrats = new Congrats({
          Username,
          Pancard,
          UpiId,
      })
      NewCongrats.save();
      res.json('Details submitted successfully' );
    } catch (error) {
        console.error('Error saving data:', error);
        res.json('Failed to submit details');
    }
});

app.post('/putBalance', async (req, res) => {
  try {
    const withdrawal = new Balance(req.body);
    await withdrawal.save();
    res.status(201).json(Balance);
  } catch (err) {
    res.status(500).json({ message: 'Error saving data', error: err });
  }
});

app.get('/putBalance', async (req, res) => {
  const { email } = req.query;

  if (!email) return res.status(400).json({ message: 'Email is required' });

  try {
    const data = await Balance.find({ email }).sort({ date: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching data', error: err });
  }
});

startPriceFluctuation([
  { key: 'watchlist1', Model: WatchList1Stock, aField: 'watchlist1_A', bField: 'watchlist1_B' },
  { key: 'watchlist2', Model: WatchList2Stock, aField: 'watchlist2_A', bField: 'watchlist2_B' },
]);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
