const path = require("path");
const { spawn } = require("child_process");

async function askAssistant(req, res) {
    try {
        const { question } = req.body;

        if (!question || !question.trim()) {
            return res.status(400).json({
                success: false,
                message: "Question is required",
            });
        }

        // --------------------------------------------------
        // Project root
        // --------------------------------------------------

        const projectRoot = path.join(__dirname, "../..");

        // --------------------------------------------------
        // Python executable
        //
        // Local Windows:
        // .venv\Scripts\python.exe
        //
        // Render/Linux:
        // python3
        //
        // PYTHON_EXECUTABLE can override both if needed.
        // --------------------------------------------------

        const pythonPath =
            process.env.PYTHON_EXECUTABLE ||
            (
                process.platform === "win32"
                    ? path.join(
                        projectRoot,
                        ".venv",
                        "Scripts",
                        "python.exe"
                    )
                    : "python3"
            );

        // --------------------------------------------------
        // Python agent script
        // --------------------------------------------------

        const scriptPath = path.join(
            projectRoot,
            "agents",
            "search_agent_runtime.py"
        );

        // --------------------------------------------------
        // Logged-in user's ID
        // --------------------------------------------------

        const userId =
            req.user?.id ||
            req.user?._id ||
            "";

        // --------------------------------------------------
        // Start Python agent
        // --------------------------------------------------

        const pythonProcess = spawn(
            pythonPath,
            [
                scriptPath,
                question.trim(),
                userId.toString(),
            ],
            {
                cwd: projectRoot,
                env: process.env,
            }
        );

        let output = "";
        let errorOutput = "";

        // --------------------------------------------------
        // Python standard output
        // --------------------------------------------------

        pythonProcess.stdout.on("data", (data) => {
            output += data.toString();
        });

        // --------------------------------------------------
        // Python error output
        // --------------------------------------------------

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

        // --------------------------------------------------
        // Failed to start Python
        // --------------------------------------------------

        pythonProcess.on("error", (error) => {
            console.error(
                "Failed to start Python process:",
                error
            );

            return res.status(500).json({
                success: false,
                message: "Failed to start AI assistant",
            });
        });

        // --------------------------------------------------
        // Python process finished
        // --------------------------------------------------

        pythonProcess.on("close", (code) => {

            if (code !== 0) {

                console.error(
                    "Python agent error:",
                    errorOutput || output || "No error output received"
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "AI assistant failed to process the question",
                });
            }

            // --------------------------------------------------
            // Parse Python JSON response
            // --------------------------------------------------

            try {

                const result = JSON.parse(
                    output.trim()
                );

                return res.status(200).json(result);

            } catch (error) {

                console.error(
                    "Invalid Python output:",
                    output
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "Invalid response from AI assistant",
                });
            }
        });

    } catch (error) {

        console.error(
            "Assistant controller error:",
            error
        );

        return res.status(500).json({
            success: false,
            message:
                "Failed to process assistant request",
        });
    }
}

module.exports = {
    askAssistant,
};