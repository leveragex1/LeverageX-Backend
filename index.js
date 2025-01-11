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

const PORT = process.env.PORT || 8080;

// CORS configuration to allow requests from multiple domains, including local dev
const allowedOrigins = [
  // 'https://leveragex.onrender.com',  // Old domain
  // 'https://leveragex.in',            // New domain
  // 'https://leveragex-frontend.onrender.com',
  'https://leveragex-605d.onrender.com',
  'http://localhost:3000'            // Local development environment
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

// Start the server

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
