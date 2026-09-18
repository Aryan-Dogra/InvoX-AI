// =========================================================
// Invoice model
// At this stage invoices are just uploaded and stored — no
// field here is populated by AI yet. Most fields default to
// empty/zero so an "uploaded" invoice is a valid document
// while it waits to be processed later.
// =========================================================

const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, default: "" },
    quantity: { type: Number, default: 0 },
    unitPrice: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Extracted invoice fields — empty until an AI/processing
  // step (added later) fills them in.
  invoiceNumber: { type: String, default: "" },
  vendorName: { type: String, default: "" },
  vendorGSTIN: { type: String, default: "" },
  invoiceDate: { type: Date, default: null },
  dueDate: { type: Date, default: null },
  billingAddress: { type: String, default: "" },
  shippingAddress: { type: String, default: "" },
  items: { type: [itemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  total: { type: Number, default: 0 },
  currency: { type: String, default: "INR" },

  // File + processing metadata
  originalFile: {
    fileName: { type: String, default: "" }, // name stored on disk
    originalName: { type: String, default: "" }, // name the user uploaded
    path: { type: String, default: "" }, // relative path under /uploads
    mimeType: { type: String, default: "" },
    size: { type: Number, default: 0 },
  },
  extractedText: { type: String, default: "" },
  processingStatus: {
    type: String,
    enum: ["uploaded", "processing", "completed", "failed"],
    default: "uploaded",
  },

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Invoice", invoiceSchema);
