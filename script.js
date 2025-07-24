// Inisialisasi Firebase
firebase.initializeApp(window.firebaseConfig);
const db = firebase.database();

// Variabel global
let chart = null;
const historyData = {
  temperature: [],
  humidity: [],
  soil: [],
  timestamps: [],
};

// Fungsi untuk mengevaluasi kondisi
function evaluateConditions(temp, hum, soil) {
  // Evaluasi suhu
  const tempStatus = document.getElementById("temp-status");
  if (temp >= 18 && temp <= 24) {
    tempStatus.textContent = "Optimal (18-24°C)";
    tempStatus.className = "status-indicator optimal";
  } else if (temp < 18) {
    tempStatus.textContent = "Low (<18°C)";
    tempStatus.className = "status-indicator warning";
  } else if (temp > 24 && temp <= 30) {
    tempStatus.textContent = "High (24-30°C)";
    tempStatus.className = "status-indicator warning";
  } else {
    tempStatus.textContent = "Critical (>30°C)";
    tempStatus.className = "status-indicator critical";
  }

  // Evaluasi kelembaban
  const humStatus = document.getElementById("hum-status");
  if (hum >= 60 && hum <= 85) {
    humStatus.textContent = "Optimal (60-85%)";
    humStatus.className = "status-indicator optimal";
  } else if (hum < 60) {
    humStatus.textContent = "Low (<60%)";
    humStatus.className = "status-indicator warning";
  } else {
    humStatus.textContent = "High (>85%)";
    humStatus.className = "status-indicator critical";
  }

  // Evaluasi kelembaban tanah
  const soilStatus = document.getElementById("soil-status");
  if (soil >= 60 && soil <= 80) {
    soilStatus.textContent = "Optimal (60-80%)";
    soilStatus.className = "status-indicator optimal";
  } else if (soil < 60 && soil >= 40) {
    soilStatus.textContent = "Low (40-60%)";
    soilStatus.className = "status-indicator warning";
  } else if (soil < 40) {
    soilStatus.textContent = "Critical (<40%)";
    soilStatus.className = "status-indicator critical";
  } else {
    soilStatus.textContent = "High (>80%)";
    soilStatus.className = "status-indicator critical";
  }

  // Evaluasi status tanaman
  const plantStatus = document.getElementById("plant-status");
  if (
    temp >= 18 &&
    temp <= 24 &&
    hum >= 60 &&
    hum <= 85 &&
    soil >= 60 &&
    soil <= 80
  ) {
    plantStatus.textContent = "Optimal conditions for tomato growth";
    plantStatus.style.color = "#27ae60";
  } else if (
    temp < 15 ||
    temp > 30 ||
    hum < 50 ||
    hum > 90 ||
    soil < 40 ||
    soil > 85
  ) {
    plantStatus.textContent = "Critical conditions! Immediate action needed";
    plantStatus.style.color = "#e74c3c";
  } else {
    plantStatus.textContent = "Suboptimal conditions - monitoring required";
    plantStatus.style.color = "#f39c12";
  }
}

// Fungsi untuk mengupdate status perangkat
function updateDeviceStatus(fan, pump) {
  document.getElementById("fan-status").textContent = fan;
  document.getElementById("pump-status").textContent = pump;

  // Update status warna berdasarkan nilai
  const fanElement = document.getElementById("fan-status");
  const pumpElement = document.getElementById("pump-status");

  fanElement.className = "metric-value";
  pumpElement.className = "metric-value";

  if (fan === "OFF") {
    fanElement.style.color = "#7f8c8d";
  } else if (fan === "LOW") {
    fanElement.style.color = "#f39c12";
  } else {
    fanElement.style.color = "#e74c3c";
  }

  if (pump === "OFF") {
    pumpElement.style.color = "#7f8c8d";
  } else if (pump === "LOW") {
    pumpElement.style.color = "#f39c12";
  } else {
    pumpElement.style.color = "#3498db";
  }
}

