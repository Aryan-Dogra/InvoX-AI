const fs = require("fs");

const DocumentIntelligence =
  require("@azure-rest/ai-document-intelligence").default;

const {
  getLongRunningPoller,
  isUnexpected,
} = require("@azure-rest/ai-document-intelligence");

const client = DocumentIntelligence(
  process.env.DOCUMENT_INTELLIGENCE_ENDPOINT,
  {
    key: process.env.DOCUMENT_INTELLIGENCE_KEY,
  }
);

async function analyzeInvoice(filePath) {
  // Read the uploaded PDF/image
  const fileBuffer = fs.readFileSync(filePath);

  // Convert the file to Base64
  const base64Source = fileBuffer.toString("base64");

  // Send the document to Azure Document Intelligence
  const initialResponse = await client
    .path("/documentModels/{modelId}:analyze", "prebuilt-invoice")
    .post({
      contentType: "application/json",
      body: {
        base64Source,
      },
    });

  // Check whether Azure rejected the request
  if (isUnexpected(initialResponse)) {
    throw new Error(
      initialResponse.body?.error?.message ||
        "Document Intelligence analysis failed"
    );
  }

  // Create the long-running operation poller
  // IMPORTANT: do NOT use await here
  const poller = getLongRunningPoller(
    client,
    initialResponse
  );

  // Wait until Azure finishes analyzing the invoice
  const result = await poller.pollUntilDone();

  return result.body;
}

module.exports = {
  analyzeInvoice,
};