const scriptURL = 'https://script.google.com/macros/s/AKfycbz_Zt0t2m-s382P_ns-O3_huGBJCj7wZP3qt4P1Lg6iVWPj1m40DxuLWUw-J8UPn4ApZw/exec';


// --- 1. Data Fetch කිරීම (CORS බ්ලොක් නොවී JSONP ක්‍රමයට) ---
function fetchOrders() {
    const tbody = document.getElementById("adminTableBody");
    tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; padding: 20px;">Loading orders...</td></tr>`;

    // කලින් තිබ්බ fetch එක වෙනුවට ලේසිම JSONP ක්‍රමය පාවිච්චි කිරීම
    const script = document.createElement('script');
    script.src = `${scriptURL}?action=read&callback=handleResponse`;
    document.body.appendChild(script);
    document.body.removeChild(script); // කෝඩ් එක රන් වුණාම Script tag එක අයින් කරයි
}

// Google Sheet එකෙන් ඩේටා ටික ආවම රන් වෙන Function එක
function handleResponse(data) {
    const tbody = document.getElementById("adminTableBody");
    tbody.innerHTML = ""; 

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="9" style="text-align:center;">No orders found.</td></tr>`;
        return;
    }

    data.forEach(order => {
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
// --- 4. Modal Preview (Google Drive ලින්ක් එක Direct Link එකක් බවට හරවා පෙන්වීම) ---
function openSlipModal(url) {
    const modal = document.getElementById("slipModal");
    const modalImg = document.getElementById("modalImage");
    
    if (!modal || !modalImg) return;

    modal.style.display = "flex";
    modalImg.src = ""; // පරණ පින්තූරය අයින් කර හිස් කරයි

    // 💡 Google Drive ලින්ක් එකෙන් File ID එක වෙන් කරගෙන Direct Link එකක් හදනවා
    if (url.includes("drive.google.com")) {
        const fileId = url.split("/d/")[1].split("/")[0];
        const directLink = `https://lh3.googleusercontent.com/d/${fileId}`;
        modalImg.src = directLink;
    } else {
        modalImg.src = url; // සාමාන්‍ය ලින්ක් එකක් නම් එහෙම්ම දමයි
    }
}
function closeSlipModal() {
    document.getElementById("slipModal").style.display = "none";
}

// 💡 පරණ කෝඩ් වලට බාධාවක් නොවන පරිදි අලුතින්ම එකතු කළ Login Function එක
function checkLogin() {
    const inputPass = document.getElementById("adminPassInput").value;
    const correctPass = "RajansTech27"; // 💡 ඔයාට කැමති පාස්වර්ඩ් එකක් මෙතනට දෙන්න මචං

    if (inputPass === correctPass) {
        document.getElementById("loginBox").style.display = "none"; // Login box එක හයිඩ් කරනවා
        document.getElementById("adminContent").style.display = "block"; // වගුව සහ අනෙක් හැමදේම පෙන්වනවා
        
        // 💡 පාස්වර්ඩ් එක හරි නම් විතරක් ඔයාගේ පරණ function එක මෙතනදී කෝල් වෙනවා
        fetchOrders(); 
    } else {
        alert("Incorrect Password! Try again.");
    }
}
