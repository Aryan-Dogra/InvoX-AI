document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // CONFIGURATION
    // =========================================================

    const API_BASE_URL = "http://localhost:5000/api";


    // =========================================================
    // AUTHENTICATION CHECK
    // =========================================================

    const token = localStorage.getItem("invoxToken");

    if (!token) {
        window.location.href = "login.html";
        return;
    }


    // =========================================================
    // DASHBOARD ELEMENTS
    // =========================================================

    const fileInput = document.getElementById("invoiceFile");
    const uploadBtn = document.getElementById("uploadBtn");
    const dropZone = document.getElementById("dropZone");
    const selectedFile = document.getElementById("selectedFile");

    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const suggestions = document.querySelectorAll(".suggestion");

    const invoiceTable = document.getElementById("invoiceTable");
    const tableBody = invoiceTable.querySelector("tbody");
    const emptyState = document.getElementById("emptyState");

    const assistantInput = document.getElementById("assistantInput");
    const assistantSend = document.getElementById("assistantSend");
    const quickQuestions =
        document.querySelectorAll(".quick-questions button");

    const logoutBtn = document.getElementById("logoutBtn");
    const viewAllBtn = document.getElementById("viewAllBtn");

    const userNameElement = document.querySelector(".user-name");


    // =========================================================
    // STORE INVOICES
    // =========================================================

    let invoices = [];


    // =========================================================
    // LOAD USER NAME
    // =========================================================

    function loadUserName() {

        const storedUser = localStorage.getItem("invoxUser");

        if (!storedUser) {
            return;
        }

        try {

            const user = JSON.parse(storedUser);

            if (user.name && userNameElement) {
                userNameElement.textContent = user.name;
            }

        } catch (error) {

            console.error("Could not read stored user:", error);

        }

    }

    loadUserName();


    // =========================================================
    // FETCH INVOICES FROM BACKEND
    // =========================================================

    async function loadInvoices() {

        try {

            const response = await fetch(
                `${API_BASE_URL}/invoices`,
                {
                    method: "GET",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                }
            );


            // If token is invalid/expired
            if (response.status === 401) {

                localStorage.removeItem("invoxToken");
                localStorage.removeItem("invoxUser");

                window.location.href = "login.html";

                return;
            }


            const data = await response.json();


            if (!response.ok || !data.success) {

                throw new Error(
                    data.message || "Failed to fetch invoices"
                );

            }


            // Save invoices
            invoices = data.invoices || [];


            // Display everything
            updateDashboardStats();
            renderInvoices(invoices);


        } catch (error) {

            console.error("Load invoices error:", error);

            tableBody.innerHTML = "";

            emptyState.textContent =
                "Could not load invoices. Please try again.";

            emptyState.style.display = "block";

        }

    }


    // =========================================================
    // UPDATE DASHBOARD STATISTICS
    // =========================================================

   function updateDashboardStats() {

    // -----------------------------------------
    // TOTAL INVOICES
    // -----------------------------------------

    const totalInvoices = invoices.length;


    // -----------------------------------------
    // THIS MONTH
    // -----------------------------------------

    const now = new Date();

    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    const thisMonthInvoices = invoices.filter(invoice => {

        if (!invoice.createdAt) {
            return false;
        }

        const date = new Date(invoice.createdAt);

        return (
            date.getMonth() === currentMonth &&
            date.getFullYear() === currentYear
        );

    });


    // -----------------------------------------
    // TOTAL AMOUNT
    // -----------------------------------------

    const totalAmount = invoices.reduce(
        (sum, invoice) => {

            const amount =
                Number(invoice.total) || 0;

            return sum + amount;

        },
        0
    );


    // -----------------------------------------
    // UPDATE HTML
    // -----------------------------------------

    const statCards =
        document.querySelectorAll(".stat-card");

    if (statCards.length >= 3) {

        // Total invoices
        const totalValue =
            statCards[0].querySelector("strong");

        if (totalValue) {
            totalValue.textContent = totalInvoices;
        }


        // This month
        const monthValue =
            statCards[1].querySelector("strong");

        if (monthValue) {
            monthValue.textContent =
                thisMonthInvoices.length;
        }


        // Total amount
        const amountValue =
            statCards[2].querySelector("strong");

        if (amountValue) {
            amountValue.textContent =
                formatCurrency(totalAmount);
        }

    }

}


    // =========================================================
    // FORMAT CURRENCY
    // =========================================================

    function formatCurrency(amount) {

        return new Intl.NumberFormat(
            "en-IN",
            {
                style: "currency",
                currency: "INR",
                maximumFractionDigits: 2
            }
        ).format(amount);

    }


    // =========================================================
    // RENDER INVOICES
    // =========================================================

    function renderInvoices(invoiceList) {

        tableBody.innerHTML = "";


        // No invoices
        if (invoiceList.length === 0) {

            emptyState.textContent =
                "No invoices found.";

            emptyState.style.display = "block";

            return;

        }


        emptyState.style.display = "none";


        invoiceList.forEach(invoice => {

            const row =
                document.createElement("tr");


            // -----------------------------------------
            // INVOICE NUMBER
            // -----------------------------------------

            const invoiceNumber =
                invoice.invoiceNumber ||
                "Not processed";


            // -----------------------------------------
            // VENDOR
            // -----------------------------------------

            const vendorName =
                invoice.vendorName ||
                "Not processed";


            // -----------------------------------------
            // DATE
            // -----------------------------------------

            const date =
                invoice.invoiceDate
                    ? formatDate(invoice.invoiceDate)
                    : formatDate(invoice.createdAt);


            // -----------------------------------------
            // TOTAL
            // -----------------------------------------

            const total =
                Number(invoice.total) || 0;


            // -----------------------------------------
            // STATUS
            // -----------------------------------------

            const status =
                invoice.processingStatus ||
                "uploaded";


            const formattedStatus =
                formatStatus(status);


            // -----------------------------------------
            // CREATE ROW
            // -----------------------------------------

            row.innerHTML = `
                <td>${escapeHTML(invoiceNumber)}</td>

                <td>${escapeHTML(vendorName)}</td>

                <td>${date}</td>

                <td>${formatCurrency(total)}</td>

                <td>
                    <span class="status ${status}">
                        ${formattedStatus}
                    </span>
                </td>

                <td>
                    <button
                        class="more-btn"
                        data-id="${invoice._id}"
                        type="button"
                    >
                        ⋮
                    </button>
                </td>
            `;


            tableBody.appendChild(row);

        });


        // Add View button listeners
        const moreButtons =
            tableBody.querySelectorAll(".more-btn");


        moreButtons.forEach(button => {

            button.addEventListener("click", () => {

                const invoiceId =
                    button.dataset.id;

                openInvoice(invoiceId);

            });

        });

    }


    // =========================================================
    // FORMAT DATE
    // =========================================================

    function formatDate(dateValue) {

        if (!dateValue) {
            return "-";
        }

        const date =
            new Date(dateValue);

        if (isNaN(date.getTime())) {
            return "-";
        }

        return date.toLocaleDateString(
            "en-IN",
            {
                day: "2-digit",
                month: "short",
                year: "numeric"
            }
        );

    }


    // =========================================================
    // FORMAT PROCESSING STATUS
    // =========================================================

    function formatStatus(status) {

        switch (status) {

            case "uploaded":
                return "Uploaded";

            case "processing":
                return "Processing";

            case "completed":
                return "Processed";

            case "failed":
                return "Failed";

            default:
                return status;

        }

    }


    // =========================================================
    // OPEN INVOICE
    // =========================================================

    function openInvoice(invoiceId) {

        if (!invoiceId) {
            return;
        }

        // Send invoice ID to invoice page
        window.location.href =
            `invoice.html?id=${invoiceId}`;

    }


    // =========================================================
    // ESCAPE HTML
    // Prevents invoice data from being inserted as HTML
    // =========================================================

    function escapeHTML(value) {

        return String(value)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");

    }

