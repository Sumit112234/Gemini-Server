import express from "express";
import dotenv from "dotenv";
import axios from "axios";
import cors from "cors";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const GEMINI_API_KEY =process.env.MY_REQUEST;

// Enable CORS & JSON Parsing
app.use(cors());
app.use(express.json());

// Store chat history (resets when server restarts)
let chatHistory = [];

// Function to get response from Gemini
const getGeminiResponse = async (prompt, instructions) => {
    try {
        const response = await axios.post(
            `https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                contents: [
                    {
                        role: "user",
                        parts: [{ text: `${instructions ? instructions + ": " : ""}${prompt}` }]
                    }
                ]
            }
        );

        return response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "No response";
    } catch (error) {
        console.error("Gemini API Error:", error.response?.data || error.message);
        return "Error: Failed to fetch response from Gemini";
    }
};

const getImageFromApi = async (prompt) => {
    const response = await fetch(`https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}`);

    if (!response.ok) {
        throw new Error("Failed to fetch image");
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);  // Convert response to a buffer
};

app.get("/", (req,res)=>{
    res.send(
        `
        Jai Shree Ram!`
    )
})
// 🟢 GET request: /api/chat?prompt=...&instructions=...
app.get("/chat", async (req, res) => {
    const { prompt, instructions } = req.query;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    const reply = await getGeminiResponse(prompt, instructions);

    // Store chat in history
    const chatEntry = { prompt, instructions, reply };
    chatHistory.push(chatEntry);

    res.json({ reply, chatHistory });
});

// 🔵 POST request: /api/chat (Body: { "prompt": "...", "instructions": "..." })
app.post("/chat", async (req, res) => {
    const { prompt, instructions } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    const reply = await getGeminiResponse(prompt, instructions);

    // Store chat in history
    const chatEntry = { prompt, instructions, reply };
    chatHistory.push(chatEntry);

    res.json({ reply, chatHistory });
});

app.get("/image", async (req, res) => {
    const { prompt } = req.query;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const imageBuffer = await getImageFromApi(prompt);
        res.setHeader("Content-Type", "image/jpeg"); // Adjust based on response type
        res.send(imageBuffer);
    } catch (error) {
        console.error("Image Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch image" });
    }
});


// 🔵 POST request: /api/chat (Body: { "prompt": "...", "instructions": "..." })
app.post("/image", async (req, res) => {
    const { prompt } = req.body;

    if (!prompt) {
        return res.status(400).json({ error: "Prompt is required" });
    }

    try {
        const imageBuffer = await getImageFromApi(prompt);
        res.setHeader("Content-Type", "image/jpeg"); // Adjust based on response type
        res.send(imageBuffer);
    } catch (error) {
        console.error("Image Fetch Error:", error);
        res.status(500).json({ error: "Failed to fetch image" });
    }
});

// 🟠 GET chat history: /api/history
app.get("/history", (req, res) => {
    res.json({ chatHistory });
});

// 🛑 Clear chat history: /api/clear
app.delete("/clear", (req, res) => {
    chatHistory = [];
    res.json({ message: "Chat history cleared" });
});

app.get("/instruction", (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>API Instructions</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f4f4f4;
                    color: #333;
                    text-align: center;
                    padding: 20px;
                }
                .container {
                    max-width: 800px;
                    margin: auto;
                    background: white;
                    padding: 20px;
                    border-radius: 10px;
                    box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #007BFF;
                }
                .endpoint {
                    margin: 15px 0;
                    padding: 10px;
                    border-left: 5px solid #007BFF;
                    background: #e9f5ff;
                }
                .method {
                    font-weight: bold;
                    color: #d9534f;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>API Instructions</h1>
                <div class="endpoint">
                    <span class="method">GET</span> /chat?prompt=...&instructions=...<br>
                    <small>Fetches a response from Gemini based on the prompt.</small>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /chat<br>
                    <small>Fetches a response using request body {"prompt": "...", "instructions": "..."}</small>
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /image?prompt=...<br>
                    <small>Generates an image from the given description.</small>
                </div>
                <div class="endpoint">
                    <span class="method">POST</span> /image<br>
                    <small>Generates an image using request body {"prompt": "..."}</small>
                </div>
                <div class="endpoint">
                    <span class="method">GET</span> /history<br>
                    <small>Fetches all previous chat history.</small>
                </div>
                <div class="endpoint">
                    <span class="method">DELETE</span> /clear<br>
                    <small>Clears all stored chat history.</small>
                </div>
            </div>
        </body>
        </html>
    `);
});


// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
