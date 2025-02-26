// Simple test function to verify MongoDB connection
const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
  console.log('Test MongoDB function invoked');
  
  // Get MongoDB URI from environment variable
  const uri = process.env.MONGODB_URI;
  
  if (!uri) {
    console.error('MONGODB_URI environment variable is not set');
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Missing MONGODB_URI environment variable' 
      })
    };
  }
  
  // Log connection string format (without exposing credentials)
  const isValidFormat = uri.startsWith('mongodb+srv://') || uri.startsWith('mongodb://');
  const hasAtSymbol = uri.includes('@');
  
  console.log('Connection string format check:');
  console.log('- Valid protocol prefix:', isValidFormat);
  console.log('- Contains @ symbol:', hasAtSymbol);
  
  // Create MongoDB client
  const client = new MongoClient(uri);
  
  try {
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
          hasCredentials: hasAtSymbol
        }
      })
    };
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}; 