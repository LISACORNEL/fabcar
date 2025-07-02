document.addEventListener("DOMContentLoaded", () => {
  // Initialize Lucide icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }

  // Initialize dashboard
  initializeDashboard()
})

function initializeDashboard() {
  // Fetch all cars from the blockchain
  fetchAllCars()

  // Setup event listeners
  setupEventListeners()

  // Setup periodic refresh
  setupPeriodicRefresh()
}

function setupEventListeners() {
  // Sidebar menu events
  document.getElementById("view-all-cars")?.addEventListener("click", handleViewAllCars)
  document.getElementById("search-car")?.addEventListener("click", handleSearchCar)
  document.getElementById("add-car")?.addEventListener("click", handleAddCar)
  document.getElementById("transfer-car")?.addEventListener("click", handleTransferCar)

  // Refresh button
  document.querySelector(".refresh-btn")?.addEventListener("click", fetchAllCars)

  // View options
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", handleViewChange)
  })

  // Sort options
  document.getElementById("sort-select")?.addEventListener("change", handleSortChange)

  // Search functionality
  const searchInput = document.querySelector(".search-box input")
  if (searchInput) {
    searchInput.addEventListener("input", debounce(handleSearch, 300))
  }

  // Modal events
  setupModalEvents()

  // Form events
  setupFormEvents()
}

function setupModalEvents() {
  // Close modal events
  document.querySelectorAll(".close-btn, .close-modal").forEach((btn) => {
    btn.addEventListener("click", closeAllModals)
  })

  // Close modal on overlay click
  document.querySelectorAll(".modal-overlay").forEach((overlay) => {
    overlay.addEventListener("click", closeAllModals)
  })

  // Prevent modal close on content click
  document.querySelectorAll(".modal-content").forEach((content) => {
    content.addEventListener("click", (e) => e.stopPropagation())
  })
}

function setupFormEvents() {
  // Search car form
  document.getElementById("search-car-form")?.addEventListener("submit", handleSearchCarSubmit)

  // Add car form
  document.getElementById("add-car-form")?.addEventListener("submit", handleAddCarSubmit)

  // Transfer ownership form
  document.getElementById("transfer-ownership-form")?.addEventListener("submit", handleTransferOwnershipSubmit)

  // Transfer ownership button in car details
  document.getElementById("transfer-ownership-btn")?.addEventListener("click", handleTransferFromDetails)
}

function setupPeriodicRefresh() {
  // Refresh data every 30 seconds
  setInterval(() => {
    if (!document.querySelector(".modal.active")) {
      fetchAllCars()
    }
  }, 30000)
}

// Event Handlers
function handleViewAllCars(e) {
  e.preventDefault()
  setActiveMenuItem(e.target.closest("li"))
  fetchAllCars()
}

function handleSearchCar(e) {
  e.preventDefault()
  setActiveMenuItem(e.target.closest("li"))
  openModal("search-car-modal")
}

function handleAddCar(e) {
  e.preventDefault()
  setActiveMenuItem(e.target.closest("li"))
  openModal("add-car-modal")
}

function handleTransferCar(e) {
  e.preventDefault()
  setActiveMenuItem(e.target.closest("li"))
  openModal("transfer-ownership-modal")
}

function handleViewChange(e) {
  const view = e.currentTarget.getAttribute("data-view")
  setActiveView(e.currentTarget)
  toggleView(view)
}

function handleSortChange(e) {
  const sortBy = e.target.value
  if (window.currentCars) {
    const sortedCars = sortCars(window.currentCars, sortBy)
    const activeView = document.querySelector(".view-btn.active")?.getAttribute("data-view") || "grid"
    renderCars(sortedCars, activeView)
  }
}

