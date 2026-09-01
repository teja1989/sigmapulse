'use client';

import React from 'react';
import { SECTORS, SectorDefinition } from '@/lib/data/sectors';
import { 
  Cpu, 
  Atom, 
  Activity, 
  Landmark, 
  Grid, 
  TrendingUp, 
  Sparkles,
  Flame
} from 'lucide-react';

interface SectorNavigationProps {
  activeSectorId: string;
  onSelectSector: (sectorId: string) => void;
}

export const SectorNavigation: React.FC<SectorNavigationProps> = ({
  activeSectorId,
  onSelectSector,
}) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Cpu': return <Cpu className="w-4 h-4" />;
      case 'Atom': return <Atom className="w-4 h-4" />;
      case 'Activity': return <Activity className="w-4 h-4" />;
      case 'Landmark': return <Landmark className="w-4 h-4" />;
      default: return <Grid className="w-4 h-4" />;
    }
  };

  const isAll = activeSectorId === 'all';

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-semibold tracking-wider text-slate-300 uppercase font-mono">
            Sector Intelligence Hub
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-500 hidden sm:inline">
          Dynamic Portfolio Matrix • Click Sector to Repaint Terminal
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-2.5">
        {/* All Sectors Tab */}
        <button
          onClick={() => onSelectSector('all')}
          className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${
            isAll
              ? 'bg-cyan-950/40 border-cyan-500/60 shadow-glow-cyan'
              : 'bg-surface-200/60 hover:bg-surface-100/80 border-white/5 hover:border-white/15'
          }`}
        >
          <div className="flex items-center justify-between mb-1.5">
            <div className={`p-1.5 rounded-lg ${isAll ? 'bg-cyan-500/20 text-cyan-300' : 'bg-white/5 text-slate-400 group-hover:text-slate-200'}`}>
              <Grid className="w-4 h-4" />
            </div>
            <span className="text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded bg-cyan-900/40 text-cyan-300 border border-cyan-700/40">
              AGGREGATED
            </span>
          </div>
          <div className="font-semibold text-xs text-slate-100 group-hover:text-white">All Active Sectors</div>
          <div className="text-[10px] text-slate-400 font-mono mt-0.5">Macro Cross-Asset View</div>
          {isAll && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-cyan-400 shadow-glow-cyan" />}
        </button>

        {/* Dynamic Sector Tabs */}
        {SECTORS.map((sector) => {
          const isSelected = activeSectorId === sector.id;
          return (
            <button
              key={sector.id}
              onClick={() => onSelectSector(sector.id)}
              className={`p-3 rounded-xl text-left border transition-all relative overflow-hidden group ${
                isSelected
                  ? 'bg-surface-100/90 shadow-lg'
                  : 'bg-surface-200/60 hover:bg-surface-100/80 border-white/5 hover:border-white/15'
              }`}
              style={{
                borderColor: isSelected ? sector.color : undefined,
                boxShadow: isSelected ? `0 0 16px -2px ${sector.glowColor}` : undefined,
              }}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div
                  className="p-1.5 rounded-lg"
                  style={{
                    backgroundColor: `${sector.color}20`,
                    color: sector.color,
                  }}
                >
                  {getIcon(sector.iconName)}
                </div>
                <div className="flex items-center space-x-1">
                  <span
                    className="text-[11px] font-mono font-bold"
                    style={{ color: sector.dailyChange >= 0 ? '#00FF66' : '#FF3366' }}
                  >
                    {sector.dailyChange >= 0 ? '+' : ''}{sector.dailyChange.toFixed(2)}%
                  </span>
                </div>
              </div>

              <div className="font-semibold text-xs text-slate-100 truncate group-hover:text-white">
                {sector.name}
              </div>

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mt-1">
                <span>Top: {sector.topPerformer}</span>
                <span className="text-slate-500">{sector.marketCap}</span>
              </div>

              {isSelected && (
                <div
                  className="absolute bottom-0 left-0 right-0 h-0.5"
                  style={{ backgroundColor: sector.color }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
