const express = require('express');
require('dotenv').config();
const urlRoutes = require('./routes/url.routes');
const {redirectUrl} = require('./controllers/url.controller');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json()); // Parse JSON request bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies

// Routes
app.use('/api', urlRoutes);

app.get('/:shortCode', redirectUrl);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'LinkForge is running!' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});