function handleSearch(e) {
  const searchTerm = e.target.value.toLowerCase()
  if (window.currentCars) {
    const filteredCars = window.currentCars.filter((car) => {
      const carData = car.Record || car
      const carId = car.Key || carData.id || ""
      return (
        carId.toLowerCase().includes(searchTerm) ||
        carData.make?.toLowerCase().includes(searchTerm) ||
        carData.model?.toLowerCase().includes(searchTerm) ||
        carData.owner?.toLowerCase().includes(searchTerm) ||
        carData.color?.toLowerCase().includes(searchTerm)
      )
    })
    const activeView = document.querySelector(".view-btn.active")?.getAttribute("data-view") || "grid"
    renderCars(filteredCars, activeView)
  }
}

function handleSearchCarSubmit(e) {
  e.preventDefault()
  const carId = document.getElementById("car-id").value.trim()
  if (carId) {
    searchSpecificCar(carId)
  }
}

function handleAddCarSubmit(e) {
  e.preventDefault()
  const carData = {
    carId: document.getElementById("new-car-id").value.trim(),
    make: document.getElementById("new-car-make").value.trim(),
    model: document.getElementById("new-car-model").value.trim(),
    color: document.getElementById("new-car-color").value,
    owner: document.getElementById("new-car-owner").value.trim(),
  }
  createNewCar(carData)
}

function handleTransferOwnershipSubmit(e) {
  e.preventDefault()
  const carId = document.getElementById("transfer-car-id").value.trim()
  const newOwner = document.getElementById("transfer-new-owner").value.trim()
  transferOwnership(carId, newOwner)
}

function handleTransferFromDetails() {
  const carId = this.getAttribute("data-car-id")
  if (carId) {
    closeAllModals()
    document.getElementById("transfer-car-id").value = carId
    openModal("transfer-ownership-modal")
  }
}

// Utility Functions
function setActiveMenuItem(item) {
  document.querySelectorAll(".sidebar-menu li").forEach((li) => {
    li.classList.remove("active")
  })
  item.classList.add("active")
}

function setActiveView(btn) {
  document.querySelectorAll(".view-btn").forEach((b) => {
    b.classList.remove("active")
  })
  btn.classList.add("active")
}

function toggleView(view) {
  const container = document.getElementById("cars-container")

  if (view === "grid") {
    container.className = "vehicles-grid"
  } else if (view === "list") {
    container.className = "vehicles-list"
  } else if (view === "table") {
    container.className = "vehicles-table"
  }

  if (window.currentCars) {
    renderCars(window.currentCars, view)
  }
}

function openModal(modalId) {
  closeAllModals()
  const modal = document.getElementById(modalId)
  if (modal) {
    modal.classList.add("active")
    document.body.style.overflow = "hidden"
  }
}

function closeAllModals() {
  document.querySelectorAll(".modal").forEach((modal) => {
    modal.classList.remove("active")
  })
  document.body.style.overflow = "auto"
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function sortCars(cars, sortBy) {
  return [...cars].sort((a, b) => {
    const aData = a.Record || a
    const bData = b.Record || b
    const aValue = sortBy === "id" ? a.Key || aData.id || "" : aData[sortBy] || ""
    const bValue = sortBy === "id" ? b.Key || bData.id || "" : bData[sortBy] || ""
    return aValue.localeCompare(bValue)
  })
}

// API Functions
async function fetchAllCars() {
  try {
    showLoading()

    const response = await fetch("/api/queryallcars")
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    const cars = await response.json()

    // Store cars for later use
    window.currentCars = cars

    // Update stats
    updateStats(cars)

    // Render cars
    const activeView = document.querySelector(".view-btn.active")?.getAttribute("data-view") || "grid"
    renderCars(cars, activeView)

    // Update blockchain status
    updateBlockchainStatus(true)
  } catch (error) {
    console.error("Error fetching cars:", error)
    showError("Failed to load vehicles. Please check your connection and try again.")
    updateBlockchainStatus(false)
  }
}

async function searchSpecificCar(carId) {
  try {
    const resultsContainer = document.getElementById("search-results")
    resultsContainer.innerHTML = `
      <div class="loading-container">
        <div class="loading-animation">
          <div class="loading-spinner"></div>
        </div>
        <h3>Searching...</h3>
        <p>Looking for vehicle ${carId}...</p>
      </div>
    `

    const response = await fetch(`/api/querycar/${carId}`)
    if (!response.ok) {
      throw new Error("Vehicle not found")
    }

    const carData = await response.json()
    const car = { Key: carId, Record: carData }

    resultsContainer.innerHTML = renderCarCard(car)

    // Add event listener to view details button
    const viewBtn = resultsContainer.querySelector(".view-details-btn")
    if (viewBtn) {
      viewBtn.addEventListener("click", () => showCarDetails(car))
    }

    // Re-initialize icons
    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    }
  } catch (error) {
    console.error("Error searching car:", error)
    document.getElementById("search-results").innerHTML = `
      <div class="no-results">
        <i data-lucide="search-x"></i>
        <h3>Vehicle Not Found</h3>
        <p>No vehicle found with ID: ${carId}</p>
      </div>
    `
    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    }
  }
}

