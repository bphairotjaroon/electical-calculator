import React from 'react';
import { CalculationStatus, SourceStatus, MultiStageStatus } from '../types';
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  AlertCircle, 
  ShieldCheck, 
  ShieldAlert, 
  Sparkles,
  Calculator,
  Clock,
  HelpCircle,
  BookOpen
} from 'lucide-react';

interface StatusBadgeProps {
  status: CalculationStatus | string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md', showLabel = true }) => {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1',
    md: 'text-xs sm:text-sm px-2.5 py-1 gap-1.5',
    lg: 'text-sm sm:text-base px-3.5 py-1.5 gap-2 font-semibold',
  };

  const iconSizes = {
    sm: 'w-3.5 h-3.5',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  switch (status) {
    case 'PASS':
      return (
        <span
          id="badge-pass"
          className={`inline-flex items-center rounded-full font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 ${sizeClasses[size]}`}
        >
          <CheckCircle2 className={`${iconSizes[size]} text-emerald-400 shrink-0`} />
          {showLabel && <span>PASS (ผ่านเกณฑ์)</span>}
        </span>
      );

    case 'PRELIMINARY PASS':
    case 'PRELIMINARY_PASS':
      return (
        <span
          id="badge-preliminary-pass"
          className={`inline-flex items-center rounded-full font-medium bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 ${sizeClasses[size]}`}
        >
          <Clock className={`${iconSizes[size]} text-cyan-400 shrink-0`} />
          {showLabel && <span>PRELIMINARY PASS (ผ่านเกณฑ์ขั้นต้น)</span>}
        </span>
      );

    case 'CALCULATED':
    case 'CALCULATION COMPLETE':
      return (
        <span
          id="badge-calculated"
          className={`inline-flex items-center rounded-full font-medium bg-blue-500/15 text-blue-400 border border-blue-500/30 ${sizeClasses[size]}`}
        >
          <Calculator className={`${iconSizes[size]} text-blue-400 shrink-0`} />
          {showLabel && <span>{status === 'CALCULATION COMPLETE' ? 'CALCULATION COMPLETE (คำนวณเสร็จสิ้น)' : 'CALCULATED (คำนวณแล้ว)'}</span>}
        </span>
      );

    case 'PENDING ENGINEERING CHECK':
      return (
        <span
          id="badge-pending-check"
          className={`inline-flex items-center rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 ${sizeClasses[size]}`}
        >
          <Clock className={`${iconSizes[size]} text-amber-400 shrink-0`} />
          {showLabel && <span>PENDING ENGINEERING CHECK (รอตรวจสอบทางวิศวกรรม)</span>}
        </span>
      );

    case 'REVIEW REQUIRED':
    case 'ENGINEERING REVIEW REQUIRED':
    case 'ENGINEERING_REVIEW_REQUIRED':
      return (
        <span
          id="badge-engineering-review"
          className={`inline-flex items-center rounded-full font-medium bg-purple-500/15 text-purple-300 border border-purple-500/30 ${sizeClasses[size]}`}
        >
          <Sparkles className={`${iconSizes[size]} text-purple-400 shrink-0`} />
          {showLabel && <span>ENGINEERING REVIEW REQUIRED (ต้องตรวจสอบทางวิศวกรรม)</span>}
        </span>
      );

    case 'INCOMPLETE ENGINEERING CHECK':
    case 'INCOMPLETE_ENGINEERING_CHECK':
      return (
        <span
          id="badge-incomplete-check"
          className={`inline-flex items-center rounded-full font-medium bg-amber-500/15 text-amber-300 border border-amber-500/30 ${sizeClasses[size]}`}
        >
          <AlertCircle className={`${iconSizes[size]} text-amber-400 shrink-0`} />
          {showLabel && <span>INCOMPLETE ENGINEERING CHECK (การตรวจยังไม่ครบ)</span>}
        </span>
      );

    case 'NOT CHECKED':
      return (
        <span
          id="badge-not-checked"
          className={`inline-flex items-center rounded-full font-mono text-slate-400 bg-slate-800/80 border border-slate-700/60 ${sizeClasses[size]}`}
        >
          <HelpCircle className={`${iconSizes[size]} text-slate-500 shrink-0`} />
          {showLabel && <span>NOT CHECKED (ยังไม่ได้ตรวจ)</span>}
        </span>
      );

    case 'NOT VERIFIED':
      return (
        <span
          id="badge-not-verified"
          className={`inline-flex items-center rounded-full font-mono text-amber-300 bg-amber-950/60 border border-amber-700/50 ${sizeClasses[size]}`}
        >
          <HelpCircle className={`${iconSizes[size]} text-amber-400 shrink-0`} />
          {showLabel && <span>NOT VERIFIED (ยังไม่ได้รับการยืนยัน)</span>}
        </span>
      );

    case 'REFERENCE ONLY':
      return (
        <span
          id="badge-reference-only"
          className={`inline-flex items-center rounded-full font-mono text-indigo-300 bg-indigo-950/60 border border-indigo-700/50 ${sizeClasses[size]}`}
        >
          <BookOpen className={`${iconSizes[size]} text-indigo-400 shrink-0`} />
          {showLabel && <span>REFERENCE ONLY (เพื่อการอ้างอิง)</span>}
        </span>
      );

    case 'WARNING':
      return (
        <span
          id="badge-warning"
          className={`inline-flex items-center rounded-full font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30 ${sizeClasses[size]}`}
        >
          <AlertTriangle className={`${iconSizes[size]} text-amber-400 shrink-0`} />
          {showLabel && <span>WARNING (เตือน)</span>}
        </span>
      );

    case 'FAIL':
      return (
        <span
          id="badge-fail"
          className={`inline-flex items-center rounded-full font-medium bg-rose-500/15 text-rose-400 border border-rose-500/30 ${sizeClasses[size]}`}
        >
          <XCircle className={`${iconSizes[size]} text-rose-400 shrink-0`} />
          {showLabel && <span>FAIL (ไม่ผ่าน)</span>}
        </span>
      );

    case 'INVALID_INPUT':
      return (
        <span
          id="badge-invalid-input"
          className={`inline-flex items-center rounded-full font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 ${sizeClasses[size]}`}
        >
          <XCircle className={`${iconSizes[size]} text-rose-400 shrink-0`} />
          {showLabel && <span>INVALID INPUT (ข้อมูลนำเข้าไม่ถูกต้อง)</span>}
        </span>
      );

    case 'HIGH_VOLTAGE_REVIEW_REQUIRED':
      return (
        <span
          id="badge-high-voltage-review"
          className={`inline-flex items-center rounded-full font-medium bg-rose-500/15 text-rose-300 border border-rose-500/30 ${sizeClasses[size]}`}
        >
          <AlertTriangle className={`${iconSizes[size]} text-rose-400 shrink-0`} />
          {showLabel && <span>HIGH VOLTAGE REVIEW REQUIRED (แรงดันสูงเกินเกณฑ์)</span>}
        </span>
      );

    case 'INSUFFICIENT_VERIFIED_DATA':
    case 'INSUFFICIENT VERIFIED DATA':
      return (
        <span
          id="badge-insufficient-data"
          className={`inline-flex items-center rounded-full font-medium bg-orange-500/15 text-orange-400 border border-orange-500/30 ${sizeClasses[size]}`}
        >
          <AlertCircle className={`${iconSizes[size]} text-orange-400 shrink-0`} />
          {showLabel && <span>INSUFFICIENT VERIFIED DATA (ข้อมูลมาตรฐานไม่เพียงพอ)</span>}
        </span>
      );

    default:
      return (
        <span className={`inline-flex items-center rounded-full font-mono text-slate-300 bg-slate-800 border border-slate-700 ${sizeClasses[size]}`}>
          <span>{status}</span>
        </span>
      );
  }
};

