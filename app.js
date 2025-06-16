const socket = new WebSocket(`ws://${window.location.host}/ws`);

// Logging function
function logEvent(level, message, data = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    level,
    message,
    ...data,
  };
  console.log(JSON.stringify(logEntry));
  // Display log in UI
  const logList = document.getElementById("log-list");
  if (logList) {
    const logItem = document.createElement("div");
    logItem.textContent = `[${timestamp}] ${level}: ${message}`;
    logList.appendChild(logItem);
  }
  // Send to backend
  fetch("/api/logs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(logEntry),
  }).catch((err) => console.error("Log failed:", err));
}

// Temperature Chart
const tempCtx = document.getElementById("tempChart").getContext("2d");
const tempChart = new Chart(tempCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Temperature (°C)",
        data: [],
        borderColor: "#fff",
        backgroundColor: "rgba(255,255,255,0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
    plugins: {
      legend: { labels: { color: "#fff" } },
    },
  },
});

// Pressure Chart
const pressCtx = document.getElementById("pressChart").getContext("2d");
const pressChart = new Chart(pressCtx, {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "Pressure (hPa)",
        data: [],
        borderColor: "#00fff7",
        backgroundColor: "rgba(0, 255, 247, 0.2)",
        fill: true,
        tension: 0.3,
        pointRadius: 3,
      },
    ],
  },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
      y: {
        ticks: { color: "#fff" },
        grid: { color: "rgba(255,255,255,0.1)" },
      },
    },
    plugins: {
      legend: { labels: { color: "#fff" } },
    },
  },
});

socket.onopen = () => {
  document.querySelector("#conn-status .status-dot").classList.add("connected");
  document.querySelector("#conn-status span").textContent = "Connected";
  logEvent("INFO", "WebSocket connection established");
};

socket.onclose = () => {
  document
    .querySelector("#conn-status .status-dot")
    .classList.remove("connected");
  document.querySelector("#conn-status span").textContent = "Disconnected";
  logEvent("ERROR", "WebSocket connection closed");
};

socket.onmessage = (event) => {
  const data = JSON.parse(event.data);

  // Update temperature chart
  if (data.times && data.temps) {
    tempChart.data.labels = data.times;
    tempChart.data.datasets[0].data = data.temps;
    tempChart.update();
    logEvent("INFO", "Temperature chart updated", {
      latestTemp: data.temps[data.temps.length - 1],
    });
  }

  // Update pressure chart
  if (data.times && data.pressures) {
    pressChart.data.labels = data.pressure_times || data.times;
    pressChart.data.datasets[0].data = data.pressures;
    pressChart.update();
    logEvent("INFO", "Pressure chart updated", {
      latestPressure: data.pressures[data.pressures.length - 1],
    });
  }

  // Update current readings
  if (data.temps && data.pressures) {
    const latestTemp = data.temps[data.temps.length - 1];
    const latestPressure = data.pressures[data.pressures.length - 1];
    document.getElementById("current-temp").textContent = latestTemp.toFixed(1);
    document.getElementById("current-pressure").textContent =
      latestPressure.toFixed(2);
    logEvent("INFO", "Current readings updated", {
      temp: latestTemp,
      pressure: latestPressure,
    });
  }

  // Update system status
  if (data.battery || data.cpu || data.memory) {
    document.getElementById("battery").textContent = `${Math.floor(
      data.battery || 0
    )}%`;
    document.getElementById("cpu").textContent = `${Math.floor(
      data.cpu || 0
    )}%`;
    document.getElementById("memory").textContent = `${Math.floor(
      data.memory || 0
    )}%`;
    document.getElementById("last-update").textContent =
      new Date().toLocaleTimeString();
    logEvent("INFO", "System status updated", {
      battery: data.battery,
      cpu: data.cpu,
      memory: data.memory,
    });
  }

  // Update recommendations
  if (data.recommendations) {
    const recList = document.getElementById("recommendation-list");
    recList.innerHTML = "";
    data.recommendations.forEach((item) => {
      const recItem = document.createElement("div");
      recItem.className = "recommendation-item";
      recItem.innerHTML = `
        <span><i class="fas fa-utensil-spoon"></i> ${item.name} ($${item.price})</span>
        <button onclick="addToCart('${item.id}', '${item.name}')">Add to Cart</button>
      `;
      recList.appendChild(recItem);
    });
    logEvent("INFO", "Recommendations updated", {
      count: data.recommendations.length,
    });
  }
};

function showSection(id) {
  document
    .querySelectorAll(".content-section")
    .forEach((el) => el.classList.remove("active"));
  document.querySelector(`#${id}`).classList.add("active");
  document
    .querySelectorAll(".nav-item")
    .forEach((el) => el.classList.remove("active"));
  const navItem = document.querySelector(
    `.nav-item[onclick="showSection('${id}')"]`
  );
  if (navItem) navItem.classList.add("active");
  logEvent("INFO", `Section ${id} displayed`);
}

function addToCart(itemId, itemName) {
  logEvent("INFO", `Item added to cart: ${itemName}`, { itemId });
  // Implement cart logic (e.g., send to backend)
  fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ itemId, quantity: 1 }),
  })
    .then((res) => res.json())
    .then((data) => {
      logEvent("INFO", `Cart updated for item ${itemName}`, { response: data });
    })
    .catch((err) => {
      logEvent("ERROR", `Failed to add item ${itemName} to cart`, {
        error: err.message,
      });
    });
}

function captureImage() {
  logEvent("INFO", "Camera capture triggered");
  // Implement camera capture logic
}
