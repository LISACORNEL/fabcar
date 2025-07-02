const express = require('express');
const path = require('path');
const { getContract } = require('./fabric-network');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

// Helper function for gateway handling
async function withGateway(handler) {
  let gateway;
  try {
    const { contract, gateway: gw } = await getContract();
    gateway = gw;
    return await handler(contract);
  } finally {
    if (gateway) {
      await gateway.disconnect();
    }
  }
}

// API Routes
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Test Fabric connection
app.get('/api/testfabric', async (req, res) => {
  try {
    await withGateway(async () => {
      res.json({ success: true, message: 'Fabric connection successful' });
    });
  } catch (error) {
    handleError(res, 500, 'Fabric connection failed', error);
  }
});

// Car routes
app.get('/api/queryallcars', async (req, res) => {
  try {
    await withGateway(async (contract) => {
      const result = await contract.evaluateTransaction('queryAllCars');
      res.json(JSON.parse(result.toString()));
    });
  } catch (error) {
    handleError(res, 500, 'Failed to query cars', error);
  }
});

app.get('/api/querycar/:id', async (req, res) => {
  try {
    await withGateway(async (contract) => {
      const result = await contract.evaluateTransaction('queryCar', req.params.id);
      res.json(JSON.parse(result.toString()));
    });
  } catch (error) {
    handleError(res, 404, `Car ${req.params.id} not found`, error);
  }
});

app.post('/api/createcar', async (req, res) => {
  const { carId, make, model, color, owner } = req.body;

  if (!carId || !make || !model || !color || !owner) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['carId', 'make', 'model', 'color', 'owner']
    });
  }

  try {
    await withGateway(async (contract) => {
      await contract.submitTransaction('createCar', carId, make, model, color, owner);
      res.json({
        success: true,
        message: `Car ${carId} created successfully`,
        carId
      });
    });
  } catch (error) {
    handleError(res, 500, 'Failed to create car', error);
  }
});

app.post('/api/transferownership', async (req, res) => {
  const { carId, newOwner } = req.body;

  if (!carId || !newOwner) {
    return res.status(400).json({
      error: 'Missing required fields',
      required: ['carId', 'newOwner']
    });
  }

  try {
    await withGateway(async (contract) => {
      await contract.submitTransaction('changeCarOwner', carId, newOwner);
      res.json({
        success: true,
        message: `Ownership of ${carId} transferred to ${newOwner}`,
        carId,
        newOwner
      });
    });
  } catch (error) {
    handleError(res, 500, 'Failed to transfer ownership', error);
  }
});

// Authentication
app.post('/signin', (req, res) => {
  const { username, password } = req.body;

  // Replace with proper authentication in production
  if (username === 'admin' && password === 'adminpw') {
    res.redirect('/dashboard.html');
  } else {
    res.status(401).json({
      error: 'Invalid credentials',
      message: 'Please check your username and password'
    });
  }
});

// Static files
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});

// Error handler
function handleError(res, status, message, error) {
  console.error(`${message}:`, error);
  res.status(status).json({
    error: message,
    details: error.message
  });
}

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found',
    message: `Route ${req.method} ${req.path} not found`
  });
});

// Server startup
function logStartupInfo() {
  console.log(`🚀 FabCar server running on http://localhost:${PORT}`);
  console.log(`📁 Serving static files from: ${path.join(__dirname, 'frontend')}`);
  
  console.log('\nAvailable endpoints:');
  console.log('  GET  /api/health - Health check');
  console.log('  GET  /api/testfabric - Test blockchain connection');
  console.log('  GET  /api/queryallcars - Get all cars');
  console.log('  GET  /api/querycar/:id - Get specific car');
  console.log('  POST /api/createcar - Create new car');
  console.log('  POST /api/transferownership - Transfer car ownership');
  console.log('  POST /signin - User authentication');
}

app.listen(PORT, logStartupInfo);

// Graceful shutdown
['SIGINT', 'SIGTERM'].forEach(signal => {
  process.on(signal, () => {
    console.log('\n🛑 Shutting down server...');
    process.exit(0);
  });
});
