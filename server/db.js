const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });

// Support both Atlas URI and local MongoDB configuration
const MONGODB_URI = process.env.MONGODB_URI;
const MONGO_URL = process.env.mongo_url;
const MONGO_PORT = process.env.mongo_port || 27017;
const MONGO_DB_NAME = process.env.MONGODB_DB_NAME || process.env.mongo_name;

// Use Atlas URI if available, otherwise fall back to local configuration
let mongo_url;
if (MONGODB_URI) {
  mongo_url = MONGODB_URI;
} else if (MONGO_URL) {
  mongo_url = `${MONGO_URL}:${MONGO_PORT}`;
} else {
  throw new Error(
    'No MongoDB connection string provided. Set MONGODB_URI or mongo_url environment variable.'
  );
}

const client = new MongoClient(mongo_url);
let db;

async function connectDB() {
  try {
    console.log('Connecting to MongoDB...');
    console.log('Using connection string:', mongo_url.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
    console.log('Database name:', MONGO_DB_NAME);

    await client.connect();
    db = client.db(MONGO_DB_NAME);

    console.log('Successfully connected to MongoDB');
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error.message);
    throw error;
  }
}

function getDB() {
  if (!db) throw new Error('DB not initialized. Call connectDB() first. ');
  return db;
}

async function health() {
  await db.command({ ping: 1 });
  console.log('Health: Success');
}

async function closeDB() {
  await client.close();
  db = null;
  console.log('Database connection closed');
}

module.exports = { connectDB, getDB, health, closeDB };
