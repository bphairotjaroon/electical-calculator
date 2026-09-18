import React, { useState } from 'react';
import { CalculationTrace } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  ArrowDown, 
  Copy, 
  Check, 
  Sparkles, 
  BookOpen, 
  FileText,
  ShieldCheck,
  CheckCircle2,
  Clock
} from 'lucide-react';

interface CalculationTraceCardProps {
  trace: CalculationTrace;
  title?: string;
  onAskAi?: (trace: CalculationTrace) => void;
}

export const CalculationTraceCard: React.FC<CalculationTraceCardProps> = ({
  trace,
  title = 'ลำดับขั้นตอนการคำนวณและการตรวจสอบทางวิศวกรรม (Engineering Calculation Trace)',
  onAskAi,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const text = `
=== ${title} ===
[1. INPUT]
${Object.entries(trace.input)
  .map(([k, v]) => `• ${k}: ${v}`)
  .join('\n')}

[2. FORMULA]
${trace.formula}

[3. SUBSTITUTION]
${trace.substitution}

[4. RESULT]
${trace.result}

[5. STANDARD REFERENCE]
Standard: ${trace.standardReference?.standard || 'วสท. 022001-22'}
${trace.standardReference?.chapter ? `Chapter: ${trace.standardReference.chapter}` : ''}
${trace.standardReference?.table ? `Table: ${trace.standardReference.table}` : ''}
Compliance: ${trace.standardReference?.complianceStatus || 'NOT YET VERIFIED'}

[6. ENGINEERING CHECK]
• Cable: ${trace.engineeringCheck?.cable || 'NOT CHECKED'}
• Breaker: ${trace.engineeringCheck?.breaker || 'NOT CHECKED'}
• Voltage Drop: ${trace.engineeringCheck?.voltageDrop || 'NOT CHECKED'}
• Conduit: ${trace.engineeringCheck?.conduit || 'NOT CHECKED'}

[7. FINAL STATUS]
${trace.finalStatus}
${trace.notes ? `\n[NOTES]\n${trace.notes.map((n) => `• ${n}`).join('\n')}` : ''}
`.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
      {/* Card Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-amber-400" />
          <h3 className="text-sm sm:text-base font-semibold text-slate-100">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {onAskAi && (
            <button
              onClick={() => onAskAi(trace)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>ให้ AI อธิบายสูตร/ผลลัพธ์</span>
            </button>
          )}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            title="คัดลอก Trace เป็นข้อความ"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'คัดลอกแล้ว' : 'คัดลอก 7-Step Trace'}</span>
          </button>
        </div>
      </div>

      {/* Trace Pipeline 7 Steps */}
      <div className="space-y-3 font-mono text-xs sm:text-sm">
        {/* Step 1: INPUT */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-sans font-semibold mb-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
            <span>1. ข้อมูลนำเข้า (INPUT)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 text-slate-300">
            {Object.entries(trace.input).map(([k, v]) => (
              <div key={k} className="flex justify-between border-b border-slate-900 pb-1">
                <span className="text-slate-400 font-sans">{k}:</span>
                <span className="text-cyan-300 font-semibold">{v}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 2: FORMULA */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-sans font-semibold mb-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-400"></span>
            <span>2. สูตรสมการวิศวกรรม (FORMULA)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-800/30 text-indigo-300 font-semibold">
            {trace.formula}
          </div>
        </div>

        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 3: SUBSTITUTION */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-sans font-semibold mb-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>3. การแทนค่าลงในสมการ (SUBSTITUTION)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 text-amber-200">
            {trace.substitution}
          </div>
        </div>

        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 4: RESULT */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-sans font-semibold mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span>4. ผลลัพธ์การคำนวณ (RESULT)</span>
          </div>
          <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-800/40 text-emerald-300 font-bold text-sm sm:text-base">
            {trace.result}
          </div>
        </div>

        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 5: STANDARD REFERENCE */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 text-slate-400 text-xs font-sans font-semibold">
              <BookOpen className="w-3.5 h-3.5 text-blue-400" />
              <span>5. การอ้างอิงมาตรฐาน (STANDARD REFERENCE)</span>
            </div>
            <span className="text-[11px] font-mono text-blue-300 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800/50">
              {trace.standardReference?.complianceStatus || 'NOT YET VERIFIED'}
            </span>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1 text-slate-300">
            <p className="font-semibold text-slate-100">
              {trace.standardReference?.standard || 'วสท. 022001-22 (มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย พ.ศ. 2564)'}
            </p>
            {trace.standardReference?.chapter && (
              <p className="text-slate-400">{trace.standardReference.chapter}</p>
            )}
            {trace.standardReference?.table && (
              <p className="text-amber-300 font-mono">อ้างอิง: {trace.standardReference.table}</p>
            )}
            {trace.reference && (
              <p className="text-[11px] text-slate-400 pt-1 border-t border-slate-800 font-sans">
                ตาราง {trace.reference.table}: {trace.reference.referenceNote} (สถานะ: {trace.reference.sourceStatus})
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 6: ENGINEERING CHECK */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-sans font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>6. รายการตรวจสอบทางวิศวกรรม (ENGINEERING CHECK)</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[11px]">Cable Sizing:</span>
              <span className={`font-mono font-bold mt-1 text-xs ${
                trace.engineeringCheck?.cable === 'PASS' ? 'text-emerald-400' :
                trace.engineeringCheck?.cable === 'FAIL' ? 'text-rose-400' :
                trace.engineeringCheck?.cable === 'INSUFFICIENT_VERIFIED_DATA' ? 'text-orange-400' : 'text-slate-400'
              }`}>
                {trace.engineeringCheck?.cable || 'NOT CHECKED'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[11px]">Breaker Rating:</span>
              <span className={`font-mono font-bold mt-1 text-xs ${
                trace.engineeringCheck?.breaker === 'PASS' ? 'text-emerald-400' :
                trace.engineeringCheck?.breaker === 'FAIL' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {trace.engineeringCheck?.breaker || 'NOT CHECKED'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[11px]">Voltage Drop:</span>
              <span className={`font-mono font-bold mt-1 text-xs ${
                trace.engineeringCheck?.voltageDrop === 'PASS' ? 'text-emerald-400' :
                trace.engineeringCheck?.voltageDrop === 'FAIL' ? 'text-rose-400' : 'text-slate-400'
              }`}>
                {trace.engineeringCheck?.voltageDrop || 'NOT CHECKED'}
              </span>
            </div>

            <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex flex-col justify-between">
              <span className="text-slate-400 text-[11px]">Conduit Fill:</span>
              <span className={`font-mono font-bold mt-1 text-xs ${
                trace.engineeringCheck?.conduit === 'PASS' ? 'text-emerald-400' :
                trace.engineeringCheck?.conduit === 'FAIL' ? 'text-rose-400' :
                trace.engineeringCheck?.conduit === 'INSUFFICIENT_VERIFIED_DATA' ? 'text-orange-400' : 'text-slate-400'
              }`}>
                {trace.engineeringCheck?.conduit || 'NOT CHECKED'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-center text-slate-600">
          <ArrowDown className="w-4 h-4" />
        </div>

        {/* Step 7: FINAL STATUS */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80">
          <div className="flex items-center gap-2 text-slate-400 text-xs font-sans font-semibold mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
            <span>7. สถานะสรุปทางวิศวกรรม (FINAL STATUS)</span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-900 border border-slate-800">
            <div className="space-y-1">
              <p className="text-slate-200 font-sans text-xs sm:text-sm font-medium">
                {trace.finalStatus === 'ENGINEERING REVIEW REQUIRED'
                  ? 'คำนวณสำเร็จแล้ว — รอการตรวจสอบและประสานสัมพันธ์กับอุปกรณ์อื่นในระบบ'
                  : trace.finalStatus === 'PASS'
                  ? 'ระบบผ่านมาตรฐานวิศวกรรมครบถ้วนตามเงื่อนไขที่กำหนด'
                  : 'ยังไม่ผ่านเกณฑ์มาตรฐาน หรือจำเป็นต้องมีการปรับแก้พารามิเตอร์'}
              </p>
            </div>
            <StatusBadge status={trace.finalStatus} size="md" />
          </div>

          {trace.notes && trace.notes.length > 0 && (
            <div className="mt-3 pt-2.5 border-t border-slate-900 text-xs text-slate-400 font-sans space-y-1">
              {trace.notes.map((note, i) => (
                <p key={i} className="flex items-start gap-1.5">
                  <span className="text-amber-400 font-bold">•</span>
                  <span>{note}</span>
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
