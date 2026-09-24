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

        const scriptPath = path.join(
            projectRoot,
            "agents",
            "search_agent_runtime.py"
        );

        const userId = req.userId || "";

        console.log("Starting Python AI agent...");
        console.log("Python path:", pythonPath);
        console.log("Script path:", scriptPath);
        console.log("User ID:", userId);

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

        pythonProcess.stdout.on("data", (data) => {
            const text = data.toString();

            console.log("Python stdout:", text);

            output += text;
        });

        pythonProcess.stderr.on("data", (data) => {
            const text = data.toString();

            console.error("Python stderr:", text);

            errorOutput += text;
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

        pythonProcess.on("close", (code, signal) => {

            console.log(
                "Python process closed.",
                {
                    code,
                    signal,
                }
            );

            if (code !== 0) {

                console.error(
                    "Python agent failed.",
                    {
                        code,
                        signal,
                        stdout: output,
                        stderr: errorOutput,
                    }
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