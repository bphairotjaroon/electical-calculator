/**
 * Calculation Engine
 * Standard: วสท. 022001-22 (พ.ศ. 2564)
 * Pure engineering deterministic calculation logic.
 */

import {
  CableRecord,
  CableVoltageRatingStatus,
  CalculationStatus,
  CalculationTrace,
  CircuitType,
  ConduitRecord,
  DemandFactorMode,
  DemandFactorRecord,
  MultiStageStatus,
  PhaseType,
  PowerUnit,
  SourceStatus,
  VoltageSource,
} from '../types';
import {
  CANDIDATE_BREAKER_RATINGS,
  getConduitFillLimit,
} from '../data/standardsData';

export interface LoadCalculationInput {
  power: number;
  unit: PowerUnit;
  voltage: number;
  voltageSource?: VoltageSource;
  phase: PhaseType;
  powerFactor: number;
  quantity?: number;
  demandFactor?: number;
  circuitType?: CircuitType;
  demandFactorMode?: DemandFactorMode;
  demandFactorRecord?: DemandFactorRecord | null;
}

export interface LoadCalculationResult {
  currentA: number;
  totalPowerW: number;
  demandPowerW: number;
  trace: CalculationTrace;
  multiStageStatus: MultiStageStatus;
  validationError?: string;
  warning?: string;
}

/**
 * 1. Calculate Load Current and Power
 * Single Phase: I = P / (V * PF)
 * Three Phase: I = P / (sqrt(3) * V * PF)
 */
export function calculateLoadCurrent(input: LoadCalculationInput): LoadCalculationResult {
  const {
    power,
    unit,
    voltage,
    voltageSource,
    phase,
    powerFactor,
    quantity = 1,
    demandFactor = 1.0,
    circuitType = 'BRANCH_CIRCUIT',
    demandFactorMode = 'NO_DEMAND_FACTOR',
    demandFactorRecord = null,
  } = input;

  // Voltage Source detection (PRESET vs USER_DEFINED)
  const isPresetVoltage =
    phase === '1_PHASE'
      ? voltage === 220 || voltage === 230
      : voltage === 380 || voltage === 400;
  const vSource: VoltageSource = voltageSource || (isPresetVoltage ? 'PRESET' : 'USER_DEFINED');

  // Validation
  if (power <= 0) {
    return {
      currentA: 0,
      totalPowerW: 0,
      demandPowerW: 0,
      validationError: 'กำลังไฟฟ้า (Power) ต้องมากกว่า 0',
      trace: createErrorTrace('กำลังไฟฟ้าไม่ถูกต้อง (ต้อง > 0)', 'FAIL'),
      multiStageStatus: createDefaultMultiStageStatus('FAIL'),
    };
  }
  if (voltage <= 0) {
    return {
      currentA: 0,
      totalPowerW: 0,
      demandPowerW: 0,
      validationError: 'INVALID_INPUT: แรงดันไฟฟ้า (Voltage) ต้องมากกว่า 0 V',
      trace: createErrorTrace('INVALID_INPUT: แรงดันไฟฟ้าต้องมากกว่า 0 V', 'INVALID_INPUT'),
      multiStageStatus: {
        ...createDefaultMultiStageStatus('FAIL'),
        finalStatus: 'FAIL',
      },
    };
  }
  if (voltage > 1000) {
    const hvMsg = 'แรงดันมากกว่า 1,000 V ต้องเข้าสู่กระบวนการตรวจสอบ และมาตรฐานที่เกี่ยวข้องเพิ่มเติม';
    return {
      currentA: 0,
      totalPowerW: 0,
      demandPowerW: 0,
      validationError: hvMsg,
      warning: hvMsg,
      trace: createErrorTrace(hvMsg, 'HIGH_VOLTAGE_REVIEW_REQUIRED'),
      multiStageStatus: {
        ...createDefaultMultiStageStatus('FAIL'),
        finalStatus: 'ENGINEERING REVIEW REQUIRED',
      },
    };
  }
  if (powerFactor <= 0 || powerFactor > 1.0) {
    return {
      currentA: 0,
      totalPowerW: 0,
      demandPowerW: 0,
      validationError: 'Power Factor (PF) ต้องอยู่ระหว่าง 0.01 ถึง 1.00',
      trace: createErrorTrace('Power Factor ต้องอยู่ระหว่าง 0.01 ถึง 1.00', 'FAIL'),
      multiStageStatus: createDefaultMultiStageStatus('FAIL'),
    };
  }
  if (quantity <= 0) {
    return {
      currentA: 0,
      totalPowerW: 0,
      demandPowerW: 0,
      validationError: 'จำนวนโหลดต้องอย่างน้อย 1 รายการ',
      trace: createErrorTrace('จำนวนโหลดต้อง >= 1', 'FAIL'),
      multiStageStatus: createDefaultMultiStageStatus('FAIL'),
    };
  }
  if (demandFactor <= 0 || demandFactor > 1.0) {
    return {
      currentA: 0,
      totalPowerW: 0,
      demandPowerW: 0,
      validationError: 'Demand Factor ต้องอยู่ระหว่าง 0.01 ถึง 1.00',
      trace: createErrorTrace('Demand Factor ไม่ถูกต้อง', 'FAIL'),
      multiStageStatus: createDefaultMultiStageStatus('FAIL'),
    };
  }

  // Branch Circuit Demand Factor warning rule
  let warning: string | undefined = undefined;
  if (circuitType === 'BRANCH_CIRCUIT' && demandFactor < 1.0) {
    warning = 'Demand Factor นี้ไม่ควรถูกนำไปใช้กับวงจรย่อยตามเงื่อนไขของมาตรฐาน (ตามข้อกำหนด วสท. 022001-22 วงจรย่อย Branch Circuit ต้องคำนวณโหลดเต็มขนาด 100% เพื่อความปลอดภัย)';
  }

  const basePowerW = unit === 'kW' ? power * 1000 : power;
  const totalPowerW = basePowerW * quantity;
  const demandPowerW = totalPowerW * demandFactor;

  let currentA = 0;
  let formula = '';
  let substitution = '';

  if (phase === '1_PHASE') {
    currentA = demandPowerW / (voltage * powerFactor);
    formula = 'I = P / (V × PF)';
    substitution = `I = ${demandPowerW.toLocaleString('en-US', { maximumFractionDigits: 1 })} / (${voltage} × ${powerFactor}) = ${currentA.toFixed(2)} A`;
  } else {
    currentA = demandPowerW / (Math.sqrt(3) * voltage * powerFactor);
    formula = 'I = P / (√3 × V × PF)';
    substitution = `I = ${demandPowerW.toLocaleString('en-US', { maximumFractionDigits: 1 })} / (√3 × ${voltage} × ${powerFactor}) = ${currentA.toFixed(2)} A`;
  }

  const multiStageStatus: MultiStageStatus = {
    calculationStatus: 'CALCULATED',
    standardStatus: 'NOT YET VERIFIED',
    cableStatus: 'NOT CHECKED',
    breakerStatus: 'NOT CHECKED',
    voltageDropStatus: 'NOT CHECKED',
    conduitStatus: 'NOT CHECKED',
    finalStatus: 'ENGINEERING REVIEW REQUIRED',
  };

  const trace: CalculationTrace = {
    input: {
      'Voltage': `${voltage} V ${vSource === 'USER_DEFINED' ? '(CUSTOM)' : '(PRESET)'}`,
      'Voltage Source': vSource,
      'ประเภทวงจร (Circuit Type)': circuitType === 'BRANCH_CIRCUIT' ? 'วงจรย่อย (Branch Circuit)' : 'สายป้อน (Feeder Circuit)',
      'กำลังไฟฟ้า (Power)': `${power} ${unit}`,
      'จำนวนชุดโหลด (Quantity)': quantity,
      'โหมด Demand Factor': demandFactorMode === 'STANDARD_TABLE' ? `ตารางมาตรฐาน (${demandFactorRecord?.referenceTable || 'วสท. บทที่ 3'})` : demandFactorMode === 'NO_DEMAND_FACTOR' ? 'ไม่คิด (100%)' : 'กำหนดเอง (Manual)',
      'Demand Factor': `${(demandFactor * 100).toFixed(0)}% (${demandFactor})`,
      'กำลังไฟฟ้าคำนวณ (P_demand)': `${demandPowerW.toFixed(1)} W`,
      'Power Factor (PF)': powerFactor,
      'ระบบไฟฟ้า (Phase)': phase === '1_PHASE' ? '1 Phase 2 Wire' : '3 Phase 4 Wire',
    },
    formula,
    substitution,
    result: `Design Current (Ib) = ${currentA.toFixed(2)} A`,
    standardReference: {
      standard: 'วสท. 022001-22',
      chapter: 'บทที่ 3 ตัวนำประธาน สายป้อน วงจรย่อย และบทที่ 5 ข้อกำหนดการเดินสายและวัสดุ',
      table: demandFactorRecord?.referenceTable,
      complianceStatus: 'NOT YET VERIFIED',
    },
    engineeringCheck: {
      cable: 'NOT CHECKED',
      breaker: 'NOT CHECKED',
      voltageDrop: 'NOT CHECKED',
      conduit: 'NOT CHECKED',
    },
    finalStatus: 'ENGINEERING REVIEW REQUIRED',
    standardCheck: 'STANDARD REFERENCE: วสท. 022001-22 บทที่ 3 และบทที่ 5 (Calculation: COMPLETED, Standard Compliance: NOT YET VERIFIED)',
    notes: [
      unit === 'kW' ? `แปลงค่ากำลังไฟฟ้า P(W) = ${power} kW × 1000 = ${basePowerW} W` : 'หน่วยกำลังไฟฟ้าเป็น Watt',
      quantity > 1 ? `คำนวณรวม ${quantity} ชุด: P_total = ${totalPowerW.toFixed(1)} W` : 'โหลด 1 ชุด',
      `คำนวณคิด Demand Factor (${demandFactor}): P_demand = ${demandPowerW.toFixed(1)} W`,
      phase === '1_PHASE'
        ? 'แรงดันที่ใช้คำนวณตามแรงดันของวงจร'
        : 'แรงดันที่กรอกคือแรงดันระหว่างสาย (Line-to-Line)',
      vSource === 'USER_DEFINED'
        ? `ค่าแรงดัน ${voltage} V นี้เป็นค่าที่ผู้ใช้กำหนด (CUSTOM) ไม่ใช่ค่ามาตรฐานจากฐานข้อมูล`
        : `ค่าแรงดัน ${voltage} V เป็นค่ามาตรฐาน (PRESET)`,
      ...(warning ? [warning] : []),
      'หมายเหตุวิศวกรรม: การคำนวณกระแส Ib เป็นเพียงขั้นตอนเริ่มต้น ยังต้องทำการเลือกขนาดสายและพิกัดเครื่องป้องกันกระแสเกินเพื่อรับรองมาตรฐาน',
    ],
  };

  return {
    currentA: Number(currentA.toFixed(2)),
    totalPowerW,
    demandPowerW,
    trace,
    multiStageStatus,
    warning,
  };
}

