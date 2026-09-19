import express from "express";
import http from "http";
import path from "path";
import dotenv from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const httpServer = http.createServer(app);
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// API health endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Lazy-initialized Gemini client
let genAiClient: GoogleGenAI | null = null;
function getGenAi(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!genAiClient) {
    genAiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return genAiClient;
}

// AI Engineering Assistant route
app.post("/api/ai/explain", async (req, res) => {
  try {
    const { topic, calculationTrace, context, question } = req.body;

    const ai = getGenAi();
    if (!ai) {
      // Fallback response when GEMINI_API_KEY is not configured
      return res.json({
        explanation: getOfflineExplanation(topic, calculationTrace, context, question),
        mode: "offline_rule_engine",
      });
    }

    const systemInstruction = `คุณเป็น AI ผู้ช่วยวิศวกรไฟฟ้าประจำระบบ Electrical Engineering Calculator ตามมาตรฐาน วสท. 022001-22 (มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย พ.ศ. 2564).
กฎความปลอดภัยทางวิศวกรรมที่เคร่งครัด:
1. คุณมีหน้าที่ "อธิบาย" สูตร, ที่มาทางทฤษฎี, ผลลัพธ์, ข้อควรระวัง (Warning), และบริบทของมาตรฐานเท่านั้น
2. ห้ามแต่งค่ามาตรฐาน (Ampacity, ขนาดท่อ, Inside Diameter, Correction Factors) ขึ้นมาเองเด็ดขาด
3. ห้ามแก้ไขหรือเปลี่ยนแปลงตัวเลขผลลัพธ์ที่คำนวณได้จาก Calculation Engine
4. อ้างอิงข้อกำหนด วสท. 022001-22 เสมอ เช่น ตารางที่ 5-20 (สายแกนเดี่ยวในท่อ), ตารางที่ 5-3 (Conduit Fill), ตารางที่ 5-43 (อุณหภูมิ), ตารางที่ 5-44 (กลุ่มสาย)
5. สรุปเป็นภาษาไทยเชิงวิชาการที่กระชับ ชัดเจน และนำไปประยุกต์ใช้ได้จริง`;

    const prompt = `กรุณาอธิบายข้อมูลทางวิศวกรรมไฟฟ้านี้ตามมาตรฐาน วสท. 022001-22:
หัวข้อ: ${topic || "การคำนวณระบบไฟฟ้า"}
คำถาม/ข้อสงสัยของผู้ใช้: ${question || "ช่วยอธิบายหลักการและการตรวจสอบตามมาตรฐาน"}
ข้อมูลการคำนวณ (Calculation Trace & Context):
${JSON.stringify({ calculationTrace, context }, null, 2)}

โปรดอธิบาย:
1. ความหมายของผลลัพธ์และตัวแปร
2. เหตุผลทางวิศวกรรมและความปลอดภัย (เช่น เงื่อนไข Ib <= In <= Iz หรือ Conduit Fill ไม่เกินเกณฑ์)
3. ข้อควรระวังในการติดตั้งจริงหน้างาน`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.2,
      },
    });

    const explanation = response.text || "ไม่สามารถสร้างคำอธิบายได้ในขณะนี้";
    return res.json({ explanation, mode: "gemini_model" });
  } catch (err: any) {
    console.error("AI Assistant API error:", err);
    // Graceful degradation fallback
    return res.json({
      explanation: "เกิดข้อผิดพลาดในการเชื่อมต่อ AI: " + (err?.message || "โปรดลองใหม่อีกครั้ง") + "\n\n(ระบบยังคงทำงานและคำนวณตามมาตรฐาน วสท. 022001-22 ได้ตามปกติผ่าน Calculation Engine ภายในระบบ)",
      mode: "error_fallback",
    });
  }
});