// =========================================================
// FILE UPLOAD
// =========================================================

let selectedInvoiceFile = null;


// Open file picker
uploadBtn.addEventListener("click", () => {

    // If a file has already been selected,
    // upload it instead of opening the picker.
    if (selectedInvoiceFile) {
        uploadInvoice();
        return;
    }

    fileInput.click();

});


// File selected normally
fileInput.addEventListener("change", () => {

    if (fileInput.files.length > 0) {

        const file = fileInput.files[0];

        if (isValidInvoiceFile(file)) {

            selectedInvoiceFile = file;

            showSelectedFile(file);

        } else {

            showUploadError();

        }

    }

});


// =========================================================
// DRAG & DROP
// =========================================================

["dragenter", "dragover"].forEach(eventName => {

    dropZone.addEventListener(
        eventName,
        event => {

            event.preventDefault();

            dropZone.classList.add("dragover");

        }
    );

});


["dragleave", "drop"].forEach(eventName => {

    dropZone.addEventListener(
        eventName,
        event => {

            event.preventDefault();

            dropZone.classList.remove("dragover");

        }
    );

});


dropZone.addEventListener(
    "drop",
    event => {

        const files =
            event.dataTransfer.files;

        if (files.length === 0) {
            return;
        }


        const file = files[0];


        if (isValidInvoiceFile(file)) {

            selectedInvoiceFile = file;

            showSelectedFile(file);

        } else {

            showUploadError();

        }

    }
);


// =========================================================
// VALIDATE FILE
// =========================================================

function isValidInvoiceFile(file) {

    const allowedTypes = [
        "application/pdf",
        "image/png",
        "image/jpeg"
    ];

    return allowedTypes.includes(file.type);

}


// =========================================================
// SHOW SELECTED FILE
// =========================================================

function showSelectedFile(file) {

    selectedFile.style.color = "";

    selectedFile.textContent =
        `Selected: ${file.name}`;

    // Change button text so user knows
    // clicking it will upload the invoice.
    uploadBtn.textContent =
        "Upload Invoice";

}