/**
 * 2. Cable Sizing Engine
 * Criteria: Ib <= In <= Iz
 * Iz = Iz_table * Ca * Cg
 */
export interface CableSizingInput {
  designCurrentIb: number;       // Ib
  selectedBreakerIn?: number;     // In (optional; if not provided, system picks standard candidate)
  cableRecords: CableRecord[];
  cableType: string;
  installationMethod?: string;
  ambientTempFactorCa: number;   // Ca
  groupingFactorCg: number;      // Cg
  otherFactorCi?: number;        // Ci
  phase: PhaseType;
  voltage?: number;              // System voltage V
  voltageSource?: VoltageSource; // 'PRESET' | 'USER_DEFINED'
}

export interface CableSizingResult {
  selectedCable: CableRecord | null;
  selectedBreakerRating: number;
  correctedAmpacityIz: number;
  baseTableAmpacity: number;
  totalCorrectionFactor: number;
  trace: CalculationTrace;
  status: CalculationStatus;
  statusMessage: string;
  voltageRatingCheck?: {
    status: CableVoltageRatingStatus;
    cableRatingV?: number;
    systemVoltageV: number;
    statusMessage: string;
  };
  breakerCoordinationStatus?: 'PRELIMINARY PASS' | 'PASS' | 'FAIL' | 'WARNING';
  candidatesTested: {
    sizeMm2: number;
    baseAmpacity: number | null;
    correctedAmpacity: number;
    passedIb: boolean;
    passedIn: boolean;
    sourceStatus: string;
  }[];
}

