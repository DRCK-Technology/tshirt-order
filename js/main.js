// 1. මෙතනට ඔයාගේ අලුත්ම DEPLOYMENT URL එක දාන්න (Anyone access දීපු එක)
const scriptURL = 'https://script.google.com/macros/s/AKfycbzpEwwBaz_3KkwkE_mew1UCH5lbhQo-tsPHJWiL1Gh9eZwiaC69x-oYAY2zWhXivTXWpQ/exec'; 

// --- 1. Size Selection Logic ---
function selectSize(size) {
    document.querySelectorAll('.size-chip').forEach(chip => {
        chip.classList.remove('active');
    });

    const chips = document.querySelectorAll('.size-chip');
    chips.forEach(chip => {
        if(chip.innerText === size) {
            chip.classList.add('active');
            console.log("Selected Size: " + size);
        }
    });

    const hiddenInput = document.getElementById('finalSize');
    if (hiddenInput) {
        hiddenInput.value = size;
    }
}

// --- 2. Navigation Logic ---
function nextStep(step) {
    document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; 
    });
    
    const target = document.getElementById('step' + step);
    if (target) {
        target.classList.add('active');
        target.style.display = 'block';
    }
}

function prevStep() {
    const activeStep = document.querySelector('.step.active');
    const currentNum = parseInt(activeStep.id.replace('step', ''));
    if (currentNum > 1) {
        nextStep(currentNum - 1);
    }
}

function validateAndNext(step) {
    if (step === 2) {
        const name = document.getElementById('name').value;
        const admission = document.getElementById('admissionNo').value;
        const className = document.getElementById('class').value;
        const phone = document.getElementById('phone').value;

        if (!name || !admission || !className || !phone) {
            showAlert("Please fill in all your details!", "error");
            return;
        }
        nextStep(3); 
    } else if (step === 4) {
        const size = document.getElementById('finalSize').value;
        if (!size) {
            showAlert("Please select a T-shirt size!", "error");
            return;
        }
        nextStep(5); 
    }
}

// --- 3. Payment UI Logic ---
function togglePaymentDetails(method) {
    const bankArea = document.getElementById('bankDetailsArea');
    const cashArea = document.getElementById('cashDetailsArea');

    if (method === 'bank') {
        bankArea.style.display = 'block';
        cashArea.style.display = 'none';
    } else {
        bankArea.style.display = 'none';
        cashArea.style.display = 'block';
    }
}

function updateFileName() {
    const fileInput = document.getElementById('slipFile');
    const fileNameDisplay = document.getElementById('file-name-text');
    if (fileInput.files.length > 0) {
        fileNameDisplay.innerText = "Selected: " + fileInput.files[0].name;
        fileNameDisplay.style.color = "#00ff88";
    }
}

// --- 4. Final Submission Logic (වැදගත්ම කොටස) ---
async function submitOrder() {
    const name = document.getElementById('name').value;
    const admissionNo = document.getElementById('admissionNo').value;
    const finalSize = document.getElementById('finalSize').value;
    const selectedPayment = document.querySelector('input[name="payMethod"]:checked');

    if (!name || !admissionNo || !finalSize || !selectedPayment) {
        showAlert("Please fill all details and select a size!", "error");
        return;
    }

    const submitBtn = document.querySelector(".btn-group button");
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending Data...";

    const formData = new FormData();
    formData.append("Name", name);
    formData.append("Admission", admissionNo);
    formData.append("Class", document.getElementById('class').value);
    formData.append("Phone", document.getElementById('phone').value);
    formData.append("Size", finalSize);
    formData.append("Method", selectedPayment.value);

    const fileInput = document.getElementById('slipFile');
    
    // Slip එකක් තියෙනවා නම් ඒක Base64 කරලා දානවා
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            const base64Data = e.target.result.split(',')[1];
            formData.append("slipFile", base64Data);
            formData.append("mimeType", file.type);
            
            // scriptURL එක උඩින් ලබාගන්නවා
            await finalFetch(scriptURL, formData); 
        };
        reader.readAsDataURL(file);
    } else {
        await finalFetch(scriptURL, formData);
    }
}

async function finalFetch(url, data) {
    try {
        await fetch(url, { 
            method: 'POST', 
            body: data,
            mode: 'no-cors' 
        });
        
        showAlert("Success! Your order has been placed. 🦁", "success");
        setTimeout(() => { location.reload(); }, 3000);
    } catch (error) {
        console.error('Error!', error.message);
        showAlert("Something went wrong. Check your internet!", "error");
        document.querySelector(".btn-group button").disabled = false;
        document.querySelector(".btn-group button").innerText = "Complete Order";
    }
}

// --- 5. UI Helpers (Alerts & Modals) ---
function showAlert(message, type) {
    const alertOverlay = document.getElementById('customAlert');
    const alertIcon = document.getElementById('alertIcon');
    document.getElementById('alertMessage').innerText = message;
    
    alertIcon.innerText = (type === "success") ? "✅" : "⚠️";
    alertOverlay.style.display = 'flex';
}

function closeAlert() {
    document.getElementById('customAlert').style.display = 'none';
}

function openPreview(src) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("fullImage");
    modal.style.display = "flex";
    modalImg.src = src;
}

function closePreview() {
    document.getElementById("imageModal").style.display = "none";
}