// Fungsi untuk menginisialisasi grafik
function initChart() {
  const ctx = document.getElementById("dataChart").getContext("2d");
  chart = new Chart(ctx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Temperature (°C)",
          data: [],
          borderColor: "#e74c3c",
          backgroundColor: "rgba(231, 76, 60, 0.1)",
          tension: 0.4,
          fill: true,
        },
        {
          label: "Humidity (%)",
          data: [],
          borderColor: "#3498db",
          backgroundColor: "rgba(52, 152, 219, 0.1)",
          tension: 0.4,
          fill: true,
          hidden: true,
        },
        {
          label: "Soil Moisture (%)",
          data: [],
          borderColor: "#27ae60",
          backgroundColor: "rgba(39, 174, 96, 0.1)",
          tension: 0.4,
          fill: true,
          hidden: true,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: false,
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            color: "#718096",
          },
        },
        x: {
          grid: {
            color: "rgba(0, 0, 0, 0.05)",
          },
          ticks: {
            color: "#718096",
          },
        },
      },
      plugins: {
        legend: {
          labels: {
            color: "#2d3748",
            font: {
              size: 13,
            },
          },
        },
        tooltip: {
          backgroundColor: "rgba(45, 55, 72, 0.95)",
          titleFont: {
            size: 13,
          },
          bodyFont: {
            size: 13,
          },
          padding: 12,
          displayColors: false,
        },
      },
    },
  });
}

// Fungsi untuk mengupdate grafik
function updateChart() {
  if (!chart) return;

  // Update data grafik
  chart.data.labels = historyData.timestamps;
  chart.data.datasets[0].data = historyData.temperature;
  chart.data.datasets[1].data = historyData.humidity;
  chart.data.datasets[2].data = historyData.soil;

  chart.update();
}

// Fungsi untuk mengupdate tabel history
function updateHistoryTable() {
  const tableBody = document.getElementById("history-table-body");
  tableBody.innerHTML = "";

  if (historyData.timestamps.length === 0) {
    tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center;">No data available</td></tr>`;
    return;
  }

  // Membuat baris untuk setiap data history
  for (let i = historyData.timestamps.length - 1; i >= 0; i--) {
    const timestamp = historyData.timestamps[i];
    const temp = historyData.temperature[i];
    const hum = historyData.humidity[i];
    const soil = historyData.soil[i];

    // Menentukan status berdasarkan kondisi
    let status = "status-optimal";
    if (
      temp < 18 ||
      temp > 24 ||
      hum < 60 ||
      hum > 85 ||
      soil < 60 ||
      soil > 80
    ) {
      status = "status-warning";
    }
    if (
      temp < 15 ||
      temp > 30 ||
      hum < 50 ||
      hum > 90 ||
      soil < 40 ||
      soil > 85
    ) {
      status = "status-critical";
    }

    const row = document.createElement("tr");
    row.innerHTML = `
        <td>${timestamp}</td>
        <td>${temp.toFixed(1)}°C</td>
        <td>${hum.toFixed(0)}%</td>
        <td>${soil.toFixed(0)}%</td>
        <td><span class="status-badge ${status}">${status
      .split("-")[1]
      .toUpperCase()}</span></td>
      `;
    tableBody.appendChild(row);
  }
}

// Event listener untuk tombol grafik
document.querySelectorAll(".chart-btn").forEach((button) => {
  button.addEventListener("click", function () {
    // Hapus kelas active dari semua tombol
    document.querySelectorAll(".chart-btn").forEach((btn) => {
      btn.classList.remove("active");
    });

    // Tambahkan kelas active ke tombol yang diklik
    this.classList.add("active");

    // Tampilkan dataset yang sesuai
    const chartType = this.dataset.type;

    // Sembunyikan semua dataset
    chart.data.datasets.forEach((dataset) => {
      dataset.hidden = true;
    });

    // Tampilkan dataset yang sesuai
    if (chartType === "temperature") {
      chart.data.datasets[0].hidden = false;
    } else if (chartType === "humidity") {
      chart.data.datasets[1].hidden = false;
    } else if (chartType === "soil") {
      chart.data.datasets[2].hidden = false;
    }

    chart.update();
  });
});

