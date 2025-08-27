const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/auth-route'));
app.use('/api/groups', require('./routes/groups-route'));
app.use('/api/channels', require('./routes/channels-route'));
app.use('/api/users', require('./routes/users-route'));

app.listen(PORT);