export function sizeCableAndBreaker(input: CableSizingInput): CableSizingResult {
  const {
    designCurrentIb,
    cableRecords,
    cableType,
    ambientTempFactorCa = 1.0,
    groupingFactorCg = 1.0,
    otherFactorCi = 1.0,
    phase,
    voltage,
    voltageSource,
  } = input;

  // Voltage validation rules
  if (voltage !== undefined && voltage <= 0) {
    const errorMsg = 'INVALID_INPUT: แรงดันไฟฟ้าต้องมากกว่า 0 V';
    return {
      selectedCable: null,
      selectedBreakerRating: 0,
      correctedAmpacityIz: 0,
      baseTableAmpacity: 0,
      totalCorrectionFactor: 1.0,
      trace: createErrorTrace(errorMsg, 'INVALID_INPUT'),
      status: 'INVALID_INPUT',
      statusMessage: errorMsg,
      breakerCoordinationStatus: 'FAIL',
      candidatesTested: [],
    };
  }

  if (voltage !== undefined && voltage > 1000) {
    const hvMsg = 'แรงดันมากกว่า 1,000 V ต้องเข้าสู่กระบวนการตรวจสอบ และมาตรฐานที่เกี่ยวข้องเพิ่มเติม';
    return {
      selectedCable: null,
      selectedBreakerRating: 0,
      correctedAmpacityIz: 0,
      baseTableAmpacity: 0,
      totalCorrectionFactor: 1.0,
      trace: createErrorTrace(hvMsg, 'HIGH_VOLTAGE_REVIEW_REQUIRED'),
      status: 'HIGH_VOLTAGE_REVIEW_REQUIRED',
      statusMessage: hvMsg,
      breakerCoordinationStatus: 'FAIL',
      candidatesTested: [],
    };
  }

  const totalFactor = Number((ambientTempFactorCa * groupingFactorCg * otherFactorCi).toFixed(4));
  const reqConductors = phase === '1_PHASE' ? 2 : 3;

  // 1. Determine Breaker In
  // Standard rule: In >= Ib
  let breakerRating = input.selectedBreakerIn;
  if (!breakerRating || breakerRating < designCurrentIb) {
    breakerRating = CANDIDATE_BREAKER_RATINGS.find((r) => r >= designCurrentIb) || CANDIDATE_BREAKER_RATINGS[CANDIDATE_BREAKER_RATINGS.length - 1];
  }

  // Filter applicable cable records
  const matchingCables = cableRecords
    .filter((c) => c.cableType === cableType && c.currentCarryingConductors === reqConductors)
    .sort((a, b) => a.sizeMm2 - b.sizeMm2);

  const candidatesTested: CableSizingResult['candidatesTested'] = [];
  let foundCable: CableRecord | null = null;
  let finalIz = 0;
  let baseAmpacity = 0;

  for (const cbl of matchingCables) {
    // Standard data trust guard: unverified or null ampacity cannot be recommended
    if (cbl.ampacity === null || cbl.sourceStatus !== 'VERIFIED_STANDARD_DATA') {
      candidatesTested.push({
        sizeMm2: cbl.sizeMm2,
        baseAmpacity: cbl.ampacity,
        correctedAmpacity: 0,
        passedIb: false,
        passedIn: false,
        sourceStatus: cbl.sourceStatus,
      });
      continue;
    }

    // Ampacity Iz = Iz_table * Ca * Cg * Ci (voltage is NOT an ampacity multiplier)
    const correctedIz = Number((cbl.ampacity * totalFactor).toFixed(2));
    const passedIb = correctedIz >= designCurrentIb;
    const passedIn = correctedIz >= breakerRating;

    candidatesTested.push({
      sizeMm2: cbl.sizeMm2,
      baseAmpacity: cbl.ampacity,
      correctedAmpacity: correctedIz,
      passedIb,
      passedIn,
      sourceStatus: cbl.sourceStatus,
    });

    if (passedIb && passedIn && !foundCable) {
      foundCable = cbl;
      finalIz = correctedIz;
      baseAmpacity = cbl.ampacity;
      break;
    }
  }

  // Check result
  if (!foundCable) {
    const hasUnverified = matchingCables.some((c) => c.sourceStatus !== 'VERIFIED_STANDARD_DATA');
    const status: CalculationStatus = hasUnverified ? 'INSUFFICIENT_VERIFIED_DATA' : 'FAIL';
    const statusMsg = hasUnverified
      ? 'INSUFFICIENT VERIFIED DATA: ไม่พบข้อมูล Ampacity ที่ผ่านการตรวจสอบในมาตรฐานสำหรับเงื่อนไขนี้'
      : 'ไม่มีขนาดสายในมาตรฐานที่ทนกระแสได้ตามเงื่อนไข Ib ≤ In ≤ Iz (กรุณาพิจารณาแยกวงจรหรือใช้สายควบ)';

    const trace: CalculationTrace = {
      input: {
        'กระแสโหลดออกแบบ (Ib)': `${designCurrentIb} A`,
        'พิกัดเบรกเกอร์ (In)': `${breakerRating} A`,
        'ชนิดสายไฟ': cableType,
        'จำนวนสายนำกระแส': `${reqConductors} เส้น (${phase === '1_PHASE' ? '1Ø' : '3Ø'})`,
        'ตัวคูณอุณหภูมิ (Ca)': ambientTempFactorCa,
        'ตัวคูณกลุ่มสาย (Cg)': groupingFactorCg,
        'ตัวคูณรวม (C_total)': totalFactor,
        ...(voltage !== undefined ? {
          'Voltage': `${voltage} V (${voltageSource === 'USER_DEFINED' ? 'CUSTOM' : 'PRESET'})`,
          'Voltage Source': voltageSource || 'PRESET',
        } : {}),
      },
      formula: 'Ib ≤ In ≤ Iz โดย Iz = Iz_table × Ca × Cg × Ci',
      substitution: `Ib (${designCurrentIb} A) ≤ In (${breakerRating} A) ≤ Iz (?)`,
      result: statusMsg,
      standardReference: {
        standard: 'วสท. 022001-22',
        chapter: 'บทที่ 5',
        table: 'ตารางที่ 5-20 / 5-27 / 5-43 / 5-44',
        complianceStatus: status,
      },
      engineeringCheck: {
        cable: status === 'INSUFFICIENT_VERIFIED_DATA' ? 'INSUFFICIENT_VERIFIED_DATA' : 'FAIL',
        breaker: breakerRating >= designCurrentIb ? 'PRELIMINARY PASS' : 'FAIL',
        voltageDrop: 'NOT CHECKED',
        conduit: 'NOT CHECKED',
      },
      finalStatus: status,
      standardCheck: 'STANDARD REFERENCE: วสท. 022001-22 ตารางที่ 5-20 / 5-27 / 5-43 / 5-44',
      notes: [
        'ห้ามใช้ค่าที่ไม่ได้ผ่านการตรวจสอบมาตรฐานเป็นคำตอบวิศวกรรม',
        'ระบบทดสอบขนาดสายทั้งหมดแล้วยังไม่พบสายที่ผ่านเกณฑ์',
      ],
    };

    return {
      selectedCable: null,
      selectedBreakerRating: breakerRating,
      correctedAmpacityIz: 0,
      baseTableAmpacity: 0,
      totalCorrectionFactor: totalFactor,
      trace,
      status,
      statusMessage: statusMsg,
      breakerCoordinationStatus: 'FAIL',
      candidatesTested,
    };
  }

  // Cable Voltage Rating Check
  const voltageRatingCheck = voltage !== undefined ? checkCableVoltageRating(voltage, foundCable) : undefined;

  // Evaluation status
  const meetsIb = designCurrentIb <= breakerRating;
  const meetsIn = breakerRating <= finalIz;
  const passesCoordination = meetsIb && meetsIn;

  const breakerCoordinationStatus: 'PRELIMINARY PASS' | 'PASS' | 'FAIL' | 'WARNING' = passesCoordination
    ? 'PRELIMINARY PASS'
    : meetsIb
    ? 'WARNING'
    : 'FAIL';

  let calcStatus: CalculationStatus = 'PRELIMINARY PASS';
  let statusMsg = `Breaker Coordination: PRELIMINARY PASS (Ib = ${designCurrentIb} A, In = ${breakerRating} A, Iz = ${finalIz} A, Condition: ${designCurrentIb} <= ${breakerRating} <= ${finalIz})`;

  if (!passesCoordination) {
    calcStatus = 'FAIL';
    statusMsg = `ไม่ผ่านเงื่อนไขการประสานสัมพันธ์: ต้องเป็น Ib (${designCurrentIb} A) ≤ In (${breakerRating} A) ≤ Iz (${finalIz} A)`;
  } else if (foundCable.sourceStatus !== 'VERIFIED_STANDARD_DATA') {
    calcStatus = 'INSUFFICIENT_VERIFIED_DATA';
    statusMsg = 'INSUFFICIENT VERIFIED DATA: ข้อมูลสายไฟนี้ยังไม่ได้รับการยืนยันสถานะมาตรฐาน';
  }

  const trace: CalculationTrace = {
    input: {
      'กระแสออกแบบ (Ib)': `${designCurrentIb} A`,
      'พิกัดเบรกเกอร์ (In)': `${breakerRating} A`,
      'ขนาดสายที่แนะนำ': `${foundCable.sizeMm2} mm² (${foundCable.cableType})`,
      'พิกัดกระแสในตาราง (Iz_table)': `${baseAmpacity} A`,
      'ตัวคูณอุณหภูมิ (Ca)': ambientTempFactorCa,
      'ตัวคูณกลุ่มสาย (Cg)': groupingFactorCg,
      'ตัวคูณรวม (C_total)': totalFactor,
      ...(voltage !== undefined ? {
        'Voltage': `${voltage} V (${voltageSource === 'USER_DEFINED' ? 'CUSTOM' : 'PRESET'})`,
        'Voltage Source': voltageSource || 'PRESET',
      } : {}),
    },
    formula: 'Ib ≤ In ≤ Iz (โดย Iz = Iz_table × Ca × Cg × Ci)',
    substitution: `${designCurrentIb} A ≤ ${breakerRating} A ≤ ${finalIz} A (${baseAmpacity} × ${totalFactor})`,
    result: `เลือกสายขนาด ${foundCable.sizeMm2} mm² (พิกัดกระแสปรับแก้ Iz = ${finalIz} A, เบรกเกอร์ In = ${breakerRating} A)`,
    standardReference: {
      standard: foundCable.standard,
      chapter: foundCable.chapter,
      table: foundCable.table,
      complianceStatus: calcStatus === 'PRELIMINARY PASS' ? 'PRELIMINARY_PASS' : calcStatus,
    },
    engineeringCheck: {
      cable: passesCoordination ? 'PASS' : 'FAIL',
      breaker: breakerCoordinationStatus,
      voltageDrop: 'PENDING',
      conduit: 'PENDING',
      cableVoltageRating: voltageRatingCheck?.status,
    },
    finalStatus: 'ENGINEERING REVIEW REQUIRED',
    standardCheck: `STANDARD REFERENCE: ${foundCable.standard} ${foundCable.chapter} ${foundCable.table}`,
    reference: {
      standard: foundCable.standard,
      chapter: foundCable.chapter,
      table: foundCable.table,
      referenceNote: foundCable.referenceNote,
      sourceStatus: foundCable.sourceStatus,
    },
    notes: [
      `แหล่งอ้างอิง: ${foundCable.table} (${foundCable.referenceNote})`,
      `สถานะข้อมูลมาตรฐาน: ${foundCable.sourceStatus}`,
      'Breaker Coordination: PRELIMINARY PASS',
      `Ib = ${designCurrentIb} A, In = ${breakerRating} A, Iz = ${finalIz} A (Condition: ${designCurrentIb} <= ${breakerRating} <= ${finalIz})`,
      ...(voltageRatingCheck ? [`Cable Voltage Rating: ${voltageRatingCheck.status} - ${voltageRatingCheck.statusMessage}`] : []),
      'หมายเหตุวิศวกรรม: ผ่านการตรวจสอบขนาดสายเบื้องต้น (PRELIMINARY PASS) ยังต้องตรวจสอบ Voltage Drop และ Conduit Fill ให้ครบถ้วนก่อนรับรองมาตรฐานขั้นสุดท้าย',
    ],
  };

  return {
    selectedCable: foundCable,
    selectedBreakerRating: breakerRating,
    correctedAmpacityIz: finalIz,
    baseTableAmpacity: baseAmpacity,
    totalCorrectionFactor: totalFactor,
    trace,
    status: calcStatus,
    statusMessage: statusMsg,
    voltageRatingCheck,
    breakerCoordinationStatus,
    candidatesTested,
  };
}

