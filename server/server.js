const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;
const { connectDB, health } = require('./db');
const { initializeSocket } = require('./socket');

app.use(cors());
app.use(express.json());
app.use(require('./utils/responses'));

/* Using Express 'app.listen()' which removes the need to create the http server */
const server = app.listen(PORT, () => {
  console.log('Server started successfully (Port: ', PORT, ')');
});

/* Initialize Socket.io */
initializeSocket(server);

/* Init Database */
(async () => {
  try {
    await connectDB();
    await health();
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Failed to connect to MongoDB:', err);
    process.exit(1);
  }
})();

app.use('/api/auth', require('./routes/auth-route'));
app.use('/api/groups', require('./routes/groups/groups-route'));
app.use('/api/channels', require('./routes/channels-route'));
app.use('/api/users', require('./routes/users-route'));
app.use('/api/messages', require('./routes/messages-route'));

// 404 for unknown API routes
app.use('/api', (req, res) => {
  return res.fail(404, 'Not Found');
});

// Error handler (Express)
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return res.fail(500, 'Internal Server Error');
});
