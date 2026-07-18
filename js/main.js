const scriptURL = 'https://script.google.com/macros/s/AKfycbz_Zt0t2m-s382P_ns-O3_huGBJCj7wZP3qt4P1Lg6iVWPj1m40DxuLWUw-J8UPn4ApZw/exec'; 

function selectSize(size) {
    document.querySelectorAll('.size-chip').forEach(chip => {
        chip.classList.remove('active');
    });

    const chips = document.querySelectorAll('.size-chip');
    chips.forEach(chip => {
        if(chip.innerText === size) {
            chip.classList.add('active');
            console.log("Selected: " + size);
        }
    });

    const hiddenInput = document.getElementById('finalSize');
    if (hiddenInput) {
        hiddenInput.value = size;
    }
}

// --- 1.  (Navigation) ---
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

// --- 2.  (Validation) --- [UPDATED FOR AUTOMATIC INITIALS]
function validateAndNext(step) {
    if (step === 2) {
        let nameInput = document.getElementById('name');
        const admission = document.getElementById('admissionNo').value.trim();
        const phone = document.getElementById('phone').value.trim();
        
        const selectedClass = document.querySelector('input[name="class"]:checked');

        if (!nameInput.value || !admission || !selectedClass || !phone) {
            showAlert("Please fill in all your details!", "error");
            return;
        }

        if (!/^\d{1,5}$/.test(admission)) {
            showAlert("Admission Number must contain numbers only and be up to 5 digits long!", "error");
            return;
        }

        if (!/^\d+$/.test(phone)) {
            showAlert("Phone Number must contain numbers only!", "error");
            return;
        }

        let formattedRaw = nameInput.value.replace(/\./g, '. ');

        let rawName = formattedRaw.trim().replace(/\s+/g, ' ').toLowerCase();

        let words = rawName.split(' ');

        if (words.length > 1) {
            let lastName = words[words.length - 1];
            lastName = lastName.charAt(0).toUpperCase() + lastName.slice(1);

            let initials = "";
            for (let i = 0; i < words.length - 1; i++) {
                let word = words[i].replace(/\./g, '');
                if (word.length > 0) {
                    initials += word.charAt(0).toUpperCase() + ". ";
                }
            }

            nameInput.value = initials + lastName;
        } else if (words.length === 1 && words[0] !== "") {
            nameInput.value = words[0].charAt(0).toUpperCase() + words[0].slice(1);
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
// --- 3. Payment ---
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

// --- 4. Slip  ---
function updateFileName() {
    const fileInput = document.getElementById('slipFile');
    const fileNameDisplay = document.getElementById('file-name-text');
    if (fileInput.files.length > 0) {
        fileNameDisplay.innerText = "Selected: " + fileInput.files[0].name;
        fileNameDisplay.style.color = "#00ff88";
    }
}

// --- 3. Submit Order --- [UPDATED FOR RADIO BUTTONS]
async function submitOrder() {
    const currentScriptURL = 'https://script.google.com/macros/s/AKfycbz_Zt0t2m-s382P_ns-O3_huGBJCj7wZP3qt4P1Lg6iVWPj1m40DxuLWUw-J8UPn4ApZw/exec'; 

    const name = document.getElementById('name').value;
    const admissionNo = document.getElementById('admissionNo').value;
    const phone = document.getElementById('phone').value;
    const finalSize = document.getElementById('finalSize').value; 
    const selectedPayment = document.querySelector('input[name="payMethod"]:checked');
    
    const selectedClass = document.querySelector('input[name="class"]:checked');
    const className = selectedClass ? selectedClass.value : '';

    // 2. Validation
    if (!name || !admissionNo || !className || !finalSize || !selectedPayment) {
        showAlert("Please fill all details and select a size!", "error");
        return;
    }

    const submitBtn = document.querySelector(".btn-group button");
    if(submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "Compressing & Sending...";
    }

    const formData = new FormData();
    formData.append("Name", name);
    formData.append("Admission", admissionNo); 
    formData.append("Class", className); 
    formData.append("Phone", phone);           
    formData.append("Size", finalSize);        
    formData.append("Method", selectedPayment.value);

    const fileInput = document.getElementById('slipFile');
    if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        const reader = new FileReader();
        
        reader.onload = function(event) {
            const img = new Image();
            img.onload = async function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;

                const MAX_WIDTH = 1024;
                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }
                canvas.width = width;
                canvas.height = height;

                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const compressedBase64 = canvas.toDataURL('image/jpeg', 0.7).split(',')[1];

                formData.append("slipFile", compressedBase64);
                formData.append("mimeType", "image/jpeg");
                
                submitBtn.innerText = "Uploading to Drive...";
                await finalFetch(currentScriptURL, formData);
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    } else {
        checkDuplicateAndSubmit(admissionNo, formData, submitBtn);
    }
}

async function finalFetch(url, data) {
    try {
        await fetch(url, { 
            method: 'POST', 
            body: data,
            mode: 'no-cors' 
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
    if (!message) return; 

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

function checkDuplicateAndSubmit(admissionNo, formData, submitBtn) {
    const targetAdmission = admissionNo.toString().trim();
    const script = document.createElement('script');
    
    window.handleDuplicateCheck = function(data) {
        const isDuplicate = data.some(order => order.admission.toString().trim() === targetAdmission);

        if (isDuplicate) {
            showAlert("⚠️ This Admission Number has already placed an order! Duplicates are not allowed.", "error");
            
            const alertOverlay = document.getElementById('customAlert');
            if (alertOverlay) {
                const alertBtn = alertOverlay.querySelector(".liquid-btn") || alertOverlay.querySelector("button");
                
                if (alertBtn) {
                    alertBtn.onclick = function() {
                        alertOverlay.style.display = 'none';
                        location.reload(); 
                    };
                }
            }
        } else {
            const currentScriptURL = 'https://script.google.com/macros/s/AKfycbz_Zt0t2m-s382P_ns-O3_huGBJCj7wZP3qt4P1Lg6iVWPj1m40DxuLWUw-J8UPn4ApZw/exec';
            finalFetch(currentScriptURL, formData);
        }
        
        document.body.removeChild(script);
        delete window.handleDuplicateCheck;
    };

    script.src = `${scriptURL}?action=read&callback=handleDuplicateCheck`;
    document.body.appendChild(script);
}

// ========================================================
// ⏰ AUTOMATIC DEADLINE CONTROL SYSTEM
// ========================================================

const targetDate = new Date("2026-07-18T11:00:00"); 

window.addEventListener("DOMContentLoaded", () => {
    const currentDate = new Date();

    if (currentDate >= targetDate) {
        const activeStep = document.querySelector('.step.active');
        if (activeStep) {
            activeStep.classList.remove('active');
            activeStep.style.display = 'none';
        }

        document.querySelectorAll('.step').forEach(s => {
            s.remove(); 
        });

        const closedMsg = document.getElementById("closedMessage");
        if (closedMsg) {
            closedMsg.style.display = "block";
        }
    } else {
        nextStep(1);
    }
});
