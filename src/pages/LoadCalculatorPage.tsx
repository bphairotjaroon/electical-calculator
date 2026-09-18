import React, { useState } from 'react';
import { calculateLoadCurrent, LoadCalculationInput, LoadCalculationResult } from '../services/calculationEngine';
import { 
  CalculationTrace, 
  CircuitType, 
  DemandFactorMode, 
  DemandFactorRecord, 
  PhaseType, 
  PowerUnit,
  VoltageSource
} from '../types';
import { CalculationTraceCard } from '../components/CalculationTraceCard';
import { StatusBadge, SourceStatusBadge, MultiStageStatusBar } from '../components/StatusBadge';
import { INITIAL_DEMAND_FACTORS } from '../data/standardsData';
import { 
  Zap, 
  ArrowRight, 
  RotateCcw, 
  AlertCircle, 
  AlertTriangle, 
  ShieldCheck, 
  BookOpen,
  Layers,
  Settings2,
  Info
} from 'lucide-react';

interface LoadCalculatorPageProps {
  onForwardToCableSizing: (currentIb: number, phase: PhaseType, voltage?: number, voltageSource?: VoltageSource) => void;
  onAskAi: (trace: CalculationTrace) => void;
}

export const LoadCalculatorPage: React.FC<LoadCalculatorPageProps> = ({
  onForwardToCableSizing,
  onAskAi,
}) => {
  const [circuitType, setCircuitType] = useState<CircuitType>('BRANCH_CIRCUIT');
  const [power, setPower] = useState<number>(3.5);
  const [unit, setUnit] = useState<PowerUnit>('kW');
  const [phase, setPhase] = useState<PhaseType>('1_PHASE');
  
  // Custom Voltage states
  const [voltageSource, setVoltageSource] = useState<VoltageSource>('PRESET');
  const [voltage, setVoltage] = useState<number>(220);
  const [customVoltageInput, setCustomVoltageInput] = useState<string>('220');

  const [powerFactor, setPowerFactor] = useState<number>(0.85);
  const [quantity, setQuantity] = useState<number>(1);

  // Demand Factor states
  const [demandMode, setDemandMode] = useState<DemandFactorMode>('NO_DEMAND_FACTOR');
  const [manualDemandFactor, setManualDemandFactor] = useState<number>(1.0);
  const [selectedDfId, setSelectedDfId] = useState<string>('df-3-1-res-1');

  // Quick preset buttons for common Thai loads
  const PRESETS = [
    { label: 'แอร์ 12,000 BTU (~1.1 kW, 1Ø)', power: 1.1, unit: 'kW' as PowerUnit, phase: '1_PHASE' as PhaseType, voltage: 220, pf: 0.85, circuit: 'BRANCH_CIRCUIT' as CircuitType },
    { label: 'เครื่องทำน้ำอุ่น (3.5 kW, 1Ø)', power: 3.5, unit: 'kW' as PowerUnit, phase: '1_PHASE' as PhaseType, voltage: 220, pf: 1.0, circuit: 'BRANCH_CIRCUIT' as CircuitType },
    { label: 'เตาอบไฟฟ้า (5 kW, 1Ø)', power: 5.0, unit: 'kW' as PowerUnit, phase: '1_PHASE' as PhaseType, voltage: 220, pf: 1.0, circuit: 'BRANCH_CIRCUIT' as CircuitType },
    { label: 'มอเตอร์ปั๊มน้ำ 3Ø (7.5 kW, 400V)', power: 7.5, unit: 'kW' as PowerUnit, phase: '3_PHASE' as PhaseType, voltage: 400, pf: 0.85, circuit: 'BRANCH_CIRCUIT' as CircuitType },
    { label: 'สายป้อนตู้ DB ย่อย 3Ø (30 kW, 400V)', power: 30, unit: 'kW' as PowerUnit, phase: '3_PHASE' as PhaseType, voltage: 400, pf: 0.85, circuit: 'FEEDER' as CircuitType },
  ];

  const handleApplyPreset = (p: typeof PRESETS[0]) => {
    setPower(p.power);
    setUnit(p.unit);
    setPhase(p.phase);
    setVoltageSource('PRESET');
    setVoltage(p.voltage);
    setCustomVoltageInput(p.voltage.toString());
    setPowerFactor(p.pf);
    setCircuitType(p.circuit);
  };

  const handlePhaseChange = (newPhase: PhaseType) => {
    setPhase(newPhase);
    if (voltageSource === 'PRESET') {
      if (newPhase === '1_PHASE') {
        setVoltage(220);
        setCustomVoltageInput('220');
      } else {
        setVoltage(400);
        setCustomVoltageInput('400');
      }
    }
    // If Custom (USER_DEFINED), retain the user's entered custom voltage!
  };

  const handleSelectPresetVoltage = (v: number) => {
    setVoltageSource('PRESET');
    setVoltage(v);
    setCustomVoltageInput(v.toString());
  };

  const handleSelectCustomVoltageMode = () => {
    setVoltageSource('USER_DEFINED');
    const parsed = parseFloat(customVoltageInput);
    if (!isNaN(parsed)) {
      setVoltage(parsed);
    }
  };

  const handleCustomVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    setCustomVoltageInput(rawVal);
    const parsed = parseFloat(rawVal);
    if (!isNaN(parsed)) {
      setVoltage(parsed);
    } else {
      setVoltage(0);
    }
  };

  // Determine effective Demand Factor
  const selectedDfRecord: DemandFactorRecord | undefined = INITIAL_DEMAND_FACTORS.find(
    (df) => df.id === selectedDfId
  );

  let effectiveDemandFactor = 1.0;
  if (demandMode === 'NO_DEMAND_FACTOR') {
    effectiveDemandFactor = 1.0;
  } else if (demandMode === 'MANUAL') {
    effectiveDemandFactor = manualDemandFactor;
  } else if (demandMode === 'STANDARD_TABLE' && selectedDfRecord) {
    effectiveDemandFactor = selectedDfRecord.factor;
  }

  // Perform calculation via Calculation Engine
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

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Zap className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                คำนวณโหลดไฟฟ้า (Load Current Calculation Engine)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              คำนวณกระแสออกแบบ (Design Current: Ib) สำหรับระบบ 1 เฟส และ 3 เฟส อ้างอิง วสท. 022001-22
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setCircuitType('BRANCH_CIRCUIT');
                setPower(3.5);
                setUnit('kW');
                setPhase('1_PHASE');
                setVoltage(220);
                setPowerFactor(0.85);
                setQuantity(1);
                setDemandMode('NO_DEMAND_FACTOR');
                setManualDemandFactor(1.0);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>รีเซ็ตค่า</span>
            </button>
          </div>
        </div>

        {/* Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800">
          <p className="text-xs font-semibold text-slate-400 mb-2">โหลดตัวอย่างมาตรฐานทั่วไป:</p>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p, idx) => (
              <button
                key={idx}
                onClick={() => handleApplyPreset(p)}
                className="px-2.5 py-1 text-xs bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Grid: Inputs (7 cols) vs Outputs (5 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Form: Inputs */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h3 className="text-sm sm:text-base font-semibold text-slate-200">
              พารามิเตอร์วงจรและโหลด (Circuit & Load Parameters)
            </h3>
            <span className="text-[11px] text-amber-400/80 font-mono">EIT 022001-22 CH.3 & 5</span>
          </div>

          <div className="space-y-4">
            {/* 1. Circuit Type (Feeder vs Branch Circuit) */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>ประเภทวงจร (Circuit Classification)</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setCircuitType('BRANCH_CIRCUIT')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                    circuitType === 'BRANCH_CIRCUIT'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">วงจรย่อย (Branch Circuit)</p>
                  <p className="text-[10px] text-slate-400">ต้องคิดโหลด 100% ห้ามใช้ Demand Factor</p>
                </button>

                <button
                  type="button"
                  onClick={() => setCircuitType('FEEDER')}
                  className={`py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer text-left ${
                    circuitType === 'FEEDER'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <p className="font-bold">สายป้อน (Feeder Circuit)</p>
                  <p className="text-[10px] text-slate-400">อนุญาตให้คิด Demand Factor ตามตาราง วสท.</p>
                </button>
              </div>
            </div>

            {/* 2. System Phase & Voltage */}
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Phase selector */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-slate-300">
                    ระบบไฟฟ้า (Phase System)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      id="btn-phase-1p"
                      onClick={() => handlePhaseChange('1_PHASE')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        phase === '1_PHASE'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      1 Phase (1Ø)
                    </button>
                    <button
                      type="button"
                      id="btn-phase-3p"
                      onClick={() => handlePhaseChange('3_PHASE')}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        phase === '3_PHASE'
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-xs'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      3 Phase (3Ø)
                    </button>
                  </div>
                </div>

                {/* Voltage Presets & Mode */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-slate-300">
                      แรงดันไฟฟ้า (Voltage: V)
                    </label>
                    <SourceStatusBadge
                      status={voltageSource === 'PRESET' ? 'VERIFIED_STANDARD_DATA' : 'USER_DEFINED_DATA'}
                      size="sm"
                    />
                  </div>
                  
                  {/* Preset Buttons for 1Ø / 3Ø + Custom */}
                  <div className="grid grid-cols-3 gap-2">
                    {phase === '1_PHASE' ? (
                      <>
                        <button
                          type="button"
                          id="btn-volt-220"
                          onClick={() => handleSelectPresetVoltage(220)}
                          className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            voltageSource === 'PRESET' && voltage === 220
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          220 V
                        </button>
                        <button
                          type="button"
                          id="btn-volt-230"
                          onClick={() => handleSelectPresetVoltage(230)}
                          className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            voltageSource === 'PRESET' && voltage === 230
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          230 V
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          id="btn-volt-380"
                          onClick={() => handleSelectPresetVoltage(380)}
                          className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            voltageSource === 'PRESET' && voltage === 380
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          380 V
                        </button>
                        <button
                          type="button"
                          id="btn-volt-400"
                          onClick={() => handleSelectPresetVoltage(400)}
                          className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            voltageSource === 'PRESET' && voltage === 400
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                              : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          400 V
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      id="btn-volt-custom"
                      onClick={handleSelectCustomVoltageMode}
                      className={`py-2 px-2 text-center rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                        voltageSource === 'USER_DEFINED'
                          ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-xs'
                          : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      Custom...
                    </button>
                  </div>
                </div>
              </div>

              {/* Custom Voltage Numeric Input if Custom is active */}
              {voltageSource === 'USER_DEFINED' && (
                <div id="custom-voltage-section" className="p-3.5 rounded-xl bg-slate-950 border border-cyan-800/40 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <label htmlFor="custom-voltage-input" className="text-xs font-semibold text-cyan-300 flex items-center gap-1.5">
                      <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Voltage (Custom Numeric Input):</span>
                    </label>
                    <span className="text-[11px] text-cyan-400/80 font-mono">
                      รับค่าทศนิยมได้ (Decimal allowed)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        id="custom-voltage-input"
                        type="number"
                        step="any"
                        value={customVoltageInput}
                        onChange={handleCustomVoltageChange}
                        placeholder="ระบุแรงดัน เช่น 208, 220, 230, 240, 380, 400, 415, 440"
                        className="w-full bg-slate-900 border border-cyan-600/50 rounded-xl px-3.5 py-2 text-sm text-cyan-200 font-mono font-bold focus:outline-hidden focus:border-cyan-400"
                      />
                      <span className="absolute right-3.5 top-2 text-xs text-slate-400 font-bold">V</span>
                    </div>

                    {/* Quick values suggestion pills */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {(phase === '1_PHASE' ? [208, 220, 230, 240] : [380, 400, 415, 440]).map((quickV) => (
                        <button
                          key={quickV}
                          type="button"
                          onClick={() => {
                            setCustomVoltageInput(quickV.toString());
                            setVoltage(quickV);
                          }}
                          className="px-2 py-1 text-[11px] font-mono bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 rounded-lg transition-colors cursor-pointer"
                        >
                          {quickV}V
                        </button>
                      ))}
                    </div>
                  </div>

                  <p className="text-[11px] text-slate-400">
                    * ระบบจะรักษาค่า Custom ที่คุณระบุไว้ ({voltage} V) โดยไม่เปลี่ยนกลับเป็นค่าเริ่มต้นโดยอัตโนมัติ
                  </p>
                </div>
              )}

              {/* Boundary / High Voltage Warnings */}
              {voltage > 1000 && (
                <div id="high-voltage-alert" className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/60 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-amber-200">HIGH_VOLTAGE_REVIEW_REQUIRED</p>
                      <StatusBadge status="HIGH_VOLTAGE_REVIEW_REQUIRED" size="sm" />
                    </div>
                    <p className="leading-relaxed">
                      แรงดันมากกว่า 1,000 V ({voltage} V) ต้องเข้าสู่กระบวนการตรวจสอบ และมาตรฐานที่เกี่ยวข้องเพิ่มเติม
                    </p>
                    <p className="text-[11px] text-amber-400/90 font-medium">
                      คำเตือน: ห้ามนำระบบแรงดันมากกว่า 1,000 V ไปคำนวณด้วยฐานข้อมูลสายแรงดันต่ำโดยอัตโนมัติ
                    </p>
                  </div>
                </div>
              )}

              {voltage <= 0 && (
                <div id="invalid-voltage-alert" className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-600/60 text-rose-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  <div className="space-y-0.5">
                    <p className="font-bold text-rose-200">INVALID_INPUT</p>
                    <p>แรงดันไฟฟ้าต้องมากกว่า 0 V (ปัจจุบัน: {voltage} V)</p>
                  </div>
                </div>
              )}
            </div>

            {/* 3. Power Value & Unit */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                ขนาดกำลังไฟฟ้า (Power)
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="0.01"
                  step="0.1"
                  value={power}
                  onChange={(e) => setPower(Number(e.target.value))}
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:border-amber-500/50"
                  placeholder="เช่น 3.5 หรือ 3500"
                />
                <div className="flex rounded-xl bg-slate-950 border border-slate-800 p-1">
                  <button
                    type="button"
                    onClick={() => setUnit('kW')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      unit === 'kW' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    kW
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit('W')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      unit === 'W' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    W
                  </button>
                </div>
              </div>
            </div>

            {/* 4. Power Factor & Quantity */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
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
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0.5 (เหนี่ยวนำสูง)</span>
                  <span>0.85 (มอเตอร์ทั่วไป)</span>
                  <span>1.0 (ฮีตเตอร์)</span>
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
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-xs sm:text-sm text-slate-200 focus:outline-hidden focus:border-amber-500/50"
                />
              </div>
            </div>

            {/* 5. Demand Factor Mode Section */}
            <div className="pt-3 border-t border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                  <Settings2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>โหมดดีมานด์แฟกเตอร์ (Demand Factor Mode)</span>
                </label>
                <span className="text-xs font-mono text-cyan-400 font-bold">
                  {(effectiveDemandFactor * 100).toFixed(0)}% (DF = {effectiveDemandFactor})
                </span>
              </div>

              {/* 3 Modes */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDemandMode('NO_DEMAND_FACTOR')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    demandMode === 'NO_DEMAND_FACTOR'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  1. ไม่คิด DF (100%)
                </button>

                <button
                  type="button"
                  onClick={() => setDemandMode('STANDARD_TABLE')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    demandMode === 'STANDARD_TABLE'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  2. ตารางมาตรฐาน วสท.
                </button>

                <button
                  type="button"
                  onClick={() => setDemandMode('MANUAL')}
                  className={`py-2 px-2 text-center rounded-xl text-xs font-medium border transition-colors cursor-pointer ${
                    demandMode === 'MANUAL'
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  3. กำหนดค่าเอง (Manual)
                </button>
              </div>

              {/* Mode 1: No demand factor description */}
              {demandMode === 'NO_DEMAND_FACTOR' && (
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-2">
                  <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span>
                    คิดโหลดเต็มกำลัง 100% (DF = 1.0) เหมาะสมที่สุดสำหรับวงจรย่อย (Branch Circuit) เพื่อความปลอดภัยสูงสุด
                  </span>
                </div>
              )}

              {/* Mode 2: Standard Table Selector */}
              {demandMode === 'STANDARD_TABLE' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-300">
                      เลือกหมวดโหลดและตาราง วสท. (บทที่ 3 ตาราง 3-1, 3-2, 3-3)
                    </label>
                    <select
                      value={selectedDfId}
                      onChange={(e) => setSelectedDfId(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-cyan-500 cursor-pointer"
                    >
                      <optgroup label="ตารางที่ 3-1: ดีมานด์แฟกเตอร์สำหรับโหลดแสงสว่าง">
                        {INITIAL_DEMAND_FACTORS.filter((df) => df.referenceTable === 'ตารางที่ 3-1').map((df) => (
                          <option key={df.id} value={df.id}>
                            [{df.referenceTable}] {df.buildingType} - {df.loadRange} ({df.unit})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="ตารางที่ 3-2: โหลดเต้ารับในอาคารที่ไม่ใช่ที่อยู่อาศัย">
                        {INITIAL_DEMAND_FACTORS.filter((df) => df.referenceTable === 'ตารางที่ 3-2').map((df) => (
                          <option key={df.id} value={df.id}>
                            [{df.referenceTable}] {df.buildingType} - {df.loadRange} ({df.unit})
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="ตารางที่ 3-3: โหลดเครื่องใช้ไฟฟ้าทั่วไป">
                        {INITIAL_DEMAND_FACTORS.filter((df) => df.referenceTable === 'ตารางที่ 3-3').map((df) => (
                          <option key={df.id} value={df.id}>
                            [{df.referenceTable}] {df.buildingType} - {df.loadRange} ({df.unit})
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  {selectedDfRecord && (
                    <div className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 text-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-cyan-300">{selectedDfRecord.referenceTable} ({selectedDfRecord.standard})</span>
                        <SourceStatusBadge status={selectedDfRecord.sourceStatus} size="sm" />
                      </div>
                      <p className="text-slate-300 font-mono">
                        ประเภทอาคาร: <span className="text-slate-100 font-sans">{selectedDfRecord.buildingType}</span>
                      </p>
                      <p className="text-slate-400">
                        ขอบเขตโหลด: {selectedDfRecord.loadRange} → <span className="text-amber-400 font-bold">ตัวคูณ = {selectedDfRecord.factor} ({selectedDfRecord.unit})</span>
                      </p>
                      <p className="text-[11px] text-slate-500 font-sans">
                        คำอธิบาย: {selectedDfRecord.referenceNote}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Mode 3: Manual Input */}
              {demandMode === 'MANUAL' && (
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-300">ระบุตัวคูณ Demand Factor (0.10 - 1.00):</span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{manualDemandFactor}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.05"
                    value={manualDemandFactor}
                    onChange={(e) => setManualDemandFactor(Number(e.target.value))}
                    className="w-full accent-cyan-400 cursor-pointer"
                  />
                  <p className="text-[11px] text-amber-400/90 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                    <span>โหมดกำหนดเอง: วิศวกรผู้ใช้งานต้องตรวจสอบเอกสารรับรองสำหรับค่า Demand Factor นี้ด้วยตนเอง</span>
                  </p>
                </div>
              )}

              {/* Circuit Type vs Demand Factor Warning */}
              {calcResult.warning && (
                <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-600/50 text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-bold text-amber-200">คำเตือนทางวิศวกรรม (Engineering Constraint Warning):</p>
                    <p className="leading-relaxed">{calcResult.warning}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Summary Card: Calculation Output & Forward Action */}
        <div className="lg:col-span-5 flex flex-col justify-between bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-6">
          <div className="space-y-4">
            {/* Header with CALCULATED status (NOT PASS) */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                ผลการคำนวณกระแส (Calculation Output)
              </span>
              <StatusBadge status={calcResult.validationError ? 'FAIL' : 'CALCULATED'} size="sm" />
            </div>

            {calcResult.validationError ? (
              <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-800/50 text-rose-300 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{calcResult.validationError}</span>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Main Design Current Display */}
                <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-950 to-slate-900 border border-amber-500/30 text-center space-y-1 shadow-inner">
                  <p className="text-xs font-medium text-slate-400">
                    กระแสโหลดออกแบบ (Design Current: Ib)
                  </p>
                  <div className="flex items-baseline justify-center gap-2">
                    <span className="text-4xl sm:text-5xl font-extrabold text-amber-400 font-mono tracking-tight">
                      {calcResult.currentA}
                    </span>
                    <span className="text-xl font-bold text-slate-300">A</span>
                  </div>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {circuitType === 'BRANCH_CIRCUIT' ? 'วงจรย่อย (Branch)' : 'สายป้อน (Feeder)'} • {phase === '1_PHASE' ? '1Ø 2W' : '3Ø 4W'} @ {voltage}V
                  </p>
                </div>

                {/* Sub metrics */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">กำลังไฟฟ้ารวม (P_total):</span>
                    <span className="text-slate-200 font-mono font-bold text-sm">
                      {(calcResult.totalPowerW / 1000).toFixed(2)} kW
                    </span>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">กำลังคำนวณ (P_demand):</span>
                    <span className="text-cyan-300 font-mono font-bold text-sm">
                      {(calcResult.demandPowerW / 1000).toFixed(2)} kW
                    </span>
                  </div>
                </div>

                {/* Multi-Stage Status Display */}
                <MultiStageStatusBar multiStageStatus={calcResult.multiStageStatus} />

                {/* Standard Reference Banner */}
                <div className="p-3.5 rounded-xl bg-blue-950/20 border border-blue-800/40 text-xs space-y-1.5 text-slate-300">
                  <div className="flex items-center gap-1.5 text-blue-300 font-semibold">
                    <BookOpen className="w-3.5 h-3.5 text-blue-400" />
                    <span>STANDARD REFERENCE</span>
                  </div>
                  <p className="font-semibold text-slate-200">วสท. 022001-22</p>
                  <p className="text-slate-400 text-[11px]">บทที่ 3 ตัวนำประธาน สายป้อน วงจรย่อย</p>
                  <p className="text-slate-400 text-[11px]">บทที่ 5 ข้อกำหนดการเดินสายและวัสดุ</p>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800 font-mono text-[11px]">
                    <span className="text-slate-400">Calculation: <strong className="text-blue-300">COMPLETED</strong></span>
                    <span className="text-slate-400">Standard Compliance: <strong className="text-amber-400">NOT YET VERIFIED</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Forward Action to Cable Sizing */}
          <div className="pt-4 border-t border-slate-800 space-y-2">
            <button
              onClick={() => onForwardToCableSizing(calcResult.currentA, phase)}
              disabled={calcResult.currentA <= 0 || !!calcResult.validationError}
              className={`w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold text-sm transition-all shadow-lg ${
                calcResult.currentA > 0 && !calcResult.validationError
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10 cursor-pointer'
                  : 'bg-slate-800 text-slate-500 cursor-not-allowed'
              }`}
            >
              <span>ส่งค่าไปเลือกขนาดสายไฟ (Cable Sizing)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-center text-slate-500">
              ระบบจะส่งค่า Ib = {calcResult.currentA} A ({phase === '1_PHASE' ? '1 Phase' : '3 Phase'}) ไปคำนวณขนาดสายไฟและเบรกเกอร์
            </p>
          </div>
        </div>
      </div>

      {/* 7-Step Calculation Trace */}
      <CalculationTraceCard
        trace={calcResult.trace}
        title="ขั้นตอนการคำนวณกระแสและตรวจสอบเบื้องต้น (7-Step Engineering Calculation Trace)"
        onAskAi={onAskAi}
      />
    </div>
  );
};