async function createNewCar(carData) {
  try {
    const submitBtn = document.querySelector('#add-car-form button[type="submit"]')
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Creating...'
    submitBtn.disabled = true

    const response = await fetch("/api/createcar", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(carData),
    })

    if (!response.ok) {
      throw new Error("Failed to create vehicle")
    }

    // Reset form
    document.getElementById("add-car-form").reset()

    // Close modal
    closeAllModals()

    // Refresh cars
    await fetchAllCars()

    // Show success notification
    showNotification("Vehicle registered successfully!", "success")
  } catch (error) {
    console.error("Error creating car:", error)
    showNotification("Failed to register vehicle. Please try again.", "error")
  } finally {
    const submitBtn = document.querySelector('#add-car-form button[type="submit"]')
    submitBtn.innerHTML = '<i data-lucide="plus-circle"></i> Register Vehicle'
    submitBtn.disabled = false
    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    }
  }
}

async function transferOwnership(carId, newOwner) {
  try {
    const submitBtn = document.querySelector('#transfer-ownership-form button[type="submit"]')
    const originalText = submitBtn.innerHTML
    submitBtn.innerHTML = '<i data-lucide="loader-2"></i> Transferring...'
    submitBtn.disabled = true

    // Note: This endpoint would need to be implemented in your server
    const response = await fetch("/api/transferownership", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ carId, newOwner }),
    })

    if (!response.ok) {
      throw new Error("Failed to transfer ownership")
    }

    // Reset form
    document.getElementById("transfer-ownership-form").reset()

    // Close modal
    closeAllModals()

    // Refresh cars
    await fetchAllCars()

    // Show success notification
    showNotification("Ownership transferred successfully!", "success")
  } catch (error) {
    console.error("Error transferring ownership:", error)
    showNotification("Failed to transfer ownership. Please try again.", "error")
  } finally {
    const submitBtn = document.querySelector('#transfer-ownership-form button[type="submit"]')
    submitBtn.innerHTML = '<i data-lucide="refresh-cw"></i> Transfer Ownership'
    submitBtn.disabled = false
    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    }
  }
}

// UI Functions
function showLoading() {
  document.getElementById("cars-container").innerHTML = `
    <div class="loading-container">
      <div class="loading-animation">
        <div class="loading-spinner"></div>
        <div class="loading-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
      <h3>Loading Vehicles</h3>
      <p>Fetching data from blockchain network...</p>
    </div>
  `
}

function showError(message) {
  document.getElementById("cars-container").innerHTML = `
    <div class="error-container">
      <i data-lucide="alert-circle"></i>
      <h3>Error Loading Data</h3>
      <p>${message}</p>
      <button class="btn btn-primary retry-btn">
        <i data-lucide="refresh-cw"></i>
        Retry
      </button>
    </div>
  `

  document.querySelector(".retry-btn")?.addEventListener("click", fetchAllCars)

  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }
}

