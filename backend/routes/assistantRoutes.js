const express = require("express");

const authMiddleware = require("../middleware/authMiddleware");
const { askAssistant } = require("../controllers/assistantController");

const router = express.Router();

router.use(authMiddleware);

router.post("/ask", askAssistant);

module.exports = router;