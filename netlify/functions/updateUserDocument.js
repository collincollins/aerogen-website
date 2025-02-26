// updateUserDocument.js
// Updates existing session documents with new events and user activity data

const { MongoClient } = require('mongodb');

// MongoDB connection
const uri = process.env.MONGODB_URI;
const dbName = 'aerogen-analytics';
const sessionsCollection = 'sessions';
const eventsCollection = 'events';

// Handler for the Netlify function
exports.handler = async (event, context) => {
  console.log('updateUserDocument function invoked with method:', event.httpMethod);
  
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method not allowed' })
    };
  }

  // Check for MongoDB URI
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Server configuration error: Missing database connection string'
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
  
  // Check if the required fields are present
  if (!payload.sessionId || !payload.userId) {
    console.error('Missing required fields in payload');
    return {
      statusCode: 400,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Missing required fields: sessionId and userId are required' 
      })
    };
  }
  
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
    const sessions = db.collection(sessionsCollection);
    const events = db.collection(eventsCollection);
    
    // Update timestamp to current time
    const timestamp = new Date();
    
    // Process any events in the payload
    if (payload.events && Array.isArray(payload.events) && payload.events.length > 0) {
      console.log(`Processing ${payload.events.length} events`);
      // Prepare all events with timestamps and IDs
      const eventDocs = payload.events.map(eventData => ({
        sessionId: payload.sessionId,
        userId: payload.userId,
        timestamp: new Date(eventData.timestamp || timestamp),
        page: eventData.page || '/',
        type: eventData.type || 'unknown',
        data: eventData.data || {}
      }));
      
      // Insert all events
      console.log('Inserting events into database');
      await events.insertMany(eventDocs);
      
      // Increment interaction count in session
      console.log('Updating session interaction count');
      await sessions.updateOne(
        { sessionId: payload.sessionId },
        { $inc: { interactionCount: eventDocs.length } }
      );
    }
    
    // Update session data if provided in the payload
    const sessionUpdates = {};
    
    // Add fields that should be updated if present in the payload
    if (payload.currentPage) sessionUpdates.currentPage = payload.currentPage;
    if (payload.exitPage) sessionUpdates.exitPage = payload.exitPage;
    if (payload.endTime) sessionUpdates.endTime = new Date(payload.endTime);
    if (payload.lingerTime) sessionUpdates.lingerTime = payload.lingerTime;
    
    // Handle fun mode toggles
    if (typeof payload.funModeEnabled === 'boolean') {
      sessionUpdates.funModeEnabled = payload.funModeEnabled;
      
      // Increment toggle count if provided
      if (payload.funModeToggled) {
        console.log('Incrementing fun mode toggle count');
        await sessions.updateOne(
          { sessionId: payload.sessionId },
          { $inc: { funModeToggleCount: 1 } }
        );
      }
    }
    
    // Update the session if we have updates
    if (Object.keys(sessionUpdates).length > 0) {
      console.log('Updating session with new data:', Object.keys(sessionUpdates));
      await sessions.updateOne(
        { sessionId: payload.sessionId },
        { $set: sessionUpdates }
      );
    }
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        message: 'Session updated successfully'
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