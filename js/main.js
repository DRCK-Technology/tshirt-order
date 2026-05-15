const scriptURL = 'https://script.google.com/macros/s/AKfycbyhLSpkcpo7108MXBG8-4SJA8DuieXEIJLX5IxdeRh3YJjASjc2ioZsP_RXq25RA-c7Xw/exec'; // මතක ඇතුව අලුත් Deployment URL එක මෙතනට දාන්න

function selectSize(size) {
    // 1. සියලුම chips වලින් 'active' class එක අයින් කරනවා
    // (ඔයාගේ CSS එකේ තියෙන්නේ .active නිසා මෙතනත් .active ම පාවිච්චි කරනවා)
    document.querySelectorAll('.size-chip').forEach(chip => {
        chip.classList.remove('active');
    });

    // 2. ක්ලික් කරපු chip එක සොයාගෙන ඒකට 'active' class එක දානවා
    const chips = document.querySelectorAll('.size-chip');
    chips.forEach(chip => {
        if(chip.innerText === size) {
            chip.classList.add('active');
            console.log("Selected: " + size);
        }
    });

    // 3. Hidden input එකට අගය දානවා
    const hiddenInput = document.getElementById('finalSize');
    if (hiddenInput) {
        hiddenInput.value = size;
    }
}

// --- 1. පියවර මාරු කිරීම (Navigation) ---
function nextStep(step) {
    document.querySelectorAll('.step').forEach(s => {
        s.classList.remove('active');
        s.style.display = 'none'; // සහතික වෙන්න පරණ ඒව පේන්නේ නෑ කියලා
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

// --- 2. දත්ත පරීක්ෂා කර ඊළඟට යාම (Validation) ---
function validateAndNext(step) {
    if (step === 2) {
        // Details පරීක්ෂාව
        const name = document.getElementById('name').value;
        const admission = document.getElementById('admissionNo').value;
        const className = document.getElementById('class').value;
        const phone = document.getElementById('phone').value;

        if (!name || !admission || !className || !phone) {
            showAlert("Please fill in all your details!", "error");
            return;
        }
        nextStep(3); // Size Chart එකට යනවා
    } else if (step === 4) {
        // Size පරීක්ෂාව
        const size = document.getElementById('finalSize').value;
        if (!size) {
            showAlert("Please select a T-shirt size!", "error");
            return;
        }
        nextStep(5); // Payment එකට යනවා
    }
}

// --- 3. ගෙවීම් ක්‍රමය අනුව විස්තර පෙන්වීම ---
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

// --- 4. Slip එක තේරූ පසු නම පෙන්වීම ---
function updateFileName() {
    const fileInput = document.getElementById('slipFile');
    const fileNameDisplay = document.getElementById('file-name-text');
    if (fileInput.files.length > 0) {
        fileNameDisplay.innerText = "Selected: " + fileInput.files[0].name;
        fileNameDisplay.style.color = "#00ff88";
    }
}

// --- 5. ඇණවුම යැවීම (Final Submission) ---
async function submitOrder() {
    const scriptURL = 'ඔයාගේ_අලුත්ම_DEPLOYMENT_URL_එක'; // අනිවාර්යයෙන්ම අලුත් එකක් ගන්න

    // 1. දත්ත ටික ගන්නවා
    const name = document.getElementById('name').value;
    const admissionNo = document.getElementById('admissionNo').value;
    const className = document.getElementById('class').value;
    const phone = document.getElementById('phone').value;
    const finalSize = document.getElementById('finalSize').value; // Hidden Input එක
    const selectedPayment = document.querySelector('input[name="payMethod"]:checked');

    // 2. Validation (දත්ත අඩුවක් තියෙනවා නම් නවත්තනවා)
    if (!name || !admissionNo || !finalSize || !selectedPayment) {
        showAlert("Please fill all details and select a size!", "error");
        return;
    }

    // 3. Button එක Disable කරනවා (පිට පිට එබීම වැළැක්වීමට)
    const submitBtn = document.querySelector(".btn-group button");
    submitBtn.disabled = true;
    submitBtn.innerText = "Sending Data...";

    // 4. දත්ත ටික Form එකක් විදිහට හදනවා
    const formData = new FormData();
    formData.append("Name", name);
    formData.append("Admission", admissionNo); // මෙතන "Admission"
    formData.append("Class", className);
    formData.append("Phone", phone);           // මෙතන "Phone"
    formData.append("Size", finalSize);        // මෙතන "Size"
    formData.append("Method", selectedPayment.value);

    // 5. Slip එකක් තියෙනවා නම් ඒකත් එකතු කරනවා
    const fileInput = document.getElementById('slipFile');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        reader.onload = async function(e) {
            const base64Data = e.target.result.split(',')[1];
            formData.append("slipFile", base64Data);
            formData.append("mimeType", file.type);
            await finalFetch(scriptURL, formData);
        };
        reader.readAsDataURL(file);
    } else {
        await finalFetch(scriptURL, formData);
    }
}

async function finalFetch(url, data) {
    try {
        // වැදගත්ම කොටස: POST Request එක
        await fetch(url, { 
            method: 'POST', 
            body: data,
            mode: 'no-cors' // Google Script වලට මේක අත්‍යවශ්‍යයි
        });
        
        showAlert("Success! Your order has been placed.", "success");
        setTimeout(() => { location.reload(); }, 3000);
    } catch (error) {
        console.error('Error!', error.message);
        showAlert("Something went wrong. Check your internet!", "error");
        document.querySelector(".btn-group button").disabled = false;
    }
}

async function sendDataToSheet(formData) {
    console.log("Sending data to URL:", scriptURL);
    try {
        await fetch(scriptURL, { method: 'POST', mode: 'no-cors', body: formData });
        showAlert("Order placed successfully! 🦁", "success");
        setTimeout(() => window.location.reload(), 3000);
    } catch (err) {
        console.error(err);
        showAlert("Connection error. Try again!", "error");
        location.reload();
    }
}

// --- 6. Alerts & Previews ---
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