// Event listener untuk menu tab
document.querySelectorAll(".menu-item").forEach((item) => {
  item.addEventListener("click", function () {
    // Hapus active dari semua item
    document.querySelectorAll(".menu-item").forEach((i) => {
      i.classList.remove("active");
    });

    // Tambahkan active ke item yang diklik
    this.classList.add("active");

    // Sembunyikan semua tab content
    document.querySelectorAll(".tab-content").forEach((tab) => {
      tab.classList.remove("active");
    });

    // Tampilkan tab yang sesuai
    const tabId = this.dataset.tab;
    if (tabId) {
      document.getElementById(`${tabId}-content`).classList.add("active");

      // Jika tab analytics diaktifkan, update grafik
      if (tabId === "analytics" && chart) {
        updateChart();
      }
    }
  });
});

// Update data dari Firebase
db.ref("sensor").on("value", (snapshot) => {
  const data = snapshot.val();
  const temp = data?.temperature ?? null;
  const hum = data?.humidity ?? null;
  const soil = data?.soil ?? null;

  // Update waktu terakhir pembaruan
  const lastUpdateEl = document.getElementById("last-update");
  if (lastUpdateEl) {
    lastUpdateEl.textContent = new Date().toLocaleTimeString();
  }

  if (temp !== null) {
    const tempEl = document.getElementById("temperature");
    if (tempEl) tempEl.textContent = temp.toFixed(1) + "°C";
  }

  if (hum !== null) {
    const humEl = document.getElementById("humidity");
    if (humEl) humEl.textContent = hum.toFixed(0) + "%";
  }

  if (soil !== null) {
    const soilEl = document.getElementById("soil");
    if (soilEl) soilEl.textContent = soil.toFixed(0) + "%";
  }

  if (temp !== null && hum !== null && soil !== null) {
    evaluateConditions(temp, hum, soil);

    // Tambahkan ke history data
    const now = new Date();
    const timeLabel =
      now.getHours() +
      ":" +
      (now.getMinutes() < 10 ? "0" : "") +
      now.getMinutes();

    historyData.temperature.push(temp);
    historyData.humidity.push(hum);
    historyData.soil.push(soil);
    historyData.timestamps.push(timeLabel);

    // Pertahankan hanya 20 data terbaru
    if (historyData.timestamps.length > 20) {
      historyData.temperature.shift();
      historyData.humidity.shift();
      historyData.soil.shift();
      historyData.timestamps.shift();
    }

    // Update grafik
    if (chart) {
      updateChart();
    }

    // Update history table
    updateHistoryTable();
  }
});

// Update status perangkat
db.ref("status").on("value", (snapshot) => {
  const data = snapshot.val();
  const fanStatus = data?.fan_status ?? "--";
  const pumpStatus = data?.pump_status ?? "--";

  if (fanStatus && pumpStatus) {
    updateDeviceStatus(fanStatus, pumpStatus);
  }
});

// Inisialisasi saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  // Inisialisasi grafik
  initChart();

  // Set default chart type
  const chartBtn = document.querySelector(
    '.chart-btn[data-type="temperature"]'
  );
  if (chartBtn) {
    chartBtn.classList.add("active");
  }

  // Ambil data history terbaru
  db.ref("history")
    .limitToLast(20)
    .once("value", (snapshot) => {
      const data = snapshot.val();
      if (!data) return;

      // Reset history data
      historyData.temperature = [];
      historyData.humidity = [];
      historyData.soil = [];
      historyData.timestamps = [];

      Object.entries(data).forEach(([key, val]) => {
        const timestamp = new Date(parseInt(key));
        const timeLabel =
          timestamp.getHours() +
          ":" +
          (timestamp.getMinutes() < 10 ? "0" : "") +
          timestamp.getMinutes();

        historyData.temperature.push(val.temperature);
        historyData.humidity.push(val.humidity);
        historyData.soil.push(val.soil);
        historyData.timestamps.push(timeLabel);
      });

      if (chart) {
        updateChart();
      }

      updateHistoryTable();
    });
});
