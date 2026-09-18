import React, { useState } from 'react';
import { CableRecord, CalculationStatus, CableVoltageRatingStatus, SourceStatus } from '../types';
import { calculateFinalEngineeringStatus } from '../services/calculationEngine';
import { Printer, FileText } from 'lucide-react';
import { DATABASE_VERSION_INFO } from '../data/standardsData';

interface CalculationReportPageProps {
  currentIb?: number;
  selectedCable?: CableRecord | null;
  breakerRatingIn?: number;
  cableAmpacityIz?: number;
  voltageDropPercent?: number;
  conduitName?: string;
  conduitFillPercent?: number;
}

export const CalculationReportPage: React.FC<CalculationReportPageProps> = ({
  currentIb,
  selectedCable,
  breakerRatingIn,
  cableAmpacityIz,
  voltageDropPercent,
  conduitName,
  conduitFillPercent,
}) => {
  const [projectName, setProjectName] = useState('โครงการปรับปรุงระบบไฟฟ้าอาคารพักอาศัย');
  const [circuitName, setCircuitName] = useState('LP-1/Ckt-03 (วงจรเครื่องปรับอากาศ)');
  const [engineerName, setEngineerName] = useState('คุณบ๊วย (Buay) วศ.บ. ไฟฟ้า');
  const [reportDate, setReportDate] = useState(
  new Date().toISOString().split('T')[0] ?? ''
);

 // Dynamic Stage Calculations & Status Evaluation

  const loadCurrentStatus: CalculationStatus =
    currentIb !== undefined && currentIb > 0
      ? 'CALCULATED'
      : 'FAIL';

  const cableSizingStatus: CalculationStatus =
    selectedCable &&
    cableAmpacityIz !== undefined &&
    breakerRatingIn !== undefined &&
    cableAmpacityIz >= breakerRatingIn
      ? 'PASS'
      : 'FAIL';

  const breakerCoordStatus: CalculationStatus =
    currentIb !== undefined &&
    breakerRatingIn !== undefined &&
    cableAmpacityIz !== undefined &&
    currentIb <= breakerRatingIn &&
    breakerRatingIn <= cableAmpacityIz
      ? 'PASS'
      : 'FAIL';

  const vdStatus: CalculationStatus =
  voltageDropPercent !== undefined
    ? voltageDropPercent <= 3.0
      ? 'PASS'
      : voltageDropPercent <= 5.0
      ? 'WARNING'
      : 'FAIL'
    : 'FAIL';

  const conduitStatus: CalculationStatus =
  conduitFillPercent !== undefined
    ? conduitFillPercent <= 40.0
      ? 'PASS'
      : 'FAIL'
    : 'FAIL';

  const cableVoltageRatingStatus: CableVoltageRatingStatus =
    selectedCable?.voltageRating
      ? 'PASS'
      : 'REVIEW REQUIRED';

  const standardSourceStatus: SourceStatus =
    selectedCable?.sourceStatus ?? 'NEEDS_SOURCE_REVIEW';

  // Single Source of Truth for Final Engineering Status
  const finalReportStatus = calculateFinalEngineeringStatus({
    cableStatus: cableSizingStatus,
    breakerStatus: breakerCoordStatus,
    voltageDropStatus: vdStatus,
    conduitStatus: conduitStatus,
    cableVoltageRatingStatus,
    standardDataStatuses: [standardSourceStatus],
  });
  const getStatusTextClass = (status: CalculationStatus) => {
    switch (status) {
      case 'PASS':
        return 'text-emerald-700 font-bold';
      case 'CALCULATED':
        return 'text-blue-700 font-bold';
      case 'PRELIMINARY PASS':
        return 'text-cyan-700 font-bold';
      case 'WARNING':
        return 'text-amber-700 font-bold';
      case 'INSUFFICIENT_VERIFIED_DATA':
        return 'text-orange-700 font-bold';
      case 'FAIL':
        return 'text-rose-700 font-bold';
      default:
        return 'text-purple-700 font-bold';
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Action Bar (hidden on print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <FileText className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-100">
              รายงานผลการคำนวณทางวิศวกรรม (Calculation Report)
            </h2>
          </div>
          <p className="text-xs sm:text-sm text-slate-400">
            เอกสารสรุปผลการตรวจสอบความสอดคล้องตามมาตรฐาน วสท. 022001-22 สำหรับนำเสนอหรือแนบแบบ
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>พิมพ์รายงาน / บันทึกเป็น PDF</span>
          </button>
        </div>
      </div>

      {/* Report Customization Form (hidden on print) */}
      <div className="print:hidden bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
        <h3 className="text-sm font-semibold text-slate-200">
          ข้อมูลหัวรายงาน (Report Metadata)
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="space-y-1">
            <label className="text-slate-400 block font-medium">ชื่อโครงการ (Project Name)</label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 block font-medium">วงจรไฟฟ้า (Circuit ID)</label>
            <input
              type="text"
              value={circuitName}
              onChange={(e) => setCircuitName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 block font-medium">ผู้จัดทำ/วิศวกร (Engineer)</label>
            <input
              type="text"
              value={engineerName}
              onChange={(e) => setEngineerName(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>
          <div className="space-y-1">
            <label className="text-slate-400 block font-medium">วันที่คำนวณ (Date)</label>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
            />
          </div>
        </div>
      </div>

      {/* Printable Sheet Document */}
      <div 
        id="printable-report-sheet"
        className="bg-white text-slate-900 rounded-2xl p-6 sm:p-10 shadow-2xl border border-slate-300 font-sans print:border-none print:shadow-none print:p-0 max-w-4xl mx-auto"
      >
        {/* Document Header */}
        <div className="border-b-2 border-slate-900 pb-5 mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs">
                EIT 022001-22
              </span>
              <h1 className="text-xl sm:text-2xl font-black text-slate-950 tracking-tight">
                ELECTRICAL CALCULATION SHEET
              </h1>
            </div>
            <p className="text-xs text-slate-600 font-medium">
              เอกสารแสดงรายการคำนวณระบบไฟฟ้า ตามมาตรฐานการติดตั้งทางไฟฟ้าสำหรับประเทศไทย (วสท. 022001-22)
            </p>
          </div>

          <div className="text-left sm:text-right font-mono text-xs text-slate-700 space-y-0.5">
            <p><strong>วันที่:</strong> {reportDate}</p>
            <p><strong>DB Ver:</strong> {DATABASE_VERSION_INFO.version}</p>
            <p className={`font-bold ${
              standardSourceStatus === 'VERIFIED_STANDARD_DATA'
                ? 'text-emerald-700'
                : standardSourceStatus === 'NEEDS_SOURCE_REVIEW'
                ? 'text-amber-700'
                : 'text-orange-700'
            }`}>
              {standardSourceStatus}
            </p>
          </div>
        </div>

        {/* Project Meta Table */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-100 border border-slate-200 text-xs mb-6">
          <div>
            <span className="text-slate-500 block">ชื่อโครงการ:</span>
            <strong className="text-slate-900">{projectName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">วงจรไฟฟ้า:</span>
            <strong className="text-slate-900">{circuitName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">วิศวกรผู้คำนวณ:</span>
            <strong className="text-slate-900">{engineerName}</strong>
          </div>
          <div>
            <span className="text-slate-500 block">มาตรฐานอ้างอิง:</span>
            <strong className="text-slate-900">วสท. 022001-22</strong>
          </div>
        </div>

        {/* Summary Table */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-300">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900">
              สรุปผลการคำนวณและตรวจสอบทางวิศวกรรม (Engineering Summary)
            </h2>
            <span className="text-xs font-mono text-slate-600">
              Final Evaluation: <strong className={getStatusTextClass(finalReportStatus)}>{finalReportStatus}</strong>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border border-slate-300">
              <thead className="bg-slate-200 text-slate-800 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-3 border border-slate-300">หมวดการคำนวณ</th>
                  <th className="p-3 border border-slate-300">เกณฑ์มาตรฐาน วสท.</th>
                  <th className="p-3 border border-slate-300">ค่าที่คำนวณได้</th>
                  <th className="p-3 border border-slate-300 text-center">สถานะ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 font-sans">
                {/* 1. Load Current */}
                <tr>
                  <td className="p-3 border border-slate-300 font-semibold">1. กระแสโหลดออกแบบ (Ib)</td>
                  <td className="p-3 border border-slate-300 text-slate-600 font-mono">วสท. บทที่ 3 (I = P / (V × PF))</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold text-slate-900">{currentIb !== undefined ? `${currentIb} A` : 'ยังไม่ได้คำนวณ'}</td>
                  <td className={`p-3 border border-slate-300 text-center ${getStatusTextClass(loadCurrentStatus)}`}>
                    {loadCurrentStatus}
                  </td>
                </tr>

                {/* 2. Cable Sizing */}
                <tr>
                  <td className="p-3 border border-slate-300 font-semibold">2. ขนาดสายไฟ & พิกัดกระแส (Iz)</td>
                  <td className="p-3 border border-slate-300 text-slate-600">
                    วสท. ตารางที่ 5-20 / 5-43 (Ca, Cg)
                  </td>
                  <td className="p-3 border border-slate-300 font-mono font-bold text-slate-900">
                  {selectedCable
  ? `${selectedCable.sizeMm2} mm² (${selectedCable.cableType})`
  : 'ยังไม่ได้เลือกสายไฟ'}
{' ➔ Iz = '}
{selectedCable && cableAmpacityIz !== undefined
  ? `${cableAmpacityIz} A`
  : 'ยังไม่ตรวจสอบ'}
                  </td>
                  <td className={`p-3 border border-slate-300 text-center ${getStatusTextClass(cableSizingStatus)}`}>
                    {cableSizingStatus}
                  </td>
                </tr>

                {/* 3. Breaker Coordination */}
                <tr>
                  <td className="p-3 border border-slate-300 font-semibold">3. การประสานสัมพันธ์เบรกเกอร์</td>
                  <td className="p-3 border border-slate-300 text-slate-600 font-mono">Ib ≤ In ≤ Iz</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold text-slate-900">
                    {currentIb !== undefined &&
breakerRatingIn !== undefined &&
cableAmpacityIz !== undefined
  ? `${currentIb}A ≤ ${breakerRatingIn}A ≤ ${cableAmpacityIz}A`
  : 'ยังตรวจสอบข้อมูลไม่ครบ'}
                  </td>
                  <td className={`p-3 border border-slate-300 text-center ${getStatusTextClass(breakerCoordStatus)}`}>
                    {breakerCoordStatus}
                  </td>
                </tr>

                {/* 4. Cable Voltage Rating */}
                <tr>
                  <td className="p-3 border border-slate-300 font-semibold">4. พิกัดแรงดันสายไฟ (Cable Voltage Rating)</td>
                  <td className="p-3 border border-slate-300 text-slate-600">U0/U ≥ พิกัดแรงดันระบบ</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold text-slate-900">
                    {selectedCable?.voltageRating || 'ยังไม่ได้ตรวจสอบ'}
                  </td>
                  <td className={`p-3 border border-slate-300 text-center ${getStatusTextClass(cableVoltageRatingStatus)}`}>
                    {cableVoltageRatingStatus}
                  </td>
                </tr>

                {/* 5. Voltage Drop */}
                <tr>
                  <td className="p-3 border border-slate-300 font-semibold">5. แรงดันตก (Voltage Drop %VD)</td>
                  <td className="p-3 border border-slate-300 text-slate-600">แนะนำ ≤ 3.0% (วงจรย่อย)</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold text-slate-900">
                    {voltageDropPercent !== undefined
  ? `${voltageDropPercent.toFixed(2)}%`
  : 'ยังไม่ได้คำนวณ'}
                  </td>
                  <td className={`p-3 border border-slate-300 text-center ${getStatusTextClass(vdStatus)}`}>
                    {vdStatus}
                  </td>
                </tr>

                {/* 6. Conduit Fill */}
                <tr>
                  <td className="p-3 border border-slate-300 font-semibold">6. การใช้พื้นที่ท่อร้อยสาย</td>
                  <td className="p-3 border border-slate-300 text-slate-600">วสท. ตารางที่ 5-3 (≤ 40%)</td>
                  <td className="p-3 border border-slate-300 font-mono font-bold text-slate-900">
{conduitName && conduitFillPercent !== undefined
  ? `ท่อ ${conduitName} ➔ ${conduitFillPercent.toFixed(1)}%`
  : 'ยังไม่ได้คำนวณ'}                  </td>
                  <td className={`p-3 border border-slate-300 text-center ${getStatusTextClass(conduitStatus)}`}>
                    {conduitStatus}
                  </td>
                </tr>

                {/* 7. Final Engineering Status */}
                <tr className="bg-slate-100 font-bold">
                  <td className="p-3 border border-slate-300 text-slate-950 font-bold" colSpan={2}>
                    7. สรุปผลการประเมินทางวิศวกรรมขั้นสุดท้าย (Final Engineering Status)
                  </td>
                  <td className="p-3 border border-slate-300 font-mono text-slate-700 text-xs">
                    ประเมินครบ 6 รายการหลัก + Data Trust
                  </td>
                  <td className={`p-3 border border-slate-300 text-center text-sm ${getStatusTextClass(finalReportStatus)}`}>
                    {finalReportStatus}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Safety Disclaimer Footer */}
        <div className="mt-8 pt-4 border-t-2 border-slate-900 text-[11px] text-slate-700 space-y-3">
          <div className="p-3 bg-amber-50 rounded-lg border border-amber-300 text-amber-900">
            <strong>ข้อความปฏิเสธความรับผิดทางวิศวกรรม (Safety & Legal Disclaimer):</strong><br />
            "แอปนี้เป็นเครื่องมือช่วยคำนวณและตรวจสอบเบื้องต้น ไม่ใช่การรับรองแบบทางวิศวกรรม การออกแบบและติดตั้งจริงต้องตรวจสอบกับมาตรฐานฉบับปัจจุบัน และผู้ประกอบวิชาชีพ/ผู้มีอำนาจตามกฎหมายที่เกี่ยวข้อง"
          </div>

          <div className="flex justify-between items-end pt-6 font-mono text-xs text-slate-800">
            <div>
              <p>ผู้จัดทำ: {engineerName}</p>
              <p>วันที่พิมพ์: {new Date().toLocaleDateString('th-TH')}</p>
            </div>
            <div className="text-center w-48 border-t border-slate-400 pt-1">
              <p>(ลงชื่อวิศวกรผู้ตรวจสอบ)</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
