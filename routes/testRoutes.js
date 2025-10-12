// backend/routes/testRoutes.js
import express from "express";

const router = express.Router();

router.get("/", (req, res) => {
  res.json({ msg: "Test route working!" });
});

export default router; // ✅ default export
