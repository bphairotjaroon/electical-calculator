import React from 'react';
import { Menu, ShieldCheck, Sparkles, CheckCircle2, FileText, Database } from 'lucide-react';
import { ActivePage } from './Sidebar';

interface HeaderProps {
  activePage: ActivePage;
  onOpenMobileMenu: () => void;
  onOpenAiAssistant: () => void;
  testPassedCount: number;
  testTotalCount: number;
}

const PAGE_TITLES: Record<ActivePage, { th: string; en: string }> = {
  load_calculator: { th: 'คำนวณโหลดไฟฟ้า', en: 'Load Calculator (Single & Three Phase)' },
  cable_sizing: { th: 'เลือกขนาดสายไฟตามมาตรฐาน วสท.', en: 'Cable Sizing & Ampacity Derating' },
  breaker_check: { th: 'ตรวจสอบ Circuit Breaker', en: 'Circuit Breaker Coordination (Ib <= In <= Iz)' },
  voltage_drop: { th: 'คำนวณแรงดันตก', en: 'Voltage Drop Analysis (Branch & Feeder)' },
  conduit_sizing: { th: 'คำนวณขนาดท่อร้อยสาย', en: 'Conduit Sizing & Fill Rate (Table 5-3)' },
  flexible_conduit: { th: 'คำนวณ Flexible Conduit', en: 'Flexible Metallic Conduit Fill Check' },
  standards_db: { th: 'Standards Database Manager', en: 'Verified Engineering Data Repository' },
  calculation_report: { th: 'รายงานผลการคำนวณวิศวกรรม', en: 'Engineering Calculation Report & Export' },
  settings_tests: { th: 'ตั้งค่า & Automated Tests', en: 'Settings, Verification Suite & DB Version' },
};

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onOpenMobileMenu,
  onOpenAiAssistant,
  testPassedCount,
  testTotalCount,
}) => {
  const currentTitle = PAGE_TITLES[activePage] || { th: 'ระบบคำนวณวิศวกรรม', en: 'Engineering Calculator' };

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 sm:px-6 py-3">
      <div className="flex items-center justify-between gap-4 max-w-7xl mx-auto">
        {/* Left: Mobile Toggle & Page Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="lg:hidden p-2 rounded-lg bg-slate-900 text-slate-300 hover:text-white border border-slate-800 cursor-pointer"
            aria-label="Open Navigation"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              <span>{currentTitle.th}</span>
            </h2>
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              {currentTitle.en}
            </p>
          </div>
        </div>

        {/* Right: Status Pills & Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Test Status Indicator */}
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-emerald-400">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Tests: {testPassedCount}/{testTotalCount} Passed</span>
          </div>

          {/* Standard Compliance Badge */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-[11px] font-medium text-amber-300">
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">วสท. 022001-22</span>
            <span className="sm:hidden">วสท.</span>
          </div>

          {/* Ask AI Assistant */}
          <button
            onClick={onOpenAiAssistant}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-semibold text-xs transition-all shadow-md shadow-amber-500/20 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
            <span className="hidden sm:inline">AI วิศวกรช่วยอธิบาย</span>
            <span className="sm:hidden">AI Assistant</span>
          </button>
        </div>
      </div>
    </header>
  );
};
