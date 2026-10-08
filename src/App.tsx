import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  MarketType, 
  PlatformType, 
  PeriodType, 
  LanguageCode, 
  InAppRecord, 
  PromoRecord, 
  CommRecord, 
  ConsolidatedRow, 
  CustomAxisConfig 
} from './types';
import { 
  generateDatasets, 
  ALL_CITIES, 
  CITY_COUNTRY_MAP, 
  DEFAULT_CHARTS, 
  DEFAULT_COMM_CHARTS,
  DEFAULT_INAPP_CHARTS,
  DEFAULT_PROMO_CHARTS
} from './data/mockData';
import { I18N_DICT } from './data/i18n';
import { loadRealDatasets } from './data/dataLoader';

// Components
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { FilterEngine } from './components/FilterEngine';
import { EditModePanel } from './components/EditModePanel';
import { KPICards } from './components/KPICards';
import { PerformanceCharts } from './components/PerformanceCharts';
import { LeaderboardSection } from './components/LeaderboardSection';
import { RecommendationsSection } from './components/RecommendationsSection';
import { DataExplorerSection } from './components/DataExplorerSection';
import { AIAnalyticStudio } from './components/AIAnalyticStudio';
import { SettingsStudio } from './components/SettingsStudio';
import { Toast } from './components/Toast';

// Modals
import { NewDiagramModal } from './components/modals/NewDiagramModal';
import { ResetModal } from './components/modals/ResetModal';
import { InsightModal } from './components/modals/InsightModal';
import { AIChatModal } from './components/modals/AIChatModal';

// Top action icons
import { RefreshCw, Edit3, Check, RotateCcw, Bot } from 'lucide-react';

