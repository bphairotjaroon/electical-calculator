import React, { useState } from 'react';
import {
  calculateLoadCurrent,
  LoadCalculationResult,
} from '../services/calculationEngine';
import {
  CalculationTrace,
  CircuitType,
  DemandFactorMode,
  DemandFactorRecord,
  PhaseType,
  PowerUnit,
  VoltageSource,
} from '../types';
import { CalculationTraceCard } from '../components/CalculationTraceCard';
import {
  StatusBadge,
  SourceStatusBadge,
  MultiStageStatusBar,
} from '../components/StatusBadge';
import { INITIAL_DEMAND_FACTORS } from '../data/standardsData';
import {
  Zap,
  ArrowRight,
  RotateCcw,
  AlertCircle,
  AlertTriangle,
  BookOpen,
  Layers,
  Settings2,
  Info,
} from 'lucide-react';

interface LoadCalculatorPageProps {
  onForwardToCableSizing: (
    currentIb: number,
    phase: PhaseType,
    voltage?: number,
    voltageSource?: VoltageSource
  ) => void;
  onAskAi: (trace: CalculationTrace) => void;
}

type Preset = {
  label: string;
  power: number;
  unit: PowerUnit;
  phase: PhaseType;
  voltage: number;
  pf: number;
  circuit: CircuitType;
};

