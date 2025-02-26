// Simple script to test MongoDB connection
const { MongoClient } = require('mongodb');

// Replace with your actual connection string
// const uri = "mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority";
// Or use environment variable
const uri = process.env.MONGODB_URI;

async function testConnection() {
  console.log('Testing MongoDB connection...');
  
  if (!uri) {
    console.error('Error: MONGODB_URI environment variable is not set');
    return;
  }
  
  console.log('Connection string format check:');
  console.log('- Starts with mongodb+srv://', uri.startsWith('mongodb+srv://'));
  console.log('- Contains @ symbol:', uri.includes('@'));
  
  const client = new MongoClient(uri);
  
  try {
    console.log('Attempting to connect...');
    await client.connect();
    console.log('Successfully connected to MongoDB!');
    
    // List databases to verify connection works
    const adminDb = client.db('admin');
    const result = await adminDb.command({ listDatabases: 1 });
    console.log('Available databases:');
    result.databases.forEach(db => {
      console.log(`- ${db.name}`);
    });
    
  } catch (err) {
    console.error('Connection error:', err);
  } finally {
    await client.close();
    console.log('Connection closed');
  }
}

testConnection().catch(console.error); 