/**
 * 3. Circuit Breaker Verification
 * Evaluates user-selected Breaker against Ib and Iz
 */
export interface BreakerCheckInput {
  designCurrentIb: number;
  breakerRatingIn: number;
  cableAmpacityIz: number;
}

export function checkCircuitBreaker(input: BreakerCheckInput): {
  status: CalculationStatus;
  statusMessage: string;
  trace: CalculationTrace;
} {
  const { designCurrentIb, breakerRatingIn, cableAmpacityIz } = input;

  if (breakerRatingIn <= 0) {
    return {
      status: 'FAIL',
      statusMessage: 'พิกัด Circuit Breaker ต้องมากกว่า 0 A',
      trace: createErrorTrace('พิกัดเบรกเกอร์ไม่ถูกต้อง'),
    };
  }

  const passIb = designCurrentIb <= breakerRatingIn;
  const passIz = breakerRatingIn <= cableAmpacityIz;

  let status: CalculationStatus = 'PRELIMINARY PASS';
  let breakerCoordinationStatus: 'PRELIMINARY PASS' | 'WARNING' | 'FAIL' = 'PRELIMINARY PASS';
  let statusMessage = `Breaker Coordination: PRELIMINARY PASS (Ib = ${designCurrentIb} A, In = ${breakerRatingIn} A, Iz = ${cableAmpacityIz} A, Condition: ${designCurrentIb} <= ${breakerRatingIn} <= ${cableAmpacityIz})`;

  if (!passIb && !passIz) {
    status = 'FAIL';
    breakerCoordinationStatus = 'FAIL';
    statusMessage = `ไม่ผ่านทั้งสองเงื่อนไข: In (${breakerRatingIn}A) น้อยกว่า Ib (${designCurrentIb}A) และมากกว่า Iz (${cableAmpacityIz}A)`;
  } else if (!passIb) {
    status = 'WARNING';
    breakerCoordinationStatus = 'WARNING';
    statusMessage = `คำเตือน: พิกัดเบรกเกอร์ In (${breakerRatingIn}A) น้อยกว่ากระแสโหลดออกแบบ Ib (${designCurrentIb}A) อาจเกิด Nuisance Tripping ตัดวงจรขณะใช้งานปกติ`;
  } else if (!passIz) {
    status = 'FAIL';
    breakerCoordinationStatus = 'FAIL';
    statusMessage = `อันตราย (FAIL): พิกัดเบรกเกอร์ In (${breakerRatingIn}A) มากกว่าพิกัดสาย Iz (${cableAmpacityIz}A) สายไฟอาจไหม้ก่อนที่เบรกเกอร์จะตัดวงจร`;
  }

  const trace: CalculationTrace = {
    input: {
      'กระแสโหลดออกแบบ (Ib)': `${designCurrentIb} A`,
      'พิกัด Circuit Breaker (In)': `${breakerRatingIn} A`,
      'พิกัดสายหลังปรับแก้ (Iz)': `${cableAmpacityIz} A`,
    },
    formula: 'Ib ≤ In ≤ Iz',
    substitution: `${designCurrentIb} A ≤ ${breakerRatingIn} A ≤ ${cableAmpacityIz} A`,
    result: `Breaker Coordination: ${status} (Ib = ${designCurrentIb} A, In = ${breakerRatingIn} A, Iz = ${cableAmpacityIz} A)`,
    standardReference: {
      standard: 'วสท. 022001-22',
      chapter: 'บทที่ 3 และบทที่ 5',
      table: 'ข้อกำหนดการป้องกันกระแสเกินและการประสานสัมพันธ์',
      complianceStatus: status === 'PRELIMINARY PASS' ? 'PRELIMINARY_PASS' : status,
    },
    engineeringCheck: {
      cable: cableAmpacityIz >= breakerRatingIn ? 'PASS' : 'FAIL',
      breaker: breakerCoordinationStatus,
      voltageDrop: 'NOT CHECKED',
      conduit: 'NOT CHECKED',
    },
    finalStatus: status === 'PRELIMINARY PASS' ? 'ENGINEERING REVIEW REQUIRED' : status,
    standardCheck: 'STANDARD REFERENCE: วสท. 022001-22 ข้อกำหนดการป้องกันกระแสเกินและการประสานสัมพันธ์',
    notes: [
      'Breaker Coordination: PRELIMINARY PASS',
      `Ib = ${designCurrentIb} A`,
      `In = ${breakerRatingIn} A`,
      `Iz = ${cableAmpacityIz} A`,
      `Condition: ${designCurrentIb} <= ${breakerRatingIn} <= ${cableAmpacityIz}`,
      passIb ? '✓ In >= Ib: เบรกเกอร์ไม่ตัดวงจรขณะทำงานที่กระแสปกติ' : '✗ In < Ib: เสี่ยงตัดวงจรพร่ำเพรื่อ',
      passIz ? '✓ In <= Iz: สายไฟได้รับการป้องกันอย่างปลอดภัยเมื่อเกิดโหลดเกิน' : '✗ In > Iz: อันตราย! เบรกเกอร์ไม่ป้องกันสายไฟ',
    ],
  };

  return { status, statusMessage, trace };
}

