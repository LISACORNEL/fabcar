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

sample screenshots
![WhatsApp Image 2025-07-02 at 10 15 07_3370665b](https://github.com/user-attachments/assets/bb9d4f66-0dc5-4e2b-97ec-89c63a442b32)
![WhatsApp Image 2025-07-02 at 10 15 33_114185ef](https://github.com/user-attachments/assets/40399023-de85-4f6d-816b-dc8df4d4016a)
![WhatsApp Image 2025-07-02 at 10 15 54_89bdb2e2](https://github.com/user-attachments/assets/eff1ad78-0a25-466e-8053-e85556a538da)
![WhatsApp Image 2025-07-02 at 10 16 46_7d62c3d2](https://github.com/user-attachments/assets/628abeaf-8781-4a45-adbf-3223c28e2668)
![WhatsApp Image 2025-07-02 at 10 17 13_c7de3bd8](https://github.com/user-attachments/assets/330e0d6f-d9f2-4d34-9951-28c2d96c0766)
![WhatsApp Image 2025-07-02 at 10 15 07_bfddf368](https://github.com/user-attachments/assets/eefbf393-1c94-4e52-aee1-70e5a5911fb2)
![WhatsApp Image 2025-07-02 at 10 15 33_5316f50a](https://github.com/user-attachments/assets/edb00107-ec3d-4454-a132-39857cb3d37d)







