import React, { useState } from 'react';
import { checkCircuitBreaker } from '../services/calculationEngine';
import { CalculationTrace } from '../types';
import { CANDIDATE_BREAKER_RATINGS } from '../data/standardsData';
import { CalculationTraceCard } from '../components/CalculationTraceCard';
import { StatusBadge } from '../components/StatusBadge';
import { ShieldCheck, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';

interface BreakerCheckPageProps {
  initialIb?: number;
  initialIz?: number;
  onAskAi: (trace: CalculationTrace) => void;
}

export const BreakerCheckPage: React.FC<BreakerCheckPageProps> = ({
  initialIb = 20,
  initialIz = 28,
  onAskAi,
}) => {
  const [designCurrentIb, setDesignCurrentIb] = useState<number>(initialIb);
  const [breakerRatingIn, setBreakerRatingIn] = useState<number>(25);
  const [cableAmpacityIz, setCableAmpacityIz] = useState<number>(initialIz);

  // Perform Breaker Check
  const checkResult = checkCircuitBreaker({
    designCurrentIb,
    breakerRatingIn,
    cableAmpacityIz,
  });

  const passIb = designCurrentIb <= breakerRatingIn;
  const passIz = breakerRatingIn <= cableAmpacityIz;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <ShieldCheck className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                ตรวจสอบ Circuit Breaker (Breaker Coordination)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              ตรวจสอบการประสานสัมพันธ์ระหว่างกระแสโหลด (Ib), พิกัดเบรกเกอร์ (In), และพิกัดสายไฟ (Iz) ตามมาตรฐาน วสท. 022001-22
            </p>
          </div>

          <StatusBadge status={checkResult.status} size="md" />
        </div>
      </div>

      {/* Interactive Controls & Diagram */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <h3 className="text-sm sm:text-base font-semibold text-slate-200 pb-2 border-b border-slate-800">
            พารามิเตอร์การตรวจสอบ (Coordination Inputs)
          </h3>

          <div className="space-y-4">
            {/* Design Current Ib */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  1. กระแสโหลดออกแบบ (Design Current: Ib)
                </span>
                <span className="font-mono text-amber-400 font-bold">{designCurrentIb} A</span>
              </div>
              <input
                type="number"
                min="0.1"
                step="0.5"
                value={designCurrentIb}
                onChange={(e) => setDesignCurrentIb(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-hidden focus:border-amber-500/50"
              />
            </div>

            {/* Breaker Rating In */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  2. พิกัด Circuit Breaker (Trip Rating: In)
                </span>
                <span className="font-mono text-indigo-400 font-bold">{breakerRatingIn} A</span>
              </div>
              <select
                value={breakerRatingIn}
                onChange={(e) => setBreakerRatingIn(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-indigo-300 font-mono font-bold focus:outline-hidden focus:border-indigo-500/50 cursor-pointer"
              >
                {CANDIDATE_BREAKER_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r} A {r === 20 ? '(ขนาดมาตรฐานทั่วไปวงจรย่อย)' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Cable Ampacity Iz */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  3. พิกัดกระแสสายไฟหลังปรับแก้ (Corrected Ampacity: Iz)
                </span>
                <span className="font-mono text-emerald-400 font-bold">{cableAmpacityIz} A</span>
              </div>
              <input
                type="number"
                min="1"
                step="0.5"
                value={cableAmpacityIz}
                onChange={(e) => setCableAmpacityIz(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-emerald-300 font-mono font-bold focus:outline-hidden focus:border-emerald-500/50"
              />
            </div>
          </div>
        </div>

        {/* Visualizer & Status Display (6 cols) */}
        <div className="lg:col-span-6 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-slate-200 pb-2 border-b border-slate-800">
              แผนภาพการประสานสัมพันธ์ (Coordination Visualizer)
            </h3>

            {/* Relationship Check Visualizer */}
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4 font-mono">
              <div className="flex items-center justify-between text-xs font-sans text-slate-400 pb-2 border-b border-slate-900">
                <span>เกณฑ์มาตรฐาน:</span>
                <span className="font-mono text-amber-400 font-bold">Ib ≤ In ≤ Iz</span>
              </div>

              {/* Graphical Scale */}
              <div className="space-y-3">
                {/* 1. Condition 1: Ib <= In */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {passIb ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-sans text-slate-300">
                      เงื่อนไข 1: <strong className="font-mono">Ib ({designCurrentIb}A) ≤ In ({breakerRatingIn}A)</strong>
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${passIb ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {passIb ? 'PASS' : 'FAIL'}
                  </span>
                </div>

                {/* 2. Condition 2: In <= Iz */}
                <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                  <div className="flex items-center gap-2">
                    {passIz ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    )}
                    <span className="text-xs font-sans text-slate-300">
                      เงื่อนไข 2: <strong className="font-mono">In ({breakerRatingIn}A) ≤ Iz ({cableAmpacityIz}A)</strong>
                    </span>
                  </div>
                  <span className={`text-xs font-bold ${passIz ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {passIz ? 'PASS' : 'FAIL'}
                  </span>
                </div>
              </div>

              {/* Status Explanation Alert */}
              <div
                className={`p-3.5 rounded-xl border text-xs leading-relaxed font-sans ${
                  checkResult.status === 'PASS'
                    ? 'bg-emerald-950/40 border-emerald-800/50 text-emerald-200'
                    : checkResult.status === 'PRELIMINARY PASS'
                    ? 'bg-cyan-950/40 border-cyan-800/50 text-cyan-200'
                    : checkResult.status === 'WARNING'
                    ? 'bg-amber-950/40 border-amber-800/50 text-amber-200'
                    : 'bg-rose-950/40 border-rose-800/50 text-rose-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  <Info className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block mb-1">
                      {checkResult.status === 'PRELIMINARY PASS'
                        ? 'ผลการประเมิน: ผ่านการตรวจสอบเบื้องต้น (PRELIMINARY PASS)'
                        : checkResult.status === 'PASS'
                        ? 'ผลการประเมิน: ผ่านเกณฑ์ (PASS)'
                        : 'ผลการประเมิน:'}
                    </span>
                    <p>{checkResult.statusMessage}</p>
                    {checkResult.status === 'PRELIMINARY PASS' && (
                      <p className="text-[11px] text-cyan-300/80 mt-1.5 font-medium">
                        * ผ่านการตรวจสอบการประสานสัมพันธ์เฉพาะส่วน (Ib ≤ In ≤ Iz) แต่ยังไม่ใช่ Final Engineering PASS เนื่องจากยังต้องตรวจสอบแรงดันตก ขนาดท่อร้อยสาย และพิกัดแรงดันสายไฟในขั้นตอนรวม
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500 font-sans">
            * มาตรฐาน วสท. 022001-22 กำหนดให้สายไฟต้องได้รับการป้องกันจากกระแสโหลดเกินโดยพิกัดของอุปกรณ์ป้องกันต้องไม่เกินพิกัดการนำกระแสของสายไฟ
          </div>
        </div>
      </div>

      {/* Engineering Calculation Trace Card */}
      <CalculationTraceCard
        trace={checkResult.trace}
        title="ขั้นตอนการตรวจสอบ Circuit Breaker (Trace: Breaker Check)"
        onAskAi={onAskAi}
      />
    </div>
  );
};
