import React from 'react';
import { 
  Zap, 
  Activity, 
  Layers, 
  ShieldCheck, 
  GitCommit, 
  Cylinder, 
  CornerDownRight, 
  Database, 
  FileCheck, 
  Settings, 
  CheckCircle,
  Sparkles,
  Menu,
  X
} from 'lucide-react';

export type ActivePage = 
  | 'load_calculator'
  | 'cable_sizing'
  | 'breaker_check'
  | 'voltage_drop'
  | 'conduit_sizing'
  | 'flexible_conduit'
  | 'standards_db'
  | 'calculation_report'
  | 'settings_tests';

interface SidebarProps {
  activePage: ActivePage;
  onSelectPage: (page: ActivePage) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activePage,
  onSelectPage,
  isOpen,
  onClose,
}) => {
  const menuItems: { id: ActivePage; labelTh: string; labelEn: string; icon: React.ElementType }[] = [
    { id: 'load_calculator', labelTh: '1. คำนวณโหลดไฟฟ้า', labelEn: 'Load Calculator', icon: Zap },
    { id: 'cable_sizing', labelTh: '2. เลือกขนาดสายไฟ', labelEn: 'Cable Sizing', icon: Layers },
    { id: 'breaker_check', labelTh: '3. ตรวจสอบ Circuit Breaker', labelEn: 'Breaker Check', icon: ShieldCheck },
    { id: 'voltage_drop', labelTh: '4. คำนวณ Voltage Drop', labelEn: 'Voltage Drop', icon: Activity },
    { id: 'conduit_sizing', labelTh: '5. คำนวณขนาดท่อร้อยสาย', labelEn: 'Conduit Sizing', icon: Cylinder },
    { id: 'flexible_conduit', labelTh: '6. คำนวณ Flexible Conduit', labelEn: 'Flexible Conduit', icon: CornerDownRight },
    { id: 'standards_db', labelTh: '7. Standards Database', labelEn: 'Database Manager', icon: Database },
    { id: 'calculation_report', labelTh: '8. Calculation Report', labelEn: 'Calculation Report', icon: FileCheck },
    { id: 'settings_tests', labelTh: '9. Settings & Test Cases', labelEn: 'Settings & DB Version', icon: Settings },
  ];

  const handleItemClick = (id: ActivePage) => {
    onSelectPage(id);
    onClose();
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-slate-950 border-r border-slate-800/80 flex flex-col transition-transform duration-200 lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Branding header */}
        <div className="p-4 sm:p-5 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-amber-500/20">
              <Zap className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-slate-100 leading-tight">
                Electrical Calculator
              </h1>
              <p className="text-[11px] font-mono text-amber-400 font-medium">
                วสท. 022001-22 (พ.ศ. 2564)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden text-slate-400 hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-900 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
            ระบบคำนวณมาตรฐาน (Engineering Modules)
          </p>
          {menuItems.map((item) => {
            const isActive = activePage === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                id={`nav-item-${item.id}`}
                onClick={() => handleItemClick(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-left transition-all duration-150 cursor-pointer group ${
                  isActive
                    ? 'bg-amber-500/15 text-amber-300 font-semibold border border-amber-500/30 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${isActive ? 'text-amber-400' : 'text-slate-500 group-hover:text-slate-300'}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs sm:text-sm truncate leading-tight">{item.labelTh}</p>
                  <p className="text-[10px] text-slate-500 truncate font-mono">({item.labelEn})</p>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Standards status footer */}
        <div className="p-3.5 m-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-slate-300">Data Trust Engine</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              ACTIVE
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            รองรับมาตรฐาน วสท. 022001-22 ฉบับล่าสุด โดยไม่อนุญาตให้ใช้ค่าที่ไม่ได้ผ่านการตรวจสอบ (VERIFIED)
          </p>
          <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] text-slate-500 font-mono">
            <span>DB Ver: 001</span>
            <span className="text-emerald-400">100% Deterministic</span>
          </div>
        </div>
      </aside>
    </>
  );
};
