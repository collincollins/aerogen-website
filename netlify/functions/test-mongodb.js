// Simple test function to verify MongoDB connection
const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
  console.log('Test MongoDB function invoked');
  
  // Get MongoDB URI from environment variable
  let uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Missing MONGODB_URI environment variable' 
      })
    };
  }
  
  // Log the raw connection string (without credentials)
  console.log('Raw connection string received:', uri.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@'));
  
  // Check if the connection string is properly formatted
  if (!uri.startsWith('mongodb://') && !uri.startsWith('mongodb+srv://')) {
    console.error('Connection string does not start with mongodb:// or mongodb+srv://');
    
    // Try to fix common issues with connection strings
    if (uri.includes('mongodb+srv://')) {
      // Extract the part after mongodb+srv://
      const parts = uri.split('mongodb+srv://');
      if (parts.length > 1) {
        uri = 'mongodb+srv://' + parts[1];
        console.log('Fixed connection string format');
      }
    }
  }
  
  // Log connection string format (without exposing credentials)
  const isValidFormat = uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://');
  const hasAtSymbol = uri.includes('@');
  
  console.log('Connection string format check:');
  console.log('- Valid protocol prefix:', isValidFormat);
  console.log('- Contains @ symbol:', hasAtSymbol);
  
  if (!isValidFormat) {
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Invalid MongoDB connection string format',
        details: 'Connection string must start with mongodb:// or mongodb+srv://'
      })
    };
  }
  
  // Create MongoDB client
  let client;
  try {
    client = new MongoClient(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000 // 5 second timeout
    });
    
    console.log('Attempting to connect to MongoDB...');
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        status: 'success',
        message: 'Successfully connected to MongoDB',
        connectionDetails: {
          validFormat: isValidFormat,
          hasCredentials: hasAtSymbol
        }
      })
    };
  } catch (error) {
    console.error('MongoDB connection error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        status: 'error',
        message: 'Failed to connect to MongoDB',
        error: error.message,
        connectionDetails: {
          validFormat: isValidFormat,
          hasCredentials: hasAtSymbol,
          errorType: error.name,
          errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        }
      })
    };
  } finally {
    if (client) {
      try {
        await client.close();
        console.log('MongoDB connection closed');
      } catch (closeError) {
        console.error('Error closing MongoDB connection:', closeError);
      }
    }
  }
}; 