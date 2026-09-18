/**
 * Electrical Engineering Calculator
 * Standard: วสท. 022001-22 (พ.ศ. 2564)
 * Author: Professional Electrical Engineering Suite for Thai Engineers
 */

import React, { useState, useCallback } from 'react';
import { Sidebar, ActivePage } from './components/Sidebar';
import { Header } from './components/Header';
import { SafetyBanner } from './components/SafetyBanner';
import { AiExplanationModal } from './components/AiExplanationModal';

// Pages
import { LoadCalculatorPage } from './pages/LoadCalculatorPage';
import { CableSizingPage } from './pages/CableSizingPage';
import { BreakerCheckPage } from './pages/BreakerCheckPage';
import { VoltageDropPage } from './pages/VoltageDropPage';
import { ConduitSizingPage } from './pages/ConduitSizingPage';
import { FlexibleConduitPage } from './pages/FlexibleConduitPage';
import { StandardsDbPage } from './pages/StandardsDbPage';
import { CalculationReportPage } from './pages/CalculationReportPage';
import { SettingsTestsPage } from './pages/SettingsTestsPage';

// Data & Types
import { INITIAL_CABLES, INITIAL_CONDUITS } from './data/standardsData';
import { CableRecord, CalculationTrace, ConduitRecord, PhaseType } from './types';
import { runAllTestCases } from './services/testCasesRunner';

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('load_calculator');
  const [mobileMenuOpen, setMobileMenuOpen] = useState<boolean>(false);

  // AI Assistant Modal state
  const [aiModalOpen, setAiModalOpen] = useState<boolean>(false);
  const [aiTraceContext, setAiTraceContext] = useState<CalculationTrace | null>(null);
  const [aiTopic, setAiTopic] = useState<string>('การคำนวณระบบไฟฟ้า วสท. 022001-22');

  // Test cases summary state (lazily initialized)
  const [testStats, setTestStats] = useState(() => {
    const initialTests = runAllTestCases();
    return { passed: initialTests.passed, total: initialTests.total };
  });

  // Persistent Cross-Module Project State
  const [currentIb, setCurrentIb] = useState<number>(18.7);
  const [currentPhase, setCurrentPhase] = useState<PhaseType>('1_PHASE');
  const [selectedCable, setSelectedCable] = useState<CableRecord | null>(() => {
    return INITIAL_CABLES.find((c) => c.sizeMm2 === 4.0 && c.cableType.includes('60227')) || INITIAL_CABLES[0] || null;
  });
  const [breakerRatingIn, setBreakerRatingIn] = useState<number>(20);
  const [cableAmpacityIz, setCableAmpacityIz] = useState<number>(28.0);
  const [voltageDropPercent, setVoltageDropPercent] = useState<number>(1.95);
  const [conduitName, setConduitName] = useState<string>('EMT 1/2" (15 mm)');
  const [conduitFillPercent, setConduitFillPercent] = useState<number>(26.8);

  // Standard cables & conduits data
  const [cables] = useState<CableRecord[]>(INITIAL_CABLES);
  const [conduits] = useState<ConduitRecord[]>(INITIAL_CONDUITS);

  const handleTestsUpdated = useCallback((passed: number, total: number) => {
    setTestStats({ passed, total });
  }, []);

  // Handlers for cross-module workflows
const handleSizingCalculated = (
  breakerRating: number,
  ampacityIz: number,
  cable: CableRecord
) => {
  setBreakerRatingIn(breakerRating);
  setCableAmpacityIz(ampacityIz);
  setSelectedCable(cable);
};
const handleConduitFillCalculated = (
  name: string,
  fillPercent: number
) => {
  setConduitName(name);
  setConduitFillPercent(fillPercent);
};

const handleForwardToCableSizing = (
  calculatedIb: number,
  phase: PhaseType
) => {
  setCurrentIb(calculatedIb);
  setCurrentPhase(phase);
  setActivePage('cable_sizing');
};

const handleForwardToVoltageDrop = (
  currentA: number,
  cable: CableRecord,
  phase: PhaseType
) => {
  setCurrentIb(currentA);
  setSelectedCable(cable);
  setCurrentPhase(phase);
  setActivePage('voltage_drop');
};

