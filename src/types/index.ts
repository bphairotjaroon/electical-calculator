/**
 * Electrical Engineering Calculator - Types & Interfaces
 * Standard: วสท. 022001-22 (มาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย พ.ศ. 2564)
 */

export type SourceStatus = 
  | 'VERIFIED_STANDARD_DATA'
  | 'USER_DEFINED_DATA'
  | 'DEMO_DATA'
  | 'NEEDS_SOURCE_REVIEW';

export type CalculationStatus =
  | 'PASS'
  | 'PRELIMINARY PASS'
  | 'WARNING'
  | 'FAIL'
  | 'INVALID_INPUT'
  | 'HIGH_VOLTAGE_REVIEW_REQUIRED'
  | 'INSUFFICIENT_VERIFIED_DATA'
  | 'ENGINEERING_REVIEW_REQUIRED'
  | 'ENGINEERING REVIEW REQUIRED'
  | 'INCOMPLETE ENGINEERING CHECK'
  | 'REVIEW REQUIRED'
  | 'CALCULATED'
  | 'CALCULATION COMPLETE'
  | 'PENDING ENGINEERING CHECK'
  | 'NOT CHECKED'
  | 'NOT VERIFIED'
  | 'REFERENCE ONLY';

export type VoltageSource = 'PRESET' | 'USER_DEFINED';
export type CableVoltageRatingStatus = 'PASS' | 'REVIEW REQUIRED' | 'NOT VERIFIED';

export type ConductorMaterial = 'Cu' | 'Al';
export type InsulationType = 'PVC' | 'XLPE' | 'EPR';
export type PhaseType = '1_PHASE' | '3_PHASE';
export type PowerUnit = 'W' | 'kW';

export type CircuitType = 'BRANCH_CIRCUIT' | 'FEEDER';
export type DemandFactorMode = 'NO_DEMAND_FACTOR' | 'STANDARD_TABLE' | 'MANUAL';

export interface StandardReference {
  standard: string;        // e.g. "วสท. 022001-22"
  chapter: string;         // e.g. "บทที่ 5"
  table: string;           // e.g. "ตารางที่ 5-20"
  referenceNote: string;   // e.g. "สายทองแดงหุ้มฉนวน PVC ในท่อโลหะในอากาศ"
  sourceStatus: SourceStatus;
}

export interface CableRecord extends StandardReference {
  id: string;
  cableType: string;        // e.g. "60227 IEC 01 (THW)", "NYY", "CV"
  conductor: ConductorMaterial;
  insulation: InsulationType;
  voltageRating: string;    // e.g. "450/750 V", "0.6/1 kV"
  voltageRatingV?: number;  // Nominal voltage rating in V
  sizeMm2: number;          // e.g. 2.5, 4, 6, 10
  approxOverallDiameterMm: number; // For conduit fill
  approxAreaMm2: number;    // pi * (D/2)^2
  resistancePerKm: number;  // Ohm/km (AC resistance at operating temp)
  reactancePerKm: number;   // Ohm/km
  acResistanceAt75COhmPerKm?: number;
  reactanceAt50HzOhmPerKm?: number;
  installationMethod: string; // e.g. "ในท่อโลหะในอากาศ", "ในท่ออโลหะ", "ร้อยท่อฝังดิน"
  currentCarryingConductors: number; // 2 or 3
  ambientTemperature: number; // base temp, usually 40 deg C
  ampacity: number | null;  // Current carrying capacity in Ampere, null if not verified
}

export type FactorType = 'Ambient Temperature' | 'Grouping' | 'Installation Condition' | 'Other';

export interface CorrectionFactorRecord extends StandardReference {
  id: string;
  factorType: FactorType;
  condition: string;        // e.g. "36 - 40 °C", "4 - 6 วงจรในท่อเดียวกัน"
  value: number;            // e.g. 1.00, 0.88, 0.80
  cableInsulation?: InsulationType;
}

export type ConduitType = 'EMT' | 'IMC' | 'RSC' | 'PVC' | 'Flexible Metal' | 'Flexible Non-metallic';