/**
 * 4. Voltage Drop Calculation
 * Single Phase: dV = 2 * I * L * (R cos(phi) + X sin(phi)) / 1000
 * Three Phase:  dV = sqrt(3) * I * L * (R cos(phi) + X sin(phi)) / 1000
 * %VD = (dV / V) * 100
 */
export interface VoltageDropInput {
  currentA: number;
  lengthMeters: number;
  voltageV: number;
  voltageSource?: VoltageSource;
  powerFactor: number;
  resistanceOhmPerKm: number; // R
  reactanceOhmPerKm: number;  // X
  phase: PhaseType;
}

export interface VoltageDropResult {
  voltageDropV: number;
  voltageDropPercent: number;
  maxRecommendedPercent: number;
  status: CalculationStatus;
  statusMessage: string;
  trace: CalculationTrace;
  validationError?: string;
}

export function calculateVoltageDrop(input: VoltageDropInput): VoltageDropResult {
  const {
    currentA,
    lengthMeters,
    voltageV,
    voltageSource = 'PRESET',
    powerFactor,
    resistanceOhmPerKm,
    reactanceOhmPerKm,
    phase,
  } = input;

  if (voltageV <= 0) {
    const errorMsg = 'INVALID_INPUT: แรงดันไฟฟ้าต้องมากกว่า 0 V';
    return {
      voltageDropV: 0,
      voltageDropPercent: 0,
      maxRecommendedPercent: 3.0,
      status: 'INVALID_INPUT',
      statusMessage: errorMsg,
      validationError: errorMsg,
      trace: createErrorTrace(errorMsg, 'INVALID_INPUT'),
    };
  }

  if (voltageV > 1000) {
    const hvMsg = 'แรงดันมากกว่า 1,000 V ต้องเข้าสู่กระบวนการตรวจสอบ และมาตรฐานที่เกี่ยวข้องเพิ่มเติม';
    return {
      voltageDropV: 0,
      voltageDropPercent: 0,
      maxRecommendedPercent: 3.0,
      status: 'HIGH_VOLTAGE_REVIEW_REQUIRED',
      statusMessage: hvMsg,
      validationError: hvMsg,
      trace: createErrorTrace(hvMsg, 'HIGH_VOLTAGE_REVIEW_REQUIRED'),
    };
  }

  if (currentA <= 0 || lengthMeters < 0 || powerFactor <= 0 || powerFactor > 1) {
    return {
      voltageDropV: 0,
      voltageDropPercent: 0,
      maxRecommendedPercent: 3.0,
      status: 'FAIL',
      statusMessage: 'ข้อมูลสำหรับคำนวณแรงดันตกไม่ถูกต้อง',
      validationError: 'ตรวจสอบว่า Current > 0, Length >= 0, 0 < PF <= 1',
      trace: createErrorTrace('พารามิเตอร์คำนวณ Voltage Drop ไม่ถูกต้อง', 'FAIL'),
    };
  }

  // sin(phi) = sqrt(1 - PF^2)
  const cosPhi = powerFactor;
  const sinPhi = Math.sqrt(Math.max(0, 1 - Math.pow(powerFactor, 2)));

  // Effective impedance Z_eff = R cos(phi) + X sin(phi) in Ohm/km
  const zEffOhmPerKm = resistanceOhmPerKm * cosPhi + reactanceOhmPerKm * sinPhi;

  // L in km = lengthMeters / 1000
  const lengthKm = lengthMeters / 1000;

  let voltageDropV = 0;
  let formula = '';
  let substitution = '';

  if (phase === '1_PHASE') {
    voltageDropV = 2 * currentA * lengthKm * zEffOhmPerKm;
    formula = 'ΔV = 2 × I × L × (R cosφ + X sinφ)';
    substitution = `ΔV = 2 × ${currentA} × (${lengthMeters}/1000) × (${resistanceOhmPerKm}×${cosPhi.toFixed(3)} + ${reactanceOhmPerKm}×${sinPhi.toFixed(3)}) = ${voltageDropV.toFixed(2)} V`;
  } else {
    voltageDropV = Math.sqrt(3) * currentA * lengthKm * zEffOhmPerKm;
    formula = 'ΔV = √3 × I × L × (R cosφ + X sinφ)';
    substitution = `ΔV = 1.732 × ${currentA} × (${lengthMeters}/1000) × (${resistanceOhmPerKm}×${cosPhi.toFixed(3)} + ${reactanceOhmPerKm}×${sinPhi.toFixed(3)}) = ${voltageDropV.toFixed(2)} V`;
  }

  const voltageDropPercent = (voltageDropV / voltageV) * 100;
  const maxRecommendedPercent = 3.0; // Standard branch circuit recommendation ( วสท. 022001-22 )

  let status: CalculationStatus = 'PASS';
  let statusMessage = `แรงดันตก ${voltageDropPercent.toFixed(2)}% อยู่ในเกณฑ์แนะนำของ วสท. (≤ ${maxRecommendedPercent}%)`;

  if (voltageDropPercent > 5.0) {
    status = 'FAIL';
    statusMessage = `แรงดันตกเกิน 5.0% (${voltageDropPercent.toFixed(2)}%) เกินเกณฑ์สูงสุดที่ยอมรับได้ในระบบไฟฟ้าตามมาตรฐาน วสท.`;
  } else if (voltageDropPercent > maxRecommendedPercent) {
    status = 'WARNING';
    statusMessage = `แรงดันตก ${voltageDropPercent.toFixed(2)}% เกินเกณฑ์แนะนำ 3% ของวงจรย่อย แต่ยังไม่เกิน 5% รวมระบบ`;
  }

  const trace: CalculationTrace = {
    input: {
      'Voltage': `${voltageV} V (${voltageSource === 'USER_DEFINED' ? 'CUSTOM' : 'PRESET'})`,
      'Voltage Source': voltageSource,
      'กระแสไฟฟ้า (I)': `${currentA} A`,
      'ความยาวสาย (L)': `${lengthMeters} ม.`,
      'Power Factor (cosφ)': powerFactor,
      'ความต้านทานสาย (R)': `${resistanceOhmPerKm} Ω/km`,
      'รีแอกแตนซ์สาย (X)': `${reactanceOhmPerKm} Ω/km`,
      'ระบบไฟฟ้า (Phase)': phase === '1_PHASE' ? '1 Phase' : '3 Phase',
    },
    formula,
    substitution,
    result: `แรงดันตก = ${voltageDropV.toFixed(2)} V (${voltageDropPercent.toFixed(2)}%)`,
    standardReference: {
      standard: 'วสท. 022001-22',
      chapter: 'บทที่ 3 และบทที่ 5',
      complianceStatus: status === 'PASS' ? 'VERIFIED_COMPLIANT' : status,
    },
    engineeringCheck: {
      cable: 'NOT CHECKED',
      breaker: 'NOT CHECKED',
      voltageDrop: status === 'PASS' ? 'PASS' : status === 'WARNING' ? 'NOT CHECKED' : 'FAIL',
      conduit: 'NOT CHECKED',
    },
    finalStatus: status === 'PASS' ? 'ENGINEERING REVIEW REQUIRED' : status,
    standardCheck: 'STANDARD REFERENCE: วสท. 022001-22 แนะนำแรงดันตกไม่เกิน 3% สำหรับวงจรย่อย และไม่เกิน 5% สำหรับทั้งระบบ',
    notes: [
      `sinφ = √(1 - cos²φ) = ${sinPhi.toFixed(4)}`,
      `Effective Impedance = ${zEffOhmPerKm.toFixed(4)} Ω/km`,
      `%VD = (ΔV / V) × 100 = (${voltageDropV.toFixed(2)} / ${voltageV}) × 100 = ${voltageDropPercent.toFixed(2)}%`,
    ],
  };

  return {
    voltageDropV: Number(voltageDropV.toFixed(2)),
    voltageDropPercent: Number(voltageDropPercent.toFixed(2)),
    maxRecommendedPercent,
    status,
    statusMessage,
    trace,
  };
}

