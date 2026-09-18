const express = require("express");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");
const {
  uploadInvoice,
  getInvoices,
  getInvoiceById,
  deleteInvoice,
  searchInvoices,
} = require("../controllers/invoiceController");

const router = express.Router();

// Every invoice route requires a logged-in user.
router.use(authMiddleware);

router.post("/upload", upload.single("invoice"), uploadInvoice);

// NOTE: /search must be registered before /:id — otherwise Express
// would treat "search" as an :id value and never reach this route.
router.get("/search", searchInvoices);

router.get("/", getInvoices);
router.get("/:id", getInvoiceById);
router.delete("/:id", deleteInvoice);

module.exports = router;
