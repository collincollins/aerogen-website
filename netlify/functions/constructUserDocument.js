// constructUserDocument.js
// Creates a new user document or updates the last visit timestamp for returning users

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// MongoDB connection
let uri = process.env.MONGODB_URI;
const dbName = 'aerogen-analytics';
const usersCollection = 'users';
const sessionsCollection = 'sessions';

// Fix connection string if needed
function fixConnectionString(connectionString) {
  if (!connectionString) return null;
  
  // Log the raw connection string (without credentials)
  console.log('Raw connection string received:', 
    connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  // Check if the connection string is properly formatted
  if (!connectionString.startsWith('mongodb://') && !connectionString.startsWith('mongodb+srv://')) {
    console.log('Connection string does not start with mongodb:// or mongodb+srv://');
    
    // Try to fix common issues with connection strings
    if (connectionString.includes('mongodb+srv://')) {
      // Extract the part after mongodb+srv://
      const parts = connectionString.split('mongodb+srv://');
      if (parts.length > 1) {
        connectionString = 'mongodb+srv://' + parts[1];
        console.log('Fixed connection string format');
      }
    }
  }
  
  return connectionString;
}

// Hash IP address for anonymous user identification
function hashIPAddress(ipAddress, salt) {
  if (!ipAddress || !salt) {
    return 'anonymous-user';
  }
  
  return crypto
    .createHmac('sha256', salt)
    .update(ipAddress)
    .digest('hex');
}

// Generate a unique session ID
function generateSessionId() {
  return crypto.randomUUID();
}

// Handler for the Netlify function
exports.handler = async (event, context) => {
  console.log('Function invoked with method:', event.httpMethod);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  // Check for MongoDB URI and fix if needed
  uri = fixConnectionString(uri);
  
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set or invalid');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Server configuration error: Missing or invalid database connection string'
      })
    };
  }
  
  // Validate connection string format
  const isValidFormat = uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://');
  if (!isValidFormat) {
    console.error('Invalid MongoDB connection string format');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Invalid MongoDB connection string format'
      })
    };
  }
  
  // Parse the incoming request body
  let payload;
  try {
    payload = JSON.parse(event.body);
    console.log('Received payload with keys:', Object.keys(payload));
  } catch (parseError) {
    console.error('Error parsing request body:', parseError);
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Invalid request body: Could not parse JSON'
      })
    };
  }
  
  // Get user IP from headers (Netlify provides this)
  const userIP = event.headers['x-forwarded-for'] || event.headers['client-ip'];
  console.log('User IP detected:', userIP ? 'Present' : 'Not present');
  
  // Get the salt from environment variables
  const salt = process.env.IP_HASH_SALT || 'default-salt-for-development';
  
  // Hash the IP to create an anonymous user ID
  const userId = hashIPAddress(userIP, salt);
  console.log('Generated userId (hashed)');
  
  // Generate a session ID for this visit
  const sessionId = generateSessionId();
  console.log('Generated sessionId');
  
  // Current timestamp
  const timestamp = new Date();
  
  // Connect to MongoDB with options
  console.log('Attempting to connect to MongoDB...');
  let client;
  
  try {
    // Create client with explicit options
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    // Connect to the client
    await client.connect();
    console.log('Connected to MongoDB successfully');
    
    const db = client.db(dbName);
    const users = db.collection(usersCollection);
    const sessions = db.collection(sessionsCollection);
    
    // Prepare user document with device information from payload
    const userDocument = {
      userId,
      lastVisit: timestamp,
      device: {
        browser: payload.browser || 'unknown',
        os: payload.os || 'unknown',
        screenSize: payload.screenSize || 'unknown',
        mobile: payload.mobile || false
      }
    };
    
    console.log('Upserting user document');
    // Create or update user document
    const result = await users.updateOne(
      { userId }, 
      { 
        $set: { 
          lastVisit: timestamp,
          device: userDocument.device
        },
        $setOnInsert: { 
          firstVisit: timestamp,
          visitCount: 0
        }
      },
      { upsert: true }
    );
    
    // If this is a returning user, increment visit count
    if (result.upsertedCount === 0) {
      console.log('Returning user, incrementing visit count');
      await users.updateOne(
        { userId },
        { $inc: { visitCount: 1 } }
      );
    } else {
      console.log('New user created');
    }
    
    // Create a new session document
    const sessionDocument = {
      sessionId,
      userId,
      startTime: timestamp,
      referrer: payload.referrer || 'direct',
      entryPage: payload.entryPage || '/',
      device: userDocument.device,
      interactionCount: 0,
      funModeEnabled: false,
      funModeToggleCount: 0
    };
    
    console.log('Creating session document');
    await sessions.insertOne(sessionDocument);
    console.log('Session document created successfully');
    
    // Return success with session ID (client will store this for subsequent updates)
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId,
        userId, // Return userId for client tracking
        status: 'success',
        message: result.upsertedCount === 0 ? 'User revisit recorded' : 'New user created'
      })
    };
  } catch (error) {
    console.error('MongoDB operation error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Database connection error',
        error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
      })
    };
  } finally {
    // Close MongoDB connection
    if (client) {
      try {
        console.log('Closing MongoDB connection');
        await client.close();
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }
    }
  }
}; 