/**
 * 5. Conduit Sizing & Conduit Fill Engine
 * A_total = sum(A_cable)
 * Fill% = (A_total / A_conduit) * 100
 * Reads allowable limits from Standards Database: Table 5-3
 */
export interface ConduitFillInput {
  cables: {
    cableRecord: CableRecord;
    quantity: number;
  }[];
  conduit: ConduitRecord;
}

export interface ConduitFillResult {
  totalCableAreaMm2: number;
  conduitInternalAreaMm2: number;
  fillPercentage: number;
  maxAllowedPercentage: number;
  totalConductors: number;
  status: CalculationStatus;
  statusMessage: string;
  trace: CalculationTrace;
}

export function calculateConduitFill(input: ConduitFillInput): ConduitFillResult {
  const { cables, conduit } = input;

  let totalConductors = 0;
  let totalCableAreaMm2 = 0;

  const cableBreakdown: string[] = [];

  for (const item of cables) {
    totalConductors += item.quantity;
    const itemTotalArea = item.cableRecord.approxAreaMm2 * item.quantity;
    totalCableAreaMm2 += itemTotalArea;
    cableBreakdown.push(
      `${item.cableRecord.sizeMm2} mm² (${item.quantity} เส้น): เส้นผ่าศูนย์กลาง ~${item.cableRecord.approxOverallDiameterMm} mm, พท. ${itemTotalArea.toFixed(1)} mm²`
    );
  }

  // Get allowed fill dynamically from Standards Database (Table 5-3)
  const fillRule = getConduitFillLimit(totalConductors);
  const maxAllowedPercentage = fillRule.allowablePercent;

  const conduitArea = conduit.internalAreaMm2;
  const fillPercentage = conduitArea > 0 ? (totalCableAreaMm2 / conduitArea) * 100 : 0;

  const passed = fillPercentage <= maxAllowedPercentage;
  let status: CalculationStatus = passed ? 'PASS' : 'FAIL';
  let statusMessage = passed
    ? `ผ่านเกณฑ์: การใช้พื้นที่ภายในท่อ ${fillPercentage.toFixed(1)}% ไม่เกินเกณฑ์สูงสุด ${maxAllowedPercentage}% (วสท. ตารางที่ 5-3)`
    : `ไม่ผ่านเกณฑ์: การใช้พื้นที่ภายในท่อ ${fillPercentage.toFixed(1)}% เกินเกณฑ์สูงสุด ${maxAllowedPercentage}% (ต้องขยายขนาดท่อ)`;

  // Data trust verification: cannot return PASS if unverified data exists
  const hasUnverifiedCable = cables.some((c) => c.cableRecord.sourceStatus !== 'VERIFIED_STANDARD_DATA');
  const isConduitUnverified = conduit.sourceStatus !== 'VERIFIED_STANDARD_DATA';
  if (hasUnverifiedCable || isConduitUnverified) {
    status = 'INSUFFICIENT_VERIFIED_DATA';
    statusMessage = 'INSUFFICIENT VERIFIED DATA: สายไฟหรือท่อร้อยสายยังไม่ได้รับการยืนยันสถานะมาตรฐาน (ห้ามใช้เป็น engineering recommendation)';
  }

  const trace: CalculationTrace = {
    input: {
      'ชนิดท่อร้อยสาย': `${conduit.type} ${conduit.nominalSizeInch} (${conduit.nominalSizeMm} mm)`,
      'เส้นผ่านศูนย์กลางภายในท่อ (ID)': `${conduit.insideDiameterMm} mm`,
      'พื้นที่หน้าตัดภายในท่อ (A_conduit)': `${conduitArea.toFixed(1)} mm²`,
      'จำนวนสายทั้งหมด': `${totalConductors} เส้น`,
      'พื้นที่หน้าตัดสายรวม (A_cables)': `${totalCableAreaMm2.toFixed(1)} mm²`,
      'เกณฑ์สูงสุดที่ยอมรับได้ (ตาราง 5-3)': `${maxAllowedPercentage}%`,
    },
    formula: 'Fill% = (Σ A_cables / A_conduit) × 100 ≤ Max_Allowable_Fill%',
    substitution: `Fill% = (${totalCableAreaMm2.toFixed(1)} / ${conduitArea.toFixed(1)}) × 100 = ${fillPercentage.toFixed(1)}% (เกณฑ์สูงสุด ${maxAllowedPercentage}%)`,
    result: `อัตราร้อยสาย = ${fillPercentage.toFixed(1)}% (ผลลัพธ์: ${status})`,
    standardReference: {
      standard: 'วสท. 022001-22',
      chapter: 'บทที่ 5 การเดินสายและช่องเดินสาย',
      table: 'ตารางที่ 5-3',
      complianceStatus: status === 'PASS' ? 'VERIFIED_COMPLIANT' : status,
    },
    engineeringCheck: {
      cable: hasUnverifiedCable ? 'INSUFFICIENT_VERIFIED_DATA' : 'PASS',
      breaker: 'NOT CHECKED',
      voltageDrop: 'NOT CHECKED',
      conduit: status === 'PASS' ? 'PASS' : status === 'INSUFFICIENT_VERIFIED_DATA' ? 'INSUFFICIENT_VERIFIED_DATA' : 'FAIL',
    },
    finalStatus: status === 'PASS' ? 'ENGINEERING REVIEW REQUIRED' : status,
    standardCheck: `STANDARD REFERENCE: วสท. 022001-22 บทที่ 5 ตารางที่ 5-3`,
    reference: {
      standard: conduit.standard,
      chapter: conduit.chapter,
      table: conduit.table,
      referenceNote: conduit.referenceNote,
      sourceStatus: conduit.sourceStatus,
    },
    notes: [
      `เกณฑ์ วสท. ตารางที่ 5-3: สาย ${totalConductors} เส้น ยอมให้ใช้พื้นที่ได้สูงสุด ${maxAllowedPercentage}% (${fillRule.note})`,
      ...cableBreakdown,
    ],
  };

  return {
    totalCableAreaMm2: Number(totalCableAreaMm2.toFixed(2)),
    conduitInternalAreaMm2: Number(conduitArea.toFixed(2)),
    fillPercentage: Number(fillPercentage.toFixed(1)),
    maxAllowedPercentage,
    totalConductors,
    status,
    statusMessage,
    trace,
  };
}

