import React, { useState } from 'react';
import { calculateConduitFill, calculateFinalEngineeringStatus } from '../services/calculationEngine';
import { CableRecord, CalculationTrace, ConduitRecord } from '../types';
import { CalculationTraceCard } from '../components/CalculationTraceCard';
import { StatusBadge } from '../components/StatusBadge';
import { CornerDownRight, AlertTriangle, CheckCircle2, Info, ShieldAlert } from 'lucide-react';

interface FlexibleConduitPageProps {
  cables: CableRecord[];
  conduits: ConduitRecord[];
  onAskAi: (trace: CalculationTrace) => void;
}

export const FlexibleConduitPage: React.FC<FlexibleConduitPageProps> = ({
  cables,
  conduits,
  onAskAi,
}) => {
  const [cableSizeMm2, setCableSizeMm2] = useState<number>(2.5);
  const [cableQuantity, setCableQuantity] = useState<number>(3);
  const [hasGroundConductor, setHasGroundConductor] = useState<boolean>(true);
  const [groundSizeMm2, setGroundSizeMm2] = useState<number>(2.5);
  const [conduitLengthMeters, setConduitLengthMeters] = useState<number>(1.5);

  // Filter flexible or small EMT/IMC conduit sizes suitable for FMC
  const flexConduitSizes = conduits.filter((c) => c.type === 'EMT' || c.type === 'IMC');
  const [selectedConduitId, setSelectedConduitId] = useState<string>(flexConduitSizes[0]?.id || conduits[0]?.id);

  const activeConduit = conduits.find((c) => c.id === selectedConduitId) || flexConduitSizes[0] || conduits[0];

  // Standard checks:
  // 1. Length constraint: EIT allows max 1.5m - 2.0m for FMC connection to equipment/fixtures
  const isLengthCompliant = conduitLengthMeters <= 2.0;

  // 2. Grounding wire constraint: EIT mandates separate equipment grounding conductor inside flexible conduit
  const isGroundingCompliant = hasGroundConductor;

  // 3. Fill rate
  const phaseCable = cables.find((c) => c.sizeMm2 === cableSizeMm2) || cables[0];
  const gndCable = cables.find((c) => c.sizeMm2 === groundSizeMm2) || cables[0];

  const calcCables = [
    { cableRecord: phaseCable, quantity: cableQuantity },
    ...(hasGroundConductor ? [{ cableRecord: gndCable, quantity: 1 }] : []),
  ];

  const fillResult = calculateConduitFill({
    cables: calcCables,
    conduit: activeConduit,
  });

  const overallPass = fillResult.status === 'PASS' && isLengthCompliant && isGroundingCompliant;
  const conduitStageStatus = overallPass ? 'PASS' : 'FAIL';

  // Final engineering status MUST be derived strictly from calculateFinalEngineeringStatus()
  const finalEngineeringStatus = calculateFinalEngineeringStatus({
    cableStatus: 'PASS',
    breakerStatus: 'NOT CHECKED',
    voltageDropStatus: 'NOT CHECKED',
    conduitStatus: conduitStageStatus,
    cableVoltageRatingStatus: 'REVIEW REQUIRED',
    standardDataStatuses: activeConduit ? [activeConduit.sourceStatus] : [],
  });

  const trace: CalculationTrace = {
    input: {
      'ชนิดท่อร้อยสาย': `ท่อโลหะอ่อน (FMC) ขนาด ${activeConduit.nominalSizeInch}`,
      'ความยาวท่อ (Length)': `${conduitLengthMeters} เมตร`,
      'สายนำกระแส': `${cableSizeMm2} mm² (${cableQuantity} เส้น)`,
      'สายดินแยก (EGC)': hasGroundConductor ? `มี (${groundSizeMm2} mm²)` : 'ไม่มี (ผิดข้อกำหนด วสท.)',
      'อัตราร้อยสาย (Fill Rate)': `${fillResult.fillPercentage}% (สูงสุด ${fillResult.maxAllowedPercentage}%)`,
    },
    formula: 'FMC Rules: Length ≤ 2.0 m, Separate Ground Wire = REQUIRED, Fill% ≤ Limit',
    substitution: `Length (${conduitLengthMeters}m ≤ 2.0m) + Ground (${hasGroundConductor ? 'YES' : 'NO'}) + Fill (${fillResult.fillPercentage}% ≤ ${fillResult.maxAllowedPercentage}%)`,
    result: overallPass ? 'ผ่านเกณฑ์มาตรฐานท่ออ่อน วสท.' : 'ไม่ผ่านเกณฑ์มาตรฐานท่ออ่อน',
    standardCheck: 'วสท. 022001-22 ข้อกำหนดการติดตั้งท่อโลหะอ่อน (Flexible Metallic Conduit)',
    standardReference: {
      standard: 'วสท. 022001-22',
      chapter: 'บทที่ 5 การเดินสายและวัสดุ',
      section: 'ข้อกำหนดการติดตั้งท่อโลหะอ่อน (Flexible Metallic Conduit)',
      complianceStatus: overallPass ? 'VERIFIED_COMPLIANT' : 'FAIL',
    },
    engineeringCheck: {
      cable: 'PASS',
      breaker: 'NOT CHECKED',
      voltageDrop: 'NOT CHECKED',
      conduit: conduitStageStatus,
    },
    finalStatus: finalEngineeringStatus,
    notes: [
      isLengthCompliant
        ? '✓ ความยาวไม่เกิน 2.0 เมตร ตามเกณฑ์ต่อเข้าเครื่องจักร/อุปกรณ์'
        : '✗ คำเตือน: ความยาวเกิน 2.0 เมตร (ไม่อนุญาตให้ใช้ท่ออ่อนเป็นท่อเดินถาวรระยะยาว)',
      isGroundingCompliant
        ? '✓ มีสายดินแยกเฉพาะภายในท่ออ่อนเพื่อความปลอดภัยทางไฟฟ้า'
        : '✗ ผิดมาตรฐาน: ต้องเดินสายดิน (Grounding Conductor) แยกภายในท่อโลหะอ่อนเสมอ',
      `ผลการใช้พื้นที่ภายในท่อ: ${fillResult.fillPercentage}% (${fillResult.statusMessage})`,
    ],
  };

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <CornerDownRight className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                คำนวณ Flexible Conduit (ท่อโลหะอ่อน)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              ตรวจสอบข้อกำหนดพิเศษของท่อโลหะอ่อนตามมาตรฐาน วสท. 022001-22: ความยาวสูงสุด, สายดินภายในท่อ, และอัตราร้อยสาย
            </p>
          </div>

          <StatusBadge status={overallPass ? 'PASS' : 'FAIL'} size="md" />
        </div>
      </div>

      {/* Grid: Inputs vs Compliance Checklist */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Inputs (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <h3 className="text-sm sm:text-base font-semibold text-slate-200 pb-2 border-b border-slate-800">
            พารามิเตอร์การติดตั้งท่ออ่อน (FMC Installation)
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Length */}
            <div className="space-y-1.5 sm:col-span-2">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-300">
                  ความยาวท่อโลหะอ่อน (Length in meters)
                </span>
                <span
                  className={`font-mono font-bold ${
                    isLengthCompliant ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {conduitLengthMeters} ม. ({isLengthCompliant ? '≤ 2.0ม. ผ่าน' : 'เกิน 2.0ม. ไม่ผ่าน'})
                </span>
              </div>
              <input
                type="number"
                min="0.3"
                max="10.0"
                step="0.1"
                value={conduitLengthMeters}
                onChange={(e) => setConduitLengthMeters(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 font-mono focus:outline-hidden focus:border-amber-500/50"
              />
              <p className="text-[11px] text-slate-500">
                ตาม วสท. อนุญาตให้ใช้ท่อโลหะอ่อนสำหรับต่อเข้าเครื่องจักรหรือโคมไฟที่มีการสั่นสะเทือน ความยาวไม่เกิน 1.5 - 2.0 เมตร
              </p>
            </div>

            {/* Cable Size */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ขนาดสายไฟวงจรย่อย
              </label>
              <select
                value={cableSizeMm2}
                onChange={(e) => setCableSizeMm2(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 font-mono cursor-pointer"
              >
                {Array.from(new Set(cables.map((c) => c.sizeMm2)))
                  .sort((a: number, b: number) => a - b)
                  .map((sz) => (
                    <option key={sz} value={sz}>
                      {sz} mm²
                    </option>
                  ))}
              </select>
            </div>

            {/* Cable Quantity */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                จำนวนสายนำกระแส (เส้น)
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={cableQuantity}
                onChange={(e) => setCableQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 font-mono text-center"
              />
            </div>

            {/* Grounding Conductor Toggle */}
            <div className="space-y-1.5 sm:col-span-2 p-3.5 rounded-xl bg-slate-950 border border-slate-800">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasGroundConductor}
                  onChange={(e) => setHasGroundConductor(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 accent-amber-500 cursor-pointer"
                />
                <span className="text-xs font-semibold text-slate-200">
                  มีสายต่อลงดินแยกเฉพาะ (Equipment Grounding Conductor) ภายในท่อ
                </span>
              </label>
              {!hasGroundConductor && (
                <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>
                    คำเตือน: วสท. 022001-22 กำหนดให้ต้องมีสายดินแยกในท่ออ่อนเสมอ ไม่ให้ใช้ท่ออ่อนเป็นตัวนำต่อลงดิน
                  </span>
                </div>
              )}
            </div>

            {/* Conduit Size Selection */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs font-semibold text-slate-300">
                ขนาดท่อโลหะอ่อน (FMC Size)
              </label>
              <select
                value={selectedConduitId}
                onChange={(e) => setSelectedConduitId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 font-mono cursor-pointer"
              >
                {flexConduitSizes.map((c) => (
                  <option key={c.id} value={c.id}>
                    ท่ออ่อน {c.nominalSizeInch} ({c.nominalSizeMm} mm)
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Compliance Checklist (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                การตรวจสอบข้อกำหนด วสท. (Compliance Checklist)
              </span>
              <StatusBadge status={overallPass ? 'PASS' : 'FAIL'} size="sm" />
            </div>

            <div className="space-y-4 mt-5">
              {/* Check 1: Length */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                {isLengthCompliant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    1. เกณฑ์ความยาวท่อ (≤ 2.0 เมตร)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    ปัจจุบัน: <strong className="text-amber-300 font-mono">{conduitLengthMeters} เมตร</strong>{' '}
                    {isLengthCompliant ? '(อยู่ในเกณฑ์)' : '(เกินเกณฑ์มาตรฐาน)'}
                  </p>
                </div>
              </div>

              {/* Check 2: Grounding */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                {isGroundingCompliant ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    2. ข้อกำหนดสายต่อลงดิน (Grounding Conductor)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isGroundingCompliant
                      ? 'มีสายดินแยกเฉพาะภายในท่อ ถูกต้องตามข้อกำหนด'
                      : 'ไม่อนุญาตให้ใช้ท่ออ่อนโดยไม่มีสายดินแยก'}
                  </p>
                </div>
              </div>

              {/* Check 3: Conduit Fill */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-start gap-3">
                {fillResult.status === 'PASS' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="text-xs font-bold text-slate-200 block">
                    3. การใช้พื้นที่ท่อร้อยสาย (Fill Rate ≤ {fillResult.maxAllowedPercentage}%)
                  </span>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    คำนวณได้: <strong className="text-amber-300 font-mono">{fillResult.fillPercentage}%</strong>{' '}
                    {fillResult.statusMessage}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            * การใช้ท่อโลหะอ่อนต้องใช้ Fitting ที่ได้รับการรับรอง มอก. หรือมาตรฐานที่เทียบเท่า และขันล็อกให้แน่นหนาเพื่อป้องกันน้ำและฝุ่น
          </div>
        </div>
      </div>

      {/* Trace Card */}
      <CalculationTraceCard
        trace={trace}
        title="ขั้นตอนการตรวจสอบท่อโลหะอ่อน (Trace: Flexible Conduit)"
        onAskAi={onAskAi}
      />
    </div>
  );
};
