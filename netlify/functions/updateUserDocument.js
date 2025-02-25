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
    
    // Check if the required fields are present
    if (!payload.sessionId || !payload.userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          status: 'error',
          message: 'Missing required fields: sessionId and userId are required' 
        })
      };
    }
    
    // Connect to MongoDB
    const client = new MongoClient(uri);
    await client.connect();
    
    const db = client.db(dbName);
    const sessions = db.collection(sessionsCollection);
    const events = db.collection(eventsCollection);
    
    // Update timestamp to current time
    const timestamp = new Date();
    
    // Process any events in the payload
    if (payload.events && Array.isArray(payload.events) && payload.events.length > 0) {
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
      await events.insertMany(eventDocs);
      
      // Increment interaction count in session
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
        await sessions.updateOne(
          { sessionId: payload.sessionId },
          { $inc: { funModeToggleCount: 1 } }
        );
      }
    }
    
    // Update the session if we have updates
    if (Object.keys(sessionUpdates).length > 0) {
      await sessions.updateOne(
        { sessionId: payload.sessionId },
        { $set: sessionUpdates }
      );
    }
    
    // Close MongoDB connection
    await client.close();
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        message: 'Session updated successfully'
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