/**
 * 6. Cable Voltage Rating Check
 * Requirement:
 * - Verify system voltage against cable rated voltage
 * - systemVoltage > cable.voltageRatingV => REVIEW REQUIRED
 * - systemVoltage <= cable.voltageRatingV => PASS
 * - no voltage rating data in database => NOT VERIFIED
 */
export function checkCableVoltageRating(
  systemVoltageV: number,
  cable: CableRecord | null
): {
  status: CableVoltageRatingStatus;
  cableRatingV?: number;
  systemVoltageV: number;
  statusMessage: string;
} {
  if (!cable || cable.voltageRatingV === undefined || cable.voltageRatingV === null) {
    return {
      status: 'NOT VERIFIED',
      systemVoltageV,
      statusMessage: 'ไม่มีข้อมูลแรงดันพิกัดของสายในฐานข้อมูล (NOT VERIFIED)',
    };
  }

  if (systemVoltageV > cable.voltageRatingV) {
    return {
      status: 'REVIEW REQUIRED',
      cableRatingV: cable.voltageRatingV,
      systemVoltageV,
      statusMessage: `แรงดันระบบ (${systemVoltageV} V) สูงกว่าพิกัดสาย (${cable.voltageRatingV} V) - REVIEW REQUIRED`,
    };
  }

  return {
    status: 'PASS',
    cableRatingV: cable.voltageRatingV,
    systemVoltageV,
    statusMessage: `แรงดันระบบ (${systemVoltageV} V) ไม่เกินพิกัดแรงดันสาย (${cable.voltageRatingV} V)`,
  };
}

