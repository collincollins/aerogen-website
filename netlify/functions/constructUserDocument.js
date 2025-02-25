// constructUserDocument.js
// Creates a new user document or updates the last visit timestamp for returning users

const { MongoClient } = require('mongodb');
const crypto = require('crypto');

// MongoDB connection
const uri = process.env.MONGODB_URI;
const dbName = 'aerogen-analytics';
const usersCollection = 'users';
const sessionsCollection = 'sessions';

// Hash IP address for anonymous user identification
function hashIPAddress(ipAddress, salt) {
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
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  try {
    // Parse the incoming request body
    const payload = JSON.parse(event.body);
    
    // Get user IP from headers (Netlify provides this)
    const userIP = event.headers['x-forwarded-for'] || event.headers['client-ip'];
    
    // Get the salt from environment variables
    const salt = process.env.IP_HASH_SALT;
    
    // Hash the IP to create an anonymous user ID
    const userId = hashIPAddress(userIP, salt);
    
    // Generate a session ID for this visit
    const sessionId = generateSessionId();
    
    // Current timestamp
    const timestamp = new Date();
    
    // Connect to MongoDB
    const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    await client.connect();
    
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
      await users.updateOne(
        { userId },
        { $inc: { visitCount: 1 } }
      );
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
    
    await sessions.insertOne(sessionDocument);
    
    // Close MongoDB connection
    await client.close();
    
    // Return success with session ID (client will store this for subsequent updates)
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        sessionId,
        status: 'success',
        message: result.upsertedCount === 0 ? 'User revisit recorded' : 'New user created'
      })
    };
    
  } catch (error) {
    console.error('Error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      })
    };
  }
}; 