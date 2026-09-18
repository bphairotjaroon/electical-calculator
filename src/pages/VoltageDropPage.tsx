import React, { useEffect, useState } from 'react';
import { calculateVoltageDrop, VoltageDropResult } from '../services/calculationEngine';
import { CableRecord, CalculationTrace, PhaseType } from '../types';
import { CalculationTraceCard } from '../components/CalculationTraceCard';
import { StatusBadge } from '../components/StatusBadge';
import { Activity } from 'lucide-react';

interface VoltageDropPageProps {
  initialCurrent?: number;
  initialCable?: CableRecord | null;
  initialPhase?: PhaseType;
  cables: CableRecord[];
  onVoltageDropCalculated?: (percent: number) => void;
  onAskAi: (trace: CalculationTrace) => void;
}

export const VoltageDropPage: React.FC<VoltageDropPageProps> = ({
  initialCurrent = 18.7,
  initialCable = null,
  initialPhase = '1_PHASE',
  cables,
  onVoltageDropCalculated,
  onAskAi,
}) => {
  const [currentA, setCurrentA] = useState<number>(initialCurrent);
  const [lengthMeters, setLengthMeters] = useState<number>(35);
  const [phase, setPhase] = useState<PhaseType>(initialPhase);
  const [voltageV, setVoltageV] = useState<number>(phase === '1_PHASE' ? 220 : 400);
  const [powerFactor, setPowerFactor] = useState<number>(0.85);

  // Selected cable for impedance values
  const defaultCable =
  initialCable ??
  cables.find((c) => c.sizeMm2 === 4.0) ??
  cables[0];

if (!defaultCable) {
  throw new Error('ไม่พบข้อมูลสายไฟในฐานข้อมูล');
}

const [selectedCableSize, setSelectedCableSize] = useState<number>(
  defaultCable.sizeMm2
);

const matchedCable =
  cables.find(
    (c) =>
      c.sizeMm2 === selectedCableSize &&
      c.cableType === defaultCable.cableType
  ) ?? defaultCable;
 const resistanceR =
  matchedCable.acResistanceAt75COhmPerKm ??
  matchedCable.resistancePerKm ??
  5.99;

const reactanceX =
  matchedCable.reactanceAt50HzOhmPerKm ??
  matchedCable.reactancePerKm ??
  0.118;

  const handlePhaseChange = (newPhase: PhaseType) => {
    setPhase(newPhase);
    if (newPhase === '1_PHASE' && voltageV === 400) {
      setVoltageV(220);
    } else if (newPhase === '3_PHASE' && voltageV === 220) {
      setVoltageV(400);
    }
  };

  // Perform Voltage Drop Calculation
  const result: VoltageDropResult = calculateVoltageDrop({
    currentA,
    lengthMeters,
    voltageV,
    powerFactor,
    resistanceOhmPerKm: resistanceR,
    reactanceOhmPerKm: reactanceX,
    phase,
  });
useEffect(() => {
  onVoltageDropCalculated?.(result.voltageDropPercent);
}, [result.voltageDropPercent, onVoltageDropCalculated]);
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Activity className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                คำนวณแรงดันตก (Voltage Drop Calculation)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              คำนวณตามสูตรอิมพีแดนซ์กระแสสลับ: <code className="text-amber-300 font-mono">ΔV = factor × I × L × (R cosφ + X sinφ)</code> ตามมาตรฐาน วสท. 022001-22
            </p>
          </div>

          <StatusBadge status={result.status} size="md" />
        </div>
      </div>

      {/* Grid: Inputs vs Results */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <h3 className="text-sm sm:text-base font-semibold text-slate-200 pb-2 border-b border-slate-800">
            พารามิเตอร์วงจร (Circuit & Cable Parameters)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* System Phase */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ระบบไฟฟ้า (Phase)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePhaseChange('1_PHASE')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    phase === '1_PHASE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  1 Phase (factor = 2)
                </button>
                <button
                  type="button"
                  onClick={() => handlePhaseChange('3_PHASE')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    phase === '3_PHASE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  3 Phase (factor = √3)
                </button>
              </div>
            </div>

            {/* Voltage */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                แรงดันไฟฟ้า (Voltage: V)
              </label>
              <input
                type="number"
                value={voltageV}
                onChange={(e) => setVoltageV(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 font-mono focus:outline-hidden focus:border-amber-500/50"
              />
            </div>

            {/* Current */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                กระแสไฟฟ้าโหลด (Current: I)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={currentA}
                  onChange={(e) => setCurrentA(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-hidden focus:border-amber-500/50"
                />
                <span className="absolute right-3.5 top-2 text-xs text-slate-500 font-bold">A</span>
              </div>
            </div>

            {/* Length */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ความยาวสายจากแหล่งจ่าย (Length: L)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={lengthMeters}
                  onChange={(e) => setLengthMeters(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-cyan-300 font-mono font-bold focus:outline-hidden focus:border-amber-500/50"
                />
                <span className="absolute right-3.5 top-2 text-xs text-slate-500 font-bold">เมตร</span>
              </div>
            </div>

            {/* Cable Size Selector (pulls R and X) */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">
                ขนาดสายไฟที่ใช้ (เพื่อดึงค่า R และ X จากตารางมาตรฐาน)
              </label>
              <select
                value={selectedCableSize}
                onChange={(e) => setSelectedCableSize(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                {Array.from(new Set(cables.map((c) => c.sizeMm2)))
                  .sort((a: number, b: number) => a - b)
                  .map((sz) => {
                    const cbl = cables.find((c) => c.sizeMm2 === sz)!;
                    const r = cbl?.acResistanceAt75COhmPerKm || cbl?.resistancePerKm || '-';
                    const x = cbl?.reactanceAt50HzOhmPerKm || cbl?.reactancePerKm || '-';
                    return (
                      <option key={sz} value={sz}>
                        สายขนาด {sz} mm² (R = {r} Ω/km, X = {x} Ω/km)
                      </option>
                    );
                  })}
              </select>
            </div>

            {/* Power Factor */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  Power Factor (cos φ)
                </label>
                <span className="text-xs font-mono text-amber-400 font-bold">{powerFactor}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.0"
                step="0.01"
                value={powerFactor}
                onChange={(e) => setPowerFactor(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Right Output Gauge & Result (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                ผลการคำนวณแรงดันตก (Voltage Drop Result)
              </span>
              <StatusBadge status={result.status} size="sm" />
            </div>

            <div className="space-y-5 mt-5">
              {/* Primary Gauge / Metric Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 text-center space-y-2 shadow-inner">
                <p className="text-xs font-medium text-slate-400">
                  เปอร์เซ็นต์แรงดันตก (% Voltage Drop)
                </p>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span
                    className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${
                      result.voltageDropPercent <= 3.0
                        ? 'text-emerald-400'
                        : result.voltageDropPercent <= 5.0
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {result.voltageDropPercent.toFixed(2)}
                  </span>
                  <span className="text-2xl font-bold text-slate-300">%</span>
                </div>
                <p className="text-xs text-slate-300 font-mono">
                  แรงดันตก = <strong className="text-amber-300">{result.voltageDropV} V</strong> (จาก {voltageV} V)
                </p>
              </div>

              {/* Standard Threshold Indicator */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>เกณฑ์มาตรฐาน วสท. 022001-22:</span>
                  <span className="font-mono text-cyan-400">แนะนำ ≤ 3.0%</span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      result.voltageDropPercent <= 3.0
                        ? 'bg-emerald-400'
                        : result.voltageDropPercent <= 5.0
                        ? 'bg-amber-400'
                        : 'bg-rose-500'
                    }`}
                    style={{ width: `${Math.min(100, (result.voltageDropPercent / 6.0) * 100)}%` }}
                  />
                </div>

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0%</span>
                  <span className="text-emerald-400">3% (วงจรย่อย)</span>
                  <span className="text-amber-400">5% (รวม Feeder)</span>
                  <span>6%+</span>
                </div>

                <p className="text-[11px] text-slate-300 pt-2 border-t border-slate-900 leading-relaxed">
                  {result.statusMessage}
                </p>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            * หากแรงดันตกเกิน 3% ควรพิจารณาขยายขนาดสายไฟขึ้นอีก 1 ขั้น หรือลดระยะทางในการเดินสาย
          </div>
        </div>
      </div>

      {/* Engineering Calculation Trace Card */}
      <CalculationTraceCard
        trace={result.trace}
        title="ขั้นตอนการคำนวณแรงดันตก (Trace: Voltage Drop)"
        onAskAi={onAskAi}
      />
    </div>
  );
};