const handleForwardToConduitSizing = (
  cable: CableRecord,
  phase: PhaseType
) => {
  setSelectedCable(cable);
  setCurrentPhase(phase);
  setActivePage('conduit_sizing');
};

  const handleOpenAiWithTrace = (trace: CalculationTrace) => {
    setAiTraceContext(trace);
    setAiTopic(`การตรวจสอบผลการคำนวณ: ${trace.result}`);
    setAiModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex font-['Prompt',sans-serif] antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        activePage={activePage}
        onSelectPage={setActivePage}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-72 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <Header
          activePage={activePage}
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenAiAssistant={() => {
            setAiTraceContext(null);
            setAiTopic('มาตรฐาน วสท. 022001-22 สำหรับวิศวกรไฟฟ้า');
            setAiModalOpen(true);
          }}
          testPassedCount={testStats.passed}
          testTotalCount={testStats.total}
        />

        {/* Page Content Container */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Mandatory Engineering Safety Disclaimer Banner */}
          <SafetyBanner />

          {/* Dynamic Module Page View */}
          {activePage === 'load_calculator' && (
            <LoadCalculatorPage
              onForwardToCableSizing={handleForwardToCableSizing}
              onAskAi={handleOpenAiWithTrace}
            />
          )}

          {activePage === 'cable_sizing' && (
            <CableSizingPage
            onSizingCalculated={handleSizingCalculated}
              initialIb={currentIb}
              initialPhase={currentPhase}
              cables={cables}
              onForwardToVoltageDrop={handleForwardToVoltageDrop}
              onForwardToConduitSizing={handleForwardToConduitSizing}
              onAskAi={handleOpenAiWithTrace}
            />
          )}

          {activePage === 'breaker_check' && (
            <BreakerCheckPage
              initialIb={currentIb}
              initialIz={cableAmpacityIz}
              onAskAi={handleOpenAiWithTrace}
            />
          )}

          {activePage === 'voltage_drop' && (
   <VoltageDropPage
  initialCurrent={currentIb}
  initialCable={selectedCable}
  initialPhase={currentPhase}
  cables={cables}
  onVoltageDropCalculated={setVoltageDropPercent}
  onAskAi={handleOpenAiWithTrace}
/>
          )}

          {activePage === 'conduit_sizing' && (
            <ConduitSizingPage
  initialCable={selectedCable}
  initialPhase={currentPhase}
  cables={cables}
  conduits={conduits}
  onConduitFillCalculated={handleConduitFillCalculated}
  onAskAi={handleOpenAiWithTrace}
/>
          )}

          {activePage === 'flexible_conduit' && (
            <FlexibleConduitPage
              cables={cables}
              conduits={conduits}
              onAskAi={handleOpenAiWithTrace}
            />
          )}

          {activePage === 'standards_db' && (
            <StandardsDbPage cables={cables} conduits={conduits} />
          )}

          {activePage === 'calculation_report' && (
            <CalculationReportPage
              currentIb={currentIb}
              selectedCable={selectedCable}
              breakerRatingIn={breakerRatingIn}
              cableAmpacityIz={cableAmpacityIz}
              voltageDropPercent={voltageDropPercent}
              conduitName={conduitName}
              conduitFillPercent={conduitFillPercent}
            />
          )}

          {activePage === 'settings_tests' && (
            <SettingsTestsPage
              onTestsUpdated={handleTestsUpdated}
            />
          )}
        </main>

        {/* Global Engineering Footer */}
        <footer className="print:hidden border-t border-slate-900 bg-slate-950/60 py-4 px-6 text-center text-xs text-slate-500 font-mono">
          <p>
            Electrical Engineering Calculator • อ้างอิงมาตรฐาน วสท. 022001-22 (พ.ศ. 2564) • Data Trust Engine Active
          </p>
        </footer>
      </div>

      {/* AI Assistant Modal */}
      <AiExplanationModal
        isOpen={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        trace={aiTraceContext}
        topic={aiTopic}
      />
    </div>
  );
}
