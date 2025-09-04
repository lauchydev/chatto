const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(require('./utils/responses'));

const options = {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
};

/* Using Express 'app.listen()' which removes the need to create the http server */
const server = app.listen(PORT, () => {
  console.log('Server started successfully (Port: ', PORT, ')');
});

const io = require('socket.io')(server, options);
/* one-to-many data */
io.on('connection', (socket) => {
  /* Listen for messages with title of 'new-message' */
  socket.on('new-message', (message) => {
    /* Emit to clients waiting on 'new-message' */
    io.emit('new-message', message);
  });
  /* Disconnect */
  socket.on('disconnect', () => {
    io.emit('disconnect');
  });
});

app.use('/api/auth', require('./routes/auth-route'));
app.use('/api/groups', require('./routes/groups-route'));
app.use('/api/channels', require('./routes/channels-route'));
app.use('/api/users', require('./routes/users-route'));

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
