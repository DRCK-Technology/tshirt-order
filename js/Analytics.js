const scriptURL = 'https://script.google.com/macros/s/AKfycbz_Zt0t2m-s382P_ns-O3_huGBJCj7wZP3qt4P1Lg6iVWPj1m40DxuLWUw-J8UPn4ApZw/exec';

// Global variables to hold chart instances
let classesChartInstance = null;
let sizesChartInstance = null;
let paymentsChartInstance = null;

async function SHA256(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(bytes => bytes.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

async function checkLogin() {
    const inputPass = document.getElementById("adminPassInput").value;
    const encryptedInput = await SHA256(inputPass);
    const hashedCorrectPass = "b68ee1b8870adf335b8afc8c7cbb1710f9f0593019583115681136a07cbdfa94";

    if (encryptedInput === hashedCorrectPass) {
        sessionStorage.setItem("adminLoggedIn", "true");
        showAnalyticsContent();
    } else {
        alert("Incorrect Password! Try again.");
    }
}

function showAnalyticsContent() {
    document.getElementById("loginBox").style.display = "none";
    document.getElementById("adminContent").style.display = "block";
    fetchAnalyticsData(); //[cite: 3]
}

window.addEventListener("DOMContentLoaded", () => {
    if (sessionStorage.getItem("adminLoggedIn") === "true") {
        showAnalyticsContent();
    }
});

function fetchAnalyticsData() {
    const script = document.createElement('script');
    script.src = `${scriptURL}?action=read&callback=processAnalyticsResponse`;
    document.body.appendChild(script);
    document.body.removeChild(script); 
}

function processAnalyticsResponse(data) {
    let sizeCounts = { 'XS': 0, 'S': 0, 'M': 0, 'L': 0, 'XL': 0, 'XXL': 0, '3XL': 0, '4XL': 0 };
    let classCounts = {};
    let paymentCounts = { 'Bank Transfer': 0, 'Cash': 0 };

    data.forEach(order => {
        // T-Shirt Sizes Count
        const size = order.size ? order.size.toUpperCase().trim() : '';
        if (sizeCounts.hasOwnProperty(size)) {
            sizeCounts[size]++;
        }

        // Classes Count
        let className = order.class ? order.class.toUpperCase().trim() : 'UNKNOWN';
        if (!classCounts[className]) {
            classCounts[className] = 0;
        }
        classCounts[className]++;

        // Payment Methods Count
        const method = order.method ? order.method.toLowerCase().trim() : '';
        if (method === 'cash') paymentCounts['Cash']++;
        else if (method === 'bank') paymentCounts['Bank Transfer']++;
    });

    // Render Or Update All 3 Charts
    renderClassesChart(classCounts);
    renderSizesChart(sizeCounts);
    renderPaymentsChart(paymentCounts);

    stopRefreshAnimation();
}

// Manual Refresh Trigger
function refreshChartsOnly() {
    const btn = document.getElementById("refreshChartsBtn");
    if(btn) {
        btn.classList.add("spinning");
        btn.disabled = true;
        btn.innerHTML = `<span class="btn-icon">🔄</span> Updating Charts...`;
    }
    
    fetchAnalyticsData();
}

function stopRefreshAnimation() {
    setTimeout(() => {
        const btn = document.getElementById("refreshChartsBtn");
        if(btn) {
            btn.classList.remove("spinning");
            btn.disabled = false;
            btn.innerHTML = `<span class="btn-icon">🔄</span> Refresh Analytics Data`;
        }
    }, 500);
}

/* ==========================================
   🎯 CHART RENDERING FUNCTIONS (CHART.JS)
   ========================================== */

// 1. Bar Chart - Classes
// 1. Bar Chart - Classes (Updated for thinner bars and side analytics)
function renderClassesChart(classData) {
    const ctx = document.getElementById('classesBarChart').getContext('2d');
    const labels = Object.keys(classData).sort();
    const data = labels.map(label => classData[label]);

    // --- Dynamic Insights Calculation ---
    if (labels.length > 0) {
        let topClass = labels[0];
        let lowClass = labels[0];
        
        labels.forEach(label => {
            if (classData[label] > classData[topClass]) topClass = label;
            if (classData[label] < classData[lowClass]) lowClass = label;
        });

        document.getElementById('topClassName').innerText = topClass;
        document.getElementById('topClassCount').innerText = `${classData[topClass]} Orders`;
        document.getElementById('lowClassName').innerText = lowClass;
        document.getElementById('lowClassCount').innerText = `${classData[lowClass]} Orders`;
    }

    if (classesChartInstance) {
        classesChartInstance.data.labels = labels;
        classesChartInstance.data.datasets[0].data = data;
        classesChartInstance.update();
    } else {
        classesChartInstance = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Orders Count',
                    data: data,
                    backgroundColor: 'rgba(0, 210, 255, 0.4)',
                    borderColor: '#00d2ff',
                    borderWidth: 2,
                    borderRadius: 6,
                    barPercentage: 0.3,       
                    categoryPercentage: 0.5   
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { color: '#94a3b8' } },
                    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
                },
                plugins: { legend: { display: false } }
            }
        });
    }
}

// 2. Pie Chart - Sizes
function renderSizesChart(sizeData) {
    const ctx = document.getElementById('sizesPieChart').getContext('2d');
    const labels = Object.keys(sizeData);
    const data = labels.map(label => sizeData[label]);

    if (sizesChartInstance) {
        sizesChartInstance.data.labels = labels;
        sizesChartInstance.data.datasets[0].data = data;
        sizesChartInstance.update();
    } else {
        sizesChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)',
                        'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)',
                        'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)',
                        'rgba(0, 255, 136, 0.5)', 'rgba(255, 0, 127, 0.5)'
                    ],
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'right', labels: { color: '#94a3b8', font: { size: 12 } } }
                }
            }
        });
    }
}

// 3. Donut Chart - Payments
function renderPaymentsChart(payData) {
    const ctx = document.getElementById('paymentsDonutChart').getContext('2d');
    const labels = Object.keys(payData);
    const data = labels.map(label => payData[label]);

    if (paymentsChartInstance) {
        paymentsChartInstance.data.labels = labels;
        paymentsChartInstance.data.datasets[0].data = data;
        paymentsChartInstance.update();
    } else {
        paymentsChartInstance = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: ['#ff007f', '#00ff88'],
                    borderColor: 'rgba(255,255,255,0.05)',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '65%',
                plugins: {
                    legend: { position: 'bottom', labels: { color: '#94a3b8', padding: 20 } }
                }
            }
        });
    }
}

// Manual Refresh Trigger
function refreshChartsOnly() {
    const btn = document.getElementById("refreshChartsBtn");
    if(btn) {
        btn.classList.add("spinning");
        btn.disabled = true;
        btn.innerHTML = `<span class="btn-icon">🔄</span> Updating Charts...`;
    }
    
    fetchAnalyticsData();
}

function stopRefreshAnimation() {
    const btn = document.getElementById("refreshChartsBtn");
    if(btn) {
        btn.classList.remove("spinning");
        btn.disabled = false;
        btn.innerHTML = `<span class="btn-icon">🔄</span> Refresh Analytics Data`;
    }
}