export const MultiStageStatusBar: React.FC<{ multiStageStatus: MultiStageStatus }> = ({ multiStageStatus }) => {
  return (
    <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/90 space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-900">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          สถานะการตรวจสอบรายระบบ (System Engineering Checks)
        </span>
        <span className="text-[11px] text-amber-400/90 font-mono">วสท. 022001-22</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px]">1. Calculation</span>
          <span className="font-mono font-semibold text-blue-300 mt-1">{multiStageStatus.calculationStatus}</span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px]">2. Standard Status</span>
          <span className="font-mono font-semibold text-indigo-300 mt-1">{multiStageStatus.standardStatus}</span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px]">3. Cable Check</span>
          <span className={`font-mono font-semibold mt-1 ${
            multiStageStatus.cableStatus === 'PASS' ? 'text-emerald-400' :
            multiStageStatus.cableStatus === 'PRELIMINARY PASS' ? 'text-cyan-400' :
            multiStageStatus.cableStatus === 'FAIL' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {multiStageStatus.cableStatus}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px]">4. Breaker Check</span>
          <span className={`font-mono font-semibold mt-1 ${
            multiStageStatus.breakerStatus === 'PASS' ? 'text-emerald-400' :
            multiStageStatus.breakerStatus === 'PRELIMINARY PASS' ? 'text-cyan-400' :
            multiStageStatus.breakerStatus === 'FAIL' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {multiStageStatus.breakerStatus}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between">
          <span className="text-slate-400 text-[11px]">5. Conduit Fill</span>
          <span className={`font-mono font-semibold mt-1 ${
            multiStageStatus.conduitStatus === 'PASS' ? 'text-emerald-400' :
            multiStageStatus.conduitStatus === 'PRELIMINARY PASS' ? 'text-cyan-400' :
            multiStageStatus.conduitStatus === 'FAIL' ? 'text-rose-400' : 'text-slate-400'
          }`}>
            {multiStageStatus.conduitStatus}
          </span>
        </div>

        <div className="p-2 rounded-lg bg-purple-950/30 border border-purple-800/40 flex flex-col justify-between">
          <span className="text-purple-300 text-[11px]">6. Final Status</span>
          <span className={`font-mono font-bold mt-1 ${
            multiStageStatus.finalStatus === 'PASS' ? 'text-emerald-400' :
            multiStageStatus.finalStatus === 'FAIL' ? 'text-rose-400' :
            multiStageStatus.finalStatus === 'INSUFFICIENT_VERIFIED_DATA' ? 'text-orange-400' :
            'text-purple-300'
          }`}>
            {multiStageStatus.finalStatus}
          </span>
        </div>
      </div>
    </div>
  );
};

interface SourceStatusBadgeProps {
  status: SourceStatus;
  size?: 'sm' | 'md';
}

export const SourceStatusBadge: React.FC<SourceStatusBadgeProps> = ({ status, size = 'sm' }) => {
  const sizeClass = size === 'sm' ? 'text-[11px] px-2 py-0.5' : 'text-xs px-2.5 py-1';

  switch (status) {
    case 'VERIFIED_STANDARD_DATA':
      return (
        <span className={`inline-flex items-center gap-1 rounded-md font-mono bg-emerald-950/60 text-emerald-300 border border-emerald-700/50 ${sizeClass}`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>VERIFIED_STANDARD_DATA</span>
        </span>
      );
    case 'NEEDS_SOURCE_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1 rounded-md font-mono bg-amber-950/60 text-amber-300 border border-amber-700/50 ${sizeClass}`}>
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
          <span>NEEDS_SOURCE_REVIEW</span>
        </span>
      );
    case 'DEMO_DATA':
      return (
        <span className={`inline-flex items-center gap-1 rounded-md font-mono bg-cyan-950/60 text-cyan-300 border border-cyan-700/50 ${sizeClass}`}>
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>DEMO_DATA</span>
        </span>
      );
    default:
      return null;
  }
};
