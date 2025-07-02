# fabcar
# FabCar Backend Server

A Node.js Express server for the FabCar Hyperledger Fabric 1.4 example, providing REST API endpoints for vehicle management on the blockchain.

## Prerequisites

1. *Hyperledger Fabric 1.4* network running
2. *Node.js* (version 10 or higher)
3. *npm* (version 6 or higher)
4. *FabCar chaincode* deployed on your Fabric network

## Setup Instructions

### 1. Install Dependencies

\\\`bash
npm install
\\\`

### 2. Configure Connection

Ensure your Hyperledger Fabric network is running and the connection profile exists at:
\\\`
../../first-network/connection-org1.json
\\\`

If your connection profile is in a different location, update the ccpPath in server.js.

### 3. Initialize Wallet

Run the setup script to enroll admin and register user:

\\\`bash
npm run setup
\\\`

This will:
- Create a wallet directory
- Enroll the admin user
- Register and enroll user1
- Verify the connection to the blockchain

### 4. Start the Server

\\\`bash
npm start
\\\`

The server will start on http://localhost:3000

## API Endpoints

### Health Check
- *GET* /api/health - Check server status

### Blockchain Connection
- *GET* /api/testfabric - Test blockchain connectivity

### Vehicle Management
- *GET* /api/queryallcars - Get all vehicles
- *GET* /api/querycar/:id - Get specific vehicle by ID
- *POST* /api/createcar - Create new vehicle
- *POST* /api/transferownership - Transfer vehicle ownership

### Authentication
- *POST* /signin - User sign-in

## API Usage Examples

### Query All Cars
\\\`bash
curl http://localhost:3000/api/queryallcars
\\\`

### Query Specific Car
\\\`bash
curl http://localhost:3000/api/querycar/CAR0
\\\`

### Create New Car
\\\`bash
curl -X POST http://localhost:3000/api/createcar \
  -H "Content-Type: application/json" \
  -d '{
    "carId": "CAR10",
    "make": "Toyota",
    "model": "Camry",
    "color": "Blue",
    "owner": "John Doe"
  }'
\\\`

### Transfer Ownership
\\\`bash
curl -X POST http://localhost:3000/api/transferownership \
  -H "Content-Type: application/json" \
  -d '{
    "carId": "CAR10",
    "newOwner": "Jane Smith"
  }'
\\\`

## Frontend Integration

The server serves static files from the frontend directory. Place your HTML, CSS, and JavaScript files there:

\\\`
frontend/
├── index.html
├── dashboard.html
├── signin.html
├── css/
├── js/
└── images/
\\\`

## Troubleshooting

### Connection Issues
1. Verify Fabric network is running
2. Check connection profile path
3. Ensure certificates are valid

### Wallet Issues
1. Delete wallet directory and run setup again
2. Check admin credentials (default: admin/adminpw)

### Chaincode Issues
1. Verify FabCar chaincode is installed and instantiated
2. Check channel name (default: mychannel)

## Development

For development with auto-restart:
\\\`bash
npm run dev
\\\`

## Configuration

Key configuration options in server.js:

\\\`javascript
const CONFIG = {
    ccpPath: path.resolve(__dirname, '..', '..', 'first-network', 'connection-org1.json'),
    walletPath: path.join(__dirname, 'wallet'),
    channelName: 'mychannel',
    chaincodeName: 'fabcar',
    userId: 'user1'
};
\\\`

## License

Apache-2.0
