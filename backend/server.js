// =========================================================
// Server entry point
// Run with: npm run dev  (nodemon)  or  npm start  (plain node)
// =========================================================

require("dotenv").config();

const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

async function start() {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`InvoX AI backend running on http://localhost:${PORT}`);
  });
}

start();