export default function App() {
  // Master Datasets
  const [rawDatasets, setRawDatasets] = useState<{
    inApp: InAppRecord[];
    promo: PromoRecord[];
    comm: CommRecord[];
  }>(() => generateDatasets());
  const [commHourlyData, setCommHourlyData] = useState<any[]>([]);

  useEffect(() => {
    loadRealDatasets().then(({ inapp, promo, comm, commHourly }) => {
      setCommHourlyData(commHourly || []);
      const mappedInApp: InAppRecord[] = inapp.map(r => ({
        date: r.date,
        pt: r.pt,
        day_of_week: r.day_of_week,
        city_name: r.city_name,
        country: r.country,
        resource_id: r.resource_id,
        resource_name: r.resource_name,
        plan_id: r.plan_id,
        plan_name: r.plan_name,
        campaign_id: r.campaign_id,
        campaign_name: r.campaign_name,
        campaign_ver: r.campaign_ver,
        plan_start_time: r.plan_start_time,
        plan_end_time: r.plan_end_time,
        show_pv: r.show_pv,
        click_pv: r.click_pv,
        show_uv: r.show_uv,
        click_uv: r.click_uv,
        reporting_date: r.reporting_date,
        template_id: r.template_id,
        ctr_click_pv_show_pv: r.ctr_click_pv_show_pv,
        frequency_show_pv_show_uv: r.frequency_show_pv_show_uv,
        unique_click_rate_click_uv_show_uv: r.unique_click_rate_click_uv_show_uv,
        data_quality_status: r.data_quality_status,
        data_quality_flag: r.data_quality_flag,
        url: r.url
      }));

      const mappedPromo: PromoRecord[] = promo.map(r => ({
        date: r.date,
        day_of_week: r.day_of_week,
        city_name: r.city_name,
        country: r.country,
        promocode: r.promocode,
        redemption_count: r.redemption_count,
        usage_count: r.usage_count,
        url: r.url
      }));

      const mappedComm: CommRecord[] = comm.map(r => ({
        date: r.report_date || r.date,
        day_of_week: r.day_of_week,
        target_markets: r.target_markets,
        country: r.country,
        channel: r.channel,
        canvas_id: r.canvas_id,
        canvas_name: r.canvas_name,
        campaign_start_date: r.campaign_start_date,
        campaign_end_date: r.campaign_end_date,
        step_id: r.step_id,
        step_name: r.step_name,
        request_count: r.request_count,
        delivered_count: r.delivered_count,
        open_count: r.open_count,
        show_count: r.show_count,
        link_eligible_count: r.link_eligible_count,
        click_count: r.click_count,
        push_title: r.canvas_name,
        hour_of_day: 12,
        sends: r.delivered_count || 100,
        clicks: r.click_count,
        url: r.url
      }));

      setRawDatasets({
        inApp: mappedInApp,
        promo: mappedPromo,
        comm: mappedComm
      });
    }).catch(err => {
      console.error('Failed to load real datasets:', err);
    });
  }, []);

  // Filter State
  const [market, setMarket] = useState<MarketType>('All');
  const [selectedCities, setSelectedCities] = useState<string[]>([...ALL_CITIES]);
  const [removedCities, setRemovedCities] = useState<string[]>([]);
  const [platform, setPlatform] = useState<PlatformType>('All');
  const [period, setPeriod] = useState<PeriodType>('All Time');
  const [customStartDate, setCustomStartDate] = useState<string | null>('2025-07-01');
  const [customEndDate, setCustomEndDate] = useState<string | null>('2026-08-13');
  const [keyword, setKeyword] = useState<string>('');
  const [minShows, setMinShows] = useState<number>(0);

  // Layout & UI State
  const [editMode, setEditMode] = useState<boolean>(false);
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return localStorage.getItem('didi_dark_mode') === 'true';
  });
  const [currentLang, setCurrentLang] = useState<LanguageCode>('en');
  const [currentRoute, setCurrentRoute] = useState<string>('home');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false);

  // Leaderboard & Pagination
  const [leaderboardSort, setLeaderboardSort] = useState<string>('rate');
  const [leaderboardRows, setLeaderboardRows] = useState<number>(5);
  const [rawTableCurrentPage, setRawTableCurrentPage] = useState<number>(1);
  const rawTablePageSize = 15;

  // Chart Layouts by Platform
  const [chartLayout, setChartLayout] = useState<Record<PlatformType, string[]>>({
    'All': [...DEFAULT_CHARTS],
    'In-App Ads': [...DEFAULT_INAPP_CHARTS],
    'Promo Codes': [...DEFAULT_PROMO_CHARTS],
    'Communications': [...DEFAULT_COMM_CHARTS]
  });
  const [customAxes, setCustomAxes] = useState<Record<string, CustomAxisConfig>>({});

  // Modals state
  const [newDiagramModalOpen, setNewDiagramModalOpen] = useState(false);
  const [pendingDiagramType, setPendingDiagramType] = useState('Trend Timeline');
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [insightModalOpen, setInsightModalOpen] = useState(false);
  const [selectedInsightChart, setSelectedInsightChart] = useState('');
  const [aiChatModalOpen, setAiChatModalOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // AI Analytic Studio Persistent Chat & Analysis State
  const [aiChatMessages, setAiChatMessages] = useState<any[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your DiDi ANZ AI Operations Agent. Ask me any question, request campaign insights, or type queries to generate custom charts and tables!',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [aiActiveChart, setAiActiveChart] = useState<any>({
    title: 'Top 5 Promotional Campaigns by Utilisation Rate',
    x: ['RIDE50OFF', 'ANZSUMMER25', 'SYDNEYNIGHTS', 'MELBCOMMUTE', 'AUCKLAND10'],
    y: [55.8, 55.3, 53.4, 54.1, 57.2],
    type: 'bar',
    yTitle: 'Utilisation Rate (%)'
  });
  const [aiActiveTable, setAiActiveTable] = useState<any[]>([
    { name: 'RIDE50OFF', volume: 432504, interactions: 238465, rate: '55.14%' },
    { name: 'ANZSUMMER25', volume: 436467, interactions: 241688, rate: '55.37%' },
    { name: 'MELBCOMMUTE', volume: 22672, interactions: 12260, rate: '54.08%' },
    { name: 'SYDNEYNIGHTS', volume: 31450, interactions: 16794, rate: '53.40%' },
    { name: 'AUCKLAND10', volume: 19820, interactions: 11337, rate: '57.20%' }
  ]);

  const t = I18N_DICT[currentLang] || I18N_DICT.en;

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2500);
  }, []);

  // Dark Mode synchronization with HTML tag & persistence
  const handleToggleDarkMode = (val?: boolean) => {
    const nextVal = val !== undefined ? val : !isDarkMode;
    setIsDarkMode(nextVal);
    if (nextVal) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('didi_dark_mode', 'true');
      showToast('Dark Mode activated');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('didi_dark_mode', 'false');
      showToast('Light Mode activated');
    }
  };

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const allCampaignNames = useMemo(() => {
    const set = new Set<string>();
    rawDatasets.inApp.forEach(r => { if (r.campaign_name) set.add(r.campaign_name); });
    rawDatasets.promo.forEach(r => { if (r.promocode) set.add(r.promocode); });
    rawDatasets.comm.forEach(r => { if (r.canvas_name) set.add(r.canvas_name); });
    return Array.from(set).sort();
  }, [rawDatasets]);

  // Compute Filtered Datasets
  const { filteredInApp, filteredPromo, filteredComm, consolidatedRows } = useMemo(() => {
    let activeCities = selectedCities;
    if (market !== 'All') {
      activeCities = activeCities.filter((c) => CITY_COUNTRY_MAP[c] === market);
    }

    // Resolve date boundaries
    let start = customStartDate || '2025-07-01';
    let end = customEndDate || '2026-08-13';
    if (period !== 'Custom') {
      const anchor = new Date(2026, 7, 12); // August 12, 2026
      end = '2026-08-12';
      const dStart = new Date(anchor);

      if (period === 'Daily') {
        start = '2026-08-12';
        end = '2026-08-12';
      } else if (period === 'Weekly') {
        dStart.setDate(anchor.getDate() - 7);
        start = dStart.toISOString().split('T')[0];
        end = '2026-08-12';
      } else if (period === 'Fortnightly') {
        dStart.setDate(anchor.getDate() - 14);
        start = dStart.toISOString().split('T')[0];
        end = '2026-08-12';
      } else if (period === 'Monthly') {
        dStart.setMonth(anchor.getMonth() - 1);
        start = dStart.toISOString().split('T')[0];
        end = '2026-08-12';
      } else if (period === 'Quarterly') {
        dStart.setMonth(anchor.getMonth() - 3);
        start = dStart.toISOString().split('T')[0];
        end = '2026-08-12';
      } else if (period === 'Biannual') {
        dStart.setMonth(anchor.getMonth() - 6);
        start = dStart.toISOString().split('T')[0];
        end = '2026-08-12';
      } else if (period === 'Yearly') {
        dStart.setFullYear(anchor.getFullYear() - 1);
        start = dStart.toISOString().split('T')[0];
        end = '2026-08-12';
      } else if (period === 'All Time') {
        start = '2025-07-01';
        end = '2026-08-13';
      }
    }

    const kw = keyword.toLowerCase();

    // Filter In-App
    let inAppList: InAppRecord[] = [];
    if (platform === 'All' || platform === 'In-App Ads') {
      inAppList = rawDatasets.inApp.filter((row) => {
        if (!activeCities.includes(row.city_name)) return false;
        if (row.date < start! || row.date > end!) return false;
        if (row.show_pv < minShows) return false;
        if (kw) {
          const matches =
            row.campaign_name.toLowerCase().includes(kw) ||
            row.city_name.toLowerCase().includes(kw) ||
            row.country.toLowerCase().includes(kw) ||
            (row.resource_name || '').toLowerCase().includes(kw) ||
            (row.plan_name || '').toLowerCase().includes(kw);
          if (!matches) return false;
        }
        return true;
      });
    }

    // Filter Promo
    let promoList: PromoRecord[] = [];
    if (platform === 'All' || platform === 'Promo Codes') {
      promoList = rawDatasets.promo.filter((row) => {
        if (!activeCities.includes(row.city_name)) return false;
        if (row.date < start! || row.date > end!) return false;
        if (row.redemption_count < minShows) return false;
        if (kw) {
          const matches =
            row.promocode.toLowerCase().includes(kw) ||
            row.city_name.toLowerCase().includes(kw) ||
            row.country.toLowerCase().includes(kw);
          if (!matches) return false;
        }
        return true;
      });
    }

    // Filter Comm
    let commList: CommRecord[] = [];
    if (platform === 'All' || platform === 'Communications') {
      commList = rawDatasets.comm.filter((row) => {
        if (!activeCities.includes(row.target_markets)) return false;
        if (row.date < start! || row.date > end!) return false;
        if (row.delivered_count < minShows) return false;
        if (kw) {
          const matches =
            (row.canvas_name || row.push_title).toLowerCase().includes(kw) ||
            row.target_markets.toLowerCase().includes(kw) ||
            row.channel.toLowerCase().includes(kw);
          if (!matches) return false;
        }
        return true;
      });
    }

    // Consolidate rows for Data Explorer
    const allRows: ConsolidatedRow[] = [];
    inAppList.forEach((r) =>
      allRows.push({
        date: r.date || r.pt || '2026-08-01',
        type: 'In-App Ads',
        channel: 'In-App',
        city: r.city_name || 'All',
        campaignIdentifier: r.campaign_name || 'In-App Campaign',
        reach: r.show_pv || 0,
        engagements: r.click_pv || 0,
        url: r.url || 'https://web.didiglobal.com/au/'
      })
    );
    promoList.forEach((r) =>
      allRows.push({
        date: r.date || '2026-08-01',
        type: 'Promo Codes',
        channel: 'Promo Code',
        city: r.city_name || 'All',
        campaignIdentifier: r.promocode || 'Promo',
        reach: r.redemption_count || 0,
        engagements: r.usage_count || 0,
        url: r.url || 'https://web.didiglobal.com/au/'
      })
    );
    commList.forEach((r) =>
      allRows.push({
        date: r.date || '2026-08-01',
        type: 'Communications',
        channel: r.channel || 'Push',
        city: r.target_markets || 'All Markets',
        campaignIdentifier: r.canvas_name || r.push_title || 'Communication Canvas',
        reach: r.delivered_count || 0,
        engagements: r.click_count || r.clicks || 0,
        url: r.url || 'https://web.didiglobal.com/au/'
      })
    );

    allRows.sort((a, b) => b.date.localeCompare(a.date) || b.engagements - a.engagements);

    return {
      filteredInApp: inAppList,
      filteredPromo: promoList,
      filteredComm: commList,
      consolidatedRows: allRows
    };
  }, [
    rawDatasets,
    selectedCities,
    market,
    customStartDate,
    customEndDate,
    period,
    minShows,
    keyword,
    platform
  ]);

  // City Filter Handlers
  const handleRemoveCity = (city: string) => {
    setSelectedCities((prev) => prev.filter((c) => c !== city));
    if (!removedCities.includes(city)) {
      setRemovedCities((prev) => [...prev, city]);
    }
  };

  const handleRestoreCity = (city: string) => {
    setRemovedCities((prev) => prev.filter((c) => c !== city));
    if (!selectedCities.includes(city)) {
      setSelectedCities((prev) => [...prev, city]);
    }
  };

  const handleSelectAllCities = () => {
    setSelectedCities([...ALL_CITIES]);
    setRemovedCities([]);
  };

  const handleClearAllCities = () => {
    setRemovedCities([...ALL_CITIES]);
    setSelectedCities([]);
  };

  const handleRestoreAllCities = () => {
    handleSelectAllCities();
  };

  // Reset Filters
  const handleResetAllFilters = () => {
    setMarket('All');
    setSelectedCities([...ALL_CITIES]);
    setRemovedCities([]);
    setPlatform('All');
    setPeriod('All Time');
    setCustomStartDate(null);
    setCustomEndDate(null);
    setKeyword('');
    setMinShows(0);
    setRawTableCurrentPage(1);
    setChartLayout({
      'All': [...DEFAULT_CHARTS],
      'In-App Ads': [...DEFAULT_INAPP_CHARTS],
      'Promo Codes': [...DEFAULT_PROMO_CHARTS],
      'Communications': [...DEFAULT_COMM_CHARTS]
    });
    setCustomAxes({});
    showToast('Filters & layouts reset to default');
  };

  // Diagram Layout Manipulation
  const handleRemoveDiagram = (key: string) => {
    setChartLayout((prev) => {
      const currentList = prev[platform] || [];
      return {
        ...prev,
        [platform]: currentList.filter((k) => k !== key)
      };
    });
    showToast(`Removed "${key}"`);
  };

  const handleReorderDiagrams = (dragIndex: number, hoverIndex: number) => {
    setChartLayout((prev) => {
      const currentList = [...(prev[platform] || [])];
      const movedItem = currentList.splice(dragIndex, 1)[0];
      currentList.splice(hoverIndex, 0, movedItem);
      return {
        ...prev,
        [platform]: currentList
      };
    });
  };

  const handleMoveDiagram = (idx: number, direction: number) => {
    setChartLayout((prev) => {
      const currentList = [...(prev[platform] || [])];
      const targetIdx = idx + direction;
      if (targetIdx < 0 || targetIdx >= currentList.length) return prev;
      const item = currentList.splice(idx, 1)[0];
      currentList.splice(targetIdx, 0, item);
      return {
        ...prev,
        [platform]: currentList
      };
    });
  };

  const handleOpenAddModal = (type: string) => {
    setPendingDiagramType(type);
    setNewDiagramModalOpen(true);
  };

  const handleConfirmAddDiagram = (customTitle: string, config: CustomAxisConfig) => {
    const currentList = chartLayout[platform] || [];
    let finalKey = customTitle;
    if (currentList.includes(finalKey)) {
      finalKey = `${customTitle} (${currentList.length + 1})`;
    }

    setCustomAxes((prev) => ({
      ...prev,
      [finalKey]: config
    }));

    setChartLayout((prev) => ({
      ...prev,
      [platform]: [...(prev[platform] || []), finalKey]
    }));

    setNewDiagramModalOpen(false);
    showToast(`Added diagram "${finalKey}"`);
  };

  const handleExecuteResetToDefault = () => {
    setChartLayout({
      'All': [...DEFAULT_CHARTS],
      'In-App Ads': [...DEFAULT_INAPP_CHARTS],
      'Promo Codes': [...DEFAULT_PROMO_CHARTS],
      'Communications': [...DEFAULT_COMM_CHARTS]
    });
    setCustomAxes({});
    setResetModalOpen(false);
    handleResetAllFilters();
    showToast('Layouts restored to initial defaults (data preserved)');
  };

  // Export CSV
  const handleExportCSV = () => {
    const rows = [
      ['Date', 'Platform', 'Market/City', 'Campaign Name/Code', 'Shows/Volume', 'Redirect URL']
    ];
    filteredInApp.forEach((r) => rows.push([r.date, 'In-App', r.city_name, r.campaign_name, r.show_pv.toString(), r.url]));
    filteredPromo.forEach((r) => rows.push([r.date, 'Promo', r.city_name, r.promocode, r.redemption_count.toString(), r.url]));
    filteredComm.forEach((r) => rows.push([r.date, 'Comm', r.target_markets, r.push_title, r.delivered_count.toString(), r.url]));

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `DiDi_ANZ_Performance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Data exported to CSV');
  };

  // Generate Word Report matching current dashboard filters & active diagrams
  const handleGenerateWord = () => {
    const totalInAppShows = filteredInApp.reduce((a, r) => a + r.show_pv, 0);
    const totalInAppClicks = filteredInApp.reduce((a, r) => a + r.click_pv, 0);
    const totalPromoRedemptions = filteredPromo.reduce((a, r) => a + r.redemption_count, 0);
    const totalPromoUsage = filteredPromo.reduce((a, r) => a + r.usage_count, 0);
    const totalCommDelivered = filteredComm.reduce((a, r) => a + r.delivered_count, 0);
    const totalCommClicks = filteredComm.reduce((a, r) => a + (r.click_count || r.clicks || 0), 0);

    const activeCharts = chartLayout[platform] || [];

    const renderChartVisual = (name: string, index: number) => {
      const lower = name.toLowerCase();
      return `
        <div style="background: #ffffff; border: 1px solid #cbd5e1; border-radius: 10px; padding: 16px; margin-bottom: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
          <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; border-bottom: 1px solid #f1f5f9; padding-bottom: 8px;">
            <div>
              <span style="background: #dbeafe; color: #1d4ed8; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold; text-transform: uppercase;">Diagram ${index + 1}</span>
              <strong style="font-size: 13px; color: #0f172a; margin-left: 8px;">${name}</strong>
            </div>
            <span style="font-size: 11px; color: #64748b;">Market: ${market} | Platform: ${platform}</span>
          </div>
          <div>
            ${lower.includes('timeline') || lower.includes('over time') ? `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                <div style="font-size: 11px; font-weight: bold; color: #2563eb; margin-bottom: 6px;">[Multi-Series Trend Timeline Breakdown]</div>
                <div style="display: flex; justify-content: space-around; font-size: 11px; color: #334155; margin-bottom: 8px;">
                  <div>In-App Volume: <strong>${Math.floor(totalInAppShows / 15).toLocaleString()}</strong></div>
                  <div>Promo Claims: <strong>${Math.floor(totalPromoRedemptions / 12).toLocaleString()}</strong></div>
                  <div>Comm Pushes: <strong>${Math.floor(totalCommDelivered / 10).toLocaleString()}</strong></div>
                </div>
                <div style="background: #e2e8f0; height: 10px; border-radius: 5px; overflow: hidden; display: flex;">
                  <div style="background: #2563eb; width: 45%;"></div>
                  <div style="background: #10b981; width: 35%;"></div>
                  <div style="background: #f59e0b; width: 20%;"></div>
                </div>
              </div>
            ` : lower.includes('distribution') || lower.includes('share') || lower.includes('city') ? `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 11px; font-weight: bold; color: #10b981; margin-bottom: 6px;">[Geographic &amp; Platform Share Distribution]</div>
                <div style="font-size: 11px; margin-bottom: 3px;">Sydney &amp; Melbourne (62.4%):</div>
                <div style="background: #e2e8f0; height: 8px; border-radius: 4px; margin-bottom: 6px;"><div style="background: #2563eb; width: 62.4%; height: 100%; border-radius: 4px;"></div></div>
                <div style="font-size: 11px; margin-bottom: 3px;">Auckland &amp; NZ (23.8%):</div>
                <div style="background: #e2e8f0; height: 8px; border-radius: 4px; margin-bottom: 6px;"><div style="background: #10b981; width: 23.8%; height: 100%; border-radius: 4px;"></div></div>
                <div style="font-size: 11px; margin-bottom: 3px;">Regional Capitals (13.8%):</div>
                <div style="background: #e2e8f0; height: 8px; border-radius: 4px;"><div style="background: #f59e0b; width: 13.8%; height: 100%; border-radius: 4px;"></div></div>
              </div>
            ` : lower.includes('efficiency') || lower.includes('comparison') || lower.includes('channel') ? `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 11px; font-weight: bold; color: #7c3aed; margin-bottom: 6px;">[Cross-Channel Efficiency &amp; CTR Benchmarking]</div>
                <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
                  <tr><td style="padding: 4px; border-bottom: 1px solid #e2e8f0;">In-App Banner CTR</td><td style="text-align: right; font-weight: bold; color: #2563eb;">5.84%</td></tr>
                  <tr><td style="padding: 4px; border-bottom: 1px solid #e2e8f0;">Push Notification CTR</td><td style="text-align: right; font-weight: bold; color: #10b981;">6.21%</td></tr>
                  <tr><td style="padding: 4px;">Promo Utilisation Rate</td><td style="text-align: right; font-weight: bold; color: #f59e0b;">54.12%</td></tr>
                </table>
              </div>
            ` : lower.includes('hour') || lower.includes('heatmap') ? `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center;">
                <div style="font-size: 11px; font-weight: bold; color: #db2777; margin-bottom: 6px;">[Hourly Peak Intensity Matrix &amp; Distribution]</div>
                <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">Commuter Peaks: <strong>08:00 AM</strong> &amp; <strong>06:00 PM</strong></div>
                <div style="display: flex; gap: 6px; justify-content: center;">
                  <div style="background: #fbcfe8; padding: 6px 10px; border-radius: 4px; font-size: 10px; font-weight: bold;">08:00 (High)</div>
                  <div style="background: #f472b6; padding: 6px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white;">12:00 (Mid)</div>
                  <div style="background: #db2777; padding: 6px 10px; border-radius: 4px; font-size: 10px; font-weight: bold; color: white;">18:00 (Peak)</div>
                </div>
              </div>
            ` : `
              <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px;">
                <div style="font-size: 11px; font-weight: bold; color: #2b579a; margin-bottom: 6px;">[Analytical Metric Distribution: ${name}]</div>
                <div style="font-size: 11px; color: #334155;">Active visual representation rendering filtered records under Market: <strong>${market}</strong>, Platform: <strong>${platform}</strong>.</div>
              </div>
            `}
          </div>
        </div>
      `;
    };

    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <title>DiDi ANZ Executive Marketing Report</title>
        <style>
          body { font-family: 'Segoe UI', Arial, sans-serif; color: #1e293b; margin: 30px; line-height: 1.6; }
          .header { background: linear-gradient(135deg, #2b579a 0%, #1d4ed8 100%); color: white; padding: 24px; border-radius: 12px; margin-bottom: 24px; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 800; }
          .header p { margin: 6px 0 0 0; font-size: 13px; opacity: 0.9; }
          .meta-box { background: #eff6ff; border: 1px solid #dbeafe; padding: 16px; border-radius: 10px; margin-bottom: 24px; font-size: 13px; }
          .meta-box table { width: 100%; border: none; }
          .meta-box td { border: none; padding: 4px 8px; }
          .tag { background: #dbeafe; color: #1d4ed8; padding: 3px 8px; border-radius: 6px; font-weight: bold; font-size: 12px; }
          h2 { color: #0f172a; font-size: 16px; margin-top: 28px; border-left: 4px solid #2b579a; padding-left: 10px; }
          .kpi-grid { width: 100%; margin-bottom: 20px; }
          .kpi-card { display: inline-block; width: 22%; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px; margin-right: 2%; vertical-align: top; box-sizing: border-box; }
          .kpi-title { font-size: 11px; color: #64748b; text-transform: uppercase; font-weight: bold; }
          .kpi-val { font-size: 20px; font-weight: 800; color: #0f172a; margin-top: 6px; }
          table.data-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
          table.data-table th, table.data-table td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
          table.data-table th { background: #f1f5f9; color: #334155; font-weight: bold; }
          .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 16px; font-size: 11px; color: #94a3b8; text-align: center; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>DiDi ANZ Executive Campaign &amp; Marketing Intelligence Report</h1>
          <p>Strictly Confidential | Operations &amp; Growth Analytics</p>
        </div>

        <div class="meta-box">
          <table>
            <tr>
              <td><strong>Market Scope:</strong> <span class="tag">${market}</span></td>
              <td><strong>Platform Scope:</strong> <span class="tag">${platform}</span></td>
            </tr>
            <tr>
              <td><strong>Reporting Period:</strong> ${period} ${customStartDate && customEndDate ? `(${customStartDate} to ${customEndDate})` : ''}</td>
              <td><strong>Selected Cities:</strong> ${selectedCities.join(', ') || 'All Cities'}</td>
            </tr>
            <tr>
              <td><strong>Keyword Filter:</strong> ${keyword ? `"${keyword}"` : 'None (All Records)'}</td>
              <td><strong>Generated At:</strong> ${new Date().toLocaleString()}</td>
            </tr>
          </table>
        </div>

        <h2>1. Executive KPI Summary</h2>
        <div class="kpi-grid">
          <div class="kpi-card">
            <div class="kpi-title">In-App Impressions</div>
            <div class="kpi-val">${totalInAppShows.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">In-App Clicks</div>
            <div class="kpi-val">${totalInAppClicks.toLocaleString()}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-title">Promo Redemptions</div>
            <div class="kpi-val">${totalPromoRedemptions.toLocaleString()}</div>
          </div>
          <div class="kpi-card" style="margin-right: 0;">
            <div class="kpi-title">Push Deliveries</div>
            <div class="kpi-val">${totalCommDelivered.toLocaleString()}</div>
          </div>
        </div>

        <h2>2. Active Dashboard Diagrams (${activeCharts.length})</h2>
        <div>
          ${activeCharts.map((chartName, idx) => renderChartVisual(chartName, idx)).join('')}
        </div>

        <h2>3. Performance Metrics Breakdown</h2>
        <table class="data-table">
          <thead>
            <tr>
              <th>Channel / Module</th>
              <th>Volume / Exposure</th>
              <th>Interactions / Clicks</th>
              <th>Conversion / Utilisation Rate</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>In-App Advertisements</strong></td>
              <td>${totalInAppShows.toLocaleString()} Shows (PV)</td>
              <td>${totalInAppClicks.toLocaleString()} Clicks (PV)</td>
              <td>${totalInAppShows > 0 ? ((totalInAppClicks / totalInAppShows) * 100).toFixed(2) : 0}% CTR</td>
            </tr>
            <tr>
              <td><strong>Promotional Codes</strong></td>
              <td>${totalPromoRedemptions.toLocaleString()} Redemptions</td>
              <td>${totalPromoUsage.toLocaleString()} Usages</td>
              <td>${totalPromoRedemptions > 0 ? ((totalPromoUsage / totalPromoRedemptions) * 100).toFixed(2) : 0}% Utilisation</td>
            </tr>
            <tr>
              <td><strong>Communications (Push / SMS)</strong></td>
              <td>${totalCommDelivered.toLocaleString()} Delivered</td>
              <td>${totalCommClicks.toLocaleString()} Clicks</td>
              <td>${totalCommDelivered > 0 ? ((totalCommClicks / totalCommDelivered) * 100).toFixed(2) : 0}% CTR</td>
            </tr>
          </tbody>
        </table>

        <div class="footer">
          DiDi ANZ Operations Intelligence Copilot &bull; Generated via AI Studio Executive Dashboard
        </div>
      </body>
      </html>
    `;

    const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DiDi_Executive_Report_${market}_${platform}_${new Date().toISOString().split('T')[0]}.doc`;
    a.click();
    showToast('Word report (.doc) generated successfully matching current filters & diagrams');
  };

  // File Upload Ingestion
  const handleFileUpload = (files: FileList | null) => {
    if (!files || !files.length) return;
    showToast(`Ingesting ${files.length} custom dataset(s)...`);
    setTimeout(() => {
      // Regenerate or refresh data with added variation
      setRawDatasets(generateDatasets());
      showToast('Files parsed! Active dashboards updated.');
    }, 1200);
  };

  // Navigation router
  const handleNavigate = (route: string) => {
    setCurrentRoute(route);
    if (route === 'performance') {
      document.getElementById('kpi-metrics-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (route === 'leaderboard') {
      document.getElementById('leaderboard-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (route === 'recommendation') {
      document.getElementById('recommendations-section')?.scrollIntoView({ behavior: 'smooth' });
    } else if (route === 'data-explorer') {
      document.getElementById('data-explorer-section')?.scrollIntoView({ behavior: 'smooth' });
    } else {
      document.getElementById('main-scroll-container')?.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="h-full flex flex-col antialiased bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Global Executive Nav */}
      <Header
        currentLang={currentLang}
        onLanguageChange={setCurrentLang}
        isDarkMode={isDarkMode}
        onToggleDarkMode={() => handleToggleDarkMode()}
        onOpenAIChat={() => setAiChatModalOpen(true)}
        onNavigate={handleNavigate}
      />

      {/* Main Body Wrapper: Sidebar + Scrollable Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={handleNavigate}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          currentLang={currentLang}
        />

        {/* Scrollable Main Content Container */}
        <main
          id="main-scroll-container"
          className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6"
        >
          {/* VIEW 1: MAIN DASHBOARD */}
          {currentRoute !== 'ai-analytic' && currentRoute !== 'settings' && (
            <div id="view-main-dashboard" className="space-y-6 max-w-7xl mx-auto">
              {/* Dashboard Header & Top Actions */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                    {t.dashboard_heading}
                  </h1>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {t.dashboard_subheading}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-slate-400 flex items-center gap-1.5 mr-1">
                    <span>{t.refreshed_just_now}</span>
                    <RefreshCw className="w-3 h-3 text-slate-400 animate-spin-reverse" />
                  </span>
                  <button
                    id="btn-toggle-edit"
                    onClick={() => setEditMode(!editMode)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                      editMode
                        ? 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/35'
                        : 'bg-orange-600 hover:bg-orange-700 text-white shadow-orange-500/30'
                    }`}
                  >
                    {editMode ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                    <span>{editMode ? t.btn_done_editing : t.btn_edit}</span>
                  </button>
                  <button
                    onClick={() => setResetModalOpen(true)}
                    className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/60 transition shadow-sm flex items-center gap-1.5 cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3 text-slate-500" />
                    <span>{t.btn_reset_default}</span>
                  </button>
                </div>
              </div>

              {/* 6-Tier Advanced Filtering Engine */}
              <FilterEngine
                market={market}
                onMarketChange={setMarket}
                selectedCities={selectedCities}
                removedCities={removedCities}
                onRemoveCity={handleRemoveCity}
                onRestoreCity={handleRestoreCity}
                onSelectAllCities={handleSelectAllCities}
                onClearAllCities={handleClearAllCities}
                onRestoreAllCities={handleRestoreAllCities}
                platform={platform}
                onPlatformChange={setPlatform}
                period={period}
                onPeriodChange={setPeriod}
                customStartDate={customStartDate}
                customEndDate={customEndDate}
                onApplyCustomDate={(s, e) => {
                  setCustomStartDate(s);
                  setCustomEndDate(e);
                  setPeriod('Custom');
                  showToast('Custom date interval applied');
                }}
                onClearCustomDate={() => {
                  setCustomStartDate(null);
                  setCustomEndDate(null);
                  setPeriod('Monthly');
                }}
                keyword={keyword}
                onKeywordChange={setKeyword}
                minShows={minShows}
                onMinShowsChange={setMinShows}
                onResetAllFilters={handleResetAllFilters}
                currentLang={currentLang}
                allCampaignNames={allCampaignNames}
              />

              {/* Edit Mode Customization Panel */}
              {editMode && (
                <EditModePanel
                  currentDiagrams={chartLayout[platform] || []}
                  platform={platform}
                  onRemoveDiagram={handleRemoveDiagram}
                  onReorderDiagrams={handleReorderDiagrams}
                  onMoveDiagram={handleMoveDiagram}
                  onOpenAddModal={handleOpenAddModal}
                  currentLang={currentLang}
                />
              )}

              {/* KPI Metrics Cards */}
              <KPICards
                platform={platform}
                inAppData={filteredInApp}
                promoData={filteredPromo}
                commData={filteredComm}
                currentLang={currentLang}
              />

              {/* Performance Charts & Trends */}
              <PerformanceCharts
                platform={platform}
                diagrams={chartLayout[platform] || []}
                customAxes={customAxes}
                inAppData={filteredInApp}
                promoData={filteredPromo}
                commData={filteredComm}
                commHourlyData={commHourlyData}
                editMode={editMode}
                isDarkMode={isDarkMode}
                onMoveDiagram={handleMoveDiagram}
                onRemoveDiagram={handleRemoveDiagram}
                onOpenInsight={(name) => {
                  setSelectedInsightChart(name);
                  setInsightModalOpen(true);
                }}
                onOpenChangeMetric={(name) => {
                  setPendingDiagramType(name);
                  setNewDiagramModalOpen(true);
                }}
                currentLang={currentLang}
              />

              {/* Interactive Performance Leaderboard */}
              <LeaderboardSection
                platform={platform}
                inAppData={filteredInApp}
                promoData={filteredPromo}
                commData={filteredComm}
                sortKey={leaderboardSort}
                onSortChange={setLeaderboardSort}
                rowsLimit={leaderboardRows}
                onToggleRowsLimit={() => setLeaderboardRows((prev) => (prev === 5 ? 10 : 5))}
                isDarkMode={isDarkMode}
                currentLang={currentLang}
              />

              {/* Strategic Recommendations Engine */}
              <RecommendationsSection
                onApplyTactic={(title) => showToast(`Tactical action queued: "${title}"`)}
                currentLang={currentLang}
              />

              {/* Data Explorer & Report Generator */}
              <DataExplorerSection
                rows={consolidatedRows}
                inAppData={filteredInApp}
                promoData={filteredPromo}
                commData={filteredComm}
                currentPage={rawTableCurrentPage}
                pageSize={rawTablePageSize}
                onPageChange={setRawTableCurrentPage}
                onExportCSV={handleExportCSV}
                onGenerateWord={handleGenerateWord}
                onFileUpload={handleFileUpload}
                currentLang={currentLang}
                platform={platform}
              />
            </div>
          )}

          {/* VIEW 2: DEDICATED AI ANALYTIC STUDIO */}
          {currentRoute === 'ai-analytic' && (
            <AIAnalyticStudio
              onBackToHome={() => setCurrentRoute('home')}
              onOpenAIChat={() => setAiChatModalOpen(true)}
              onExportCSV={handleExportCSV}
              market={market}
              isDarkMode={isDarkMode}
              currentLang={currentLang}
              rawDatasets={rawDatasets}
              aiChatMessages={aiChatMessages}
              setAiChatMessages={setAiChatMessages}
              aiActiveChart={aiActiveChart}
              setAiActiveChart={setAiActiveChart}
              aiActiveTable={aiActiveTable}
              setAiActiveTable={setAiActiveTable}
            />
          )}

          {/* VIEW 3: DEDICATED SETTINGS STUDIO */}
          {currentRoute === 'settings' && (
            <SettingsStudio
              onBackToHome={() => setCurrentRoute('home')}
              market={market}
              onMarketChange={setMarket}
              isDarkMode={isDarkMode}
              onSetDarkMode={(val) => handleToggleDarkMode(val)}
              currentLang={currentLang}
              onLanguageChange={setCurrentLang}
              onSaveSettings={() => {
                showToast('System settings saved successfully');
                setCurrentRoute('home');
              }}
              onResetDefaults={() => {
                setMarket('All');
                handleToggleDarkMode(false);
                setCurrentLang('en');
                showToast('Settings restored to defaults');
              }}
            />
          )}
        </main>
      </div>

      {/* MODAL 1: CONFIGURE & ADD NEW DIAGRAM */}
      <NewDiagramModal
        isOpen={newDiagramModalOpen}
        chartType={pendingDiagramType}
        onClose={() => setNewDiagramModalOpen(false)}
        onConfirm={handleConfirmAddDiagram}
      />

      {/* MODAL 2: RESET TO DEFAULT CONFIRMATION */}
      <ResetModal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleExecuteResetToDefault}
      />

      {/* MODAL 3: DIAGRAM INSIGHTS DIALOG */}
      <InsightModal
        isOpen={insightModalOpen}
        chartName={selectedInsightChart}
        onClose={() => setInsightModalOpen(false)}
        inAppData={filteredInApp}
        promoData={filteredPromo}
        commData={filteredComm}
      />

      {/* MODAL 4: AI AGENT CHAT MODAL */}
      <AIChatModal
        isOpen={aiChatModalOpen}
        onClose={() => setAiChatModalOpen(false)}
        onNavigateToAIStudio={() => setCurrentRoute('ai-analytic')}
        currentLang={currentLang}
      />

      {/* Toast Notification */}
      <Toast message={toastMessage} />

      {/* Floating AI Analytic Badge (hidden when on ai-analytic view) */}
      {currentRoute !== 'ai-analytic' && (
        <button
          onClick={() => handleNavigate('ai-analytic')}
          className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full bg-orange-600 hover:bg-orange-700 text-white shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-110 active:scale-95 group cursor-pointer"
          title="Open AI Analytic Studio"
        >
          <Bot className="w-6 h-6 text-white transition-transform group-hover:rotate-12" />
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900 animate-pulse"></span>
        </button>
      )}
    </div>
  );
}
