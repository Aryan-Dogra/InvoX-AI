// =========================================================
// Express app
//
// Wires up middleware and routes. server.js is what actually
// starts listening — keeping the two separate makes app.js
// easy to import in tests later if needed.
// =========================================================

const express = require("express");
const cors = require("cors");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const assistantRoutes = require("./routes/assistantRoutes");

const app = express();


// ---------- CORS ----------

// Allows the frontend (running on Live Server or similar)
// to call this API during development.

const allowedOrigins = (process.env.CLIENT_ORIGIN || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);


app.use(
    cors({
        origin:
            allowedOrigins.length > 0
                ? allowedOrigins
                : true,
    })
);


// ---------- Body parsing ----------

app.use(express.json());


// ---------- Uploaded files ----------

// Allows the frontend to access uploaded
// invoice PDFs and images.

app.use(
    "/uploads",
    express.static(
        path.join(__dirname, "uploads")
    )
);


// ---------- Health check ----------

app.get(
    "/api/health",
    (req, res) => {

        res.status(200).json({
            success: true,
            message: "InvoX AI backend is running",
        });

    }
);


// ---------- Routes ----------

app.use(
    "/api/auth",
    authRoutes
);

app.use(
    "/api/invoices",
    invoiceRoutes
);

app.use(
    "/api/assistant",
    assistantRoutes
);


// ---------- 404 handler ----------

// Anything that didn't match a route above ends up here.

app.use(
    (req, res) => {

        res.status(404).json({
            success: false,
            message: "Route not found",
        });

    }
);


// ---------- Centralized error handler ----------

// Catches errors passed via next(err), and errors thrown by
// multer (e.g. bad file type, file too large).

app.use(
    (err, req, res, next) => {

        console.error(
            "Unhandled error:",
            err.message
        );


        if (
            err.message &&
            err.message.includes(
                "Only PDF, PNG, JPG"
            )
        ) {

            return res.status(400).json({
                success: false,
                message: err.message,
            });

        }


        if (
            err.code === "LIMIT_FILE_SIZE"
        ) {

            return res.status(400).json({
                success: false,
                message:
                    "File is too large (max 10MB)",
            });

        }


        res.status(500).json({
            success: false,
            message:
                "Something went wrong on the server",
        });

    }
);


module.exports = app;