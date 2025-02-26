# MongoDB Setup for Aerogen Website

This document provides instructions for setting up and troubleshooting the MongoDB connection for the Aerogen website analytics system.

## Environment Variables

The following environment variables need to be set in your Netlify deployment:

- `MONGODB_URI`: The MongoDB connection string
- `IP_HASH_SALT`: A secret string used to hash IP addresses for anonymous user tracking

## MongoDB Connection String Format

The MongoDB connection string should be in the following format:

```
mongodb+srv://<username>:<password>@<cluster-url>/<database>?retryWrites=true&w=majority
```

Make sure to:
1. Replace `<username>` with your MongoDB Atlas username
2. Replace `<password>` with your MongoDB Atlas password
3. Replace `<cluster-url>` with your MongoDB Atlas cluster URL
4. Replace `<database>` with the database name (optional)

## Troubleshooting Connection Issues

If you're experiencing connection issues, try the following:

1. **Check Environment Variables**: Ensure that the `MONGODB_URI` environment variable is correctly set in Netlify.

2. **Verify Network Access**: In MongoDB Atlas, make sure that your IP address or "Allow Access from Anywhere" is enabled in the Network Access settings.

3. **Check User Permissions**: Ensure that the MongoDB user has the correct permissions to access the database.

4. **Test Connection**: Use the `/test-mongodb.html` page to test the connection to MongoDB.

5. **Check Netlify Logs**: Review the Netlify function logs for detailed error messages.

## MongoDB Atlas Setup

1. Create a MongoDB Atlas account at [https://www.mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Create a database user with read/write permissions
4. Configure network access to allow connections from Netlify
5. Get the connection string from the "Connect" button in the Atlas dashboard

## Database Structure

The analytics system uses the following collections:

- `users`: Stores information about unique visitors
- `sessions`: Stores information about user sessions
- `events`: Stores detailed user interaction events

## Testing

To test the MongoDB connection:

1. Deploy the site to Netlify
2. Navigate to `/test-mongodb.html`
3. Click the "Test MongoDB Connection" button
4. Check the result for success or error messages

If you encounter a "Database connection error", check the Netlify function logs for more detailed error information. 