// =========================================================
// Invoice controller
// Every function here trusts req.userId, which is set by
// authMiddleware — so a user can only ever see or modify
// their own invoices.
// =========================================================

const fs = require("fs");
const path = require("path");
const Invoice = require("../models/Invoice");

// POST /api/invoices/upload
// Saves the uploaded file (handled by multer before this runs)
// and creates a matching Invoice document. No AI extraction
// happens here — that's a later stage.
async function uploadInvoice(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file was uploaded",
      });
    }

    const invoice = await Invoice.create({
      userId: req.userId,
      originalFile: {
        fileName: req.file.filename,
        originalName: req.file.originalname,
        path: `uploads/${req.file.filename}`,
        mimeType: req.file.mimetype,
        size: req.file.size,
      },
      processingStatus: "uploaded",
    });

    return res.status(201).json({
      success: true,
      message: "Invoice uploaded successfully",
      invoice,
    });
  } catch (error) {
    console.error("Upload invoice error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while uploading the invoice",
    });
  }
}

// GET /api/invoices
async function getInvoices(req, res) {
  try {
    const invoices = await Invoice.find({ userId: req.userId }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Get invoices error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching invoices",
    });
  }
}

// GET /api/invoices/:id
async function getInvoiceById(req, res) {
  try {
    const invoice = await Invoice.findOne({ _id: req.params.id, userId: req.userId });

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
    console.error("Get invoice error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while fetching the invoice",
    });
  }
}

// DELETE /api/invoices/:id
async function deleteInvoice(req, res) {
  try {
    const invoice = await Invoice.findOneAndDelete({ _id: req.params.id, userId: req.userId });

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // Best-effort cleanup of the stored file — an invoice record
    // should never block deletion just because the file is missing.
    if (invoice.originalFile?.fileName) {
      const filePath = path.join(__dirname, "..", "uploads", invoice.originalFile.fileName);
      fs.unlink(filePath, (err) => {
        if (err) console.warn("Could not remove uploaded file:", err.message);
      });
    }

    return res.status(200).json({
      success: true,
      message: "Invoice deleted",
    });
  } catch (error) {
    console.error("Delete invoice error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while deleting the invoice",
    });
  }
}

// GET /api/invoices/search?q=
// Simple MongoDB regex search across a few text fields.
// This is a foundation only — real semantic search comes
// later via Azure AI Search.
async function searchInvoices(req, res) {
  try {
    const { q } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Provide a search query using ?q=",
      });
    }

    const regex = new RegExp(q.trim(), "i");

    const invoices = await Invoice.find({
      userId: req.userId,
      $or: [{ invoiceNumber: regex }, { vendorName: regex }, { vendorGSTIN: regex }],
    }).sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    console.error("Search invoices error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Something went wrong while searching invoices",
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
