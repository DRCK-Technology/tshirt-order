const scriptURL = 'https://script.google.com/macros/s/AKfycbz_Zt0t2m-s382P_ns-O3_huGBJCj7wZP3qt4P1Lg6iVWPj1m40DxuLWUw-J8UPn4ApZw/exec';


function fetchOrders() {
    const tbody = document.getElementById("adminTableBody");
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading orders...</td></tr>`;

    const script = document.createElement('script');
    script.src = `${scriptURL}?action=read&callback=handleResponse`;
    document.body.appendChild(script);
    document.body.removeChild(script); 
}

function handleResponse(data) {
    const tbody = document.getElementById("adminTableBody");
    tbody.innerHTML = ""; 

    let totalOrders = 0;
    let countXS = 0, countS = 0, countM = 0, countL = 0, countXL = 0, countXXL = 0, count3XL = 0, count4XL = 0;
    let countCash = 0, countBank = 0;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No orders found.</td></tr>`;
        return;
    }

    data.forEach(order => {
        totalOrders++; 

        const orderSize = order.size ? order.size.toUpperCase().trim() : '';
        if (orderSize === 'XS') countXS++;
        else if (orderSize === 'S') countS++;
        else if (orderSize === 'M') countM++;
        else if (orderSize === 'L') countL++;
        else if (orderSize === 'XL') countXL++;
        else if (orderSize === 'XXL') countXXL++;
        else if (orderSize === '3XL') count3XL++;
        else if (orderSize === '4XL') count4XL++;

        
        const payMethod = order.method ? order.method.toLowerCase().trim() : '';
        if (payMethod === 'cash') countCash++;
        else if (payMethod === 'bank') countBank++;

        const tr = document.createElement("tr");
        
        let slipButton = "No Slip";
        if (order.slipUrl && order.slipUrl !== "No Slip") {
            slipButton = `<button class="btn-view" onclick="openSlipModal('${order.slipUrl}')">View Slip</button>`;
        }

        let actionButtons = "";
        if (order.status.toLowerCase() === "done") {
            actionButtons = `
                <button class="btn-reset" onclick="updateStatus('${order.admission}', 'Pending', this)">Reset</button>
                <button class="btn-delete" onclick="deleteOrder('${order.admission}', this)">Delete</button>
            `;
        } else {
            actionButtons = `
                <button class="btn-approve" onclick="updateStatus('${order.admission}', 'Done', this)">Approve</button>
                <button class="btn-delete" onclick="deleteOrder('${order.admission}', this)">Delete</button>
            `;
        }

        tr.innerHTML = `
            <td>${order.admission}</td>
            <td>${order.name}</td>
            <td>${order.class}</td>
            <td>${order.phone}</td>
            <td><span style="color:#00ff88; font-weight:bold;">${order.size}</span></td>
            <td>${order.method.toUpperCase()}</td>
            <td>${slipButton}</td>
            <td><span class="badge ${order.status.toLowerCase()}">${order.status}</span></td>
            <td><div class="action-group">${actionButtons}</div></td>
        `;
        tbody.appendChild(tr);
    });

    if(document.getElementById("sumTotalOrders")) document.getElementById("sumTotalOrders").innerText = totalOrders;
    if(document.getElementById("sizeXS")) document.getElementById("sizeXS").innerText = countXS;
    if(document.getElementById("sizeS")) document.getElementById("sizeS").innerText = countS;
    if(document.getElementById("sizeM")) document.getElementById("sizeM").innerText = countM;
    if(document.getElementById("sizeL")) document.getElementById("sizeL").innerText = countL;
    if(document.getElementById("sizeXL")) document.getElementById("sizeXL").innerText = countXL;
    if(document.getElementById("sizeXXL")) document.getElementById("sizeXXL").innerText = countXXL;
    if(document.getElementById("size3XL")) document.getElementById("size3XL").innerText = count3XL;
    if(document.getElementById("size4XL")) document.getElementById("size4XL").innerText = count4XL;
    if(document.getElementById("sumCash")) document.getElementById("sumCash").innerText = countCash;
    if(document.getElementById("sumBank")) document.getElementById("sumBank").innerText = countBank;
}

// --- 2. Status Update ---
async function updateStatus(admissionNo, newStatus, button) {
    const actionText = newStatus === 'Done' ? 'approve' : 'reset to pending';
    if (!confirm(`Are you sure you want to ${actionText} this order?`)) return;

    button.disabled = true;
    button.innerText = "...";

    try {
        const formData = new FormData();
        formData.append("action", "updateStatus");
        formData.append("Admission", admissionNo);
        formData.append("Status", newStatus);

        await fetch(scriptURL, { method: 'POST', body: formData, mode: 'no-cors' });
        alert("Order updated successfully!");
        fetchOrders(); 
    } catch (error) {
        alert("Error, try again.");
        fetchOrders();
    }
}

// --- 3. Delete Order ---
async function deleteOrder(admissionNo, button) {
    if (!confirm("⚠️ Permanent Delete?")) return;

    button.disabled = true;
    button.innerText = "...";

    try {
        const formData = new FormData();
        formData.append("action", "deleteOrder");
        formData.append("Admission", admissionNo);

        await fetch(scriptURL, { method: 'POST', body: formData, mode: 'no-cors' });
        alert("Deleted successfully!");
        fetchOrders(); 
    } catch (error) {
        alert("Error, try again.");
        fetchOrders();
    }
}

// --- 4. Modal Preview ---
// --- 4. Modal Preview (Google Drive to Direct Link ) ---
function openSlipModal(url) {
    const modal = document.getElementById("slipModal");
    const modalImg = document.getElementById("modalImage");
    
    if (!modal || !modalImg) return;

    modal.style.display = "flex";
    modalImg.src = ""; 

    if (url.includes("drive.google.com")) {
        const fileId = url.split("/d/")[1].split("/")[0];
        const directLink = `https://lh3.googleusercontent.com/d/${fileId}`;
        modalImg.src = directLink;
    } else {
        modalImg.src = url; 
    }
}
function closeSlipModal() {
    document.getElementById("slipModal").style.display = "none";
}

//SHA256
async function SHA256(string) {
    const utf8 = new TextEncoder().encode(string);
    const hashBuffer = await crypto.subtle.digest('SHA-256', utf8);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(bytes => bytes.toString(16).padStart(2, '0')).join('');
    return hashHex;
}

// Admin login function
async function checkLogin() {
    const inputPass = document.getElementById("adminPassInput").value;
    
    const encryptedInput = await SHA256(inputPass);
    
    const hashedCorrectPass = "b68ee1b8870adf335b8afc8c7cbb1710f9f0593019583115681136a07cbdfa94";

    if (encryptedInput === hashedCorrectPass) {
        document.getElementById("loginBox").style.display = "none";
        document.getElementById("adminContent").style.display = "block";
        
        fetchOrders();
    } else {
        alert("Incorrect Password! Try again.");
    }
}
function refreshTableOnly() {
    const refreshBtn = document.getElementById("refreshBtn");
    
    if (refreshBtn) {
        refreshBtn.disabled = true;
        refreshBtn.innerText = "⏳ Loading Data...";
        refreshBtn.style.borderColor = "#ffcc00";
        refreshBtn.style.color = "#ffcc00";
    }

    fetchOrders();

    setTimeout(() => {
        if (refreshBtn) {
            refreshBtn.disabled = false;
            refreshBtn.innerText = "🔄 Refresh Table";
            refreshBtn.style.borderColor = "#00ff88";
            refreshBtn.style.color = "#00ff88";
        }
    }, 2500);
}