export interface ConduitRecord extends StandardReference {
  id: string;
  type: ConduitType;
  nominalSizeInch: string;   // e.g. "1/2\"", "3/4\"", "1\"", "1-1/4\"", "1-1/2\"", "2\""
  nominalSizeMm: number;     // e.g. 15, 20, 25, 32, 40, 50
  insideDiameterMm: number;  // Inside diameter in mm (must be verified standard)
  internalAreaMm2: number;   // Inside cross-sectional area (pi * D^2 / 4)
  productStandard?: string;  // e.g. "TIS 770-2533 / ANSI C80.3"
}

export interface DemandFactorRecord {
  id: string;
  buildingType: string;
  loadType: 'Lighting' | 'Receptacle' | 'General Appliance' | 'Other';
  loadRange: string;
  factor: number;
  unit: string;
  applicableTo: 'FEEDER_ONLY' | 'BRANCH_ONLY' | 'BOTH';
  standard: string;          // e.g. "วสท. 022001-22"
  chapter: string;           // e.g. "บทที่ 3"
  referenceTable: string;    // e.g. "ตารางที่ 3-1", "ตารางที่ 3-2", "ตารางที่ 3-3"
  referenceNote: string;
  sourceStatus: SourceStatus;
}

export interface EngineeringCheckStatus {
  cable: 'NOT CHECKED' | 'PENDING' | 'PASS' | 'FAIL' | 'WARNING' | 'INSUFFICIENT_VERIFIED_DATA' | 'PRELIMINARY PASS' | 'REVIEW REQUIRED';
  breaker: 'NOT CHECKED' | 'PENDING' | 'PASS' | 'FAIL' | 'WARNING' | 'INSUFFICIENT_VERIFIED_DATA' | 'PRELIMINARY PASS' | 'REVIEW REQUIRED';
  voltageDrop: 'NOT CHECKED' | 'PENDING' | 'PASS' | 'FAIL' | 'WARNING';
  conduit: 'NOT CHECKED' | 'PENDING' | 'PASS' | 'FAIL' | 'WARNING' | 'INSUFFICIENT_VERIFIED_DATA';
  cableVoltageRating?: CableVoltageRatingStatus;
}

export interface MultiStageStatus {
  calculationStatus: 'CALCULATED' | 'CALCULATION COMPLETE' | 'FAIL';
  standardStatus: 'REFERENCE ONLY' | 'NOT YET VERIFIED' | 'VERIFIED_STANDARD';
  cableStatus: 'NOT CHECKED' | 'PENDING' | 'PASS' | 'PRELIMINARY PASS' | 'FAIL' | 'INSUFFICIENT_VERIFIED_DATA';
  breakerStatus: 'NOT CHECKED' | 'PENDING' | 'PASS' | 'PRELIMINARY PASS' | 'FAIL' | 'INSUFFICIENT_VERIFIED_DATA';
  voltageDropStatus: 'NOT CHECKED' | 'PENDING' | 'PASS' | 'FAIL';
  conduitStatus: 'NOT CHECKED' | 'PENDING' | 'PASS' | 'PRELIMINARY PASS' | 'FAIL' | 'INSUFFICIENT_VERIFIED_DATA';
  finalStatus: 'ENGINEERING REVIEW REQUIRED' | 'PENDING ENGINEERING CHECK' | 'PASS' | 'FAIL' | 'INSUFFICIENT_VERIFIED_DATA';
}

export interface CalculationTrace {
  input: Record<string, string | number>;
  formula: string;
  substitution: string;
  result: string;
  standardReference: {
    standard: string;
    chapter?: string;
    section?: string;
    table?: string;
    complianceStatus: string;
  };
  engineeringCheck: EngineeringCheckStatus;
  finalStatus: CalculationStatus;
  standardCheck?: string;
  notes?: string[];
  reference?: StandardReference;
}

export interface LoadItem {
  id: string;
  name: string;
  quantity: number;
  power: number;
  unit: PowerUnit;
  voltage: number;
  phase: PhaseType;
  circuitType?: CircuitType;
  powerFactor: number;
  demandFactor: number;
  calculatedPowerW: number;
  calculatedDemandW: number;
  calculatedCurrentA: number;
}

export interface ProjectMetadata {
  projectName: string;
  projectCode: string;
  engineerName: string;
  licenseNumber: string;
  date: string;
  notes: string;
}

export interface DatabaseVersionInfo {
  versionId: string;
  version?: string;
  standard?: string;
  edition?: string;
  standardName: string;
  standardEdition: string;
  organization: string;
  lastUpdated: string;
  verifiedBy: string;
  totalRecords: number;
  notes: string;
}


