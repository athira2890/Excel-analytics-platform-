import OpenAI from "openai";
import Analysis from "../models/Analysis.js";
import ExcelFile from "../models/ExcelFile.js";

const openai = new OpenAI({ apiKey: process.env.OPENAI_KEY });

export const generateSummary = async (req, res) => {
  try {
    const { fileId, chartData } = req.body;
    let dataToSummarize;

    if (fileId) {
      const file = await ExcelFile.findById(fileId);
      if (!file) return res.status(400).json({ message: "File not found" });
      dataToSummarize = file.data;
    } else if (chartData) {
      dataToSummarize = chartData;
    } else {
      return res.status(400).json({ message: "No data provided" });
    }

    const prompt = `Summarize the key numeric trends in this data in a few sentences: ${JSON.stringify(dataToSummarize)}`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 150,
    });

    const summary = response.choices[0].message.content;

    // Optional: save summary
    const analysis = await Analysis.create({
      user: req.user._id,
      fileId,
      chartData,
      summary,
    });

    res.status(200).json({ summary, analysisId: analysis._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
