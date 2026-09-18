import React, { useState } from 'react';
import { sizeCableAndBreaker, CableSizingResult } from '../services/calculationEngine';
import { CableRecord, CalculationTrace, PhaseType } from '../types';
import { 
  CANDIDATE_BREAKER_RATINGS, 
  CORRECTION_FACTORS_TEMP_THW, 
  CORRECTION_FACTORS_TEMP_XLPE, 
  CORRECTION_FACTORS_GROUPING 
} from '../data/standardsData';
import { CalculationTraceCard } from '../components/CalculationTraceCard';
import { StatusBadge, SourceStatusBadge } from '../components/StatusBadge';
import { 
  Layers,
  AlertTriangle,
  Sliders,
  Thermometer,
  Users,
  Activity,
  Cylinder
} from 'lucide-react';

interface CableSizingPageProps {onSizingCalculated: (
  breakerRatingIn: number,
  cableAmpacityIz: number,
  cable: CableRecord
) => void;
  initialIb?: number;
  initialPhase?: PhaseType;
  cables: CableRecord[];
  onForwardToVoltageDrop: (currentA: number, cable: CableRecord, phase: PhaseType) => void;
  onForwardToConduitSizing: (cable: CableRecord, phase: PhaseType) => void;
  onAskAi: (trace: CalculationTrace) => void;
}