// =========================================================
// INVALID FILE
// =========================================================

function showUploadError() {

    selectedInvoiceFile = null;

    selectedFile.textContent =
        "Please choose a PDF, PNG, JPG or JPEG file.";

    selectedFile.style.color =
        "#ff8b8b";

}


// =========================================================
// UPLOAD INVOICE TO BACKEND
// =========================================================

async function uploadInvoice() {

    if (!selectedInvoiceFile) {
        return;
    }


    // Disable button while uploading
    uploadBtn.disabled = true;

    uploadBtn.textContent =
        "Uploading...";


    try {

        const formData =
            new FormData();

        formData.append(
            "invoice",
            selectedInvoiceFile
        );


        const response =
            await fetch(
                `${API_BASE_URL}/invoices/upload`,
                {
                    method: "POST",

                    headers: {
                        "Authorization":
                            `Bearer ${token}`
                    },

                    body: formData
                }
            );


        // -------------------------------------------------
        // Token expired / invalid
        // -------------------------------------------------

        if (response.status === 401) {

            localStorage.removeItem(
                "invoxToken"
            );

            localStorage.removeItem(
                "invoxUser"
            );

            window.location.href =
                "login.html";

            return;

        }


        const data =
            await response.json();


        // -------------------------------------------------
        // Upload failed
        // -------------------------------------------------

        if (
            !response.ok ||
            !data.success
        ) {

            throw new Error(
                data.message ||
                "Invoice upload failed."
            );

        }


        // -------------------------------------------------
        // Upload successful
        // -------------------------------------------------

        selectedFile.textContent =
            "Invoice uploaded successfully!";

        selectedFile.style.color =
            "#25d995";


        // Reset selected file
        selectedInvoiceFile = null;

        fileInput.value = "";


        uploadBtn.textContent =
            "Upload Invoice";


        // Reload invoices from MongoDB
        await loadInvoices();


    } catch (error) {

        console.error(
            "Invoice upload error:",
            error
        );


        selectedFile.textContent =
            error.message ||
            "Could not upload invoice.";

        selectedFile.style.color =
            "#ff8b8b";


    } finally {

        uploadBtn.disabled = false;


        // If upload succeeded, button goes
        // back to normal file-picker behavior.
        if (!selectedInvoiceFile) {

            uploadBtn.textContent =
                "Upload Invoice";

        }

    }

}

    // =========================================================
    // INVOICE SEARCH
    // =========================================================

    function filterInvoices(query) {

        const text =
            query.trim().toLowerCase();


        if (!text) {

            renderInvoices(invoices);

            return;

        }


        const filtered =
            invoices.filter(invoice => {

                const invoiceNumber =
                    invoice.invoiceNumber || "";

                const vendorName =
                    invoice.vendorName || "";

                const vendorGSTIN =
                    invoice.vendorGSTIN || "";

                const fileName =
                    invoice.originalFile?.originalName || "";


                return (
                    invoiceNumber.toLowerCase().includes(text) ||
                    vendorName.toLowerCase().includes(text) ||
                    vendorGSTIN.toLowerCase().includes(text) ||
                    fileName.toLowerCase().includes(text)
                );

            });


        renderInvoices(filtered);

    }


    searchBtn.addEventListener(
        "click",
        () => {

            filterInvoices(
                searchInput.value
            );

        }
    );


    searchInput.addEventListener(
        "input",
        () => {

            filterInvoices(
                searchInput.value
            );

        }
    );


    suggestions.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                searchInput.value =
                    button.textContent.trim();

                filterInvoices(
                    searchInput.value
                );

            }
        );

    });


    // =========================================================
    // AI ASSISTANT UI
    // =========================================================

    quickQuestions.forEach(button => {

        button.addEventListener(
            "click",
            () => {

                assistantInput.value =
                    button.textContent
                        .replace("→", "")
                        .trim();

                assistantInput.focus();

            }
        );

    });


    function submitAssistantQuestion() {

        const question =
            assistantInput.value.trim();


        if (!question) {
            return;
        }


        // Microsoft Foundry Agent
        // will be connected later.

        assistantInput.value = "";


        alert(
            "AI Assistant is ready in the UI. " +
            "Microsoft Foundry integration will be connected later."
        );

    }


    assistantSend.addEventListener(
        "click",
        submitAssistantQuestion
    );


    assistantInput.addEventListener(
        "keydown",
        event => {

            if (event.key === "Enter") {

                submitAssistantQuestion();

            }

        }
    );


    // =========================================================
    // LOGOUT
    // =========================================================

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "invoxToken"
            );

            localStorage.removeItem(
                "invoxUser"
            );

            window.location.href =
                "login.html";

        }
    );


    // =========================================================
    // VIEW ALL INVOICES
    // =========================================================

    viewAllBtn.addEventListener(
        "click",
        () => {

            document
                .getElementById("recent-invoices")
                .scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });

        }
    );


    // =========================================================
    // START DASHBOARD
    // =========================================================

    loadInvoices();

});