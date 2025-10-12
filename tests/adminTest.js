import request from "supertest";
import express from "express";
import multer from "multer";
import XLSX from "xlsx";
import { protect } from "../middleware/authMiddleware.js";
import fileRoutes from "../routes/files.js";

// ---------------- MOCK SETUP ----------------

// Mock protect middleware to inject fake user
jest.mock("../middleware/authMiddleware.js", () => ({
  protect: (req, res, next) => {
    req.user = { _id: "64f1abc123", role: "admin", name: "Test Admin" };
    next();
  },
}));

// Mock OpenAI client to prevent real API call
jest.mock("openai", () => {
  return {
    default: class {
      constructor() {}
      responses = {
        create: jest.fn(async () => ({
          output: [{ content: [{ type: "output_text", text: "Mock summary" }] }],
        })),
      };
    },
  };
});

// ---------------- EXPRESS APP ----------------
const app = express();
app.use(express.json());
app.use("/api/files", fileRoutes);

// ---------------- TEST CASES ----------------
describe("POST /api/files/upload", () => {
  it("returns 400 if no file is sent", async () => {
    const res = await request(app)
      .post("/api/files/upload")
      .set("Authorization", "Bearer faketoken");
    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/no file/i);
  });

  it("returns 201 with mock Excel file", async () => {
    // create a small XLSX buffer in-memory
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ["Name", "Value"],
      ["A", 10],
      ["B", 20],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    const res = await request(app)
      .post("/api/files/upload")
      .set("Authorization", "Bearer faketoken")
      .attach("file", buf, "test.xlsx");

    expect(res.statusCode).toBe(201);
    expect(res.body.summary).toBe("Mock summary");
    expect(res.body.file).toHaveProperty("id");
  });
});
