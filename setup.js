const FabricCAServices = require("fabric-ca-client")
const { FileSystemWallet, Gateway, X509WalletMixin } = require("fabric-network")
const fs = require("fs")
const path = require("path")

// Configuration
const CONFIG = {
  ccpPath: path.resolve(__dirname, "..", "..", "first-network", "connection-org1.json"),
  walletPath: path.join(process.cwd(), "wallet"),
  channelName: "mychannel",
  chaincodeName: "fabcar",
  adminId: "admin",
  adminSecret: "adminpw",
  userId: "user1",
  orgMSP: "Org1MSP",
}

async function setupWallet() {
  try {
    console.log("🔧 Setting up FabCar backend...\n")

    // Check if connection profile exists
    if (!fs.existsSync(CONFIG.ccpPath)) {
      console.error(`❌ Connection profile not found at: ${CONFIG.ccpPath}`)
      console.log("Please ensure your Hyperledger Fabric network is running and the connection profile exists.")
      return false
    }

    // Load connection profile
    const ccpJSON = fs.readFileSync(CONFIG.ccpPath, "utf8")
    const ccp = JSON.parse(ccpJSON)
    console.log("✅ Connection profile loaded")

    // Create wallet
    const wallet = new FileSystemWallet(CONFIG.walletPath)
    console.log(`✅ Wallet created at: ${CONFIG.walletPath}`)

    // Check if admin already exists
    const adminExists = await wallet.exists(CONFIG.adminId)
    if (adminExists) {
      console.log("✅ Admin identity already exists in wallet")
    } else {
      console.log("📝 Enrolling admin user...")
      await enrollAdmin(ccp, wallet)
    }

    // Check if user already exists
    const userExists = await wallet.exists(CONFIG.userId)
    if (userExists) {
      console.log("✅ User identity already exists in wallet")
    } else {
      console.log("📝 Registering and enrolling user...")
      await registerUser(ccp, wallet)
    }

    // Test connection
    console.log("🔍 Testing blockchain connection...")
    await testConnection(ccp, wallet)

    console.log("\n🎉 Setup completed successfully!")
    console.log("You can now start the server with: node server.js")
    return true
  } catch (error) {
    console.error("❌ Setup failed:", error.message)
    console.error("Full error:", error)
    return false
  }
}

async function enrollAdmin(ccp, wallet) {
  try {
    // Get CA info
    const caInfo = ccp.certificateAuthorities["ca.org1.example.com"]
    const caTLSCACerts = caInfo.tlsCACerts.pem
    const ca = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName)

    // Enroll admin
    const enrollment = await ca.enroll({
      enrollmentID: CONFIG.adminId,
      enrollmentSecret: CONFIG.adminSecret,
    })

    // Create identity using X509WalletMixin
    const identity = X509WalletMixin.createIdentity(CONFIG.orgMSP, enrollment.certificate, enrollment.key.toBytes())

    // Import to wallet
    await wallet.import(CONFIG.adminId, identity)
    console.log("✅ Admin enrolled and imported to wallet")
  } catch (error) {
    throw new Error(`Failed to enroll admin: ${error.message}`)
  }
}

async function registerUser(ccp, wallet) {
  try {
    // Create gateway
    const gateway = new Gateway()
    await gateway.connect(ccp, {
      wallet,
      identity: CONFIG.adminId,
      discovery: { enabled: true, asLocalhost: true },
    })

    // Get CA
    const ca = gateway.getClient().getCertificateAuthority()
    const adminIdentity = gateway.getCurrentIdentity()

    // Register user
    const secret = await ca.register(
      {
        affiliation: "org1.department1",
        enrollmentID: CONFIG.userId,
        role: "client",
      },
      adminIdentity,
    )

    // Enroll user
    const enrollment = await ca.enroll({
      enrollmentID: CONFIG.userId,
      enrollmentSecret: secret,
    })

    // Create identity using X509WalletMixin
    const userIdentity = X509WalletMixin.createIdentity(CONFIG.orgMSP, enrollment.certificate, enrollment.key.toBytes())

    // Import to wallet
    await wallet.import(CONFIG.userId, userIdentity)
    console.log("✅ User registered and imported to wallet")

    // Disconnect gateway
    await gateway.disconnect()
  } catch (error) {
    throw new Error(`Failed to register user: ${error.message}`)
  }
}

async function testConnection(ccp, wallet) {
  let gateway
  try {
    // Create gateway
    gateway = new Gateway()
    await gateway.connect(ccp, {
      wallet,
      identity: CONFIG.userId,
      discovery: { enabled: true, asLocalhost: true },
    })

    // Get network and contract
    const network = await gateway.getNetwork(CONFIG.channelName)
    const contract = network.getContract(CONFIG.chaincodeName)

    // Test query
    const result = await contract.evaluateTransaction("queryAllCars")
    const cars = JSON.parse(result.toString())

    console.log(`✅ Blockchain connection successful! Found ${cars.length} cars in the ledger.`)

    // Show first car as example
    if (cars.length > 0) {
      const firstCar = cars[0]
      const carData = firstCar.Record || firstCar
      const carId = firstCar.Key || "Unknown"
      console.log(
        `📋 Example car: ${carId} - ${carData.make} ${carData.model} (${carData.color}) owned by ${carData.owner}`,
      )
    }
  } catch (error) {
    throw new Error(`Failed to test connection: ${error.message}`)
  } finally {
    if (gateway) {
      await gateway.disconnect()
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setupWallet().then((success) => {
    process.exit(success ? 0 : 1)
  })
}

module.exports = { setupWallet }
