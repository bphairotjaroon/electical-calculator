import React, { useState } from 'react';
import { calculateConduitFill, ConduitFillResult } from '../services/calculationEngine';
import { CableRecord, CalculationTrace, ConduitRecord, PhaseType } from '../types';
import { CONDUIT_FILL_LIMITS } from '../data/standardsData';
import { CalculationTraceCard } from '../components/CalculationTraceCard';
import { StatusBadge, SourceStatusBadge } from '../components/StatusBadge';
import { 
  Cylinder, 
  Plus, 
  Trash2, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

interface SelectedCableItem {
  id: string;
  cableSizeMm2: number;
  quantity: number;
}

interface ConduitSizingPageProps {
  initialCable?: CableRecord | null;
  initialPhase?: PhaseType;
  cables: CableRecord[];
  conduits: ConduitRecord[];
  onAskAi: (trace: CalculationTrace) => void;
}

export const ConduitSizingPage: React.FC<ConduitSizingPageProps> = ({
  initialCable = null,
  initialPhase = '1_PHASE',
  cables,
  conduits,
  onAskAi,
}) => {
  // Cable list inside conduit
  const defaultSize = initialCable?.sizeMm2 || 2.5;
  const defaultQty = initialPhase === '1_PHASE' ? 2 : 3;

  const [cableList, setCableList] = useState<SelectedCableItem[]>([
    { id: '1', cableSizeMm2: defaultSize, quantity: defaultQty },
    { id: '2', cableSizeMm2: 2.5, quantity: 1 }, // Ground wire
  ]);

  // Selected conduit type & size
  const [conduitType, setConduitType] = useState<string>('EMT');
  const availableConduitsOfType = conduits.filter((c) => c.type === conduitType);

  const [selectedConduitId, setSelectedConduitId] = useState<string>(
    availableConduitsOfType[0]?.id || conduits[0]?.id || ''
  );

  const activeConduit =
    conduits.find((c) => c.id === selectedConduitId) ||
    availableConduitsOfType[0] ||
    conduits[0];

  // Helper to add cable row
  const handleAddCableRow = () => {
    setCableList([
      ...cableList,
      { id: Date.now().toString(), cableSizeMm2: 2.5, quantity: 1 },
    ]);
  };

  // Helper to update cable row
  const handleUpdateCableRow = (id: string, field: 'cableSizeMm2' | 'quantity', value: number) => {
    setCableList(
      cableList.map((item) => (item.id === id ? { ...item, [field]: value } : item))
    );
  };

  // Helper to remove cable row
  const handleRemoveCableRow = (id: string) => {
    if (cableList.length <= 1) return;
    setCableList(cableList.filter((item) => item.id !== id));
  };

  // Map user selections to Calculation Engine input
  const calculationCables = cableList.map((item) => {
    const record = cables.find((c) => c.sizeMm2 === item.cableSizeMm2) || cables[0];
    return {
      cableRecord: record,
      quantity: item.quantity,
    };
  });

  // Calculate Conduit Fill
  const fillResult: ConduitFillResult = calculateConduitFill({
    cables: calculationCables,
    conduit: activeConduit,
  });

  // Find minimum passing conduit among current type
  const minimumPassingConduit = availableConduitsOfType.find((c) => {
    const test = calculateConduitFill({ cables: calculationCables, conduit: c });
    return test.status === 'PASS';
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Cylinder className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                คำนวณขนาดท่อร้อยสายไฟฟ้า (Conduit Sizing & Fill Rate)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              ตรวจสอบการใช้พื้นที่หน้าตัดภายในท่อตามมาตรฐาน {CONDUIT_FILL_LIMITS.standard} {CONDUIT_FILL_LIMITS.referenceTable} ({CONDUIT_FILL_LIMITS.limits.map((l) => `${l.note} ≤ ${l.allowablePercent}%`).join(', ')})
            </p>
          </div>

          <StatusBadge status={fillResult.status} size="md" />
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Cable Mix & Conduit Selection (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          {/* Section 1: Cables in Conduit */}
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm sm:text-base font-semibold text-slate-200">
                รายการสายไฟภายในท่อ (Cables in Conduit)
              </h3>
              <button
                onClick={handleAddCableRow}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-semibold transition-colors cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>เพิ่มกลุ่มสาย</span>
              </button>
            </div>

            <div className="mt-4 space-y-3">
              {cableList.map((item, index) => {
                const cbl = cables.find((c) => c.sizeMm2 === item.cableSizeMm2) || cables[0];
                const rowArea = cbl.approxAreaMm2 * item.quantity;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-wrap sm:flex-nowrap items-center gap-3"
                  >
                    <div className="flex-1 min-w-[140px]">
                      <label className="text-[11px] text-slate-400 block mb-1">ขนาดสายไฟ</label>
                      <select
                        value={item.cableSizeMm2}
                        onChange={(e) =>
                          handleUpdateCableRow(item.id, 'cableSizeMm2', Number(e.target.value))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono cursor-pointer"
                      >
                        {Array.from(new Set(cables.map((c) => c.sizeMm2)))
                          .sort((a: number, b: number) => a - b)
                          .map((sz) => (
                            <option key={sz} value={sz}>
                              {sz} mm² (~{(cables.find((c) => c.sizeMm2 === sz)?.approxAreaMm2 || 0).toFixed(1)} mm²/เส้น)
                            </option>
                          ))}
                      </select>
                    </div>

                    <div className="w-24">
                      <label className="text-[11px] text-slate-400 block mb-1">จำนวน (เส้น)</label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={item.quantity}
                        onChange={(e) =>
                          handleUpdateCableRow(item.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))
                        }
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-200 font-mono text-center"
                      />
                    </div>

                    <div className="w-32 text-right">
                      <span className="text-[11px] text-slate-400 block">พท. รวมกลุ่มนี้</span>
                      <span className="text-xs font-mono font-bold text-amber-300">
                        {rowArea.toFixed(1)} mm²
                      </span>
                    </div>

                    <button
                      onClick={() => handleRemoveCableRow(item.id)}
                      disabled={cableList.length <= 1}
                      className="p-1.5 text-slate-500 hover:text-rose-400 rounded-lg transition-colors cursor-pointer disabled:opacity-30"
                      title="ลบแถวนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 2: Conduit Selection */}
          <div className="pt-2 border-t border-slate-800 space-y-4">
            <h3 className="text-sm sm:text-base font-semibold text-slate-200">
              เลือกชนิดและขนาดท่อร้อยสาย (Conduit Selection)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Conduit Type */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ชนิดท่อร้อยสาย (Conduit Type)
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {['EMT', 'IMC', 'RSC', 'PVC'].map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => {
                        setConduitType(type);
                        const firstOfType = conduits.find((c) => c.type === type);
                        if (firstOfType) setSelectedConduitId(firstOfType.id);
                      }}
                      className={`py-2 px-1 text-center rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        conduitType === type
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>
              </div>

              {/* Conduit Size */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  ขนาดท่อระบุ (Nominal Conduit Size)
                </label>
                <select
                  value={selectedConduitId}
                  onChange={(e) => setSelectedConduitId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 font-mono cursor-pointer"
                >
                  {availableConduitsOfType.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nominalSizeInch} ({c.nominalSizeMm} mm) - พท.ภายใน {c.internalAreaMm2.toFixed(1)} mm²
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right Output: Fill Gauge & Recommendation (5 cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                อัตราการใช้พื้นที่ภายในท่อ (Conduit Fill Rate)
              </span>
              <StatusBadge status={fillResult.status} size="sm" />
            </div>

            <div className="space-y-5 mt-5">
              {/* Primary Fill Rate Box */}
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 text-center space-y-2 shadow-inner">
                <p className="text-xs font-medium text-slate-400">
                  อัตราร้อยสายจริง (Calculated Conduit Fill)
                </p>
                <div className="flex items-baseline justify-center gap-1.5">
                  <span
                    className={`text-4xl sm:text-5xl font-extrabold font-mono tracking-tight ${
                      fillResult.status === 'PASS' ? 'text-emerald-400' : 'text-rose-400'
                    }`}
                  >
                    {fillResult.fillPercentage.toFixed(1)}
                  </span>
                  <span className="text-2xl font-bold text-slate-300">%</span>
                </div>
                <p className="text-xs text-slate-400">
                  เกณฑ์สูงสุดที่อนุญาต (วสท. ตาราง 5-3):{' '}
                  <strong className="text-cyan-300 font-mono font-bold">
                    {fillResult.maxAllowedPercentage}%
                  </strong>{' '}
                  (สำหรับสาย {fillResult.totalConductors} เส้น)
                </p>
              </div>

              {/* Graphical Progress Fill Bar */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between items-center text-slate-400">
                  <span>ความจุพื้นที่ภายในท่อ:</span>
                  <span className="font-mono text-slate-200">
                    {fillResult.totalCableAreaMm2} / {fillResult.conduitInternalAreaMm2} mm²
                  </span>
                </div>

                <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      fillResult.status === 'PASS' ? 'bg-emerald-400' : 'bg-rose-500'
                    }`}
                    style={{
                      width: `${Math.min(100, (fillResult.fillPercentage / fillResult.maxAllowedPercentage) * 100)}%`,
                    }}
                  />
                </div>

                <div className="text-[11px] text-slate-300 pt-1 leading-relaxed">
                  {fillResult.statusMessage}
                </div>
              </div>

              {/* Minimum Passing Size Recommendation */}
              {fillResult.status !== 'PASS' && minimumPassingConduit && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-amber-300">
                    <CheckCircle2 className="w-4 h-4 text-amber-400" />
                    <span>ขนาดท่อเล็กที่สุดที่ผ่านเกณฑ์ (Minimum Passing Size):</span>
                  </div>
                  <p className="text-slate-200">
                    แนะนำให้ใช้ท่อ <strong className="text-amber-300 font-mono">{minimumPassingConduit.type} {minimumPassingConduit.nominalSizeInch}</strong> ({minimumPassingConduit.nominalSizeMm} mm)
                  </p>
                  <button
                    onClick={() => setSelectedConduitId(minimumPassingConduit.id)}
                    className="mt-2 inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 underline cursor-pointer"
                  >
                    <span>คลิกเพื่อปรับใช้ขนาดท่อนี้ทันที</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="text-[11px] text-slate-500">
            * เกณฑ์ วสท. ตารางที่ 5-3 คำนวณเพื่อป้องกันความเสียหายของฉนวนขณะดึงสาย และช่วยระบายความร้อน
          </div>
        </div>
      </div>

      {/* Engineering Calculation Trace Card */}
      <CalculationTraceCard
        trace={fillResult.trace}
        title="ขั้นตอนการคำนวณการใช้พื้นที่ท่อร้อยสาย (Trace: Conduit Fill)"
        onAskAi={onAskAi}
      />
    </div>
  );
};
