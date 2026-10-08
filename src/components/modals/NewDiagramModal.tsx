import React, { useState, useEffect } from 'react';
import { TrendingUp, X, Plus, Info } from 'lucide-react';
import { CustomAxisConfig } from '../../types';

interface NewDiagramModalProps {
  isOpen: boolean;
  chartType: string;
  onClose: () => void;
  onConfirm: (customTitle: string, config: CustomAxisConfig) => void;
}

export const NewDiagramModal: React.FC<NewDiagramModalProps> = ({
  isOpen,
  chartType,
  onClose,
  onConfirm
}) => {
  const [title, setTitle] = useState(chartType);
  const [xAxis, setXAxis] = useState('Date');
  const [yAxis, setYAxis] = useState('Volume');
  const [style, setStyle] = useState('line');
  const [scope, setScope] = useState('current');

  useEffect(() => {
    setTitle(chartType);
    if (chartType === 'Trend Timeline') {
      setXAxis('Date'); setYAxis('Volume'); setStyle('line');
    } else if (chartType === 'Distribution Share') {
      setXAxis('Platform'); setYAxis('Volume'); setStyle('donut');
    } else if (chartType === 'Efficiency Comparison') {
      setXAxis('Campaign'); setYAxis('Rate'); setStyle('bar');
    } else if (chartType === 'Cross-Type Engagement Share Distribution') {
      setXAxis('Type'); setYAxis('Engagements'); setStyle('donut');
    } else {
      setXAxis('Campaign'); setYAxis('Volume'); setStyle('bar');
    }
  }, [chartType, isOpen]);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirm(title.trim() || chartType, {
      xAxis,
      yAxis,
      style,
      baseType: chartType
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg mx-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/50 text-orange-600 dark:text-orange-400 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
                Configure New Diagram: {chartType}
              </h3>
              <p className="text-[11px] text-slate-400">
                Choose metrics and dimensions to compare before placing on dashboard.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Diagram Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Diagram Custom Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500 focus:outline-none"
              placeholder="e.g. Sydney vs Melbourne Efficiency"
            />
          </div>

          {/* X Axis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Horizontal Dimension (X-Axis / Comparison Basis)
            </label>
            <select
              value={xAxis}
              onChange={(e) => setXAxis(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500"
            >
              <option value="Date">Date / Timeline</option>
              <option value="City">City / Market Location</option>
              <option value="Campaign">Campaign Name / Promo Code</option>
              <option value="DayOfWeek">Day of the Week (Activity)</option>
              <option value="Platform">Marketing Platform / Channel</option>
            </select>
          </div>

          {/* Y Axis */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Vertical Metric (Y-Axis / Measure)
            </label>
            <select
              value={yAxis}
              onChange={(e) => setYAxis(e.target.value)}
              className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500"
            >
              <option value="Volume">Exposure / Volume (Shows / Sends / Claims)</option>
              <option value="Interactions">Interactions (Clicks / Usages / Direct Opens)</option>
              <option value="Rate">Efficiency Rate (CTR / Utilisation %)</option>
              <option value="UV">Unique Users Reach (UV)</option>
            </select>
          </div>

          {/* Visual Display Style & Channel Scope */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Chart Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="bar">Bar Chart</option>
                <option value="line">Trend Timeline</option>
                <option value="donut">Distribution Share / Donut</option>
                <option value="area">Stacked Area Horizon</option>
                <option value="scatter">Scatter Matrix</option>
                <option value="heatmap">Heatmap Matrix</option>
                <option value="treemap">Volume Treemap</option>
                <option value="funnel">Conversion Funnel</option>
                <option value="radar">Radar Profile</option>
                <option value="boxplot">Box Plot Dispersion</option>
                <option value="waterfall">Waterfall Walkdown</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Channel Scope
              </label>
              <select
                value={scope}
                onChange={(e) => setScope(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-orange-500"
              >
                <option value="current">Current Filter Scope</option>
                <option value="all">All Channels Combined</option>
                <option value="inapp">In-App Ads Only</option>
                <option value="promo">Promo Codes Only</option>
                <option value="comm">Communications Push Only</option>
              </select>
            </div>
          </div>

          {/* Live Configuration Summary */}
          <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-xs text-slate-600 dark:text-slate-400">
            <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1 mb-1">
              <Info className="w-3.5 h-3.5 text-orange-500" />
              <span>Live Configuration Summary:</span>
            </span>
            <p>
              Comparing <strong className="text-slate-800 dark:text-slate-100">{xAxis}</strong> against{' '}
              <strong className="text-slate-800 dark:text-slate-100">{yAxis}</strong> using a{' '}
              <strong className="text-slate-800 dark:text-slate-100">{style}</strong> display.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end space-x-2 px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-850">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-medium border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-md shadow-orange-500/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Confirm &amp; Add to Dashboard</span>
          </button>
        </div>
      </div>
    </div>
  );
};