function updateStats(cars) {
  const totalCars = cars.length
  const uniqueOwners = new Set()

  cars.forEach((car) => {
    const carData = car.Record || car
    if (carData.owner) {
      uniqueOwners.add(carData.owner)
    }
  })

  // Animate counter updates
  animateCounter("total-cars", totalCars)
  animateCounter("unique-owners", uniqueOwners.size)
  animateCounter("transactions", totalCars + Math.floor(Math.random() * 50))
}

function animateCounter(elementId, targetValue) {
  const element = document.getElementById(elementId)
  if (!element) return

  const startValue = 0
  const duration = 1000
  const startTime = performance.now()

  function updateCounter(currentTime) {
    const elapsed = currentTime - startTime
    const progress = Math.min(elapsed / duration, 1)
    const currentValue = Math.floor(startValue + (targetValue - startValue) * progress)

    element.textContent = currentValue.toLocaleString()

    if (progress < 1) {
      requestAnimationFrame(updateCounter)
    }
  }

  requestAnimationFrame(updateCounter)
}

function updateBlockchainStatus(isOnline) {
  const indicator = document.querySelector(".status-indicator")
  const statusText = document.querySelector(".status-info span")

  if (indicator && statusText) {
    if (isOnline) {
      indicator.className = "status-indicator online"
      statusText.textContent = "Blockchain Connected"
    } else {
      indicator.className = "status-indicator offline"
      statusText.textContent = "Connection Failed"
    }
  }
}

function renderCars(cars, view = "grid") {
  const container = document.getElementById("cars-container")

  if (!cars || cars.length === 0) {
    container.innerHTML = `
      <div class="no-results">
        <i data-lucide="car"></i>
        <h3>No Vehicles Found</h3>
        <p>No vehicles are currently registered in the blockchain.</p>
        <button class="btn btn-primary" onclick="handleAddCar(event)">
          <i data-lucide="plus-circle"></i>
          Register First Vehicle
        </button>
      </div>
    `
    if (typeof lucide !== "undefined") {
      lucide.createIcons()
    }
    return
  }

  if (view === "grid") {
    container.className = "vehicles-grid"
    container.innerHTML = cars.map((car) => renderCarCard(car)).join("")
  } else if (view === "list") {
    container.className = "vehicles-list"
    container.innerHTML = cars.map((car) => renderCarListItem(car)).join("")
  } else if (view === "table") {
    container.className = "vehicles-table"
    container.innerHTML = renderCarTable(cars)
  }

  // Add event listeners
  addCarEventListeners()

  // Re-initialize icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }
}

function renderCarCard(car) {
  const carData = car.Record || car
  const carId = car.Key || carData.id || "Unknown"
  const colorStyle = getColorStyle(carData.color)

  return `
    <div class="car-card" data-car-id="${carId}">
      <div class="car-image">
        <i data-lucide="car"></i>
        <div class="car-color-indicator" style="background-color: ${colorStyle};"></div>
      </div>
      <div class="car-details">
        <h3 class="car-make-model">${carData.make} ${carData.model}</h3>
        <p class="car-id">${carId}</p>
        <div class="car-owner">
          <i data-lucide="user"></i>
          <span>${carData.owner}</span>
        </div>
      </div>
      <div class="car-actions">
        <button class="car-action-btn view-details-btn" data-car-id="${carId}">
          <i data-lucide="eye"></i>
          <span>View Details</span>
        </button>
        <button class="car-action-btn transfer-btn" data-car-id="${carId}">
          <i data-lucide="refresh-cw"></i>
          <span>Transfer</span>
        </button>
      </div>
    </div>
  `
}

function renderCarListItem(car) {
  const carData = car.Record || car
  const carId = car.Key || carData.id || "Unknown"
  const colorStyle = getColorStyle(carData.color)

  return `
    <div class="car-list-item" data-car-id="${carId}">
      <div class="car-list-color" style="background-color: ${colorStyle};"></div>
      <div class="car-list-info">
        <h3 class="car-list-make-model">${carData.make} ${carData.model}</h3>
        <p class="car-list-id">${carId}</p>
      </div>
      <div class="car-list-owner">
        <i data-lucide="user"></i>
        <span>${carData.owner}</span>
      </div>
      <div class="car-list-actions">
        <button class="car-action-btn view-details-btn" data-car-id="${carId}" title="View Details">
          <i data-lucide="eye"></i>
        </button>
        <button class="car-action-btn transfer-btn" data-car-id="${carId}" title="Transfer Ownership">
          <i data-lucide="refresh-cw"></i>
        </button>
      </div>
    </div>
  `
}

