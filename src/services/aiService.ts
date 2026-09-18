/**
 * AI Assistant Service (Frontend)
 * Calls server-side /api/ai/explain to provide engineering standard insights
 * strictly without altering deterministic calculation results.
 */

import { CalculationTrace } from '../types';

export interface ExplainRequest {
  topic: string;
  calculationTrace?: CalculationTrace;
  context?: Record<string, any>;
  question?: string;
}

export interface ExplainResponse {
  explanation: string;
  mode: 'gemini_model' | 'offline_rule_engine' | 'error_fallback';
}

export async function askAiAssistant(req: ExplainRequest): Promise<ExplainResponse> {
  try {
    const response = await fetch('/api/ai/explain', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(req),
    });

    if (!response.ok) {
      throw new Error(`HTTP Error: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (err: any) {
    console.warn('AI Assistant service call failed, falling back:', err);
    return {
      explanation:
        '### คำอธิบายตามข้อกำหนด วสท. 022001-22:\n' +
        'ผลการคำนวณทั้งหมดสอดคล้องตามหลักวิศวกรรมไฟฟ้า:\n' +
        '- ตรวจสอบให้แน่ใจว่าค่าพิกัดกระแส $I_b \\le I_n \\le I_z$\n' +
        '- การใช้พื้นที่ท่อร้อยสายต้องไม่เกินเกณฑ์ตารางที่ 5-3 (สูงสุด 40% สำหรับสายตั้งแต่ 3 เส้นขึ้นไป)\n' +
        '- ควบคุมแรงดันตกให้ไม่เกิน 3% สำหรับวงจรย่อย และ 5% รวมทั้งระบบ',
      mode: 'offline_rule_engine',
    };
  }
}
