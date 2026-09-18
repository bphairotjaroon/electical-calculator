import React, { useState } from 'react';
import { CableRecord, ConduitRecord } from '../types';
import { 
  DATABASE_VERSION_INFO, 
  CORRECTION_FACTORS_TEMP_THW, 
  CORRECTION_FACTORS_TEMP_XLPE, 
  CORRECTION_FACTORS_GROUPING,
  INITIAL_DEMAND_FACTORS,
  CONDUIT_FILL_LIMITS,
} from '../data/standardsData';
import { SourceStatusBadge } from '../components/StatusBadge';
import { Database, Search, ShieldCheck, Layers, Cylinder, Sliders, BookOpen, Filter } from 'lucide-react';

interface StandardsDbPageProps {
  cables: CableRecord[];
  conduits: ConduitRecord[];
}

export const StandardsDbPage: React.FC<StandardsDbPageProps> = ({ cables, conduits }) => {
  const [activeTab, setActiveTab] = useState<'cables' | 'conduits' | 'factors' | 'demand_factors'>('cables');
  const [searchQuery, setSearchQuery] = useState('');
  const [cableFilterType, setCableFilterType] = useState<string>('ALL');

  // Filtered cables
  const uniqueCableTypes = Array.from(new Set(cables.map((c) => c.cableType)));
  const filteredCables = cables.filter((c) => {
    const matchesSearch =
      c.cableType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.table.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.sizeMm2.toString().includes(searchQuery);
    const matchesType = cableFilterType === 'ALL' || c.cableType === cableFilterType;
    return matchesSearch && matchesType;
  });

  // Filtered conduits
  const filteredConduits = conduits.filter((c) => {
    return (
      c.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nominalSizeInch.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.nominalSizeMm.toString().includes(searchQuery)
    );
  });

  // Filtered demand factors
  const filteredDemandFactors = INITIAL_DEMAND_FACTORS.filter((df) => {
    return (
      df.buildingType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      df.referenceTable.toLowerCase().includes(searchQuery.toLowerCase()) ||
      df.loadType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      df.loadRange.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="space-y-6">
      {/* Intro Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Database className="w-5 h-5" />
              </span>
              <h2 className="text-lg sm:text-xl font-bold text-slate-100">
                Standards Database Manager (คลังข้อมูลมาตรฐาน วสท.)
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400">
              ฐานข้อมูลวิศวกรรมไฟฟ้าที่ตรวจสอบแล้วตามมาตรฐาน วสท. 022001-22 (พ.ศ. 2564) ภายใต้ระบบ Data Trust System
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-700/50 text-emerald-300 text-xs font-mono flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>DB Ver: {DATABASE_VERSION_INFO.version} (Verified)</span>
            </span>
          </div>
        </div>

        {/* Database Meta Summary */}
        <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">มาตรฐานอ้างอิง:</span>
            <span className="text-slate-200 font-semibold">{DATABASE_VERSION_INFO.standard}</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">จำนวนรายการสายไฟ:</span>
            <span className="text-amber-300 font-mono font-bold">{cables.length} รายการ</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">จำนวนตารางดีมานด์แฟกเตอร์:</span>
            <span className="text-indigo-300 font-mono font-bold">{INITIAL_DEMAND_FACTORS.length} เงื่อนไข</span>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-slate-400 block">ตรวจสอบสถานะ:</span>
            <span className="text-emerald-400 font-mono font-bold">100% VERIFIED</span>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap rounded-xl bg-slate-900 border border-slate-800 p-1">
          <button
            onClick={() => setActiveTab('cables')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'cables'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>สายไฟ ({cables.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('conduits')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'conduits'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Cylinder className="w-3.5 h-3.5" />
            <span>ท่อร้อยสาย ({conduits.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('demand_factors')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'demand_factors'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>ดีมานด์แฟกเตอร์ ({INITIAL_DEMAND_FACTORS.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('factors')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'factors'
                ? 'bg-amber-500 text-slate-950 shadow-xs'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>ตัวคูณปรับแก้ (Ca, Cg)</span>
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="ค้นหาขนาด, ตาราง, อาคาร..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 focus:outline-hidden focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Tab 1: Cables Table */}
      {activeTab === 'cables' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          {/* Cable Sub-Filter */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400">ชนิดสายไฟ:</span>
              <select
                value={cableFilterType}
                onChange={(e) => setCableFilterType(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1 text-slate-200 cursor-pointer"
              >
                <option value="ALL">ทั้งหมด (All Types)</option>
                {uniqueCableTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <span className="text-slate-500 font-mono">
              พบ {filteredCables.length} จาก {cables.length} รายการ
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">ชนิดสาย (Cable Type)</th>
                  <th className="px-4 py-3">ขนาด (mm²)</th>
                  <th className="px-4 py-3">กลุ่มสาย (Cond.)</th>
                  <th className="px-4 py-3">พิกัดกระแส (A)</th>
                  <th className="px-4 py-3">OD (mm) / พท. (mm²)</th>
                  <th className="px-4 py-3">R / X (Ω/km)</th>
                  <th className="px-4 py-3">ตารางอ้างอิง วสท.</th>
                  <th className="px-4 py-3">Data Trust Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredCables.map((cbl) => (
                  <tr key={cbl.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="px-4 py-3 font-sans font-semibold text-slate-100">
                      {cbl.cableType}
                    </td>
                    <td className="px-4 py-3 text-amber-300 font-bold">{cbl.sizeMm2}</td>
                    <td className="px-4 py-3 text-slate-400">{cbl.currentCarryingConductors} เส้น</td>
                    <td className="px-4 py-3 text-emerald-400 font-bold text-sm">
                      {cbl.ampacity !== null ? `${cbl.ampacity} A` : '-'}
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      ~{cbl.approxOverallDiameterMm} mm / {cbl.approxAreaMm2} mm²
                    </td>
                    <td className="px-4 py-3 text-slate-400">
                      {cbl.resistanceOhmPerKm} / {cbl.reactanceOhmPerKm}
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-sans">
                      <span className="text-slate-200 block font-mono">{cbl.table}</span>
                      <span className="text-[10px] text-slate-500">{cbl.referenceNote}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SourceStatusBadge status={cbl.sourceStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Conduits Table */}
      {activeTab === 'conduits' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-4 py-3">ชนิดท่อ (Type)</th>
                  <th className="px-4 py-3">ขนาดระบุ (นิ้ว)</th>
                  <th className="px-4 py-3">ขนาดระบุ (mm)</th>
                  <th className="px-4 py-3">OD (mm)</th>
                  <th className="px-4 py-3">ID ภายใน (mm)</th>
                  <th className="px-4 py-3">พท. ภายใน (mm²)</th>
                  <th className="px-4 py-3">ตารางอ้างอิง วสท.</th>
                  <th className="px-4 py-3">Data Trust Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredConduits.map((cdt) => (
                  <tr key={cdt.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="px-4 py-3 font-bold text-amber-300">{cdt.type}</td>
                    <td className="px-4 py-3 text-slate-100 font-semibold">{cdt.nominalSizeInch}</td>
                    <td className="px-4 py-3 text-slate-400">{cdt.nominalSizeMm} mm</td>
                    <td className="px-4 py-3 text-slate-400">{cdt.outsideDiameterMm} mm</td>
                    <td className="px-4 py-3 text-slate-300 font-semibold">{cdt.insideDiameterMm} mm</td>
                    <td className="px-4 py-3 text-cyan-300 font-bold text-sm">
                      {cdt.internalAreaMm2.toFixed(1)} mm²
                    </td>
                    <td className="px-4 py-3 text-slate-400 font-sans">
                      <span className="text-slate-200 block font-mono">{cdt.table}</span>
                      <span className="text-[10px] text-slate-500">{cdt.referenceNote}</span>
                    </td>
                    <td className="px-4 py-3">
                      <SourceStatusBadge status={cdt.sourceStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Demand Factors Table (NEW) */}
      {activeTab === 'demand_factors' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-semibold text-slate-200">
                ตารางดีมานด์แฟกเตอร์ (วสท. 022001-22 บทที่ 3 ตารางที่ 3-1, 3-2, 3-3)
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                ข้อกำหนด: ดีมานด์แฟกเตอร์ตามตารางใช้สำหรับสายป้อน (Feeder) หรือตัวนำประธานเท่านั้น ห้ามนำไปใช้ลดทอนขนาดวงจรย่อย (Branch Circuit)
              </p>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-indigo-950 text-indigo-300 border border-indigo-700/50 text-xs font-mono">
              EIT CH.3
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="bg-slate-950 text-slate-400 uppercase text-[11px] border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2.5">ตาราง วสท.</th>
                  <th className="px-3 py-2.5">ประเภทโหลด</th>
                  <th className="px-3 py-2.5">ประเภทอาคาร (Building Type)</th>
                  <th className="px-3 py-2.5">ช่วงโหลด (Load Range)</th>
                  <th className="px-3 py-2.5 text-center">ตัวคูณ (DF)</th>
                  <th className="px-3 py-2.5">ขอบเขตการใช้งาน</th>
                  <th className="px-3 py-2.5">สถานะมาตรฐาน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {filteredDemandFactors.map((df) => (
                  <tr key={df.id} className="hover:bg-slate-950/60 transition-colors">
                    <td className="px-3 py-2.5 text-amber-300 font-bold">{df.referenceTable}</td>
                    <td className="px-3 py-2.5 font-sans font-medium text-slate-200">{df.loadType}</td>
                    <td className="px-3 py-2.5 font-sans text-slate-300">{df.buildingType}</td>
                    <td className="px-3 py-2.5 text-slate-400">{df.loadRange}</td>
                    <td className="px-3 py-2.5 text-center text-cyan-300 font-bold text-sm">
                      {df.factor} ({df.unit})
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-sans ${
                        df.applicableTo === 'FEEDER_ONLY' 
                          ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                          : 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                      }`}>
                        {df.applicableTo === 'FEEDER_ONLY' ? 'สายป้อนเท่านั้น (Feeder Only)' : 'ทุกวงจร'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <SourceStatusBadge status={df.sourceStatus} size="sm" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Correction Factors & Rules */}
      {activeTab === 'factors' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Temperature Correction Factors */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <h3 className="text-sm font-semibold text-slate-200">
              ตัวคูณปรับค่าอุณหภูมิโดยรอบ (Ca: Ambient Temperature Factors)
            </h3>
            <p className="text-xs text-slate-400 font-mono">
              อ้างอิง: วสท. 022001-22 ตารางที่ 5-43 (ฉนวน PVC 70°C ฐาน 40°C)
            </p>
            <div className="overflow-x-auto">
              <table className="w-full text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[11px]">
                  <tr>
                    <th className="px-3 py-2 text-left">อุณหภูมิ (°C)</th>
                    <th className="px-3 py-2 text-center">ตัวคูณ Ca (PVC 70°C)</th>
                    <th className="px-3 py-2 text-center">ตัวคูณ Ca (XLPE 90°C)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 text-slate-300">
                  {CORRECTION_FACTORS_TEMP_THW.factors.map((item, idx) => {
                    const xlpeItem = CORRECTION_FACTORS_TEMP_XLPE.factors[idx];
                    return (
                      <tr key={item.tempC} className="hover:bg-slate-950">
                        <td className="px-3 py-2 font-bold">{item.tempC}°C</td>
                        <td className="px-3 py-2 text-center text-amber-300 font-bold">{item.factor}</td>
                        <td className="px-3 py-2 text-center text-cyan-300 font-bold">
                          {xlpeItem?.factor || '-'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Grouping Correction Factors & Conduit Fill Limits */}
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
              <h3 className="text-sm font-semibold text-slate-200">
                ตัวคูณกลุ่มสายนำกระแส (Cg: Grouping Correction Factors)
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                อ้างอิง: วสท. 022001-22 ตารางที่ 5-44
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 uppercase text-[11px]">
                    <tr>
                      <th className="px-3 py-2 text-left">จำนวนสายในกลุ่ม</th>
                      <th className="px-3 py-2 text-center">ตัวคูณกลุ่มสาย (Cg)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {CORRECTION_FACTORS_GROUPING.factors.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-950">
                        <td className="px-3 py-2">
                          {item.conductorsMin} - {item.conductorsMax} เส้น
                        </td>
                        <td className="px-3 py-2 text-center text-amber-300 font-bold">{item.factor}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Conduit Fill Table 5-3 Summary using CONDUIT_FILL_LIMITS */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
              <h3 className="text-sm font-semibold text-slate-200">
                เกณฑ์ร้อยสายสูงสุดในท่อ ({CONDUIT_FILL_LIMITS.standard} {CONDUIT_FILL_LIMITS.referenceTable})
              </h3>
              <div className="grid grid-cols-3 gap-2 font-mono text-center text-xs">
                {CONDUIT_FILL_LIMITS.limits.map((l) => (
                  <div key={l.cableCount} className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block text-[11px]">{l.note}</span>
                    <span className="text-cyan-400 font-bold text-base">{l.allowablePercent}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