export const CableSizingPage: React.FC<CableSizingPageProps> = ({ 
  initialIb = 18.7, 
  initialPhase = '1_PHASE', 
  cables, 
  onSizingCalculated,
  onForwardToVoltageDrop, 
  onForwardToConduitSizing,
  onAskAi, 
}) => {
  const [designCurrentIb, setDesignCurrentIb] = useState<number>(initialIb);
  const [phase, setPhase] = useState<PhaseType>(initialPhase);
  const [cableType, setCableType] = useState<string>('60227 IEC 01 (THW)');
  const [ambientTemp, setAmbientTemp] = useState<number>(40);
  const [groupingConductors, setGroupingConductors] = useState<number>(1);
  const [customBreakerIn, setCustomBreakerIn] = useState<number | undefined>(undefined);

  // Available unique cable types in DB
  const availableCableTypes = Array.from(new Set(cables.map((c) => c.cableType)));

  // Temperature correction factor Ca lookup
  const isXlpe = cableType.includes('XLPE') || cableType.includes('CV');
  const tempTable = isXlpe ? CORRECTION_FACTORS_TEMP_XLPE : CORRECTION_FACTORS_TEMP_THW;
  const foundTemp = tempTable.factors.find((f) => f.tempC === ambientTemp);
  const ambientTempFactorCa = foundTemp ? foundTemp.factor : 1.0;

  // Grouping correction factor Cg lookup
  const foundGroup = CORRECTION_FACTORS_GROUPING.factors.find(
    (g) => groupingConductors >= g.conductorsMin && groupingConductors <= g.conductorsMax
  );
  const groupingFactorCg = foundGroup ? foundGroup.factor : 1.0;

  // Perform Cable Sizing
  const sizingResult: CableSizingResult = sizeCableAndBreaker({
    designCurrentIb,
    selectedBreakerIn: customBreakerIn,
    cableRecords: cables,
    cableType,
    ambientTempFactorCa,
    groupingFactorCg,
    phase,
  });

  const selectedCable = sizingResult.selectedCable;

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Layers className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                เลือกขนาดสายไฟตามมาตรฐาน วสท. 022001-22
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              คำนวณและตรวจสอบเงื่อนไขการประสานสัมพันธ์ทางวิศวกรรม: <code className="text-amber-300 font-mono font-semibold">Ib ≤ In ≤ Iz</code>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-mono">
              ตาราง วสท. 5-20 / 5-27 / 5-43
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid: Control Inputs vs Result Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="text-sm sm:text-base font-semibold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>พารามิเตอร์การออกแบบ (Design Parameters)</span>
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Design Current Ib */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                กระแสโหลดออกแบบ (Design Current: Ib)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={designCurrentIb}
                  onChange={(e) => setDesignCurrentIb(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-hidden focus:border-amber-500/50"
                  placeholder="เช่น 20 A"
                />
                <span className="absolute right-3.5 top-2 text-xs text-slate-500 font-bold">A</span>
              </div>
            </div>

            {/* System Phase */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ระบบไฟฟ้า (Phase)
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setPhase('1_PHASE')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    phase === '1_PHASE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  1 Phase (2 สาย)
                </button>
                <button
                  type="button"
                  onClick={() => setPhase('3_PHASE')}
                  className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                    phase === '3_PHASE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  3 Phase (3 สาย)
                </button>
              </div>
            </div>

            {/* Cable Type */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">
                ชนิดสายไฟฟ้า (Cable Type / Insulation)
              </label>
              <select
                value={cableType}
                onChange={(e) => setCableType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                {availableCableTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Ambient Temperature Ca */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Thermometer className="w-3.5 h-3.5 text-rose-400" />
                  <span>อุณหภูมิโดยรอบ (Ca)</span>
                </label>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {ambientTemp}°C (Ca = {ambientTempFactorCa})
                </span>
              </div>
              <select
                value={ambientTemp}
                onChange={(e) => setAmbientTemp(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                {tempTable.factors.map((t) => (
                  <option key={t.tempC} value={t.tempC}>
                    {t.tempC}°C {t.tempC === 40 ? '(เกณฑ์มาตรฐานไทยปกติ 40°C)' : ''} ➔ Ca = {t.factor}
                  </option>
                ))}
              </select>
            </div>

            {/* Grouping Factor Cg */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1">
                  <Users className="w-3.5 h-3.5 text-blue-400" />
                  <span>จำนวนสายในกลุ่ม (Cg)</span>
                </label>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  Cg = {groupingFactorCg}
                </span>
              </div>
              <select
                value={groupingConductors}
                onChange={(e) => setGroupingConductors(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                <option value={1}>1-3 เส้นนำกระแสในท่อ (Cg = 1.00)</option>
                <option value={4}>4-6 เส้นนำกระแสในท่อ (Cg = 0.80)</option>
                <option value={7}>7-9 เส้นนำกระแสในท่อ (Cg = 0.70)</option>
                <option value={10}>10-12 เส้นนำกระแสในท่อ (Cg = 0.50)</option>
                <option value={16}>13-16 เส้นนำกระแสในท่อ (Cg = 0.45)</option>
                <option value={20}>20 เส้นขึ้นไป (Cg = 0.40)</option>
              </select>
            </div>

            {/* Circuit Breaker In Selection */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-300">
                  พิกัดเบรกเกอร์ (Circuit Breaker: In)
                </label>
                <span className="text-[11px] text-slate-400">
                  แนะนำอัตโนมัติหรือเลือกด้วยตนเอง
                </span>
              </div>
              <select
                value={customBreakerIn !== undefined ? customBreakerIn : sizingResult.selectedBreakerRating}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  setCustomBreakerIn(val);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-amber-300 font-mono font-bold focus:outline-hidden focus:border-amber-500/50 cursor-pointer"
              >
                {CANDIDATE_BREAKER_RATINGS.map((r) => (
                  <option key={r} value={r}>
                    {r} A {r === sizingResult.selectedBreakerRating ? '(แนะนำโดยระบบ)' : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Output Card (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                ผลการเลือกขนาดสายไฟ (Recommended Sizing)
              </span>
              <StatusBadge status={sizingResult.status} size="sm" />
            </div>

            {selectedCable ? (
              <div className="space-y-5 mt-5">
                {/* Main Recommended Cable Box */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/40 text-center space-y-1 shadow-inner">
                  <p className="text-xs font-medium text-slate-400">
                    ขนาดสายไฟที่แนะนำ (Recommended Cable Size)
                  </p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono tracking-tight">
                      {selectedCable.sizeMm2}
                    </span>
                    <span className="text-xl font-bold text-slate-300">mm²</span>
                  </div>
                  <p className="text-xs text-amber-300 font-mono font-semibold">
                    {selectedCable.cableType}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {selectedCable.referenceNote}
                  </p>
                </div>

                {/* Triple Check Comparison Metric */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                    <span>การตรวจสอบเงื่อนไขความปลอดภัย:</span>
                    <span className="text-[10px] font-mono text-emerald-400">Ib ≤ In ≤ Iz</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center font-mono">
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">โหลด Ib</span>
                      <span className="text-amber-400 font-bold text-sm">{designCurrentIb} A</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">เบรกเกอร์ In</span>
                      <span className="text-indigo-400 font-bold text-sm">{sizingResult.selectedBreakerRating} A</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block font-sans">พิกัดสาย Iz</span>
                      <span className="text-emerald-400 font-bold text-sm">{sizingResult.correctedAmpacityIz} A</span>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 space-y-1 pt-1 border-t border-slate-900">
                    <p className="flex justify-between">
                      <span>พิกัดกระแสในตาราง (Iz_table):</span>
                      <span className="font-mono text-slate-200">{sizingResult.baseTableAmpacity} A</span>
                    </p>
                    <p className="flex justify-between">
                      <span>ตัวคูณปรับแก้รวม (Ca × Cg):</span>
                      <span className="font-mono text-cyan-300">{sizingResult.totalCorrectionFactor}</span>
                    </p>
                  </div>
                </div>

                {/* Source Verification Badge */}
                <div className="flex items-center justify-between text-xs p-2.5 rounded-lg bg-slate-950 border border-slate-800">
                  <span className="text-slate-400">สถานะข้อมูลมาตรฐาน:</span>
                  <SourceStatusBadge status={selectedCable.sourceStatus} />
                </div>
              </div>
            ) : (
              <div className="p-5 mt-4 rounded-xl bg-rose-950/30 border border-rose-800/50 text-rose-300 text-xs space-y-2">
                <div className="flex items-center gap-2 font-semibold">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{sizingResult.statusMessage}</span>
                </div>
                <p className="text-[11px] text-rose-400/80">
                  กรุณาตรวจสอบว่ามีค่ากระแสโหลดเกินพิกัดสายเดี่ยวหรือไม่ หรือลองเปลี่ยนชนิดสายเป็น XLPE หรือพิจารณาใช้สายควบ
                </p>
              </div>
            )}
          </div>

         {/* Forward Actions */}
{selectedCable && (
  <div className="pt-4 border-t border-slate-800 space-y-2">
    <button
      onClick={() => {
        onSizingCalculated(
          sizingResult.selectedBreakerRating,
          sizingResult.correctedAmpacityIz,
          selectedCable
        );

        onForwardToVoltageDrop(
          designCurrentIb,
          selectedCable,
          phase
        );
      }}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer"
    >
      <Activity className="w-4 h-4" />
      <span>
        นำสายไฟขนาด {selectedCable.sizeMm2} mm² ไปคำนวณ Voltage Drop
      </span>
    </button>

    <button
      onClick={() => {
        onSizingCalculated(
          sizingResult.selectedBreakerRating,
          sizingResult.correctedAmpacityIz,
          selectedCable
        );

        onForwardToConduitSizing(
          selectedCable,
          phase
        );
      }}
      className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs sm:text-sm transition-all border border-slate-700 cursor-pointer"
    >
      <Cylinder className="w-4 h-4 text-amber-400" />
      <span>
        ส่งไปคำนวณขนาดท่อร้อยสาย (Conduit Sizing)
      </span>
    </button>
  </div>
)}
</div>
</div>
      {/* Candidate Comparison Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm sm:text-base font-semibold text-slate-200">
            ตารางเปรียบเทียบขนาดสายในมาตรฐาน (Candidate Size Verification)
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {sizingResult.candidatesTested.length} รายการ
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="px-4 py-2.5">ขนาดสาย (mm²)</th>
                <th className="px-4 py-2.5">Ampacity ตาราง</th>
                <th className="px-4 py-2.5">Ampacity ปรับแก้ (Iz)</th>
                <th className="px-4 py-2.5">เงื่อนไข Ib ≤ Iz</th>
                <th className="px-4 py-2.5">เงื่อนไข In ≤ Iz</th>
                <th className="px-4 py-2.5">สถานะมาตรฐาน</th>
                <th className="px-4 py-2.5 text-center">ผลการเลือก</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {sizingResult.candidatesTested.map((c) => {
                const isSelected = selectedCable?.sizeMm2 === c.sizeMm2;
                return (
                  <tr
                    key={c.sizeMm2}
                    className={`transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 text-amber-300 font-semibold'
                        : 'hover:bg-slate-950 text-slate-300'
                    }`}
                  >
                    <td className="px-4 py-3 font-bold">{c.sizeMm2} mm²</td>
                    <td className="px-4 py-3">{c.baseAmpacity !== null ? `${c.baseAmpacity} A` : '-'}</td>
                    <td className="px-4 py-3 text-cyan-300 font-bold">{c.correctedAmpacity} A</td>
                    <td className="px-4 py-3">
                      {c.passedIb ? (
                        <span className="text-emerald-400 font-bold">✓ ผ่าน ({designCurrentIb}A ≤ {c.correctedAmpacity}A)</span>
                      ) : (
                        <span className="text-rose-400">✗ ไม่ผ่าน</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      {c.passedIn ? (
                        <span className="text-emerald-400 font-bold">✓ ผ่าน ({sizingResult.selectedBreakerRating}A ≤ {c.correctedAmpacity}A)</span>
                      ) : (
                        <span className="text-rose-400">✗ ไม่ผ่าน</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <SourceStatusBadge status={c.sourceStatus as any} size="sm" />
                    </td>
                    <td className="px-4 py-3 text-center">
                      {isSelected ? (
                        <span className="px-2.5 py-1 rounded-full bg-amber-500 text-slate-950 font-sans font-bold text-[11px]">
                          แนะนำ (Selected)
                        </span>
                      ) : c.passedIb && c.passedIn ? (
                        <span className="text-slate-400 text-[11px]">ผ่าน (ขนาดใหญ่กว่า)</span>
                      ) : (
                        <span className="text-slate-500 text-[11px]">-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engineering Calculation Trace Card */}
      <CalculationTraceCard
        trace={sizingResult.trace}
        title="ขั้นตอนการคำนวณและตรวจสอบขนาดสาย (Trace: Cable Sizing)"
        onAskAi={onAskAi}
      />
    </div>
  );
};