export const LoadCalculatorPage: React.FC<LoadCalculatorPageProps> = ({
  onForwardToCableSizing,
  onAskAi,
}) => {
  const [circuitType, setCircuitType] =
    useState<CircuitType>('BRANCH_CIRCUIT');

  const [power, setPower] = useState<number>(3.5);
  const [unit, setUnit] = useState<PowerUnit>('kW');
  const [phase, setPhase] = useState<PhaseType>('1_PHASE');

  const [voltageSource, setVoltageSource] =
    useState<VoltageSource>('PRESET');
  const [voltage, setVoltage] = useState<number>(220);
  const [customVoltageInput, setCustomVoltageInput] =
    useState<string>('220');

  const [powerFactor, setPowerFactor] = useState<number>(0.85);
  const [quantity, setQuantity] = useState<number>(1);

  const [demandMode, setDemandMode] =
    useState<DemandFactorMode>('NO_DEMAND_FACTOR');
  const [manualDemandFactor, setManualDemandFactor] =
    useState<number>(1.0);
  const [selectedDfId, setSelectedDfId] =
    useState<string>('df-3-1-res-1');

  const PRESETS: Preset[] = [
    {
      label: 'แอร์ 12,000 BTU (~1.1 kW, 1 เฟส)',
      power: 1.1,
      unit: 'kW',
      phase: '1_PHASE',
      voltage: 220,
      pf: 0.85,
      circuit: 'BRANCH_CIRCUIT',
    },
    {
      label: 'เครื่องทำน้ำอุ่น (3.5 kW, 1 เฟส)',
      power: 3.5,
      unit: 'kW',
      phase: '1_PHASE',
      voltage: 220,
      pf: 1.0,
      circuit: 'BRANCH_CIRCUIT',
    },
    {
      label: 'เตาอบไฟฟ้า (5 kW, 1 เฟส)',
      power: 5.0,
      unit: 'kW',
      phase: '1_PHASE',
      voltage: 220,
      pf: 1.0,
      circuit: 'BRANCH_CIRCUIT',
    },
    {
      label: 'มอเตอร์ปั๊มน้ำ 3 เฟส (7.5 kW, 400V)',
      power: 7.5,
      unit: 'kW',
      phase: '3_PHASE',
      voltage: 400,
      pf: 0.85,
      circuit: 'BRANCH_CIRCUIT',
    },
    {
      label: 'สายป้อนตู้ DB ย่อย 3 เฟส (30 kW, 400V)',
      power: 30,
      unit: 'kW',
      phase: '3_PHASE',
      voltage: 400,
      pf: 0.85,
      circuit: 'FEEDER',
    },
  ];

  const resetCalculator = () => {
    setCircuitType('BRANCH_CIRCUIT');
    setPower(3.5);
    setUnit('kW');
    setPhase('1_PHASE');
    setVoltageSource('PRESET');
    setVoltage(220);
    setCustomVoltageInput('220');
    setPowerFactor(0.85);
    setQuantity(1);
    setDemandMode('NO_DEMAND_FACTOR');
    setManualDemandFactor(1.0);
    setSelectedDfId('df-3-1-res-1');
  };

  const handleApplyPreset = (preset: Preset) => {
    setPower(preset.power);
    setUnit(preset.unit);
    setPhase(preset.phase);
    setVoltageSource('PRESET');
    setVoltage(preset.voltage);
    setCustomVoltageInput(String(preset.voltage));
    setPowerFactor(preset.pf);
    setCircuitType(preset.circuit);
  };

  const handlePhaseChange = (newPhase: PhaseType) => {
    setPhase(newPhase);

    if (voltageSource === 'PRESET') {
      const newVoltage = newPhase === '1_PHASE' ? 220 : 400;
      setVoltage(newVoltage);
      setCustomVoltageInput(String(newVoltage));
    }
  };

  const handleSelectPresetVoltage = (newVoltage: number) => {
    setVoltageSource('PRESET');
    setVoltage(newVoltage);
    setCustomVoltageInput(String(newVoltage));
  };

  const handleSelectCustomVoltageMode = () => {
    setVoltageSource('USER_DEFINED');

    const parsed = Number.parseFloat(customVoltageInput);

    if (Number.isFinite(parsed) && parsed > 0) {
      setVoltage(parsed);
    }
  };

  const handleCustomVoltageChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const rawValue = event.target.value;

    setCustomVoltageInput(rawValue);

    const parsed = Number.parseFloat(rawValue);

    if (Number.isFinite(parsed)) {
      setVoltage(parsed);
    } else {
      setVoltage(0);
    }
  };

  const selectedDfRecord: DemandFactorRecord | undefined =
    INITIAL_DEMAND_FACTORS.find(
      (df) => df.id === selectedDfId
    );

  let effectiveDemandFactor = 1.0;

  if (demandMode === 'NO_DEMAND_FACTOR') {
    effectiveDemandFactor = 1.0;
  } else if (demandMode === 'MANUAL') {
    effectiveDemandFactor = manualDemandFactor;
  } else if (
    demandMode === 'STANDARD_TABLE' &&
    selectedDfRecord
  ) {
    effectiveDemandFactor = selectedDfRecord.factor;
  }

  const calcResult: LoadCalculationResult = calculateLoadCurrent({
    power,
    unit,
    voltage,
    voltageSource,
    phase,
    powerFactor,
    quantity,
    demandFactor: effectiveDemandFactor,
    circuitType,
    demandFactorMode: demandMode,
    demandFactorRecord: selectedDfRecord || null,
  });

  const circuitLabel =
    circuitType === 'BRANCH_CIRCUIT'
      ? 'วงจรย่อย (Branch Circuit)'
      : 'สายป้อน (Feeder)';

  const phaseLabel =
    phase === '1_PHASE' ? '1 เฟส 2W' : '3 เฟส 4W';

  return (
    <div className="space-y-6">
      {/* Header */}
      <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="w-5 h-5" aria-hidden="true" />
              </span>

              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                คำนวณกระแสโหลด
              </h2>
            </div>

            <p className="text-xs text-slate-400">
              Load Current Calculation Engine — คำนวณกระแสออกแบบ Ib
              ตามข้อมูลระบบไฟฟ้าที่กำหนด
            </p>
          </div>

          <button
            type="button"
            onClick={resetCalculator}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
            <span>รีเซ็ตค่า</span>
          </button>
        </div>

        {/* Presets */}
        <div className="mt-5 pt-4 border-t border-slate-800">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-3.5 h-3.5 text-amber-400" aria-hidden="true" />
            <span className="text-xs font-semibold text-slate-300">
              โหลดตัวอย่างที่ใช้บ่อย
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 hover:border-amber-500/50 hover:text-amber-300 text-slate-400 text-[11px] transition-colors cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Main calculator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Input */}
        <section className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="space-y-5">
            {/* Circuit type */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers
                  className="w-3.5 h-3.5 text-amber-400"
                  aria-hidden="true"
                />
                ประเภทวงจร (Circuit Classification)
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCircuitType('BRANCH_CIRCUIT')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    circuitType === 'BRANCH_CIRCUIT'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  วงจรย่อย
                  <span className="block text-[10px] opacity-70 mt-0.5">
                    Branch Circuit
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setCircuitType('FEEDER')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    circuitType === 'FEEDER'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  สายป้อน
                  <span className="block text-[10px] opacity-70 mt-0.5">
                    Feeder
                  </span>
                </button>
              </div>
            </div>

            {/* Phase */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                ระบบไฟฟ้า (Phase)
              </label>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => handlePhaseChange('1_PHASE')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    phase === '1_PHASE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  1 เฟส
                  <span className="block text-[10px] opacity-70 mt-0.5">
                    1 Phase
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => handlePhaseChange('3_PHASE')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    phase === '3_PHASE'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  3 เฟส
                  <span className="block text-[10px] opacity-70 mt-0.5">
                    3 Phase
                  </span>
                </button>
              </div>
            </div>

            {/* Voltage */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300">
                  แรงดันไฟฟ้า (Voltage)
                </label>

                <SourceStatusBadge
                  status={
                    voltageSource === 'USER_DEFINED'
                      ? 'USER_DEFINED_DATA'
                      : 'VERIFIED_STANDARD_DATA'
                  }
                  size="sm"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[220, 230, 400].map((presetVoltage) => (
                  <button
                    key={presetVoltage}
                    type="button"
                    onClick={() =>
                      handleSelectPresetVoltage(presetVoltage)
                    }
                    className={`py-2 rounded-lg text-xs font-mono border cursor-pointer transition-colors ${
                      voltageSource === 'PRESET' &&
                      voltage === presetVoltage
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    {presetVoltage} V
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={customVoltageInput}
                  onChange={handleCustomVoltageChange}
                  onFocus={handleSelectCustomVoltageMode}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-hidden focus:border-cyan-500/50"
                  aria-label="แรงดันไฟฟ้าแบบกำหนดเอง"
                />

                <button
                  type="button"
                  onClick={handleSelectCustomVoltageMode}
                  className={`px-3 rounded-xl border text-xs cursor-pointer ${
                    voltageSource === 'USER_DEFINED'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  Custom
                </button>
              </div>

              {voltage <= 0 && (
                <div className="flex items-center gap-2 text-xs text-rose-300">
                  <AlertCircle
                    className="w-3.5 h-3.5"
                    aria-hidden="true"
                  />
                  กรุณาระบุแรงดันมากกว่า 0 V
                </div>
              )}

              {voltage > 1000 && (
                <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-700/50 text-amber-300 text-xs flex items-start gap-2">
                  <AlertTriangle
                    className="w-4 h-4 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    แรงดันที่ระบุสูงกว่า 1,000 V
                    กรุณาตรวจสอบว่าเป็นระบบแรงดันสูงและข้อมูลที่ใช้เหมาะสมกับงาน
                  </span>
                </div>
              )}
            </div>

            {/* Power */}
            <div className="space-y-2">
              <label className="text-xs font-semibold text-slate-300">
                กำลังไฟฟ้า (Power)
              </label>

              <div className="grid grid-cols-[1fr_auto] gap-2">
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={power}
                  onChange={(event) =>
                    setPower(
                      Math.max(
                        0,
                        Number.parseFloat(event.target.value) || 0
                      )
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 font-mono focus:outline-hidden focus:border-amber-500/50"
                />

                <select
                  value={unit}
                  onChange={(event) =>
                    setUnit(event.target.value as PowerUnit)
                  }
                  className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-300 cursor-pointer"
                >
                  <option value="kW">kW</option>
                  <option value="W">W</option>
                </select>
              </div>
            </div>

            {/* Power factor and quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-semibold text-slate-300">
                    Power Factor (cos φ)
                  </label>

                  <span className="text-xs font-mono text-amber-400 font-bold">
                    {powerFactor.toFixed(2)}
                  </span>
                </div>

                <input
                  type="range"
                  min="0.5"
                  max="1"
                  step="0.01"
                  value={powerFactor}
                  onChange={(event) =>
                    setPowerFactor(Number(event.target.value))
                  }
                  className="w-full accent-amber-500 cursor-pointer"
                />

                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.5</span>
                  <span>0.85</span>
                  <span>1.0</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  จำนวนชุดโหลด (Quantity)
                </label>

                <input
                  type="number"
                  min="1"
                  max="100"
                  value={quantity}
                  onChange={(event) =>
                    setQuantity(
                      Math.min(
                        100,
                        Math.max(
                          1,
                          Number.parseInt(event.target.value, 10) || 1
                        )
                      )
                    )
                  }
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-sm text-slate-200 focus:outline-hidden focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* Demand factor */}
            <div className="pt-4 border-t border-slate-800/80 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Settings2
                    className="w-3.5 h-3.5 text-cyan-400"
                    aria-hidden="true"
                  />
                  โหมดดีมานด์แฟกเตอร์ (Demand Factor Mode)
                </label>

                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {(effectiveDemandFactor * 100).toFixed(0)}%
                  {' '}
                  (DF = {effectiveDemandFactor.toFixed(2)})
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setDemandMode('NO_DEMAND_FACTOR')
                  }
                  className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    demandMode === 'NO_DEMAND_FACTOR'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  1. ไม่คิด DF
                  <span className="block text-[10px] opacity-70 mt-0.5">
                    100%
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDemandMode('STANDARD_TABLE')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    demandMode === 'STANDARD_TABLE'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  2. ตารางมาตรฐาน
                  <span className="block text-[10px] opacity-70 mt-0.5">
                    วสท.
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setDemandMode('MANUAL')}
                  className={`py-2 px-2 rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    demandMode === 'MANUAL'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  3. กำหนดเอง
                  <span className="block text-[10px] opacity-70 mt-0.5">
                    Manual
                  </span>
                </button>
              </div>

              {demandMode === 'NO_DEMAND_FACTOR' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                  <Info
                    className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>
                    คิดโหลดเต็ม 100% (DF = 1.0)
                    เหมาะสำหรับการคำนวณวงจรย่อยเมื่อยังไม่ได้กำหนด
                    Demand Factor เฉพาะของระบบ
                  </span>
                </div>
              )}

              {demandMode === 'STANDARD_TABLE' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      เลือกหมวดโหลดและตาราง Demand Factor
                    </label>

                    <select
                      value={selectedDfId}
                      onChange={(event) =>
                        setSelectedDfId(event.target.value)
                      }
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2.5 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                    >
                      <optgroup label="ตารางที่ 3-1">
                        {INITIAL_DEMAND_FACTORS
                          .filter(
                            (df) =>
                              df.referenceTable === 'ตารางที่ 3-1'
                          )
                          .map((df) => (
                            <option key={df.id} value={df.id}>
                              {df.buildingType} - {df.loadRange} ({df.unit})
                            </option>
                          ))}
                      </optgroup>

                      <optgroup label="ตารางที่ 3-2">
                        {INITIAL_DEMAND_FACTORS
                          .filter(
                            (df) =>
                              df.referenceTable === 'ตารางที่ 3-2'
                          )
                          .map((df) => (
                            <option key={df.id} value={df.id}>
                              {df.buildingType} - {df.loadRange} ({df.unit})
                            </option>
                          ))}
                      </optgroup>

                      <optgroup label="ตารางที่ 3-3">
                        {INITIAL_DEMAND_FACTORS
                          .filter(
                            (df) =>
                              df.referenceTable === 'ตารางที่ 3-3'
                          )
                          .map((df) => (
                            <option key={df.id} value={df.id}>
                              {df.buildingType} - {df.loadRange} ({df.unit})
                            </option>
                          ))}
                      </optgroup>
                    </select>
                  </div>

                  {selectedDfRecord && (
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <span className="font-semibold text-cyan-300">
                          {selectedDfRecord.referenceTable}
                          {' '}
                          ({selectedDfRecord.standard})
                        </span>

                        <SourceStatusBadge
                          status={selectedDfRecord.sourceStatus}
                          size="sm"
                        />
                      </div>

                      <p className="text-slate-300">
                        ประเภทอาคาร:{' '}
                        <span className="text-slate-100">
                          {selectedDfRecord.buildingType}
                        </span>
                      </p>

                      <p className="text-slate-400">
                        ขอบเขตโหลด:{' '}
                        {selectedDfRecord.loadRange}
                        {' → '}
                        <span className="text-amber-400 font-bold">
                          ตัวคูณ = {selectedDfRecord.factor}
                          {' '}
                          ({selectedDfRecord.unit})
                        </span>
                      </p>

                      <p className="text-[11px] text-slate-500">
                        คำอธิบาย: {selectedDfRecord.referenceNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {demandMode === 'MANUAL' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-300">
                      ระบุค่า Demand Factor (0.10 - 1.00)
                    </span>

                    <span className="text-xs font-mono text-cyan-400 font-bold">
                      {manualDemandFactor.toFixed(2)}
                    </span>
                  </div>

                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={manualDemandFactor}
                    onChange={(event) =>
                      setManualDemandFactor(
                        Number(event.target.value)
                      )
                    }
                    className="w-full accent-cyan-400 cursor-pointer"
                  />

                  <p className="text-[11px] text-amber-400/90 flex items-start gap-1.5">
                    <AlertTriangle
                      className="w-3.5 h-3.5 shrink-0 mt-0.5"
                      aria-hidden="true"
                    />
                    <span>
                      โหมดกำหนดเอง:
                      ผู้ใช้งานต้องตรวจสอบเอกสารอ้างอิงที่เหมาะสม
                      สำหรับค่า Demand Factor ที่เลือก
                    </span>
                  </p>
                </div>
              )}

              {calcResult.warning && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle
                    className="w-4 h-4 text-amber-400 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />

                  <div className="space-y-1">
                    <p className="font-bold text-amber-200">
                      คำเตือนทางวิศวกรรม
                    </p>
                    <p className="leading-relaxed">
                      {calcResult.warning}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Output */}
        <section className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                ผลการคำนวณกระแส (Calculation Output)
              </span>

              <StatusBadge
                status={
                  calcResult.validationError
                    ? 'FAIL'
                    : 'CALCULATED'
                }
                size="sm"
              />
            </div>

            {calcResult.validationError ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle
                  className="w-4 h-4 shrink-0 mt-0.5"
                  aria-hidden="true"
                />
                <span>{calcResult.validationError}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 text-center space-y-1 shadow-inner">
                  <p className="text-xs font-medium text-slate-400">
                    กระแสโหลดออกแบบ (Design Current: Ib)
                  </p>

                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono tracking-tight">
                      {calcResult.currentA}
                    </span>

                    <span className="text-xl font-bold text-slate-300">
                      A
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 font-mono">
                    {circuitLabel}
                    {' • '}
                    {phaseLabel}
                    {' @ '}
                    {voltage}V
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">
                      กำลังไฟฟ้ารวม (P_total):
                    </span>

                    <span className="text-slate-200 font-mono font-bold text-sm">
                      {(calcResult.totalPowerW / 1000).toFixed(2)} kW
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">
                      กำลังไฟฟ้าคำนวณ (P_demand):
                    </span>

                    <span className="text-cyan-300 font-mono font-bold text-sm">
                      {(calcResult.demandPowerW / 1000).toFixed(2)} kW
                    </span>
                  </div>
                </div>

                <MultiStageStatusBar
                  multiStageStatus={calcResult.multiStageStatus}
                />

                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                    <BookOpen
                      className="w-3.5 h-3.5 text-blue-400"
                      aria-hidden="true"
                    />
                    <span>STANDARD REFERENCE</span>
                  </div>

                  <p className="font-semibold text-slate-200">
                    วสท. 022001-22
                  </p>

                  <p className="text-slate-400 text-[11px]">
                    ข้อมูลอ้างอิงสำหรับการคำนวณระบบไฟฟ้า
                  </p>

                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1 border-t border-slate-800 font-mono text-[11px]">
                    <span className="text-slate-400">
                      Calculation:{' '}
                      <strong className="text-blue-300">
                        COMPLETED
                      </strong>
                    </span>

                    <span className="text-slate-400">
                      Standard Compliance:{' '}
                      <strong className="text-amber-400">
                        NOT YET VERIFIED
                      </strong>
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Forward */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              type="button"
              onClick={() =>
                onForwardToCableSizing(
                  calcResult.currentA,
                  phase,
                  voltage,
                  voltageSource
                )
              }
              disabled={
                calcResult.currentA <= 0 ||
                !!calcResult.validationError
              }
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                calcResult.currentA > 0 &&
                !calcResult.validationError
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>
                ส่งค่าไปเลือกขนาดสายไฟ (Cable Sizing)
              </span>

              <ArrowRight
                className="w-4 h-4"
                aria-hidden="true"
              />
            </button>

            <p className="text-[11px] text-center text-slate-500">
              ระบบจะส่งค่า Ib = {calcResult.currentA} A
              {' '}
              ({phase === '1_PHASE' ? '1 Phase' : '3 Phase'})
              {' '}
              ไปคำนวณขนาดสายไฟและเบรกเกอร์
            </p>
          </div>
        </section>
      </div>

      {/* Calculation trace */}
      <CalculationTraceCard
        trace={calcResult.trace}
        title="ขั้นตอนการคำนวณกระแสและตรวจสอบเบื้องต้น (Engineering Calculation Trace)"
        onAskAi={onAskAi}
      />
    </div>
  );
};
