require("dotenv").config();
const express = require("express");
const multer = require("multer");
const fs = require("fs");
const cors = require("cors");
const { GoogleGenerativeAI } = require("@google/generative-ai");

const app = express();
app.use(cors());
app.use(express.static(__dirname));

const upload = multer({ dest: "uploads/" });

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.post("/generate", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image uploaded" });
    }

    const imageBuffer = fs.readFileSync(req.file.path);

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent([
      "Look at this image and write a short formal civic complaint (2-3 sentences).",
      {
        inlineData: {
          data: imageBuffer.toString("base64"),
          mimeType: req.file.mimetype,
        },
      },
    ]);

    fs.unlinkSync(req.file.path);

    res.json({ text: result.response.text() });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "AI failed" });
  }
});

app.listen(5000, () => console.log("Server running on port 5000"));