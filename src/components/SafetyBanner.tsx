import React from 'react';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  return (
    <div 
      id="safety-disclaimer-banner" 
      className="bg-amber-950/40 border border-amber-800/60 rounded-xl p-3 sm:p-4 text-amber-200/90 text-xs sm:text-sm flex items-start gap-3 shadow-sm"
    >
      <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-amber-300">ข้อความเตือนความปลอดภัยทางวิศวกรรม (Safety & Legal Disclaimer):</span>
          <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 bg-amber-900/60 rounded text-amber-300 border border-amber-700/50">
            วสท. 022001-22
          </span>
        </div>
        <p className="leading-relaxed text-amber-200/80">
          "แอปนี้เป็นเครื่องมือช่วยคำนวณและตรวจสอบเบื้องต้น ไม่ใช่การรับรองแบบทางวิศวกรรม การออกแบบและติดตั้งจริงต้องตรวจสอบกับมาตรฐานฉบับปัจจุบัน และผู้ประกอบวิชาชีพ/ผู้มีอำนาจตามกฎหมายที่เกี่ยวข้อง"
        </p>
      </div>
    </div>
  );
};
