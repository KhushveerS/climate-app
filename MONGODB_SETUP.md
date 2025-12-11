# MongoDB Setup Guide

This guide will help you set up MongoDB for the Climate & Weather App.

## Prerequisites

- Node.js (v14 or higher)
- npm (comes with Node.js)

## Installing MongoDB

### Option 1: Install MongoDB Community Edition (Recommended)

#### Windows:
1. Download MongoDB Community Server from [mongodb.com](https://www.mongodb.com/try/download/community)
2. Run the installer and follow the installation wizard
3. Choose "Complete" setup type
4. Choose "Run service as Network Service user"
5. Complete the installation

#### macOS:
```bash
# Using Homebrew
brew tap mongodb/brew
brew install mongodb-community
```

#### Linux (Ubuntu/Debian):
```bash
# Import the public key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Create the list file
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package database
sudo apt-get update

# Install MongoDB
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
```

### Option 2: Use MongoDB Atlas (Cloud)

1. Sign up at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Configure IP whitelist and database user
4. Get your connection string

## Starting MongoDB

### Local Installation:

#### Windows:
MongoDB service should start automatically. If not:
```bash
# Start MongoDB service
net start MongoDB

# Or run manually
"C:\Program Files\MongoDB\Server\[version]\bin\mongod.exe" --dbpath="c:\data\db"
```

#### macOS/Linux:
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or run manually
mongod --dbpath /data/db
```

### Cloud (Atlas):
No separate startup needed. Just use your connection string.

## Verifying Installation

1. Open a terminal/command prompt
2. Run:
```bash
mongo --eval 'db.runCommand({ connectionStatus: 1 })'
```

If you see "ok: 1", MongoDB is running correctly.

## Configuring the Climate App

By default, the app connects to MongoDB at `mongodb://localhost:27017/climateApp`.

To customize:
1. Edit `mongodb-config.js`
2. Change the `mongoURI` value:
   ```javascript
   mongoURI: 'mongodb://localhost:27017/climateApp'  // Default
   // or for Atlas:
   mongoURI: 'mongodb+srv://username:password@cluster.mongodb.net/climateApp'
   ```

## Testing the Connection

In the project directory, run:
```bash
npm run test-db
```

If successful, you'll see:
```
✓ MongoDB connected successfully
✓ Test document created successfully: Connection test
✓ Test document cleaned up
All tests passed! MongoDB is ready to use.
```

## Troubleshooting

### Connection Refused
- Ensure MongoDB is running
- Check if the port (27017) is correct
- Verify firewall settings

### Authentication Failed
- Check username/password in connection string
- Ensure user has proper permissions

### Cannot Connect to Atlas
- Verify IP whitelist includes your current IP
- Check that you're using the correct connection string
- Ensure network connectivity

## Security Notes

- Don't commit connection strings with credentials to version control
- Use environment variables for sensitive data:
  ```bash
  export MONGODB_URI='your_connection_string_here'
  ```
- Enable authentication in production environments