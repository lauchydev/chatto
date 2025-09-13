const { MongoClient } = require('mongodb');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
dotenv.config({ path: path.resolve(__dirname, '../.env') });
const MONGO_URL = process.env.mongo_url;
const MONGO_PORT = process.env.mongo_port || 27017;
const MONGO_DB_NAME = process.env.mongo_name || 'chatto';

const mongo_url = `${MONGO_URL}:${MONGO_PORT}`;
const client = new MongoClient(mongo_url);
let db;

async function connectDB() {
  await client.connect();
  db = client.db(MONGO_DB_NAME);
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
