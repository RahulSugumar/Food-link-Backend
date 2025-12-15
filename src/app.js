const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/authRoutes');
const donationRoutes = require('./routes/donationRoutes');
const requestRoutes = require('./routes/requestRoutes');
const fridgeRoutes = require('./routes/fridgeRoutes');
const volunteerRoutes = require('./routes/volunteerRoutes');
const notificationRoutes = require('./routes/notificationRoutes'); // Explicit Import
const chatRoutes = require('./routes/chatRoutes');

app.use('/api/auth', authRoutes);
app.use('/api/notifications', notificationRoutes); // Mount early
app.use('/api/donations', donationRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/fridges', fridgeRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/volunteers', volunteerRoutes);
app.use('/api/chat', chatRoutes);

// Debug: Print all registered routes
app._router.stack.forEach(function (r) {
    if (r.route && r.route.path) {
        console.log('Route:', r.route.path)
    } else if (r.name === 'router') {
        // middleware router
        console.log('Router Middleware:', r.regexp)
    }
});

app.get('/', (req, res) => {
    res.send('FoodBridge API is running');
});

module.exports = app;
