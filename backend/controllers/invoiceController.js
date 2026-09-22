// =========================================================
// Invoice controller
// Every function here trusts req.userId, which is set by
// authMiddleware — so a user can only ever see or modify
// their own invoices.
// =========================================================

const fs = require("fs");
const path = require("path");
const Invoice = require("../models/Invoice");
const {
  analyzeInvoice,
} = require("../services/documentIntelligenceService");

// ---------------------------------------------------------
// Helper: Get text from an Azure Document Intelligence field
// ---------------------------------------------------------
function getText(field) {
  if (!field) return "";

  return (
    field.valueString ||
    field.content ||
    ""
  );
}

// ---------------------------------------------------------
// Helper: Get numeric value from an Azure field
//
// Money fields such as InvoiceTotal, SubTotal,
// UnitPrice and Amount are often returned as valueCurrency.
// Other numeric fields can use valueNumber.
// ---------------------------------------------------------
function getNumber(field) {
  if (!field) return 0;

  if (typeof field.valueNumber === "number") {
    return field.valueNumber;
  }

  if (
    field.valueCurrency &&
    typeof field.valueCurrency.amount === "number"
  ) {
    return field.valueCurrency.amount;
  }

  // Final fallback: try extracting a number from content
  if (typeof field.content === "string") {
    const cleaned = field.content.replace(/[^0-9.-]/g, "");

    const number = Number(cleaned);

    if (!Number.isNaN(number)) {
      return number;
    }
  }

  return 0;
}

// ---------------------------------------------------------
// POST /api/invoices/upload
// Uploads the invoice, sends it to Azure Document Intelligence,
// extracts invoice information, and saves the structured data.
// ---------------------------------------------------------
async function uploadInvoice(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file was uploaded",
      });
    }

    // Multer already gives us the exact uploaded file path
    const filePath = req.file.path;

    // Create invoice record first
    const invoice = await Invoice.create({
      userId: req.userId,
      originalFile: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        path: `uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      processingStatus: "processing",
    });

    try {
      // ---------------------------------------------------
      // Send invoice to Azure Document Intelligence
      // ---------------------------------------------------
      const result = await analyzeInvoice(filePath);

      const analyzeResult = result.analyzeResult;

      const document = analyzeResult?.documents?.[0];

      if (!document) {
        throw new Error("No invoice data was extracted");
      }

      const fields = document.fields || {};

      // ---------------------------------------------------
      // Extract line items
      // ---------------------------------------------------
      const items = [];

      const itemsField = fields.Items?.valueArray || [];

      for (const item of itemsField) {
        const itemFields = item.valueObject || {};

        items.push({
          name: getText(itemFields.Description),

          quantity: getNumber(
            itemFields.Quantity
          ),

          unitPrice: getNumber(
            itemFields.UnitPrice
          ),

          tax: getNumber(
            itemFields.Tax
          ),

          total: getNumber(
            itemFields.Amount
          ),
        });
      }

      // ---------------------------------------------------
      // Extract invoice information
      // ---------------------------------------------------

      invoice.invoiceNumber = getText(
        fields.InvoiceId
      );

      invoice.vendorName = getText(
        fields.VendorName
      );

      invoice.vendorGSTIN = getText(
        fields.VendorTaxId
      );

      invoice.invoiceDate =
        fields.InvoiceDate?.valueDate ||
        null;

      invoice.dueDate =
        fields.DueDate?.valueDate ||
        null;

      invoice.billingAddress = getText(
        fields.BillingAddress
      );

      invoice.shippingAddress = getText(
        fields.ShippingAddress
      );

      // ---------------------------------------------------
      // Line items
      // ---------------------------------------------------

      invoice.items = items;

      // ---------------------------------------------------
      // Amounts
      // ---------------------------------------------------

      invoice.subtotal = getNumber(
        fields.SubTotal
      );

      invoice.tax = getNumber(
        fields.TotalTax
      );

      invoice.total = getNumber(
        fields.InvoiceTotal
      );

      // ---------------------------------------------------
      // Currency
      // ---------------------------------------------------

      invoice.currency =
        fields.InvoiceTotal?.valueCurrency?.currencyCode ||
        "INR";

      // ---------------------------------------------------
      // Store extracted OCR/document text
      // ---------------------------------------------------

      invoice.extractedText =
        analyzeResult?.content || "";

      // ---------------------------------------------------
      // Mark processing complete
      // ---------------------------------------------------

      invoice.processingStatus = "completed";

      await invoice.save();

      return res.status(201).json({
        success: true,
        message:
          "Invoice uploaded and processed successfully",
        invoice,
      });

    } catch (aiError) {
      console.error(
        "Document Intelligence error:",
        aiError.message
      );

      invoice.processingStatus = "failed";

      await invoice.save();

      return res.status(500).json({
        success: false,
        message:
          "Invoice uploaded but AI extraction failed",
        error: aiError.message,
      });
    }

  } catch (error) {
    console.error(
      "Upload invoice error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while uploading the invoice",
    });
  }
}

// ---------------------------------------------------------
// GET /api/invoices
// ---------------------------------------------------------
async function getInvoices(req, res) {
  try {
    const invoices = await Invoice.find({
      userId: req.userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });

  } catch (error) {
    console.error(
      "Get invoices error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching invoices",
    });
  }
}

// ---------------------------------------------------------
// GET /api/invoices/:id
// ---------------------------------------------------------
async function getInvoiceById(req, res) {
  try {
    const invoice = await Invoice.findOne({
      _id: req.params.id,
      userId: req.userId,
    });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    return res.status(200).json({
      success: true,
      invoice,
    });

  } catch (error) {
    console.error(
      "Get invoice error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while fetching the invoice",
    });
  }
}

// ---------------------------------------------------------
// DELETE /api/invoices/:id
// ---------------------------------------------------------
async function deleteInvoice(req, res) {
  try {
    const invoice =
      await Invoice.findOneAndDelete({
        _id: req.params.id,
        userId: req.userId,
      });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Best-effort cleanup of uploaded file
    if (invoice.originalFile?.fileName) {
      const filePath = path.join(
        __dirname,
        "..",
        "uploads",
        invoice.originalFile.fileName
      );

      fs.unlink(filePath, (err) => {
        if (err) {
          console.warn(
            "Could not remove uploaded file:",
            err.message
          );
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted",
    });

  } catch (error) {
    console.error(
      "Delete invoice error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while deleting the invoice",
    });
  }
}

// ---------------------------------------------------------
// GET /api/invoices/search?q=
// ---------------------------------------------------------
async function searchInvoices(req, res) {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Provide a search query using ?q=",
      });
    }

    const regex = new RegExp(
      q.trim(),
      "i"
    );

    const invoices = await Invoice.find({
      userId: req.userId,
      $or: [
        {
          invoiceNumber: regex,
        },
        {
          vendorName: regex,
        },
        {
          vendorGSTIN: regex,
        },
      ],
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });

  } catch (error) {
    console.error(
      "Search invoices error:",
      error.message
    );

    return res.status(500).json({
      success: false,
      message:
        "Something went wrong while searching invoices",
    });
  }
}

module.exports = {
  uploadInvoice,
  getInvoices,
  getInvoiceById,
  deleteInvoice,
  searchInvoices,
}; 