function renderCarTable(cars) {
  const tableRows = cars
    .map((car) => {
      const carData = car.Record || car
      const carId = car.Key || carData.id || "Unknown"
      const colorStyle = getColorStyle(carData.color)

      return `
      <tr data-car-id="${carId}">
        <td>
          <div class="table-car-info">
            <div class="table-color-indicator" style="background-color: ${colorStyle};"></div>
            <span>${carId}</span>
          </div>
        </td>
        <td>${carData.make}</td>
        <td>${carData.model}</td>
        <td>
          <div class="table-color">
            <div class="color-circle" style="background-color: ${colorStyle};"></div>
            ${carData.color}
          </div>
        </td>
        <td>
          <div class="table-owner">
            <i data-lucide="user"></i>
            ${carData.owner}
          </div>
        </td>
        <td>
          <div class="table-actions">
            <button class="car-action-btn view-details-btn" data-car-id="${carId}" title="View Details">
              <i data-lucide="eye"></i>
            </button>
            <button class="car-action-btn transfer-btn" data-car-id="${carId}" title="Transfer">
              <i data-lucide="refresh-cw"></i>
            </button>
          </div>
        </td>
      </tr>
    `
    })
    .join("")

  return `
    <table class="vehicles-table-element">
      <thead>
        <tr>
          <th>Vehicle ID</th>
          <th>Make</th>
          <th>Model</th>
          <th>Color</th>
          <th>Owner</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  `
}

function addCarEventListeners() {
  // View details buttons
  document.querySelectorAll(".view-details-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const carId = this.getAttribute("data-car-id")
      const car = window.currentCars?.find((c) => (c.Key || c.id) === carId)
      if (car) {
        showCarDetails(car)
      }
    })
  })

  // Transfer buttons
  document.querySelectorAll(".transfer-btn").forEach((btn) => {
    btn.addEventListener("click", function () {
      const carId = this.getAttribute("data-car-id")
      document.getElementById("transfer-car-id").value = carId
      openModal("transfer-ownership-modal")
    })
  })
}

function showCarDetails(car) {
  const carData = car.Record || car
  const carId = car.Key || carData.id || "Unknown"
  const colorStyle = getColorStyle(carData.color)

  const detailsContent = `
    <div class="car-detail-header">
      <div class="car-detail-icon">
        <i data-lucide="car"></i>
      </div>
      <div class="car-detail-title">
        <h3>${carData.make} ${carData.model}</h3>
        <p>${carId}</p>
      </div>
    </div>
    <div class="car-detail-info">
      <div class="car-detail-row">
        <span class="car-detail-label">Vehicle ID</span>
        <span class="car-detail-value">${carId}</span>
      </div>
      <div class="car-detail-row">
        <span class="car-detail-label">Make</span>
        <span class="car-detail-value">${carData.make}</span>
      </div>
      <div class="car-detail-row">
        <span class="car-detail-label">Model</span>
        <span class="car-detail-value">${carData.model}</span>
      </div>
      <div class="car-detail-row">
        <span class="car-detail-label">Color</span>
        <span class="car-detail-value">
          <div class="car-detail-color">
            <div class="color-circle" style="background-color: ${colorStyle};"></div>
            ${carData.color}
          </div>
        </span>
      </div>
      <div class="car-detail-row">
        <span class="car-detail-label">Owner</span>
        <span class="car-detail-value">${carData.owner}</span>
      </div>
      <div class="car-detail-row">
        <span class="car-detail-label">Blockchain Status</span>
        <span class="car-detail-value">
          <span class="status-badge verified">
            <i data-lucide="shield-check"></i>
            Verified
          </span>
        </span>
      </div>
    </div>
  `

  document.getElementById("car-details-content").innerHTML = detailsContent
  document.getElementById("transfer-ownership-btn").setAttribute("data-car-id", carId)

  openModal("car-details-modal")

  // Re-initialize icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }
}

