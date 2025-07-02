const express = require("express")
const bodyParser = require("body-parser")
const cors = require("cors")
const path = require("path")
const { FileSystemWallet, Gateway } = require("fabric-network")
const fs = require("fs")

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(cors())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: false }))

// Serve static files from the frontend directory
const frontendPath = path.join(__dirname, "frontend")
app.use(express.static(frontendPath))

// Configuration
const ccpPath = path.resolve(__dirname, "..", "..", "first-network", "connection-org1.json")
const walletPath = path.join(process.cwd(), "wallet")

async function getContract() {
  let gateway
  try {
    // Check if connection profile exists
    if (!fs.existsSync(ccpPath)) {
      throw new Error(`Connection profile not found at: ${ccpPath}`)
    }

    // Load connection profile
    const ccpJSON = fs.readFileSync(ccpPath, "utf8")
    const ccp = JSON.parse(ccpJSON)

    // Create wallet instance (Fabric 1.4 syntax)
    const wallet = new FileSystemWallet(walletPath)

    // Check if user exists in wallet
    const userExists = await wallet.exists("user2")
    if (!userExists) {
      throw new Error('User "user2" not found in wallet. Please run: node registerUser.js')
    }

    // Create gateway instance
    gateway = new Gateway()
    await gateway.connect(ccp, {
      wallet,
      identity: "user2",
      discovery: { enabled: true, asLocalhost: true },
    })

    // Get network and contract
    const network = await gateway.getNetwork("mychannel")
    const contract = network.getContract("fabcar")

    return { contract, gateway }
  } catch (error) {
    if (gateway) {
      await gateway.disconnect()
    }
    throw error
  }
}

// API Routes

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    status: "OK",
    timestamp: new Date().toISOString(),
    service: "FabCar Backend",
    version: "1.4.x",
  })
})

// Test fabric connection
app.get("/api/testfabric", async (req, res) => {
  let gateway
  try {
    const { contract, gateway: gw } = await getContract()
    gateway = gw

    const result = await contract.evaluateTransaction("queryAllCars")
    const cars = JSON.parse(result.toString())

    res.json({
      success: true,
      message: "Fabric connection successful",
      carsCount: cars.length,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error("Fabric connection test failed:", error)
    res.status(500).json({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString(),
    })
  } finally {
    if (gateway) {
      await gateway.disconnect()
    }
  }
})

// Query all cars
app.get("/api/queryallcars", async (req, res) => {
  let gateway
  try {
    const { contract, gateway: gw } = await getContract()
    gateway = gw

    console.log("Querying all cars...")
    const result = await contract.evaluateTransaction("queryAllCars")
    const cars = JSON.parse(result.toString())

    console.log(`Found ${cars.length} cars`)
    res.json(cars)
  } catch (error) {
    console.error("Error querying all cars:", error)
    res.status(500).json({
      error: error.message,
      details: "Failed to query all cars from blockchain",
    })
  } finally {
    if (gateway) {
      await gateway.disconnect()
    }
  }
})

// Query specific car
app.get("/api/querycar/:id", async (req, res) => {
  let gateway
  try {
    const carId = req.params.id
    const { contract, gateway: gw } = await getContract()
    gateway = gw

    console.log(`Querying car: ${carId}`)
    const result = await contract.evaluateTransaction("queryCar", carId)
    const car = JSON.parse(result.toString())

    res.json(car)
  } catch (error) {
    console.error(`Error querying car ${req.params.id}:`, error)
    res.status(404).json({
      error: error.message,
      details: `Car ${req.params.id} not found`,
    })
  } finally {
    if (gateway) {
      await gateway.disconnect()
    }
  }
})

// Create new car
app.post("/api/createcar", async (req, res) => {
  let gateway
  try {
    const { carId, make, model, color, owner } = req.body

    // Validate input
    if (!carId || !make || !model || !color || !owner) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["carId", "make", "model", "color", "owner"],
      })
    }

    const { contract, gateway: gw } = await getContract()
    gateway = gw

    console.log(`Creating car: ${carId}`)
    await contract.submitTransaction("createCar", carId, make, model, color, owner)

    console.log(`Car ${carId} created successfully`)
    res.json({
      success: true,
      message: `Car ${carId} created successfully`,
      carId: carId,
    })
  } catch (error) {
    console.error("Error creating car:", error)
    res.status(500).json({
      error: error.message,
      details: "Failed to create car on blockchain",
    })
  } finally {
    if (gateway) {
      await gateway.disconnect()
    }
  }
})

// Transfer ownership
app.post("/api/transferownership", async (req, res) => {
  let gateway
  try {
    const { carId, newOwner } = req.body

    // Validate input
    if (!carId || !newOwner) {
      return res.status(400).json({
        error: "Missing required fields",
        required: ["carId", "newOwner"],
      })
    }

    const { contract, gateway: gw } = await getContract()
    gateway = gw

    console.log(`Transferring ownership of ${carId} to ${newOwner}`)
    await contract.submitTransaction("changeCarOwner", carId, newOwner)

    console.log(`Ownership of ${carId} transferred to ${newOwner}`)
    res.json({
      success: true,
      message: `Ownership of ${carId} transferred to ${newOwner}`,
      carId: carId,
      newOwner: newOwner,
    })
  } catch (error) {
    console.error("Error transferring ownership:", error)
    res.status(500).json({
      error: error.message,
      details: "Failed to transfer ownership on blockchain",
    })
  } finally {
    if (gateway) {
      await gateway.disconnect()
    }
  }
})

// Authentication endpoint
app.post("/signin", (req, res) => {
  const { username, password } = req.body

  // Simple authentication
  if (username === "admin" && password === "adminpw") {
    res.redirect("/dashboard.html")
  } else {
    res.status(401).json({
      error: "Invalid credentials",
      message: "Please check your username and password",
    })
  }
})

// Default route
app.get("/", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"))
})

// Error handling
app.use((error, req, res, next) => {
  console.error("Unhandled error:", error)
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Not found",
    message: `Route ${req.method} ${req.path} not found`,
  })
})

// Start server
app.listen(PORT, () => {
  console.log(`🚀 FabCar server running on http://localhost:${PORT}`)
  console.log(`📁 Serving static files from: ${__dirname}`)
  console.log(`🔗 Connection profile: ${ccpPath}`)
  console.log(`💼 Wallet path: ${walletPath}`)
  console.log(`🔧 Fabric Version: 1.4.x`)
  console.log("")
  console.log("Available endpoints:")
  console.log("  GET  /api/health - Health check")
  console.log("  GET  /api/testfabric - Test blockchain connection")
  console.log("  GET  /api/queryallcars - Get all cars")
  console.log("  GET  /api/querycar/:id - Get specific car")
  console.log("  POST /api/createcar - Create new car")
  console.log("  POST /api/transferownership - Transfer car ownership")
  console.log("  POST /signin - User authentication")
})

// Graceful shutdown
process.on("SIGINT", () => {
  console.log("\n🛑 Shutting down server...")
  process.exit(0)
})
