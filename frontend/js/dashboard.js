document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("invoiceFile");
    const uploadBtn = document.getElementById("uploadBtn");
    const dropZone = document.getElementById("dropZone");
    const selectedFile = document.getElementById("selectedFile");

    const searchInput = document.getElementById("searchInput");
    const searchBtn = document.getElementById("searchBtn");
    const suggestions = document.querySelectorAll(".suggestion");
    const tableRows = document.querySelectorAll("#invoiceTable tbody tr");
    const emptyState = document.getElementById("emptyState");

    const assistantInput = document.getElementById("assistantInput");
    const assistantSend = document.getElementById("assistantSend");
    const quickQuestions = document.querySelectorAll(".quick-questions button");

    uploadBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", () => {
        if (fileInput.files.length > 0) {
            showSelectedFile(fileInput.files[0]);
        }
    });

    ["dragenter", "dragover"].forEach(eventName => {
        dropZone.addEventListener(eventName, event => {
            event.preventDefault();
            dropZone.classList.add("dragover");
        });
    });

    ["dragleave", "drop"].forEach(eventName => {
        dropZone.addEventListener(eventName, event => {
            event.preventDefault();
            dropZone.classList.remove("dragover");
        });
    });

    dropZone.addEventListener("drop", event => {
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const allowed = ["application/pdf", "image/png", "image/jpeg"];

            if (allowed.includes(file.type)) {
                showSelectedFile(file);
            } else {
                selectedFile.textContent = "Please choose a PDF, PNG, JPG or JPEG file.";
                selectedFile.style.color = "#ff8b8b";
            }
        }
    });

    function showSelectedFile(file) {
        selectedFile.style.color = "";
        selectedFile.textContent = `Selected: ${file.name}`;
    }

    function filterInvoices(query) {
        const text = query.trim().toLowerCase();
        let visible = 0;

        tableRows.forEach(row => {
            const matches = row.textContent.toLowerCase().includes(text);
            row.style.display = matches ? "" : "none";
            if (matches) visible++;
        });

        emptyState.style.display = visible === 0 ? "block" : "none";
    }

    searchBtn.addEventListener("click", () => {
        filterInvoices(searchInput.value);
    });

    searchInput.addEventListener("input", () => {
        filterInvoices(searchInput.value);
    });

    suggestions.forEach(button => {
        button.addEventListener("click", () => {
            searchInput.value = button.textContent.trim();
            filterInvoices(searchInput.value);
        });
    });

    quickQuestions.forEach(button => {
        button.addEventListener("click", () => {
            assistantInput.value = button.textContent.replace("→", "").trim();
            assistantInput.focus();
        });
    });

    function submitAssistantQuestion() {
        const question = assistantInput.value.trim();

        if (!question) return;

        // Backend / Microsoft Foundry Agent integration will be added later.
        assistantInput.value = "";
        alert("AI Assistant is ready in the UI. Microsoft Foundry integration will be connected later.");
    }

    assistantSend.addEventListener("click", submitAssistantQuestion);

    assistantInput.addEventListener("keydown", event => {
        if (event.key === "Enter") {
            submitAssistantQuestion();
        }
    });

    document.getElementById("logoutBtn").addEventListener("click", () => {
        // Real JWT logout will be connected when backend authentication is added.
        window.location.href = "login.html";
    });

    document.getElementById("viewAllBtn").addEventListener("click", () => {
        document.getElementById("recent-invoices").scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
});
