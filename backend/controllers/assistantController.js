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

        const projectRoot = path.join(__dirname, "../..");

        const pythonPath = path.join(
            projectRoot,
            ".venv",
            "Scripts",
            "python.exe"
        );

        const scriptPath = path.join(
            projectRoot,
            "agents",
            "search_agent_runtime.py"
        );

        const userId =
            req.user?.id ||
            req.user?._id ||
            "";

        const pythonProcess = spawn(
            pythonPath,
            [
                scriptPath,
                question.trim(),
                userId.toString(),
            ],
            {
                cwd: projectRoot,
            }
        );

        let output = "";
        let errorOutput = "";

        pythonProcess.stdout.on("data", (data) => {
            output += data.toString();
        });

        pythonProcess.stderr.on("data", (data) => {
            errorOutput += data.toString();
        });

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

        pythonProcess.on("close", (code) => {

            if (code !== 0) {

                console.error(
                    "Python agent error:",
                    errorOutput
                );

                return res.status(500).json({
                    success: false,
                    message:
                        "AI assistant failed to process the question",
                });
            }

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