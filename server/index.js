const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(require('./utils/responses'));

app.use('/api/auth', require('./routes/auth-route'));
app.use('/api/groups', require('./routes/groups-route'));
app.use('/api/channels', require('./routes/channels-route'));
app.use('/api/users', require('./routes/users-route'));

// 404 for unknown API routes
app.use('/api', (req, res) => {
  return res.fail(404, 'Not Found');
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err);
  if (res.headersSent) return next(err);
  return res.fail(500, 'Internal Server Error');
});

app.listen(PORT);
