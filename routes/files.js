import express from 'express';
import multer from 'multer';
import XLSX from 'xlsx';
import { v4 as uuidv4 } from 'uuid';
import ExcelFile from '../models/ExcelFile.js';
import { protect } from '../middleware/authMiddleware.js';
import OpenAI from 'openai';

const router = express.Router();

// Multer memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
  fileFilter: (req, file, cb) => {
    const ok = /^(application\/vnd\.openxmlformats-officedocument\.spreadsheetml\.sheet|application\/vnd\.ms-excel|text\/csv)/;
    if (ok.test(file.mimetype) || file.originalname.match(/\.(xlsx|xls|csv)$/i)) cb(null, true);
    else cb(new Error('Invalid file type. Only xlsx/xls/csv allowed.'));
  },
});

// Compute numeric stats
function computeNumericStats(rows) {
  const cols = {};
  rows.forEach(row => {
    Object.entries(row).forEach(([k, v]) => {
      const n = v === null || v === undefined || v === '' ? NaN : Number(v);
      if (!Number.isNaN(n)) {
        if (!cols[k]) cols[k] = { count: 0, sum: 0, min: n, max: n };
        cols[k].count += 1;
        cols[k].sum += n;
        if (n < cols[k].min) cols[k].min = n;
        if (n > cols[k].max) cols[k].max = n;
      }
    });
  });
  Object.keys(cols).forEach(k => {
    cols[k].avg = cols[k].count ? cols[k].sum / cols[k].count : null;
  });
  return cols;
}

// Upload + AI summary
router.post('/upload', protect, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) return res.status(400).json({ message: 'No sheets in file' });

    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: null });
    if (!rows.length) return res.status(400).json({ message: 'Sheet is empty' });

    const stats = computeNumericStats(rows);
    const sampleRows = rows.slice(0, 6);

    let prompt = `You are a concise data analyst. Summarize numeric trends.\n\nNumeric column stats:\n`;
    Object.entries(stats).forEach(([col, s]) => {
      prompt += `- ${col}: count=${s.count}, sum=${s.sum}, avg=${Number(s.avg?.toFixed(4))}, min=${s.min}, max=${s.max}\n`;
    });
    prompt += `\nProvide a 3-6 sentence plain-language summary of trends, notable outliers, and 2 quick recommendations (1 action, 1 question). Sample rows:\n${JSON.stringify(sampleRows, null, 2)}`;

    // OpenAI call
    const client = new OpenAI({ apiKey: process.env.OPENAI_KEY });
    const aiResp = await client.responses.create({ model: 'gpt-4o-mini', input: prompt, max_tokens: 400 });

    let summary = 'No summary returned from OpenAI.';
    if (aiResp.output?.length) {
      const content = aiResp.output[0].content;
      if (Array.isArray(content)) {
        const textPart = content.find(c => c.type === 'output_text' || c.type === 'text');
        if (textPart?.text) summary = textPart.text;
      }
    } else if (aiResp.output_text) summary = aiResp.output_text;
    else if (aiResp.generated_text) summary = aiResp.generated_text;
    else if (aiResp.choices?.[0]?.message?.content) summary = aiResp.choices[0].message.content;

    const fileDoc = new ExcelFile({
      filename: uuidv4(),
      originalName: req.file.originalname,
      data: rows,
      uploadedBy: req.user._id,
      analysis: { summary, model: 'gpt-4o-mini', createdAt: new Date() },
    });
    await fileDoc.save();

    res.status(201).json({ message: 'File uploaded and analyzed', file: { id: fileDoc._id }, summary });
  } catch (err) {
    console.error('upload err:', err);
    if (err.message?.includes('Invalid file type')) return res.status(400).json({ message: err.message });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// List files (superadmin/all files based on role)
router.get('/superadmin/files', protect, async (req, res) => {
  try {
    const user = req.user;
    let files;
    if (user.role === 'superadmin') files = await ExcelFile.find().populate('uploadedBy', '-password');
    else if (user.role === 'admin') files = await ExcelFile.find({ uploadedBy: user._id }).populate('uploadedBy', '-password');
    else return res.status(403).json({ message: 'Access denied' });

    const uniqueFiles = Array.from(new Map(files.map(f => [`${f.filename}-${f.uploadedAt}`, f])).values());
    res.json(uniqueFiles);
  } catch (err) {
    console.error('get files err:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete file (admin/superadmin)
router.delete('/:id', protect, async (req, res) => {
  try {
    if (!['admin', 'superadmin'].includes(req.user.role)) return res.status(403).json({ message: 'Access denied' });
    const file = await ExcelFile.findByIdAndDelete(req.params.id);
    if (!file) return res.status(404).json({ message: 'File not found' });
    res.json({ message: 'File deleted' });
  } catch (err) {
    console.error('delete file err:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