/**
 * 7. Final Engineering Status Engine
 * Requirement 8:
 * - ห้ามแสดง PASS (ผ่านเกณฑ์) ถ้ายังมีรายการใดเป็น:
 *   PENDING, NOT CHECKED, NOT VERIFIED, REVIEW REQUIRED
 * - Final Status ต้องเป็น: ENGINEERING REVIEW REQUIRED หรือ: INCOMPLETE ENGINEERING CHECK
 * - ให้ PASS ได้เฉพาะเมื่อ Required Engineering Checks ทั้งหมดมีผลเป็น PASS
 *   และข้อมูลมาตรฐานที่ใช้มีสถานะ VERIFIED_STANDARD_DATA
 */
export interface FinalEngineeringCheckInput {
  cableStatus?: string;
  breakerStatus?: string;
  voltageDropStatus?: string;
  conduitStatus?: string;
  cableVoltageRatingStatus: CableVoltageRatingStatus;
  standardDataStatuses?: SourceStatus[];
}

export function calculateFinalEngineeringStatus(input: FinalEngineeringCheckInput): CalculationStatus {
  const {
    cableStatus = 'NOT CHECKED',
    breakerStatus = 'NOT CHECKED',
    voltageDropStatus = 'NOT CHECKED',
    conduitStatus = 'NOT CHECKED',
    cableVoltageRatingStatus,
    standardDataStatuses = [],
  } = input;

  const checks: string[] = [
    cableStatus,
    breakerStatus,
    voltageDropStatus,
    conduitStatus,
    cableVoltageRatingStatus,
  ];

  // 1. Any FAIL leads to immediate FAIL
  if (checks.some((s) => s === 'FAIL')) {
    return 'FAIL';
  }

  // 2. Data Trust check: Standard data sources must all be VERIFIED_STANDARD_DATA
  if (standardDataStatuses.length > 0) {
    const hasUnverified = standardDataStatuses.some((st) => st !== 'VERIFIED_STANDARD_DATA');
    if (hasUnverified) {
      return 'INSUFFICIENT_VERIFIED_DATA';
    }
  }

  // If any check explicitly flagged unverified / insufficient verified data
  if (
    checks.some(
      (s) =>
        s === 'INSUFFICIENT_VERIFIED_DATA' ||
        s === 'INSUFFICIENT VERIFIED DATA' ||
        s === 'NOT VERIFIED'
    ) ||
    cableVoltageRatingStatus === 'NOT VERIFIED'
  ) {
    return 'INSUFFICIENT_VERIFIED_DATA';
  }

  // 3. Required checks completeness:
  // All 5 required stages (Cable, Breaker, Cable Voltage Rating, Voltage Drop, Conduit) must be evaluated.
  // Missing cableVoltageRatingStatus (undefined) cannot be PASS -> ENGINEERING REVIEW REQUIRED
  if (!cableVoltageRatingStatus) {
    return 'ENGINEERING REVIEW REQUIRED';
  }

  // Any pending, not checked, review required, preliminary pass, warning, etc.
  const incompleteStatuses = [
    'PENDING',
    'NOT CHECKED',
    'REVIEW REQUIRED',
    'PRELIMINARY PASS',
    'PRELIMINARY_PASS',
    'WARNING',
    'CALCULATED',
    'CALCULATION COMPLETE',
    'REFERENCE ONLY',
  ];

  if (checks.some((s) => incompleteStatuses.includes(s))) {
    return 'ENGINEERING REVIEW REQUIRED';
  }

  // Cable Voltage Rating must specifically be PASS
  if (cableVoltageRatingStatus !== 'PASS') {
    return 'ENGINEERING REVIEW REQUIRED';
  }

  // 4. All required checks must be PASS
  const allRequiredPassed =
    cableStatus === 'PASS' &&
    breakerStatus === 'PASS' &&
    voltageDropStatus === 'PASS' &&
    conduitStatus === 'PASS' &&
    cableVoltageRatingStatus === 'PASS';

  return allRequiredPassed ? 'PASS' : 'ENGINEERING REVIEW REQUIRED';
}

function createErrorTrace(reason: string, status: CalculationStatus = 'FAIL'): CalculationTrace {
  return {
    input: { ข้อผิดพลาด: reason },
    formula: '-',
    substitution: '-',
    result: reason,
    standardReference: {
      standard: 'วสท. 022001-22',
      complianceStatus: status,
    },
    engineeringCheck: {
      cable: status === 'INVALID_INPUT' || status === 'HIGH_VOLTAGE_REVIEW_REQUIRED' ? 'NOT CHECKED' : 'FAIL',
      breaker: 'NOT CHECKED',
      voltageDrop: 'NOT CHECKED',
      conduit: 'NOT CHECKED',
    },
    standardCheck: 'การตรวจสอบข้อมูลนำเข้า',
    finalStatus: status,
    notes: [reason],
  };
}

function createDefaultMultiStageStatus(status: 'FAIL' | 'CALCULATED'): MultiStageStatus {
  return {
    calculationStatus: status,
    standardStatus: 'REFERENCE ONLY',
    cableStatus: status === 'FAIL' ? 'FAIL' : 'NOT CHECKED',
    breakerStatus: status === 'FAIL' ? 'FAIL' : 'NOT CHECKED',
    voltageDropStatus: status === 'FAIL' ? 'FAIL' : 'NOT CHECKED',
    conduitStatus: status === 'FAIL' ? 'FAIL' : 'NOT CHECKED',
    finalStatus: status === 'FAIL' ? 'FAIL' : 'ENGINEERING REVIEW REQUIRED',
  };
}
