import React, { useState } from 'react';
import { runAllTestCases, TestCaseResult } from '../services/testCasesRunner';
import { DATABASE_VERSION_INFO } from '../data/standardsData';
import { 
  Settings, 
  CheckCircle2, 
  XCircle, 
  RotateCcw, 
  ShieldCheck, 
  Terminal, 
  Play, 
  Database,
  Cpu
} from 'lucide-react';

interface SettingsTestsPageProps {
  onTestsUpdated?: (passed: number, total: number) => void;
}

export const SettingsTestsPage: React.FC<SettingsTestsPageProps> = ({ onTestsUpdated }) => {
  const [testSuite, setTestSuite] = useState(() => runAllTestCases());
  const [running, setRunning] = useState(false);

  const handleRerunTests = () => {
    setRunning(true);
    setTimeout(() => {
      const results = runAllTestCases();
      setTestSuite(results);
      if (onTestsUpdated) {
        onTestsUpdated(results.passed, results.total);
      }
      setRunning(false);
    }, 300);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Settings className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                ตั้งค่า & ชุดทดสอบอัตโนมัติ (Settings & Automated Tests)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              ตรวจสอบความถูกต้องของสมการคำนวณทางวิศวกรรมไฟฟ้าและข้อมูลมาตรฐาน วสท. 022001-22
            </p>
          </div>

          <button
            onClick={handleRerunTests}
            disabled={running}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer disabled:opacity-50"
          >
            <Play className={`w-4 h-4 ${running ? 'animate-spin' : ''}`} />
            <span>{running ? 'กำลังรันการทดสอบ...' : 'รันการทดสอบซ้ำ (Run Tests)'}</span>
          </button>
        </div>
      </div>

      {/* Database Version & Integrity Status */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-200">
              ข้อมูลเวอร์ชันฐานข้อมูลมาตรฐาน (Standards Database Integrity)
            </h3>
          </div>
          <span className="px-2.5 py-1 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-700/50 text-xs font-mono">
            VERIFIED INTEGRITY
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block font-sans">Database Version:</span>
            <span className="text-amber-400 font-bold text-sm">{DATABASE_VERSION_INFO.version}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block font-sans">Standard Edition:</span>
            <span className="text-slate-200 font-bold text-sm">{DATABASE_VERSION_INFO.edition}</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block font-sans">Data Trust Policy:</span>
            <span className="text-emerald-400 font-bold text-sm">ZERO HALLUCINATION</span>
          </div>
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
            <span className="text-slate-500 block font-sans">Calculation Architecture:</span>
            <span className="text-cyan-400 font-bold text-sm">Deterministic Engine</span>
          </div>
        </div>

        <p className="text-xs text-slate-400 leading-relaxed pt-2 border-t border-slate-800/80">
          * ระบบใช้มาตรฐาน วสท. 022001-22 เป็นแหล่งอ้างอิงหลัก หากข้อมูลตารางใดไม่ได้รับการระบุสถานะเป็น <code className="text-emerald-400 font-mono">VERIFIED_STANDARD_DATA</code> ระบบจะปฏิเสธการคำนวณอัตโนมัติและแสดงผลเป็น <code className="text-orange-400 font-mono">INSUFFICIENT_VERIFIED_DATA</code> ทันทีเพื่อความปลอดภัยสูงสุด
        </p>
      </div>

      {/* Automated Test Suite Results */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-amber-400" />
            <h3 className="text-sm sm:text-base font-semibold text-slate-200">
              ผลการทดสอบการคำนวณทางวิศวกรรม (Automated Unit Tests)
            </h3>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="px-3 py-1 rounded-lg bg-emerald-950 text-emerald-400 border border-emerald-800">
              ผ่าน {testSuite.passed} / {testSuite.total} การทดสอบ
            </span>
            {testSuite.failed > 0 && (
              <span className="px-3 py-1 rounded-lg bg-rose-950 text-rose-400 border border-rose-800">
                ล้มเหลว {testSuite.failed}
              </span>
            )}
          </div>
        </div>

        <div className="space-y-3">
          {testSuite.results.map((t) => (
            <div
              key={t.id}
              className={`p-4 rounded-xl border transition-colors ${
                t.passed
                  ? 'bg-slate-950 border-slate-800 hover:border-slate-700'
                  : 'bg-rose-950/20 border-rose-800/50'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {t.passed ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs sm:text-sm font-semibold text-slate-200">
                      {t.name}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs font-mono text-slate-400 pl-6">
                    <span>
                      หมวด: <strong className="text-slate-300">{t.category}</strong>
                    </span>
                    <span>
                      ค่าที่คาดหวัง: <strong className="text-amber-400">{t.expected}</strong>
                    </span>
                    <span>
                      ค่าที่คำนวณได้จริง: <strong className="text-cyan-400">{t.actual}</strong>
                    </span>
                  </div>
                  {t.notes && (
                    <p className="text-[11px] text-slate-500 pl-6 pt-1">
                      {t.notes}
                    </p>
                  )}
                </div>

                <span
                  className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md shrink-0 ${
                    t.passed
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-700/40'
                      : 'bg-rose-950/80 text-rose-400 border border-rose-700/40'
                  }`}
                >
                  {t.passed ? 'PASSED' : 'FAILED'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
