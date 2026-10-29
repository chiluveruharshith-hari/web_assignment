import mongoose from 'mongoose';

let memoryServer = null;

export const connectDB = async () => {
  // Reuse existing connection in serverless or cached runtime
  if (mongoose.connection && mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campusfind';

  try {
    // Attempt connecting to the configured MongoDB URI (e.g., MongoDB Atlas or local daemon)
    mongoose.set('strictQuery', false);
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`[Database] Connected to MongoDB at: ${conn.connection.host}/${conn.connection.name}`);
    return conn;
  } catch (err) {
    console.warn(`[Database] Could not connect to MongoDB at ${uri} (${err.message})`);

    // In development/test mode, fall back to MongoMemoryServer for standalone zero-config execution
    if (process.env.NODE_ENV !== 'production') {
      try {
        console.log('[Database] Starting in-memory MongoDB server for standalone academic evaluation...');
        const { MongoMemoryServer } = await import('mongodb-memory-server');
        memoryServer = await MongoMemoryServer.create();
        const memUri = memoryServer.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[Database] In-memory MongoDB running successfully at: ${memUri}`);
        return conn;
      } catch (memErr) {
        console.error('[Database] Failed to start in-memory MongoDB server:', memErr.message);
        throw memErr;
      }
    } else {
      console.error('[Database] Fatal: Unable to connect to MongoDB in production mode.');
      throw err;
    }
  }
};

export const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (memoryServer) {
      await memoryServer.stop();
    }
    console.log('[Database] MongoDB disconnected cleanly.');
  } catch (err) {
    console.error('[Database] Error disconnecting MongoDB:', err.message);
  }
};
