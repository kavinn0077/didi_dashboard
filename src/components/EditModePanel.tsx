import React, { useState, useRef, useEffect } from 'react';
import { 
  GripVertical, 
  X, 
  PlusCircle, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Sliders, 
  TrendingUp, 
  PieChart, 
  BarChart3, 
  ScatterChart, 
  LayoutGrid, 
  Boxes, 
  Filter, 
  Radar, 
  SlidersHorizontal, 
  Layers, 
  BarChartHorizontal 
} from 'lucide-react';
import { LanguageCode, PlatformType } from '../types';
import { I18N_DICT } from '../data/i18n';

interface EditModePanelProps {
  currentDiagrams: string[];
  platform: PlatformType;
  onRemoveDiagram: (name: string) => void;
  onReorderDiagrams: (dragIndex: number, hoverIndex: number) => void;
  onMoveDiagram?: (index: number, direction: number) => void;
  onOpenAddModal: (type: string) => void;
  currentLang: LanguageCode;
}

const AVAILABLE_DIAGRAM_TYPES = [
  { name: 'Trend Timeline', desc: 'Multi-series timeline metric analysis', icon: TrendingUp, bg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' },
  { name: 'Distribution Share', desc: 'Market & platform exposure breakdowns', icon: PieChart, bg: 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400' },
  { name: 'Efficiency Comparison', desc: 'Cross-channel CTR & conversion benchmarking', icon: BarChart3, bg: 'bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400' },
  { name: 'Cross-Type Engagement Share Distribution', desc: 'Cross-type engagement contribution breakdown', icon: PieChart, bg: 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400' },
  { name: 'Volume Treemap', desc: 'Hierarchical volume block allocation', icon: Boxes, bg: 'bg-teal-100 dark:bg-teal-950/60 text-teal-600 dark:text-teal-400' },
  { name: 'Conversion Funnel', desc: 'Impression to completed ride attrition', icon: Filter, bg: 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400' },
  { name: 'Radar Profile', desc: 'Multi-axis operational performance index', icon: Radar, bg: 'bg-cyan-100 dark:bg-cyan-950/60 text-cyan-600 dark:text-cyan-400' },
  { name: 'Box Plot Dispersion', desc: 'Variance, medians and outlier distribution', icon: SlidersHorizontal, bg: 'bg-fuchsia-100 dark:bg-fuchsia-950/60 text-fuchsia-600 dark:text-fuchsia-400' },
  { name: 'Stacked Area Horizon', desc: 'Cumulative volume composition over time', icon: Layers, bg: 'bg-violet-100 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400' },
  { name: 'Waterfall Walkdown', desc: 'Gross to net interaction & drop-off attribution', icon: BarChartHorizontal, bg: 'bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400' },
  { name: 'Heatmap Matrix', desc: 'Density matrix & hourly intensity distribution', icon: LayoutGrid, bg: 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400' }
];

export const EditModePanel: React.FC<EditModePanelProps> = ({
  currentDiagrams,
  onRemoveDiagram,
  onReorderDiagrams,
  onMoveDiagram,
  onOpenAddModal,
  currentLang
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const t = I18N_DICT[currentLang] || I18N_DICT.en;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onReorderDiagrams(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
  };

  return (
    <div id="edit-mode-panel" className="p-4 rounded-2xl bg-orange-50/70 dark:bg-slate-800/80 border border-orange-200 dark:border-slate-700 shadow-sm space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <span className="px-2 py-0.5 rounded bg-orange-600 text-white font-bold text-xs uppercase tracking-wide">
            {t.edit_mode_tag}
          </span>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t.edit_mode_title}
          </h4>
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
          <GripVertical className="w-3.5 h-3.5" />
          <span>{t.edit_mode_instruction}</span>
        </p>
      </div>

      {/* Draggable active diagram chips */}
      <div className="flex flex-wrap gap-2">
        {currentDiagrams.map((key, idx) => (
          <div
            key={`${key}-${idx}`}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, idx)}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-orange-600 text-white text-xs font-bold shadow-sm cursor-move select-none active:scale-95 transition"
          >
            <GripVertical className="w-3 h-3 text-orange-200" />
            <span>{key}</span>
            <div className="flex items-center space-x-0.5 ml-1 border-l border-orange-500 pl-1">
              {onMoveDiagram && idx > 0 && (
                <button
                  type="button"
                  onClick={() => onMoveDiagram(idx, -1)}
                  className="text-orange-200 hover:text-white p-0.5 cursor-pointer"
                  title="Move Left"
                >
                  <ChevronLeft className="w-3 h-3" />
                </button>
              )}
              {onMoveDiagram && idx < currentDiagrams.length - 1 && (
                <button
                  type="button"
                  onClick={() => onMoveDiagram(idx, 1)}
                  className="text-orange-200 hover:text-white p-0.5 cursor-pointer"
                  title="Move Right"
                >
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
            <button
              onClick={() => onRemoveDiagram(key)}
              className="text-orange-200 hover:text-white ml-1 text-sm font-bold cursor-pointer"
              title={`Remove ${key}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add New Diagram Custom Menu */}
      <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-orange-100 dark:border-slate-700">
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4 text-orange-600 dark:text-orange-400" />
          <span>{t.add_new_diagram_label}</span>
        </label>

        {/* Custom Popover Dropdown Wrapper */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-orange-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-100 hover:border-orange-500 transition shadow-sm flex items-center justify-between min-w-[280px] cursor-pointer"
          >
            <span className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-600" />
              <span>{t.opt_choose_diagram}</span>
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {/* Custom Dropdown Menu with Rounded Pastel Badges */}
          {dropdownOpen && (
            <div className="absolute left-0 bottom-full mb-2 w-80 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl p-2 z-50 max-h-96 overflow-y-auto animate-in fade-in zoom-in-95">
              <div className="px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100 dark:border-slate-800 mb-1">
                AVAILABLE ANALYTICS DIAGRAMS
              </div>
              <div className="space-y-1">
                {AVAILABLE_DIAGRAM_TYPES.map((diag) => {
                  const Icon = diag.icon;
                  return (
                    <button
                      key={diag.name}
                      onClick={() => {
                        setDropdownOpen(false);
                        onOpenAddModal(diag.name);
                      }}
                      className="w-full text-left p-2 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition flex items-center space-x-3 group cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-xl ${diag.bg} flex items-center justify-center shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-800 dark:text-slate-100 group-hover:text-orange-600 transition">
                          {diag.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {diag.desc}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <span className="text-[11px] text-orange-600 dark:text-orange-400 italic flex items-center gap-1">
          <Sliders className="w-3 h-3" />
          <span>A configuration window will open to customize data dimensions before adding.</span>
        </span>
      </div>
    </div>
  );
};
