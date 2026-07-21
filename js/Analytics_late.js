const scriptURL = 'https://script.google.com/macros/s/AKfycbz_Zt0t2m-s382P_ns-O3_huGBJCj7wZP3qt4P1Lg6iVWPj1m40DxuLWUw-J8UPn4ApZw/exec';

// Global Chart Instances
let classesChartInstance = null;
let sizesChartInstance = null;
let paymentsChartInstance = null;

// Global Variables to store fetched data for theme switching
let latestClassData = null;
let latestSizeData = null;
let latestPayData = null;
let currentTheme = 'dark'; // default theme

// SHA256 Verification
async function SHA256(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(bytes => bytes.toString(16).padStart(2, '0')).join('');
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
    fetchAnalyticsData();
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
    // CUTOFF FILTER
    const cutoffTime = new Date("2026-07-20T19:00:00"); 

    data = data.filter(order => {
        const rawTime = order.Timestamp || order.timestamp || order.Date || order.date;
        if (!rawTime) return false; 
        const orderTime = new Date(rawTime);
        if (isNaN(orderTime.getTime())) return false;

        return orderTime > cutoffTime; 
    });
    // -----------------------------------------------------------------------------

    let sizeCounts = { 'XS': 0, 'S': 0, 'M': 0, 'L': 0, 'XL': 0, 'XXL': 0, '3XL': 0, '4XL': 0 };
    let classCounts = {};
    let paymentCounts = { 'Bank Transfer': 0, 'Cash': 0 };

    data.forEach(order => {
        const size = order.size ? order.size.toUpperCase().trim() : '';
        if (sizeCounts.hasOwnProperty(size)) sizeCounts[size]++;

        let className = order.class ? order.class.toUpperCase().trim() : 'UNKNOWN';
        if (!classCounts[className]) classCounts[className] = 0;
        classCounts[className]++;

        const method = order.method ? order.method.toLowerCase().trim() : '';
        if (method === 'cash') paymentCounts['Cash']++;
        else if (method === 'bank') paymentCounts['Bank Transfer']++;
    });

    latestClassData = classCounts;
    latestSizeData = sizeCounts;
    latestPayData = paymentCounts;

    updateAllCharts();
    stopRefreshAnimation();
}

// Function to handle chart rendering wrapper based on theme
function updateAllCharts() {
    if (!latestClassData) return;
    renderClassesChart(latestClassData);
    renderSizesChart(latestSizeData);
    renderPaymentsChart(latestPayData);
}

/* ==========================================
   🎯 CHART RENDERING FUNCTIONS (CHART.JS)
   ========================================== */

function getThemeColors() {
    // Dynamic styling configurations for charts depending on active theme
    if (currentTheme === 'light') {
        return {
            text: '#334155', grid: 'rgba(0,0,0,0.05)',
            barBg: 'rgba(16, 185, 129, 0.6)', barBorder: '#10b981',
            pieBg: ['#ff6384', '#36a2eb', '#ffcc5c', '#4bc0c0', '#9966ff', '#ff9f40', '#10b981', '#f43f5e'],
            donutBg: ['#3b82f6', '#10b981']
        };
    } else if (currentTheme === 'cyber') {
        return {
            text: '#00ffcc', grid: 'rgba(0, 255, 204, 0.1)',
            barBg: 'rgba(255, 0, 127, 0.5)', barBorder: '#ff007f',
            pieBg: ['#ff007f', '#00ffcc', '#9966ff', '#ffcc00', '#ff3366', '#00ff88', '#3399ff', '#ff6600'],
            donutBg: ['#ff007f', '#00ffcc']
        };
    } else { // Dark / Liquid Glass
        return {
            text: '#94a3b8', grid: 'rgba(255,255,255,0.05)',
            barBg: 'rgba(0, 210, 255, 0.4)', barBorder: '#00d2ff',
            pieBg: ['rgba(255, 99, 132, 0.5)', 'rgba(54, 162, 235, 0.5)', 'rgba(255, 206, 86, 0.5)', 'rgba(75, 192, 192, 0.5)', 'rgba(153, 102, 255, 0.5)', 'rgba(255, 159, 64, 0.5)', 'rgba(0, 255, 136, 0.5)', 'rgba(255, 0, 127, 0.5)'],
            donutBg: ['#ff007f', '#00ff88']
        };
    }
}

function renderClassesChart(classData) {
    const ctx = document.getElementById('classesBarChart').getContext('2d');
    const labels = Object.keys(classData).sort();
    const data = labels.map(label => classData[label]);
    const colors = getThemeColors();

    if (labels.length > 0) {
        let topClass = labels[0], lowClass = labels[0];
        labels.forEach(label => {
            if (classData[label] > classData[topClass]) topClass = label;
            if (classData[label] < classData[lowClass]) lowClass = label;
        });
        document.getElementById('topClassName').innerText = topClass;
        document.getElementById('topClassCount').innerText = `${classData[topClass]} Orders`;
        document.getElementById('lowClassName').innerText = lowClass;
        document.getElementById('lowClassCount').innerText = `${classData[lowClass]} Orders`;
    }

    if (classesChartInstance) classesChartInstance.destroy(); // Clear old instance for robust redraws

    classesChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: data, backgroundColor: colors.barBg, borderColor: colors.barBorder,
                borderWidth: 2, borderRadius: 6, barPercentage: 0.3, categoryPercentage: 0.5
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, grid: { color: colors.grid }, ticks: { color: colors.text } },
                x: { grid: { display: false }, ticks: { color: colors.text } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function renderSizesChart(sizeData) {
    const ctx = document.getElementById('sizesPieChart').getContext('2d');
    const labels = Object.keys(sizeData);
    const data = labels.map(label => sizeData[label]);
    const colors = getThemeColors();

    if (sizesChartInstance) sizesChartInstance.destroy();

    sizesChartInstance = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.pieBg, borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'right', labels: { color: colors.text, font: { size: 12 } } } }
        }
    });
}

function renderPaymentsChart(payData) {
    const ctx = document.getElementById('paymentsDonutChart').getContext('2d');
    const labels = Object.keys(payData);
    const data = labels.map(label => payData[label]);
    const colors = getThemeColors();

    if (paymentsChartInstance) paymentsChartInstance.destroy();

    paymentsChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{ data: data, backgroundColor: colors.donutBg, borderColor: 'rgba(255,255,255,0.05)', borderWidth: 2 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false, cutout: '65%',
            plugins: { legend: { position: 'bottom', labels: { color: colors.text, padding: 20 } } }
        }
    });
}

/* ==========================================
   🎨 🆕 THEME CYCLE LOGIC WITH ICONS
   ========================================== */
function setDashboardTheme(themeName, index) {
    currentTheme = themeName;
    
    document.body.className = ''; 
    if (themeName === 'light') document.body.classList.add('light-theme');
    if (themeName === 'cyber') document.body.classList.add('cyber-theme');

    const slider = document.getElementById("thumbSlider");
    if (slider) {
        slider.style.transform = `translateX(${index * 41}px)`;
    }

    const icons = document.querySelectorAll(".theme-icon-option");
    icons.forEach((icon, idx) => {
        if (idx === index) {
            icon.classList.add("active");
        } else {
            icon.classList.remove("active");
        }
    });

    updateAllCharts();
}

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