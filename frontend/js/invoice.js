document.addEventListener("DOMContentLoaded", () => {

    // =========================================================
    // CONFIG
    // =========================================================

    const API_BASE_URL = "https://invox-ai-backend.onrender.com/api";

    const SERVER_BASE_URL = "https://invox-ai-backend.onrender.com";


    // =========================================================
    // AUTHENTICATION
    // =========================================================

    const token =
        localStorage.getItem("invoxToken");

    if (!token) {

        window.location.href =
            "login.html";

        return;

    }


    // =========================================================
    // GET INVOICE ID FROM URL
    // =========================================================

    const params =
        new URLSearchParams(
            window.location.search
        );

    const invoiceId =
        params.get("id");


    // =========================================================
    // ELEMENTS
    // =========================================================

    const loadingState =
        document.getElementById("loadingState");

    const errorState =
        document.getElementById("errorState");

    const errorMessage =
        document.getElementById("errorMessage");

    const invoiceContent =
        document.getElementById("invoiceContent");

    const statusBadge =
        document.getElementById("statusBadge");

    const statusText =
        document.getElementById("statusText");

    const invoiceNumber =
        document.getElementById("invoiceNumber");

    const uploadedDate =
        document.getElementById("uploadedDate");

    const fileName =
        document.getElementById("fileName");

    const documentContainer =
        document.getElementById("documentContainer");

    const extractedText =
        document.getElementById("extractedText");

    const previewTab =
        document.getElementById("previewTab");

    const textTab =
        document.getElementById("textTab");

    const itemsTableBody =
        document.getElementById("itemsTableBody");

    const itemsEmpty =
        document.getElementById("itemsEmpty");


    // =========================================================
    // USER NAME
    // =========================================================

    function loadUserName() {

        const storedUser =
            localStorage.getItem("invoxUser");

        if (!storedUser) {
            return;
        }

        try {

            const user =
                JSON.parse(storedUser);

            const userName =
                document.querySelector(
                    ".user-name"
                );

            if (
                userName &&
                user.name
            ) {

                userName.textContent =
                    user.name;

            }

            const avatar =
                document.querySelector(
                    ".avatar"
                );

            if (
                avatar &&
                user.name
            ) {

                avatar.textContent =
                    user.name
                        .charAt(0)
                        .toUpperCase();

            }

        } catch (error) {

            console.error(
                "Could not load user:",
                error
            );

        }

    }

    loadUserName();


    // =========================================================
    // NO INVOICE ID
    // =========================================================

    if (!invoiceId) {

        showError(
            "No invoice was selected."
        );

        return;

    }


    // =========================================================
    // FETCH INVOICE
    // =========================================================

    async function loadInvoice() {

        try {

            const response =
                await fetch(
                    `${API_BASE_URL}/invoices/${invoiceId}`,
                    {
                        method: "GET",

                        headers: {
                            "Authorization":
                                `Bearer ${token}`
                        }
                    }
                );


            // -------------------------------------------------
            // Unauthorized
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


            if (
                !response.ok ||
                !data.success
            ) {

                throw new Error(
                    data.message ||
                    "Unable to load invoice."
                );

            }


            // -------------------------------------------------
            // Render
            // -------------------------------------------------

            renderInvoice(
                data.invoice
            );


        } catch (error) {

            console.error(
                "Load invoice error:",
                error
            );

            showError(
                "We could not load this invoice. Please try again."
            );

        }

    }


    // =========================================================
    // RENDER INVOICE
    // =========================================================

    function renderInvoice(invoice) {

        loadingState.style.display =
            "none";

        errorState.style.display =
            "none";

        invoiceContent.style.display =
            "block";


        // -------------------------------------------------
        // Header
        // -------------------------------------------------

        const number =
            invoice.invoiceNumber ||
            "Invoice";

        invoiceNumber.textContent =
            number;

        uploadedDate.textContent =
            formatDate(
                invoice.createdAt
            );


        // -------------------------------------------------
        // Status
        // -------------------------------------------------

        setStatus(
            invoice.processingStatus
        );


        // -------------------------------------------------
        // Invoice information
        // -------------------------------------------------

        setText(
            "infoInvoiceNumber",
            invoice.invoiceNumber
        );

        setText(
            "invoiceDate",
            invoice.invoiceDate
                ? formatDate(invoice.invoiceDate)
                : null
        );

        setText(
            "dueDate",
            invoice.dueDate
                ? formatDate(invoice.dueDate)
                : null
        );

        setText(
            "currency",
            invoice.currency
        );


        // -------------------------------------------------
        // Vendor
        // -------------------------------------------------

        setText(
            "vendorName",
            invoice.vendorName
        );

        setText(
            "vendorGSTIN",
            invoice.vendorGSTIN
        );

        setText(
            "billingAddress",
            invoice.billingAddress
        );

        setText(
            "shippingAddress",
            invoice.shippingAddress
        );


        // -------------------------------------------------
        // Amount
        // -------------------------------------------------

        const currency =
            invoice.currency || "INR";

        document.getElementById(
            "subtotal"
        ).textContent =
            formatCurrency(
                invoice.subtotal,
                currency
            );

        document.getElementById(
            "tax"
        ).textContent =
            formatCurrency(
                invoice.tax,
                currency
            );

        document.getElementById(
            "total"
        ).textContent =
            formatCurrency(
                invoice.total,
                currency
            );


        // -------------------------------------------------
        // File
        // -------------------------------------------------

        renderDocument(
            invoice
        );


        // -------------------------------------------------
        // Extracted text
        // -------------------------------------------------

        if (
            invoice.extractedText &&
            invoice.extractedText.trim()
        ) {

            extractedText.textContent =
                invoice.extractedText;

        } else {

            extractedText.textContent =
                "No extracted text available yet.";

        }


        // -------------------------------------------------
        // Items
        // -------------------------------------------------

        renderItems(
            invoice.items,
            currency
        );

    }


    // =========================================================
    // STATUS
    // =========================================================

    function setStatus(status) {

        const currentStatus =
            status || "uploaded";


        let text =
            "Uploaded";


        if (currentStatus === "processing") {
            text = "Processing";
        }

        if (currentStatus === "completed") {
            text = "Processed";
        }

        if (currentStatus === "failed") {
            text = "Failed";
        }


        statusText.textContent =
            text;


        statusBadge.classList.remove(
            "uploaded",
            "processing",
            "completed",
            "failed"
        );


        statusBadge.classList.add(
            currentStatus
        );


        if (currentStatus === "failed") {

            statusBadge.style.color =
                "#ff6868";

            statusBadge.style.borderColor =
                "rgba(255,104,104,0.35)";

            statusBadge.style.background =
                "rgba(255,104,104,0.08)";

        }

        else if (
            currentStatus === "processing"
        ) {

            statusBadge.style.color =
                "#f4bd42";

            statusBadge.style.borderColor =
                "rgba(244,189,66,0.35)";

            statusBadge.style.background =
                "rgba(244,189,66,0.08)";

        }

        else {

            statusBadge.style.color =
                "#25d995";

            statusBadge.style.borderColor =
                "rgba(37,217,149,0.35)";

            statusBadge.style.background =
                "rgba(37,217,149,0.08)";

        }

    }


    // =========================================================
    // RENDER DOCUMENT
    // =========================================================

    function renderDocument(invoice) {

        documentContainer.innerHTML =
            "";


        const originalFile =
            invoice.originalFile;


        if (
            !originalFile ||
            !originalFile.path
        ) {

            documentContainer.innerHTML = `
                <div class="document-placeholder">

                    <div class="document-icon">
                        ▤
                    </div>

                    <p>
                        Document preview unavailable.
                    </p>

                </div>
            `;

            fileName.textContent =
                "No file available";

            return;

        }


        fileName.textContent =
            originalFile.originalName ||
            originalFile.fileName ||
            "Invoice document";


        const fileUrl =
            `${SERVER_BASE_URL}/${originalFile.path}`;


        const mimeType =
            originalFile.mimeType ||
            "";


        // -------------------------------------------------
        // PDF
        // -------------------------------------------------

        if (
            mimeType ===
            "application/pdf"
        ) {

            const iframe =
                document.createElement(
                    "iframe"
                );

            iframe.src =
                fileUrl;

            iframe.title =
                "Invoice PDF";

            documentContainer.appendChild(
                iframe
            );

            return;

        }


        // -------------------------------------------------
        // IMAGE
        // -------------------------------------------------

        if (
            mimeType === "image/png" ||
            mimeType === "image/jpeg" ||
            mimeType === "image/jpg"
        ) {

            const image =
                document.createElement(
                    "img"
                );

            image.src =
                fileUrl;

            image.alt =
                originalFile.originalName ||
                "Invoice";

            image.onerror =
                () => {

                    documentContainer.innerHTML = `
                        <div class="document-placeholder">

                            <div class="document-icon">
                                !
                            </div>

                            <p>
                                Unable to preview this document.
                            </p>

                        </div>
                    `;

                };


            documentContainer.appendChild(
                image
            );

            return;

        }


        // -------------------------------------------------
        // Unsupported
        // -------------------------------------------------

        documentContainer.innerHTML = `
            <div class="document-placeholder">

                <div class="document-icon">
                    ?
                </div>

                <p>
                    Preview is not available for this file type.
                </p>

            </div>
        `;

    }


    // =========================================================
    // RENDER ITEMS
    // =========================================================

    function renderItems(
        items,
        currency
    ) {

        itemsTableBody.innerHTML =
            "";


        if (
            !items ||
            items.length === 0
        ) {

            itemsEmpty.style.display =
                "block";

            return;

        }


        itemsEmpty.style.display =
            "none";


        items.forEach(
            (item, index) => {

                const row =
                    document.createElement(
                        "tr"
                    );


                row.innerHTML = `
                    <td>
                        ${index + 1}
                    </td>

                    <td>
                        ${escapeHTML(
                            item.name || "Not available"
                        )}
                    </td>

                    <td>
                        ${Number(item.quantity) || 0}
                    </td>

                    <td>
                        ${formatCurrency(
                            item.unitPrice,
                            currency
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            item.tax,
                            currency
                        )}
                    </td>

                    <td>
                        ${formatCurrency(
                            item.total,
                            currency
                        )}
                    </td>
                `;


                itemsTableBody.appendChild(
                    row
                );

            }
        );

    }


    // =========================================================
    // SET TEXT
    // =========================================================

    function setText(
        elementId,
        value
    ) {

        const element =
            document.getElementById(
                elementId
            );


        if (!element) {
            return;
        }


        if (
            value === null ||
            value === undefined ||
            value === ""
        ) {

            element.textContent =
                "Not available";

            return;

        }


        element.textContent =
            value;

    }


    // =========================================================
    // DATE
    // =========================================================

    function formatDate(
        value
    ) {

        if (!value) {
            return "Not available";
        }


        const date =
            new Date(value);


        if (
            isNaN(
                date.getTime()
            )
        ) {

            return "Not available";

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
    // CURRENCY
    // =========================================================

    function formatCurrency(
        amount,
        currency
    ) {

        const value =
            Number(amount) || 0;


        try {

            return new Intl.NumberFormat(
                "en-IN",
                {
                    style: "currency",
                    currency:
                        currency || "INR",
                    maximumFractionDigits: 2
                }
            ).format(value);

        } catch (error) {

            return `${currency || "INR"} ${value.toFixed(2)}`;

        }

    }


    // =========================================================
    // ESCAPE HTML
    // =========================================================

    function escapeHTML(
        value
    ) {

        return String(value)
            .replace(
                /&/g,
                "&amp;"
            )
            .replace(
                /</g,
                "&lt;"
            )
            .replace(
                />/g,
                "&gt;"
            )
            .replace(
                /"/g,
                "&quot;"
            )
            .replace(
                /'/g,
                "&#039;"
            );

    }


    // =========================================================
    // PREVIEW / TEXT TABS
    // =========================================================

    previewTab.addEventListener(
        "click",
        () => {

            previewTab.classList.add(
                "active"
            );

            textTab.classList.remove(
                "active"
            );

            documentContainer.classList.remove(
                "hidden"
            );

            extractedText.classList.remove(
                "active"
            );

        }
    );


    textTab.addEventListener(
        "click",
        () => {

            textTab.classList.add(
                "active"
            );

            previewTab.classList.remove(
                "active"
            );

            documentContainer.classList.add(
                "hidden"
            );

            extractedText.classList.add(
                "active"
            );

        }
    );


    // =========================================================
    // LOGOUT
    // =========================================================

    document
        .getElementById("logoutBtn")
        .addEventListener(
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
    // SHOW ERROR
    // =========================================================

    function showError(message) {

        loadingState.style.display =
            "none";

        invoiceContent.style.display =
            "none";

        errorState.style.display =
            "block";

        errorMessage.textContent =
            message;

    }


    // =========================================================
    // START
    // =========================================================

    loadInvoice();

});