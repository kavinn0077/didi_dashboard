import React, { useState, useRef, useMemo } from 'react';
import { 
  Database, 
  FileSpreadsheet, 
  Download, 
  ChevronLeft, 
  ChevronRight, 
  ExternalLink, 
  Radio, 
  FileText, 
  Search 
} from 'lucide-react';
import { ConsolidatedRow, InAppRecord, PromoRecord, CommRecord, LanguageCode } from '../types';
import { I18N_DICT } from '../data/i18n';

interface DataExplorerSectionProps {
  rows: ConsolidatedRow[];
  inAppData?: InAppRecord[];
  promoData?: PromoRecord[];
  commData?: CommRecord[];
  currentPage: number;
  pageSize: number;
  onPageChange: (newPage: number) => void;
  onExportCSV: () => void;
  onGenerateWord: () => void;
  onFileUpload: (files: FileList | null) => void;
  currentLang: LanguageCode;
  platform?: string;
}

export const DataExplorerSection: React.FC<DataExplorerSectionProps> = ({
  rows,
  inAppData = [],
  promoData = [],
  commData = [],
  currentPage,
  pageSize,
  onPageChange,
  onExportCSV,
  onGenerateWord,
  onFileUpload,
  currentLang,
  platform
}) => {
  const jumpInputRef = useRef<HTMLInputElement>(null);
  const t = I18N_DICT[currentLang] || I18N_DICT.en;

  const [filterType, setFilterType] = useState('All');
  const [filterCity, setFilterCity] = useState('All');
  const [filterCampaign, setFilterCampaign] = useState('All');

  const isInApp = platform === 'In-App Ads';
  const isPromo = platform === 'Promo Codes';
  const isComm = platform === 'Communications';

  const filteredRows = useMemo(() => {
    return rows.filter(r => {
      if (filterType !== 'All' && r.type !== filterType) return false;
      if (filterCity !== 'All' && r.city !== filterCity) return false;
      if (filterCampaign !== 'All' && r.campaignIdentifier !== filterCampaign) return false;
      return true;
    });
  }, [rows, filterType, filterCity, filterCampaign]);

  const uniqueTypes = ['All', 'In-App Ads', 'Promo Codes', 'Communications'];
  const uniqueCities = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => { if (r.city) set.add(r.city); });
    return ['All', ...Array.from(set).sort()];
  }, [rows]);
  const uniqueCampaigns = useMemo(() => {
    const set = new Set<string>();
    rows.forEach(r => { if (r.campaignIdentifier) set.add(r.campaignIdentifier); });
    return ['All', ...Array.from(set).sort()];
  }, [rows]);

  const totalRows = isInApp ? inAppData.length : isPromo ? promoData.length : isComm ? commData.length : filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(Math.max(1, currentPage), totalPages);

  const startIdx = (safeCurrentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, totalRows);
  const pageInAppRows = isInApp ? inAppData.slice(startIdx, endIdx) : [];
  const pagePromoRows = isPromo ? promoData.slice(startIdx, endIdx) : [];
  const pageCommRows = isComm ? commData.slice(startIdx, endIdx) : [];
  const pageRows = !isInApp && !isPromo && !isComm ? filteredRows.slice(startIdx, endIdx) : [];

  const handleJump = () => {
    if (!jumpInputRef.current) return;
    let target = parseInt(jumpInputRef.current.value);
    if (isNaN(target) || target < 1) target = 1;
    if (target > totalPages) target = totalPages;
    onPageChange(target);
  };

  return (
    <section id="data-explorer-section" className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <Database className="w-4 h-4 text-orange-600" />
          <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 uppercase">
            {t.data_explorer_title}
          </h2>
        </div>
      </div>

      {/* Type = All Hierarchical Dropdown Filters */}
      {!isInApp && !isPromo && !isComm && (
        <div className="flex flex-wrap items-center gap-3 bg-slate-50 dark:bg-slate-800/60 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs shadow-sm">
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Type:</span>
            <select
              value={filterType}
              onChange={(e) => { setFilterType(e.target.value); onPageChange(1); }}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-orange-500"
            >
              {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Market / City:</span>
            <select
              value={filterCity}
              onChange={(e) => { setFilterCity(e.target.value); onPageChange(1); }}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 max-w-[160px] truncate"
            >
              {uniqueCities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-slate-700 dark:text-slate-300">Campaign Identifier:</span>
            <select
              value={filterCampaign}
              onChange={(e) => { setFilterCampaign(e.target.value); onPageChange(1); }}
              className="text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:ring-1 focus:ring-orange-500 max-w-[180px] truncate"
            >
              {uniqueCampaigns.map(cp => <option key={cp} value={cp}>{cp}</option>)}
            </select>
          </div>
          {(filterType !== 'All' || filterCity !== 'All' || filterCampaign !== 'All') && (
            <button
              onClick={() => { setFilterType('All'); setFilterCity('All'); setFilterCampaign('All'); onPageChange(1); }}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-700 transition cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Raw Data Table Card */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        <div className="max-h-80 overflow-y-auto overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 dark:bg-slate-800/70 sticky top-0 border-b border-slate-100 dark:border-slate-800 z-10">
              <tr>
                {isInApp ? (
                  <>
                    <th className="py-2.5 px-3 font-semibold">date</th>
                    <th className="py-2.5 px-3 font-semibold">city name</th>
                    <th className="py-2.5 px-3 font-semibold">resource id</th>
                    <th className="py-2.5 px-3 font-semibold">plan id</th>
                    <th className="py-2.5 px-3 font-semibold">plan name</th>
                    <th className="py-2.5 px-3 font-semibold">campaign id</th>
                    <th className="py-2.5 px-3 font-semibold">campaign name</th>
                    <th className="py-2.5 px-3 font-semibold">plan start time</th>
                    <th className="py-2.5 px-3 font-semibold">plan end time</th>
                    <th className="py-2.5 px-3 font-semibold">campaign ver</th>
                    <th className="py-2.5 px-3 font-semibold text-right">show pv</th>
                    <th className="py-2.5 px-3 font-semibold text-right">show uv</th>
                    <th className="py-2.5 px-3 font-semibold text-right">click pv</th>
                    <th className="py-2.5 px-3 font-semibold text-right">click uv</th>
                    <th className="py-2.5 px-3 font-semibold">resource name</th>
                    <th className="py-2.5 px-3 font-semibold">template id</th>
                    <th className="py-2.5 px-3 font-semibold">reporting date</th>
                    <th className="py-2.5 px-3 font-semibold">ctr click pv show pv</th>
                    <th className="py-2.5 px-3 font-semibold">frequency show pv show uv</th>
                    <th className="py-2.5 px-3 font-semibold">unique click rate click uv show uv</th>
                    <th className="py-2.5 px-3 font-semibold">data quality status</th>
                    <th className="py-2.5 px-3 font-semibold">data quality flag</th>
                    <th className="py-2.5 px-3 font-semibold text-center">redirect url</th>
                  </>
                ) : isPromo ? (
                  <>
                    <th className="py-2.5 px-3 font-semibold">date</th>
                    <th className="py-2.5 px-3 font-semibold">promo code</th>
                    <th className="py-2.5 px-3 font-semibold">city</th>
                    <th className="py-2.5 px-3 font-semibold text-right">redemption count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">usage count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">Utilisation Rate(%)</th>
                    <th className="py-2.5 px-3 font-semibold text-center">redirect url</th>
                  </>
                ) : isComm ? (
                  <>
                    <th className="py-2.5 px-3 font-semibold">date</th>
                    <th className="py-2.5 px-3 font-semibold">canvas id</th>
                    <th className="py-2.5 px-3 font-semibold">canvas name</th>
                    <th className="py-2.5 px-3 font-semibold">start date</th>
                    <th className="py-2.5 px-3 font-semibold">end date</th>
                    <th className="py-2.5 px-3 font-semibold">step id</th>
                    <th className="py-2.5 px-3 font-semibold">step name</th>
                    <th className="py-2.5 px-3 font-semibold">channel</th>
                    <th className="py-2.5 px-3 font-semibold text-right">request count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">delivered count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">open count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">show count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">link eligible count</th>
                    <th className="py-2.5 px-3 font-semibold text-right">click count</th>
                    <th className="py-2.5 px-3 font-semibold text-center">redirect url</th>
                  </>
                ) : (
                  <>
                    <th className="py-2.5 px-3 font-semibold">DATE</th>
                    <th className="py-2.5 px-3 font-semibold">TYPE</th>
                    <th className="py-2.5 px-3 font-semibold">CHANNEL</th>
                    <th className="py-2.5 px-3 font-semibold">MARKET / CITY</th>
                    <th className="py-2.5 px-3 font-semibold">CAMPAIGN IDENTIFIER</th>
                    <th className="py-2.5 px-3 font-semibold text-right">REACH / VOLUME</th>
                    <th className="py-2.5 px-3 font-semibold text-right">ENGAGEMENTS</th>
                    <th className="py-2.5 px-3 font-semibold text-center">REDIRECT URL</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {isInApp ? (
                pageInAppRows.length === 0 ? (
                  <tr>
                    <td colSpan={23} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <span>No matching records found.</span>
                    </td>
                  </tr>
                ) : (
                  pageInAppRows.map((r, idx) => {
                    return (
                      <tr key={`${r.campaign_name}-${r.date}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-mono text-slate-500">{r.date || r.pt}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.city_name}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{r.resource_id || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{r.plan_id || '-'}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300 max-w-[150px] truncate" title={r.plan_name}>{r.plan_name || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{r.campaign_id || '-'}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100 max-w-[160px] truncate" title={r.campaign_name}>{r.campaign_name}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.plan_start_time || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.plan_end_time || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.campaign_ver || 'All'}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.show_pv ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.show_uv ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.click_pv ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.click_uv ?? 0).toLocaleString()}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.resource_name || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.template_id || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.reporting_date || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{r.ctr_click_pv_show_pv || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{r.frequency_show_pv_show_uv || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{r.unique_click_rate_click_uv_show_uv || '-'}</td>
                        <td className="py-2 px-3">
                          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${r.data_quality_status === 'Valid' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'}`}>
                            {r.data_quality_status || 'Valid'}
                          </span>
                        </td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.data_quality_flag || '-'}</td>
                        <td className="py-2 px-3 text-center">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 dark:text-orange-400 hover:underline text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : isPromo ? (
                pagePromoRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <span>No matching promo records found.</span>
                    </td>
                  </tr>
                ) : (
                  pagePromoRows.map((r, idx) => {
                    const utilRate = r.redemption_count > 0 ? ((r.usage_count / r.redemption_count) * 100).toFixed(2) + '%' : '0.00%';
                    return (
                      <tr key={`${r.promocode}-${r.date}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                        <td className="py-2 px-3 font-mono text-slate-500">{r.date}</td>
                        <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100">{r.promocode}</td>
                        <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.city_name}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{r.redemption_count.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{r.usage_count.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right font-bold font-mono text-orange-600 dark:text-orange-400">{utilRate}</td>
                        <td className="py-2 px-3 text-center">
                          <a
                            href={r.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-orange-600 dark:text-orange-400 hover:underline text-[11px] font-medium inline-flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Link</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })
                )
              ) : isComm ? (
                pageCommRows.length === 0 ? (
                  <tr>
                    <td colSpan={15} className="py-8 text-center text-slate-400 dark:text-slate-500">
                      <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <span>No matching communication records found.</span>
                    </td>
                  </tr>
                ) : (
                  pageCommRows.map((r, idx) => (
                    <tr key={`${r.canvas_id}-${r.date}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-2 px-3 font-mono text-slate-500">{r.date}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{r.canvas_id}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100 max-w-[180px] truncate" title={r.canvas_name}>{r.canvas_name}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{r.campaign_start_date || '-'}</td>
                      <td className="py-2 px-3 font-mono text-slate-500">{r.campaign_end_date || '-'}</td>
                      <td className="py-2 px-3 font-mono text-slate-600 dark:text-slate-300">{r.step_id || '-'}</td>
                      <td className="py-2 px-3 text-slate-600 dark:text-slate-300">{r.step_name || '-'}</td>
                      <td className="py-2 px-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.channel === 'Push' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300' :
                          r.channel === 'Email' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300' :
                          'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                        }`}>
                          {r.channel || 'Push'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.request_count ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.delivered_count ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.open_count ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.show_count ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.link_eligible_count ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">{(r.click_count ?? 0).toLocaleString()}</td>
                      <td className="py-2 px-3 text-center">
                        <a
                          href={r.url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-orange-600 dark:text-orange-400 hover:underline text-[11px] font-medium inline-flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Link</span>
                        </a>
                      </td>
                    </tr>
                  ))
                )
              ) : pageRows.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-400 dark:text-slate-500">
                    <Search className="w-6 h-6 mx-auto mb-2 opacity-50" />
                    <span>No matching records found. Try adjusting your keyword or minimum volume.</span>
                  </td>
                </tr>
              ) : (
                pageRows.map((r, idx) => (
                  <tr key={`${r.campaignIdentifier}-${r.date}-${idx}`} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 font-mono text-slate-500">{r.date}</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        r.type === 'In-App Ads'
                          ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                          : r.type === 'Promo Codes'
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300'
                      }`}>
                        {r.type}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-slate-600 dark:text-slate-300 font-medium">{r.channel}</td>
                    <td className="py-2 px-3 text-slate-700 dark:text-slate-300">{r.city}</td>
                    <td className="py-2 px-3 font-semibold text-slate-800 dark:text-slate-100 max-w-[200px] truncate" title={r.campaignIdentifier}>
                      {r.campaignIdentifier}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {r.reach.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-600 dark:text-slate-300">
                      {r.engagements.toLocaleString()}
                    </td>
                    <td className="py-2 px-3 text-center">
                      <a
                        href={r.url || "https://web.didiglobal.com/au/"}
                        target="_blank"
                        rel="noreferrer"
                        className="text-orange-600 dark:text-orange-400 hover:underline text-[11px] font-medium inline-flex items-center gap-1 max-w-[150px] truncate"
                        title={r.campaignIdentifier}
                      >
                        <ExternalLink className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{r.campaignIdentifier}</span>
                      </a>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Dedicated Interactive Pagination Bar */}
        <div className="px-4 py-2.5 bg-slate-50/90 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Left: Summary Count */}
          <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
            {totalRows === 0 ? 'Showing 0 records' : `Showing ${startIdx + 1} - ${endIdx} of ${totalRows.toLocaleString()} records`}
          </span>

          {/* Right: Prev / Next / Page Indicator / Quick Jump */}
          <div className="flex items-center space-x-2">
            {/* Previous Button */}
            <button
              onClick={() => onPageChange(safeCurrentPage - 1)}
              disabled={safeCurrentPage <= 1}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <ChevronLeft className="w-3 h-3" />
              <span>Prev</span>
            </button>

            {/* Page Indicator: Current / Total */}
            <div className="px-2 py-1 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs shadow-sm flex items-center space-x-1">
              <span>Page</span>
              <span className="font-bold text-orange-600 dark:text-orange-400">{safeCurrentPage}</span>
              <span>/</span>
              <span className="font-bold">{totalPages}</span>
            </div>

            {/* Next Button */}
            <button
              onClick={() => onPageChange(safeCurrentPage + 1)}
              disabled={safeCurrentPage >= totalPages}
              className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center gap-1 shadow-sm cursor-pointer"
            >
              <span>Next</span>
              <ChevronRight className="w-3 h-3" />
            </button>

            {/* Quick Page Jump */}
            <div className="flex items-center space-x-1.5 pl-2 border-l border-slate-200 dark:border-slate-700">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Jump:</span>
              <input
                ref={jumpInputRef}
                type="number"
                min={1}
                max={totalPages}
                defaultValue={safeCurrentPage}
                onKeyDown={(e) => { if (e.key === 'Enter') handleJump(); }}
                className="w-14 text-xs px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 text-center font-semibold focus:ring-1 focus:ring-orange-500 focus:outline-none"
              />
              <button
                onClick={handleJump}
                className="px-2.5 py-1 rounded-lg text-xs font-bold bg-orange-600 hover:bg-orange-700 text-white shadow-sm transition cursor-pointer"
              >
                Go
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Data Status & Single-Row Report Generator */}
        <div className="px-4 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
            <span>{t.live_stream_tag}</span>
          </span>

          {/* Compact Single-Row Report Generator with Hover Tooltips */}
          <div className="flex items-center space-x-2">
            {/* Word Report Button with Tooltip */}
            <div className="relative group">
              <button
                onClick={onGenerateWord}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shadow-blue-500/20 transition flex items-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>{t.btn_gen_word}</span>
              </button>
              <div className="hidden group-hover:block absolute bottom-full right-0 mb-2 w-64 p-2.5 rounded-xl bg-slate-900 text-white text-[11px] shadow-2xl border border-slate-700 z-50 pointer-events-none animate-in fade-in">
                <p className="font-bold text-blue-400 mb-0.5">{t.tip_word_title}</p>
                <p className="text-slate-300">{t.tip_word_desc}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
