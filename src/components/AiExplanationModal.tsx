import React, { useState } from 'react';
import { CalculationTrace } from '../types';
import { askAiAssistant } from '../services/aiService';
import { Sparkles, X, Loader2, Bot, BookOpen, AlertCircle, Send } from 'lucide-react';

interface AiExplanationModalProps {
  isOpen: boolean;
  onClose: () => void;
  trace?: CalculationTrace | null;
  topic?: string;
}

export const AiExplanationModal: React.FC<AiExplanationModalProps> = ({
  isOpen,
  onClose,
  trace,
  topic = 'การคำนวณระบบไฟฟ้า วสท. 022001-22',
}) => {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [mode, setMode] = useState<string>('');

  if (!isOpen) return null;

  const handleFetchExplanation = async (userPrompt?: string) => {
    setLoading(true);
    try {
      const res = await askAiAssistant({
        topic,
        calculationTrace: trace || undefined,
        question: userPrompt || question || 'โปรดอธิบายที่มาของสูตร ข้อกำหนดมาตรฐาน และข้อพิจารณาความปลอดภัยสำหรับผลลัพธ์นี้',
      });
      setExplanation(res.explanation);
      setMode(res.mode);
    } catch (err: any) {
      setExplanation('เกิดข้อผิดพลาดในการขอคำอธิบาย: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold text-slate-100 flex items-center gap-2">
                AI วิศวกรผู้ช่วยอธิบายมาตรฐาน วสท.
              </h3>
              <p className="text-xs text-slate-400">อธิบายสูตร ผลลัพธ์ และข้อกำหนดความปลอดภัย (ไม่แต่งค่ามาตรฐาน)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4 text-sm text-slate-300">
          {/* Rule statement notice */}
          <div className="p-3 bg-indigo-950/30 border border-indigo-800/40 rounded-xl text-xs text-indigo-200/90 flex items-start gap-2.5">
            <BookOpen className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
            <span>
              <strong>หลักความปลอดภัย:</strong> AI ทำหน้าที่อธิบายความหมายของผลการคำนวณและข้อกำหนดในมาตรฐาน วสท. 022001-22 เท่านั้น โดยไม่สามารถดัดแปลงตัวเลขผลลัพธ์ของ Calculation Engine ได้
            </span>
          </div>

          {/* Trace Summary if available */}
          {trace && (
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono">
              <p className="text-slate-400 font-sans font-medium mb-1">ผลลัพธ์ปัจจุบันที่กำลังตรวจสอบ:</p>
              <p className="text-cyan-300 font-semibold">{trace.result}</p>
              <p className="text-amber-200 mt-1">{trace.formula} ➔ {trace.substitution}</p>
            </div>
          )}

          {/* Quick preset questions */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-slate-400">คำถามแนะนำที่พบบ่อย:</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFetchExplanation('อธิบายหลักการประสานสัมพันธ์ Ib <= In <= Iz')}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                หลักการ Ib ≤ In ≤ Iz
              </button>
              <button
                onClick={() => handleFetchExplanation('อธิบายเกณฑ์ Conduit Fill ตามตารางที่ 5-3 ทำไมสาย 2 เส้นถึงได้แค่ 31%')}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                ทำไมร้อยสาย 2 เส้นได้แค่ 31%?
              </button>
              <button
                onClick={() => handleFetchExplanation('อธิบายตัวคูณปรับค่าอุณหภูมิ Ca และการจัดกลุ่มสาย Cg ใน วสท.')}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                ตัวคูณอุณหภูมิ Ca & กลุ่มสาย Cg
              </button>
              <button
                onClick={() => handleFetchExplanation('เกณฑ์และผลกระทบของแรงดันตก Voltage Drop เกิน 3% และ 5%')}
                className="px-2.5 py-1 text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors cursor-pointer"
              >
                ผลกระทบของ Voltage Drop
              </button>
            </div>
          </div>

          {/* Output Display */}
          {loading && (
            <div className="p-8 text-center flex flex-col items-center justify-center space-y-3">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
              <p className="text-xs text-slate-400">กำลังวิเคราะห์ตามข้อกำหนดมาตรฐาน วสท. 022001-22...</p>
            </div>
          )}

          {!loading && explanation && (
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-2 border-b border-slate-800/80">
                <span className="flex items-center gap-1.5 text-amber-400 font-medium">
                  <Bot className="w-3.5 h-3.5" />
                  คำอธิบายทางวิศวกรรม
                </span>
                <span className="font-mono text-[10px] uppercase bg-slate-800 px-1.5 py-0.5 rounded">
                  {mode}
                </span>
              </div>
              <div className="prose prose-invert prose-sm max-w-none text-slate-200 leading-relaxed whitespace-pre-wrap font-sans text-xs sm:text-sm">
                {explanation}
              </div>
            </div>
          )}
        </div>

        {/* Input Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (question.trim()) handleFetchExplanation(question.trim());
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="พิมพ์คำถามหรือข้อสงสัยเกี่ยวกับมาตรฐานหรือสูตรนี้..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-200 placeholder:text-slate-500 focus:outline-hidden focus:border-amber-500/50"
            />
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold rounded-xl text-xs sm:text-sm transition-colors cursor-pointer disabled:opacity-50"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span>ถาม AI</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
