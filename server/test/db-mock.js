const mockDb = {
  collection: (name) => ({
    find: () => ({
      toArray: () => Promise.resolve([]),
      sort: () => ({
        limit: () => ({
          toArray: () => Promise.resolve([]),
        }),
      }),
    }),
    findOne: () => Promise.resolve(null),
    insertOne: () => Promise.resolve({ insertedId: 'mock-id' }),
    updateOne: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
    updateMany: () => Promise.resolve({ matchedCount: 0, modifiedCount: 0 }),
    deleteOne: () => Promise.resolve({ deletedCount: 0 }),
    deleteMany: () => Promise.resolve({ deletedCount: 0 }),
  }),
};

const getDB = () => mockDb;

const connectDB = () => Promise.resolve();
const health = () => Promise.resolve();

module.exports = { getDB, connectDB, health };
