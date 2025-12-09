const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', require('./src/routes/authRoutes'));
app.use('/api/donations', require('./src/routes/donationRoutes'));
app.use('/api/requests', require('./src/routes/requestRoutes'));
app.use('/api/fridges', require('./src/routes/fridgeRoutes'));
app.use('/api/volunteers', require('./src/routes/volunteerRoutes'));

// Basic Route
app.get('/', (req, res) => {
    res.send('Community Food Link API is running');
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
