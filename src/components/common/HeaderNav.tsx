import React, { useState } from 'react';
import { Lock, Unlock, FileSpreadsheet } from 'lucide-react';
import { PortalType } from '../../types/chapel';
import { useChapel } from '../../context/ChapelContext';
import { ExportImportModal } from './ExportImportModal';
import { PinLockModal } from './PinLockModal';

export const HeaderNav: React.FC = () => {
  const { activePortal, setActivePortal, unlockedPortals, lockPortal } = useChapel();
  const [showExportModal, setShowExportModal] = useState(false);
  const [pendingPortalToUnlock, setPendingPortalToUnlock] = useState<PortalType | null>(null);

  const handlePortalClick = (portal: PortalType) => {
    if (activePortal === portal) return;

    if (unlockedPortals[portal]) {
      setActivePortal(portal);
    } else {
      setPendingPortalToUnlock(portal);
    }
  };

  const handleToggleCurrentLock = () => {
    lockPortal(activePortal);
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 md:gap-8">
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <img 
              src="/src/assets/images/chapel_emblem_1791928260015.jpg" 
              alt="ኤዴን ቻፕል አርማ"
              className="w-10 h-10 rounded-full object-cover border border-amber-500/40 shadow-xs shrink-0" 
            />
            <div className="leading-none">
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap block">
                ብርብር ቃለ ሕይወት · ኤዴን ቻፕል
              </span>
              <span className="text-[11px] text-amber-700 font-medium hidden sm:inline-block mt-0.5">
                የአባላትና የመሪዎች መቆጣጠሪያ ሲስተም
              </span>
            </div>
          </div>

          {/* Zone 2: 3 Portal Nav Tabs */}
          <nav className="flex items-center gap-1 sm:gap-2 overflow-x-auto py-1">
            <button
              onClick={() => handlePortalClick('coordinator')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activePortal === 'coordinator'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>1. የአስተባባሪ ገጽ</span>
              {!unlockedPortals.coordinator && <Lock className="w-3 h-3 text-amber-400" />}
            </button>

            <button
              onClick={() => handlePortalClick('leaders')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activePortal === 'leaders'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>2. የመሪዎች ገጽ</span>
              {!unlockedPortals.leaders && <Lock className="w-3 h-3 text-amber-400" />}
            </button>

            <button
              onClick={() => handlePortalClick('members')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activePortal === 'members'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <span>3. የአባላት ገጽ</span>
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action + Lock Status */}
          <div className="flex items-center gap-2 shrink-0">
            {unlockedPortals[activePortal] && (
              <button
                onClick={handleToggleCurrentLock}
                title="ይህን ገጽ ቆልፍ"
                className="hidden md:flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 px-2 py-1.5 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5 text-emerald-600" />
                <span>ክፍት</span>
              </button>
            )}

            <button
              onClick={() => setShowExportModal(true)}
              className="px-3.5 py-2 text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>ኤክሴል / ምትኬ</span>
            </button>
          </div>
        </div>
      </header>

      {/* Export / Import Modal */}
      <ExportImportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
      />

      {/* PIN Unlock Modal */}
      {pendingPortalToUnlock && (
        <PinLockModal
          portalToUnlock={pendingPortalToUnlock}
          isOpen={!!pendingPortalToUnlock}
          onClose={() => setPendingPortalToUnlock(null)}
          onSuccess={() => setPendingPortalToUnlock(null)}
        />
      )}
    </>
  );
};
