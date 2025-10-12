// backend/routes/ai.js
import express from "express";
import dotenv from "dotenv";
import OpenAI from "openai";
import { protect } from "../middleware/authMiddleware.js";

dotenv.config();
const router = express.Router();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ---------- POST /ai/summary ----------
router.post("/summary", protect, async (req, res) => {
  try {
    const { chartData } = req.body;

    // Validation
    if (!chartData || !Array.isArray(chartData.labels) || !Array.isArray(chartData.values)) {
      return res.status(400).json({ summary: "Invalid chart data format" });
    }

    // Prepare prompt
    const prompt = `
      Analyze the given numeric dataset and write a short professional summary.
      Labels (first 30): ${chartData.labels.slice(0, 30).join(", ")}
      Values (first 30): ${chartData.values.slice(0, 30).join(", ")}
    `;

    // Try real OpenAI call
    let summary = "";
    try {
      const aiRes = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 120,
      });
      summary = aiRes.choices?.[0]?.message?.content?.trim();
      if (!summary) throw new Error("Empty summary");
    } catch (err) {
      console.error("OpenAI error:", err.message);

      // ---------- Realistic Mock Fallback ----------
      const values = chartData.values || [];
      if (values.length > 0) {
        const min = Math.min(...values);
        const max = Math.max(...values);
        const avg = (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
        const trend =
          values.length >= 2
            ? values[values.length - 1] > values[0]
              ? "an upward trend overall"
              : "a slight downward pattern"
            : "stable readings";
        summary = `⚠️ Mock summary: Values range between ${min} and ${max}, averaging ${avg}. Data shows ${trend}.`;
      } else {
        summary = "⚠️ Mock summary: No numeric data available for analysis.";
      }
    }

    res.json({ summary });
  } catch (err) {
    console.error("AI route failed:", err.message);
    res.status(500).json({ summary: "⚠️ Mock summary: Could not fetch AI summary" });
  }
});

export default router;
