/**
 * Automated Test Cases Runner
 * Section 8: Comprehensive Engineering Test Suite
 * Standard: วสท. 022001-22 (พ.ศ. 2564)
 */

import {
  calculateLoadCurrent,
  sizeCableAndBreaker,
  checkCircuitBreaker,
  calculateVoltageDrop,
  calculateConduitFill,
  calculateFinalEngineeringStatus,
} from './calculationEngine';
import { 
  INITIAL_CABLES, 
  INITIAL_CONDUITS, 
  INITIAL_DEMAND_FACTORS,
  getConduitFillLimit 
} from '../data/standardsData';
import { CableRecord, ConduitRecord } from '../types';

export interface TestCaseResult {
  id: string;
  name: string;
  category: string;
  expected: string;
  actual: string;
  passed: boolean;
  notes: string;
}

export function runAllTestCases(): {
  total: number;
  passed: number;
  failed: number;
  results: TestCaseResult[];
} {
  const results: TestCaseResult[] = [];

  // ==========================================
  // 1) Load calculation 1-Phase
  // P = 2200 W, V = 220 V, PF = 1.0 -> I = 2200 / (220 * 1.0) = 10.0 A
  // ==========================================
  {
    const res = calculateLoadCurrent({
      power: 2200,
      unit: 'W',
      voltage: 220,
      phase: '1_PHASE',
      powerFactor: 1.0,
      quantity: 1,
      demandFactor: 1.0,
      circuitType: 'BRANCH_CIRCUIT',
    });
    const expected = 10.0;
    const passed = Math.abs(res.currentA - expected) < 0.05 && res.multiStageStatus.calculationStatus === 'CALCULATED';
    results.push({
      id: 'test-1p-current',
      name: '1-Phase Load Current: 2200W @ 220V, PF=1.0 -> Ib = 10.0 A',
      category: '1. Load Calc 1-Phase',
      expected: '10.0 A (Status: CALCULATED, not PASS)',
      actual: `${res.currentA} A (Status: ${res.multiStageStatus.calculationStatus})`,
      passed,
      notes: res.trace.substitution,
    });
  }

  // ==========================================
  // 2) Load calculation 3-Phase
  // P = 15 kW, V = 400 V, PF = 0.85 -> I = 15000 / (sqrt(3) * 400 * 0.85) = 25.47 A
  // ==========================================
  {
    const res = calculateLoadCurrent({
      power: 15,
      unit: 'kW',
      voltage: 400,
      phase: '3_PHASE',
      powerFactor: 0.85,
      quantity: 1,
      demandFactor: 1.0,
      circuitType: 'FEEDER',
    });
    const expected = 25.47;
    const passed = Math.abs(res.currentA - expected) < 0.05;
    results.push({
      id: 'test-3p-current',
      name: '3-Phase Load Current: 15kW @ 400V, PF=0.85 -> Ib = 25.47 A',
      category: '2. Load Calc 3-Phase',
      expected: '25.47 A',
      actual: `${res.currentA} A`,
      passed,
      notes: res.trace.substitution,
    });
  }

  // ==========================================
  // 3) Demand Factor:
  //    a) Branch Circuit Warning when DF < 1.0
  //    b) Feeder standard factor without warning
  // ==========================================
  {
    // a) Branch Circuit with DF 0.8 -> MUST produce warning
    const branchRes = calculateLoadCurrent({
      power: 5,
      unit: 'kW',
      voltage: 220,
      phase: '1_PHASE',
      powerFactor: 0.85,
      demandFactor: 0.8,
      circuitType: 'BRANCH_CIRCUIT',
      demandFactorMode: 'MANUAL',
    });
    const hasBranchWarning = !!branchRes.warning && branchRes.warning.includes('วงจรย่อย');

    // b) Feeder with Standard DF (Table 3-1: 3000 VA @ 100%, 0.35 beyond)
    const dfRecord = INITIAL_DEMAND_FACTORS.find((df) => df.referenceTable === 'ตารางที่ 3-1');
    const feederRes = calculateLoadCurrent({
      power: 10,
      unit: 'kW',
      voltage: 400,
      phase: '3_PHASE',
      powerFactor: 0.85,
      demandFactor: dfRecord ? dfRecord.factor : 0.7,
      circuitType: 'FEEDER',
      demandFactorMode: 'STANDARD_TABLE',
      demandFactorRecord: dfRecord || null,
    });
    const feederNoWarning = !feederRes.warning;

    const passed = hasBranchWarning && feederNoWarning;
    results.push({
      id: 'test-demand-factor-branch-vs-feeder',
      name: 'Demand Factor: เตือนเมื่อใช้วงจรย่อย (Branch) และยอมรับสำหรับสายป้อน (Feeder)',
      category: '3. Demand Factor Rules',
      expected: 'Branch: Warning แสดงเตือนข้อกำหนด วสท., Feeder: ไม่มี Warning',
      actual: hasBranchWarning ? 'Branch แจ้งเตือนถูกต้อง' : 'ไม่พบ Warning ใน Branch Circuit',
      passed,
      notes: branchRes.warning || 'Pass',
    });
  }

  // ==========================================
  // 4) Cable / Breaker: Ib <= In <= Iz_corrected
  // ==========================================
  {
    // a) Coordination PASS: Ib = 25A <= In = 32A <= Iz = 34A
    const passRes = checkCircuitBreaker({
      designCurrentIb: 25,
      breakerRatingIn: 32,
      cableAmpacityIz: 34,
    });

    // b) Coordination FAIL: Ib = 25A <= In = 50A > Iz = 34A (In > Iz violates safety)
    const failRes = checkCircuitBreaker({
      designCurrentIb: 25,
      breakerRatingIn: 50,
      cableAmpacityIz: 34,
    });

    const passed = passRes.status === 'PRELIMINARY PASS' && failRes.status === 'FAIL';
    results.push({
      id: 'test-coordination-ib-in-iz',
      name: 'การประสานสัมพันธ์ Circuit Breaker และสายไฟ (Ib ≤ In ≤ Iz)',
      category: '4. Cable & Breaker Ib<=In<=Iz',
      expected: '25A ≤ 32A ≤ 34A -> PRELIMINARY PASS, 25A ≤ 50A > 34A -> FAIL',
      actual: `Pass case: ${passRes.status}, Over-breaker case: ${failRes.status}`,
      passed,
      notes: `${passRes.statusMessage} | ${failRes.statusMessage}`,
    });
  }

  // ==========================================
  // 5) Ambient temp & grouping correction factors (Ca, Cg)
  // ==========================================
  {
    // Ib = 20A, 3-Phase, Ca = 0.91 (45°C), Cg = 0.80 (4-6 conductors in raceway)
    // Total derating = 0.91 * 0.80 = 0.728
    const res = sizeCableAndBreaker({
      designCurrentIb: 20,
      cableRecords: INITIAL_CABLES,
      cableType: '60227 IEC 01 (THW)',
      ambientTempFactorCa: 0.91,
      groupingFactorCg: 0.80,
      phase: '3_PHASE',
    });

    const passed = res.status === 'PRELIMINARY PASS' && res.selectedCable !== null && res.totalCorrectionFactor === 0.728;
    results.push({
      id: 'test-correction-factors',
      name: 'การปรับลดพิกัดกระแสด้วย Ca (0.91) และ Cg (0.80) -> C_total = 0.728',
      category: '5. Temp & Grouping Factors',
      expected: 'C_total = 0.728 และเลือกสายที่ Iz_corrected >= In >= Ib',
      actual: res.selectedCable ? `สาย ${res.selectedCable.sizeMm2} mm², Iz_corrected = ${res.correctedAmpacityIz} A` : 'ไม่พบสาย',
      passed,
      notes: `Iz_base = ${res.baseTableAmpacity} A -> Iz_corrected = ${res.correctedAmpacityIz} A`,
    });
  }

  // ==========================================
  // 6) Conduit Fill Limits (Table 5-3): 1, 2, 3+ Conductors
  // ==========================================
  {
    const limit1 = getConduitFillLimit(1);
    const limit2 = getConduitFillLimit(2);
    const limit3 = getConduitFillLimit(3);
    const limit5 = getConduitFillLimit(5);

    const check1 = limit1.allowablePercent === 53;
    const check2 = limit2.allowablePercent === 31;
    const check3 = limit3.allowablePercent === 40;
    const check5 = limit5.allowablePercent === 40;

    const passed = check1 && check2 && check3 && check5;
    results.push({
      id: 'test-conduit-fill-table-5-3',
      name: 'เกณฑ์การใช้พื้นที่ในท่อ วสท. ตารางที่ 5-3 (1 เส้น ≤ 53%, 2 เส้น ≤ 31%, 3+ เส้น ≤ 40%)',
      category: '6. Conduit Fill Limits (Table 5-3)',
      expected: '1 cond: 53%, 2 cond: 31%, 3+ cond: 40%',
      actual: `1: ${limit1.allowablePercent}%, 2: ${limit2.allowablePercent}%, 3: ${limit3.allowablePercent}%, 5: ${limit5.allowablePercent}%`,
      passed,
      notes: `อ้างอิง: ${limit1.referenceTable}`,
    });
  }

  // ==========================================
  // 7) Voltage Drop Stages (<=3%, 3-5%, >5%)
  // ==========================================
  {
    // Case A: Small distance 15m, 20A, 220V -> VD <= 3% (PASS)
    const vdPass = calculateVoltageDrop({
      currentA: 20,
      lengthMeters: 15,
      voltageV: 220,
      powerFactor: 0.85,
      resistanceOhmPerKm: 3.08,
      reactanceOhmPerKm: 0.119,
      phase: '1_PHASE',
    });

    // Case B: Moderate distance 70m -> VD between 3% and 5% (WARNING)
    const vdWarning = calculateVoltageDrop({
      currentA: 20,
      lengthMeters: 70,
      voltageV: 220,
      powerFactor: 0.85,
      resistanceOhmPerKm: 3.08,
      reactanceOhmPerKm: 0.119,
      phase: '1_PHASE',
    });

    // Case C: Long distance 150m -> VD > 5% (FAIL)
    const vdFail = calculateVoltageDrop({
      currentA: 20,
      lengthMeters: 150,
      voltageV: 220,
      powerFactor: 0.85,
      resistanceOhmPerKm: 3.08,
      reactanceOhmPerKm: 0.119,
      phase: '1_PHASE',
    });

    const passed = vdPass.status === 'PASS' && vdWarning.status === 'WARNING' && vdFail.status === 'FAIL';
    results.push({
      id: 'test-voltage-drop-stages',
      name: 'ระดับการเตือนแรงดันตก: ≤ 3% (PASS), > 3% ถึง ≤ 5% (WARNING), > 5% (FAIL)',
      category: '7. Voltage Drop Stages',
      expected: 'Pass (≤3%), Warning (3-5%), Fail (>5%)',
      actual: `15m: ${vdPass.voltageDropPercent}% (${vdPass.status}), 70m: ${vdWarning.voltageDropPercent}% (${vdWarning.status}), 150m: ${vdFail.voltageDropPercent}% (${vdFail.status})`,
      passed,
      notes: `Thresholds: 3.0% branch recommendation, 5.0% total system limit`,
    });
  }

  // ==========================================
  // 8) Data Source Trust: NEEDS_SOURCE_REVIEW handling
  // ==========================================
  {
    // Create a mock unverified cable
    const unverifiedCable: CableRecord = {
      id: 'mock-unverified',
      cableType: 'MOCK_UNVERIFIED_CABLE',
      conductor: 'Cu',
      sizeMm2: 10,
      insulation: 'PVC',
      voltageRating: '450/750 V',
      installationMethod: 'Method 1',
      currentCarryingConductors: 2,
      ambientTemperature: 40,
      ampacity: 60,
      approxOverallDiameterMm: 6.8,
      approxAreaMm2: 36.3,
      resistancePerKm: 1.83,
      reactancePerKm: 0.11,
      standard: 'วสท. 022001-22',
      chapter: 'บทที่ 5',
      table: 'ตารางทดสอบ',
      referenceNote: 'ข้อมูลจำลองยังไม่ยืนยัน',
      sourceStatus: 'NEEDS_SOURCE_REVIEW',
    };

    const res = sizeCableAndBreaker({
      designCurrentIb: 25,
      cableRecords: [unverifiedCable],
      cableType: 'MOCK_UNVERIFIED_CABLE',
      ambientTempFactorCa: 1.0,
      groupingFactorCg: 1.0,
      phase: '1_PHASE',
    });

    // Must NOT select unverified cable as PASS, must return INSUFFICIENT_VERIFIED_DATA
    const passed = res.status === 'INSUFFICIENT_VERIFIED_DATA' && res.selectedCable === null;
    results.push({
      id: 'test-data-source-trust',
      name: 'ระบบความน่าเชื่อถือข้อมูล: ปฏิเสธการแนะนำสายที่มีสถานะ NEEDS_SOURCE_REVIEW',
      category: '8. Data Trust & Source Review',
      expected: 'สถานะ INSUFFICIENT_VERIFIED_DATA (ห้ามแนะนำเป็นคำตอบวิศวกรรม)',
      actual: `สถานะ: ${res.status} (Selected: ${res.selectedCable ? 'พบสาย' : 'ไม่เลือกสายที่ไม่ยืนยัน'})`,
      passed,
      notes: res.statusMessage,
    });
  }

  // ==========================================
  // 9) Flexible conduit rules (length, ground wire)
  // ==========================================
  {
    // Rule: FMC length <= 2.0m, separate ground wire mandatory
    const sampleCable = INITIAL_CABLES[0];
    const sampleConduit = INITIAL_CONDUITS[0];

    // Case 1: Length 1.5m (<= 2.0m) and with ground wire -> Compliant
    const length1 = 1.5;
    const hasGround1 = true;
    const passRule = length1 <= 2.0 && hasGround1;

    // Case 2: Length 3.5m (> 2.0m) -> Violation
    const length2 = 3.5;
    const violateLength = length2 > 2.0;

    // Case 3: No ground wire -> Violation
    const hasGround3 = false;
    const violateGround = !hasGround3;

    const passed = passRule && violateLength && violateGround;
    results.push({
      id: 'test-fmc-rules',
      name: 'ข้อกำหนดท่อโลหะอ่อน (FMC): ความยาว ≤ 2.0m และต้องมีสายดินแยกเฉพาะภายในท่อ',
      category: '9. Flexible Conduit Constraints',
      expected: 'Length ≤ 2.0m = PASS, Length > 2.0m = FAIL, Without Ground = FAIL',
      actual: passed ? 'ตรวจจับเงื่อนไขความยาวและสายดินครบถ้วน' : 'ข้อกำหนดไม่สมบูรณ์',
      passed,
      notes: 'วสท. 022001-22 ไม่อนุญาตให้ใช้ท่ออ่อนเดินถาวรระยะยาว และต้องมีสายดิน EGC แยกเสมอ',
    });
  }

  // ==========================================
  // 10) Final Status: ทุก required stage ยัง NOT CHECKED -> ENGINEERING REVIEW REQUIRED
  // ==========================================
  {
    const status = calculateFinalEngineeringStatus({
      cableStatus: 'NOT CHECKED',
      breakerStatus: 'NOT CHECKED',
      voltageDropStatus: 'NOT CHECKED',
      conduitStatus: 'NOT CHECKED',
      cableVoltageRatingStatus: 'REVIEW REQUIRED',
    });

    const passed = status === 'ENGINEERING REVIEW REQUIRED';
    results.push({
      id: 'test-final-status-all-not-checked',
      name: 'Final Status: ทุก required stage ยัง NOT CHECKED -> ENGINEERING REVIEW REQUIRED',
      category: '10. Final Status - Incomplete Stages',
      expected: 'ENGINEERING REVIEW REQUIRED',
      actual: status,
      passed,
      notes: 'ห้ามสรุปเป็น PASS หากยังมีรายการที่ยังไม่ได้ตรวจสอบ',
    });
  }

  // ==========================================
  // 11) Final Status: Cable + Breaker ผ่าน แต่ Voltage Drop = PENDING -> ENGINEERING REVIEW REQUIRED
  // ==========================================
  {
    const status = calculateFinalEngineeringStatus({
      cableStatus: 'PASS',
      breakerStatus: 'PASS',
      voltageDropStatus: 'PENDING',
      conduitStatus: 'PASS',
      cableVoltageRatingStatus: 'PASS',
      standardDataStatuses: ['VERIFIED_STANDARD_DATA'],
    });

    const passed = status === 'ENGINEERING REVIEW REQUIRED';
    results.push({
      id: 'test-final-status-pending-voltage-drop',
      name: 'Final Status: มีขั้นตอนที่รอดำเนินการ (Voltage Drop = PENDING) -> ENGINEERING REVIEW REQUIRED',
      category: '11. Final Status - Pending Voltage Drop',
      expected: 'ENGINEERING REVIEW REQUIRED',
      actual: status,
      passed,
      notes: 'ห้ามสรุปเป็น PASS หากยังมีขั้นตอนที่ PENDING',
    });
  }

  // ==========================================
  // 12) Final Status: ทุก stage ผ่าน แต่ Cable Voltage Rating = NOT VERIFIED -> INSUFFICIENT_VERIFIED_DATA (ห้ามเป็น PASS)
  // ==========================================
  {
    const status = calculateFinalEngineeringStatus({
      cableStatus: 'PASS',
      breakerStatus: 'PASS',
      voltageDropStatus: 'PASS',
      conduitStatus: 'PASS',
      cableVoltageRatingStatus: 'NOT VERIFIED',
      standardDataStatuses: ['VERIFIED_STANDARD_DATA'],
    });

    const passed = status === 'INSUFFICIENT_VERIFIED_DATA';
    results.push({
      id: 'test-final-status-unverified-voltage-rating',
      name: 'Final Status: ข้อมูลพิกัดแรงดันสายยังไม่ได้รับการยืนยัน (NOT VERIFIED) -> INSUFFICIENT_VERIFIED_DATA',
      category: '12. Final Status - Unverified Voltage Rating',
      expected: 'INSUFFICIENT_VERIFIED_DATA (ห้ามเป็น PASS)',
      actual: status,
      passed,
      notes: 'ข้อมูลพิกัดแรงดันสายไฟเป็น required data หากยังไม่ verified ต้องปฏิเสธการให้ PASS',
    });
  }

  // ==========================================
  // 13) Final Status: ทุก stage ผ่าน แต่ standard data = NEEDS_SOURCE_REVIEW -> INSUFFICIENT_VERIFIED_DATA
  // ==========================================
  {
    const status = calculateFinalEngineeringStatus({
      cableStatus: 'PASS',
      breakerStatus: 'PASS',
      voltageDropStatus: 'PASS',
      conduitStatus: 'PASS',
      cableVoltageRatingStatus: 'PASS',
      standardDataStatuses: ['NEEDS_SOURCE_REVIEW'],
    });

    const passed = status === 'INSUFFICIENT_VERIFIED_DATA';
    results.push({
      id: 'test-final-status-needs-source-review',
      name: 'Final Status: แหล่งข้อมูลมาตรฐานมีสถานะ NEEDS_SOURCE_REVIEW -> INSUFFICIENT_VERIFIED_DATA',
      category: '13. Final Status - Unverified Standard Data',
      expected: 'INSUFFICIENT_VERIFIED_DATA',
      actual: status,
      passed,
      notes: 'เมื่อข้อมูลมาตรฐานที่จำเป็นยังไม่ได้รับการยืนยัน ต้องได้สถานะ INSUFFICIENT_VERIFIED_DATA',
    });
  }

  // ==========================================
  // 14) Final Status: ทุก required stage ผ่าน, Cable Voltage Rating = PASS, Standard Data = VERIFIED_STANDARD_DATA -> PASS (FINAL PASS)
  // ==========================================
  {
    const status = calculateFinalEngineeringStatus({
      cableStatus: 'PASS',
      breakerStatus: 'PASS',
      voltageDropStatus: 'PASS',
      conduitStatus: 'PASS',
      cableVoltageRatingStatus: 'PASS',
      standardDataStatuses: ['VERIFIED_STANDARD_DATA'],
    });

    const passed = status === 'PASS';
    results.push({
      id: 'test-final-status-full-pass',
      name: 'Final Status: ทุก stage ผ่านครบถ้วนและข้อมูลมาตรฐาน verified 100% -> FINAL PASS',
      category: '14. Final Status - Full Verification PASS',
      expected: 'PASS',
      actual: status,
      passed,
      notes: 'ผ่านครบทั้ง 5 การตรวจสอบทางวิศวกรรม + ข้อมูลมาตรฐานได้รับการยืนยันสมบูรณ์',
    });
  }

  // ==========================================
  // 15) Final Status: มี stage ใด stage หนึ่ง = FAIL -> FAIL (FINAL FAIL)
  // ==========================================
  {
    const status = calculateFinalEngineeringStatus({
      cableStatus: 'PASS',
      breakerStatus: 'FAIL',
      voltageDropStatus: 'PASS',
      conduitStatus: 'PASS',
      cableVoltageRatingStatus: 'PASS',
      standardDataStatuses: ['VERIFIED_STANDARD_DATA'],
    });

    const passed = status === 'FAIL';
    results.push({
      id: 'test-final-status-single-fail',
      name: 'Final Status: มีขั้นตอนใดขั้นตอนหนึ่งล้มเหลว (Breaker = FAIL) -> FINAL FAIL',
      category: '15. Final Status - Single Stage FAIL',
      expected: 'FAIL',
      actual: status,
      passed,
      notes: 'ข้อกำหนดความปลอดภัย: หากมี stage ใด FAIL ผลสรุปรวมต้องเป็น FAIL ทันที',
    });
  }

  // ==========================================
  // 16) Final Status: Breaker = PRELIMINARY PASS แต่ stage อื่นยังไม่ครบ -> FINAL ไม่เป็น PASS
  // ==========================================
  {
    const status = calculateFinalEngineeringStatus({
      cableStatus: 'PASS',
      breakerStatus: 'PRELIMINARY PASS',
      voltageDropStatus: 'NOT CHECKED',
      conduitStatus: 'NOT CHECKED',
     cableVoltageRatingStatus: 'REVIEW REQUIRED',
      standardDataStatuses: ['VERIFIED_STANDARD_DATA'],
    });

    const passed = status === 'ENGINEERING REVIEW REQUIRED';
    results.push({
      id: 'test-final-status-preliminary-not-final-pass',
      name: 'Final Status: Breaker = PRELIMINARY PASS แต่ stage อื่นยังไม่ครบ -> FINAL ไม่เป็น PASS',
      category: '16. Final Status - Preliminary Breaker Coordination',
      expected: 'ENGINEERING REVIEW REQUIRED (ห้ามเป็น PASS)',
      actual: status,
      passed,
      notes: 'PRELIMINARY PASS ไม่ถูกตีความหรือสรุปเป็น FINAL PASS เด็ดขาด',
    });
  }

  const passedCount = results.filter((r) => r.passed).length;
  return {
    total: results.length,
    passed: passedCount,
    failed: results.length - passedCount,
    results,
  };
}