function getOfflineExplanation(topic: string, trace: any, _context: any, question?: string): string {
  if (topic === "cable_sizing" || topic === "breaker") {
    return `### สรุปหลักการเลือกขนาดสายและ Circuit Breaker ตามมาตรฐาน วสท. 022001-22:
- **หลักการประสานสัมพันธ์ทางไฟฟ้า (Coordination Rule):** $I_b \\le I_n \\le I_z$
  1. **$I_b$ (Design Current):** กระแสโหลดออกแบบที่ใช้งานจริง
  2. **$I_n$ (Nominal Rating):** พิกัดกระแสตัดวงจรของ Circuit Breaker ต้องไม่ต่ำกว่า $I_b$ เพื่อไม่ให้ตัดวงจรขณะทำงานปกติ
  3. **$I_z$ (Corrected Ampacity):** พิกัดกระแสยอมรับได้ของสายไฟหลังคูณตัวปรับค่า ($I_z = I_{table} \\times C_a \\times C_g$) ต้องไม่น้อยกว่า $I_n$ เพื่อป้องกันสายไฟร้อนเกินก่อนที่เบรกเกอร์จะทำงาน
- **ข้อพึงระวัง:** หากสายไฟร้อยในท่อร่วมกันเกิน 3 เส้น หรืออุณหภูมิห้องเกิน 40°C ต้องคิดตัวคูณลดกระแสเสมอ`;
  }

  if (topic === "conduit_fill") {
    return `### สรุปข้อกำหนดการใช้พื้นที่ภายในท่อร้อยสาย (Conduit Fill) ตาม วสท. ตารางที่ 5-3:
- **1 เส้น:** ยอมให้ใช้พื้นที่หน้าตัดรวมของสายได้สูงสุด **53%** ของพื้นที่หน้าตัดภายในท่อ
- **2 เส้น:** ยอมให้ใช้พื้นที่หน้าตัดรวมของสายได้สูงสุด **31%** (เนื่องจากสาย 2 เส้นอาจบิดหรือเสียดสีกันจนดึงยาก)
- **3 เส้นขึ้นไป:** ยอมให้ใช้พื้นที่หน้าตัดรวมของสายได้สูงสุด **40%** เพื่อความสะดวกในการดึงสายและระบายความร้อน
- การคำนวณคิดจากพื้นที่หน้าตัดภายนอกของสายรวมฉนวน ($A = \\frac{\\pi d^2}{4}$) เทียบกับพื้นที่หน้าตัดภายในท่อ`;
  }

  if (topic === "voltage_drop") {
    return `### สรุปข้อกำหนดแรงดันตก (Voltage Drop) ในระบบไฟฟ้า:
- ตามมาตรฐาน วสท. 022001-22 แนะนำให้แรงดันตกรวมจากจุดรับไฟฟ้าถึงโหลดปลายทางไม่ควรเกิน **5%**
  - สายประธาน (Feeder): นิยมออกแบบไม่เกิน **2-3%**
  - สายวงจรย่อย (Branch Circuit): นิยมออกแบบไม่เกิน **2-3%**
- สูตรคำนวณ:
  - 1 เฟส 2 สาย: $\\Delta V = 2 I L (R \\cos\\phi + X \\sin\\phi)$
  - 3 เฟส 4 สาย: $\\Delta V = \\sqrt{3} I L (R \\cos\\phi + X \\sin\\phi)$`;
  }

  return `### คำอธิบายทางวิศวกรรมไฟฟ้า วสท. 022001-22:
การคำนวณทั้งหมดได้รับการประมวลผลด้วยโมเดล Deterministic Calculation Engine ตามสมการและตารางมาตรฐาน วสท. พ.ศ. 2564
- ตรวจสอบให้แน่ใจว่าได้ระบุวิธีติดตั้งและสภาพแวดล้อมอย่างถูกต้อง
- สำหรับการปฏิบัติงานจริง ควรอ้างอิงร่วมกับตารางมาตรฐานฉบับทางการของ วสท.`;
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: "0.0.0.0",
        port: PORT,
        allowedHosts: true,
        hmr: {
          server: httpServer,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