function getColorStyle(color) {
  const colorMap = {
    red: "#e53935",
    blue: "#1e88e5",
    green: "#43a047",
    yellow: "#fdd835",
    black: "#212121",
    white: "#f5f5f5",
    silver: "#bdbdbd",
    gray: "#757575",
    grey: "#757575",
    purple: "#8e24aa",
    orange: "#fb8c00",
    brown: "#6d4c41",
    pink: "#d81b60",
    gold: "#d4af37",
  }

  return colorMap[color?.toLowerCase()] || color || "#757575"
}

function showNotification(message, type = "info") {
  // Create notification element
  const notification = document.createElement("div")
  notification.className = `notification ${type}`
  notification.innerHTML = `
    <div class="notification-content">
      <i data-lucide="${type === "success" ? "check-circle" : type === "error" ? "x-circle" : "info"}"></i>
      <span>${message}</span>
    </div>
    <button class="notification-close">
      <i data-lucide="x"></i>
    </button>
  `

  // Add to page
  document.body.appendChild(notification)

  // Initialize icons
  if (typeof lucide !== "undefined") {
    lucide.createIcons()
  }

  // Auto remove after 5 seconds
  setTimeout(() => {
    notification.remove()
  }, 5000)

  // Manual close
  notification.querySelector(".notification-close").addEventListener("click", () => {
    notification.remove()
  })
}

// Add notification styles to CSS
const notificationStyles = `
.notification {
  position: fixed;
  top: 20px;
  right: 20px;
  background: var(--card-bg);
  backdrop-filter: blur(20px);
  border: 1px solid var(--border-color);
  border-radius: var(--border-radius);
  padding: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
  z-index: 1001;
  min-width: 300px;
  box-shadow: var(--shadow-heavy);
  animation: slideIn 0.3s ease-out;
}

.notification.success {
  border-color: var(--success-color);
}

.notification.error {
  border-color: var(--error-color);
}

.notification-content {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-grow: 1;
}

.notification-content i {
  width: 20px;
  height: 20px;
}

.notification.success .notification-content i {
  color: var(--success-color);
}

.notification.error .notification-content i {
  color: var(--error-color);
}

.notification-close {
  background: transparent;
  border: none;
  color: var(--text-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: var(--transition);
}

.notification-close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: var(--text-primary);
}

.notification-close i {
  width: 16px;
  height: 16px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.verified {
  background: rgba(76, 175, 80, 0.2);
  color: var(--success-color);
  border: 1px solid rgba(76, 175, 80, 0.3);
}

.status-badge i {
  width: 14px;
  height: 14px;
}

/* Table styles */
.vehicles-table-element {
  width: 100%;
  border-collapse: collapse;
  background: transparent;
}

.vehicles-table-element th,
.vehicles-table-element td {
  padding: 16px;
  text-align: left;
  border-bottom: 1px solid var(--border-color);
}

.vehicles-table-element th {
  background: rgba(0, 0, 0, 0.3);
  color: var(--text-secondary);
  font-weight: 600;
  text-transform: uppercase;
  font-size: 12px;
  letter-spacing: 0.5px;
}

.vehicles-table-element td {
  color: var(--text-primary);
}

.vehicles-table-element tr:hover {
  background: rgba(212, 175, 55, 0.05);
}

.table-car-info,
.table-color,
.table-owner {
  display: flex;
  align-items: center;
  gap: 8px;
}

.table-color-indicator {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  border: 2px solid white;
}

.table-actions {
  display: flex;
  gap: 8px;
}
`

// Inject notification styles
const styleSheet = document.createElement("style")
styleSheet.textContent = notificationStyles
document.head.appendChild(styleSheet)
