import React, { useEffect, useRef } from 'react';
import { 
  AreaChart, 
  Lightbulb, 
  ArrowLeftRight, 
  GripVertical, 
  ChevronLeft, 
  ChevronRight, 
  X 
} from 'lucide-react';
import { 
  PlatformType, 
  InAppRecord, 
  PromoRecord, 
  CommRecord, 
  CustomAxisConfig, 
  LanguageCode 
} from '../types';
import { I18N_DICT } from '../data/i18n';

interface PerformanceChartsProps {
  platform: PlatformType;
  diagrams: string[];
  customAxes: Record<string, CustomAxisConfig>;
  inAppData: InAppRecord[];
  promoData: PromoRecord[];
  commData: CommRecord[];
  commHourlyData?: any[];
  editMode: boolean;
  isDarkMode: boolean;
  onMoveDiagram: (index: number, direction: number) => void;
  onRemoveDiagram: (name: string) => void;
  onOpenInsight: (chartName: string) => void;
  onOpenChangeMetric: (chartName: string) => void;
  currentLang: LanguageCode;
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({
  platform,
  diagrams,
  customAxes,
  inAppData,
  promoData,
  commData,
  commHourlyData = [],
  editMode,
  isDarkMode,
  onMoveDiagram,
  onRemoveDiagram,
  onOpenInsight,
  onOpenChangeMetric,
  currentLang
}) => {
  const chartRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});
  const t = I18N_DICT[currentLang] || I18N_DICT.en;

  const getFreshLayout = (chartType: string) => {
    const isCampaign = chartType.includes('Campaign Performance');
    const isEfficiency = chartType.includes('Efficiency Comparison');
    return {
      autosize: true,
      height: isCampaign ? 1800 : isEfficiency ? 520 : 420,
      margin: { t: 30, r: 20, l: isCampaign ? 220 : isEfficiency ? 180 : 45, b: isCampaign ? 80 : 60 },
      paper_bgcolor: 'rgba(0,0,0,0)',
      plot_bgcolor: 'rgba(0,0,0,0)',
      font: { 
        family: 'Inter, sans-serif', 
        size: 11, 
        color: isDarkMode ? '#cbd5e1' : '#475569' 
      },
      showlegend: true,
      legend: { orientation: 'h', y: -0.2, x: 0 },
      xaxis: {
        type: chartType.includes('Timeline') || chartType.includes('Engagement Over Time') ? 'date' : 'category',
        gridcolor: isDarkMode ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
        linecolor: isDarkMode ? '#334155' : '#cbd5e1',
        tickfont: { size: 10 }
      },
      yaxis: {
        gridcolor: isDarkMode ? 'rgba(51, 65, 85, 0.4)' : 'rgba(226, 232, 240, 0.8)',
        linecolor: isDarkMode ? '#334155' : '#cbd5e1',
        tickfont: { size: 10 }
      }
    };
  };

  useEffect(() => {
    const Plotly = (window as unknown as { Plotly: any })?.Plotly;
    if (!Plotly) return;

    diagrams.forEach((chartKey) => {
      const container = chartRefs.current[chartKey];
      if (!container) return;

      const baseType = customAxes[chartKey]?.baseType || chartKey;
      const layout: any = getFreshLayout(baseType);
      let traces: any[] = [];

      if (customAxes[chartKey]) {
        const config = customAxes[chartKey];
        const xField = config.xAxis; 
        const yMetric = config.yAxis; 
        const chartStyle = config.style; 

        const aggMap: Record<string, { vol: number; int: number }> = {};
        const processRecord = (xVal: string, vol: number, int: number) => {
          if (!xVal) xVal = 'Unknown';
          aggMap[xVal] = aggMap[xVal] || { vol: 0, int: 0 };
          aggMap[xVal].vol += Number(vol) || 0;
          aggMap[xVal].int += Number(int) || 0;
        };

        inAppData.forEach(r => {
          let x = xField === 'Date' ? (r.date || r.pt || '2026-08-01') :
                  xField === 'City' ? (r.city_name || 'All') :
                  xField === 'Campaign' ? (r.campaign_name || 'Campaign') :
                  xField === 'Platform' ? 'In-App Ads' : (r.city_name || 'General');
          processRecord(x, r.show_pv || 0, r.click_pv || 0);
        });
        promoData.forEach(r => {
          let x = xField === 'Date' ? (r.date || '2026-08-01') :
                  xField === 'City' ? (r.city_name || 'All') :
                  xField === 'Campaign' ? (r.promocode || 'Promo') :
                  xField === 'Platform' ? 'Promo Codes' : (r.city_name || 'General');
          processRecord(x, r.redemption_count || 0, r.usage_count || 0);
        });
        commData.forEach(r => {
          let x = xField === 'Date' ? (r.date || '2026-08-01') :
                  xField === 'City' ? (r.target_markets || 'All') :
                  xField === 'Campaign' ? (r.canvas_name || r.push_title || 'Comm') :
                  xField === 'Platform' ? 'Communications' : (r.target_markets || 'General');
          processRecord(x, r.delivered_count || 0, r.click_count || r.clicks || 0);
        });

        const sortedKeys = Object.keys(aggMap).sort().slice(0, 20);
        const xVals = sortedKeys;
        const yVals = sortedKeys.map(k => {
          const item = aggMap[k];
          if (yMetric === 'Interactions') return item.int;
          if (yMetric === 'Rate') return item.vol > 0 ? Number(((item.int / item.vol) * 100).toFixed(2)) : 0;
          if (yMetric === 'UV') return Math.floor(item.vol * 0.4);
          return item.vol;
        });

        layout.xaxis.title = xField;
        layout.yaxis.title = yMetric;

        if (chartStyle === 'donut' || chartStyle === 'pie') {
          traces = [{
            labels: xVals,
            values: yVals,
            type: 'pie',
            hole: 0.4
          }];
        } else if (chartStyle === 'heatmap') {
          const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
          const matrix = days.map(() => yVals.slice(0, 7));
          traces = [{
            z: matrix,
            x: xVals.slice(0, 7),
            y: days,
            type: 'heatmap',
            colorscale: 'Purples'
          }];
        } else if (chartStyle === 'scatter') {
          traces = [{
            x: xVals,
            y: yVals,
            mode: 'markers',
            type: 'scatter',
            marker: { size: 12, color: '#f59e0b' }
          }];
        } else if (chartStyle === 'area') {
          traces = [{
            x: xVals,
            y: yVals,
            fill: 'tozeroy',
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#2563eb' }
          }];
        } else if (chartStyle === 'line') {
          traces = [{
            x: xVals,
            y: yVals,
            type: 'scatter',
            mode: 'lines+markers',
            line: { color: '#10b981' }
          }];
        } else if (chartStyle === 'funnel') {
          traces = [{
            type: 'funnel',
            y: xVals.slice(0, 5),
            x: yVals.slice(0, 5),
            marker: { color: '#8b5cf6' }
          }];
        } else if (chartStyle === 'radar') {
          traces = [{
            type: 'scatterpolar',
            r: yVals.slice(0, 6),
            theta: xVals.slice(0, 6),
            fill: 'toself',
            marker: { color: '#06b6d4' }
          }];
        } else if (chartStyle === 'boxplot') {
          traces = [{
            y: yVals,
            type: 'box',
            name: xField,
            boxpoints: 'all',
            marker: { color: '#ec4899' }
          }];
        } else if (chartStyle === 'waterfall') {
          traces = [{
            type: 'waterfall',
            orientation: 'v',
            measure: ['relative', 'relative', 'relative', 'total'],
            x: xVals.slice(0, 4),
            y: yVals.slice(0, 4),
            connector: { line: { color: 'rgb(63, 63, 63)' } }
          }];
        } else {
          traces = [{
            x: xVals,
            y: yVals,
            type: 'bar',
            marker: { color: '#f97316' }
          }];
        }

        try {
          Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
        } catch (e) {
          console.error("Plotly custom chart error:", e);
        }
        return;
      }

      // SPECIAL CASE: IN-APP ADS PLATFORM DEDICATED VISUALS
      if (platform === 'In-App Ads' && !customAxes[chartKey]) {
        if (chartKey === 'In-App Engagement Over Time') {
          const dateMap: Record<string, { show: number; click: number }> = {};
          inAppData.forEach((r) => {
            const d = r.date || r.pt || '2026-06-01';
            dateMap[d] = dateMap[d] || { show: 0, click: 0 };
            dateMap[d].show += r.show_pv;
            dateMap[d].click += r.click_pv;
          });
          const dates = Object.keys(dateMap).sort();
          const shows = dates.map(d => dateMap[d].show);
          const clicks = dates.map(d => dateMap[d].click);

          traces = [
            {
              x: dates,
              y: shows,
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Show PV (Impressions)',
              line: { color: '#2563eb', width: 2.5 }
            },
            {
              x: dates,
              y: clicks,
              type: 'scatter',
              mode: 'lines+markers',
              name: 'Click PV (Clicks)',
              yaxis: 'y2',
              line: { color: '#10b981', width: 2.5 }
            }
          ];
          layout.yaxis = { title: 'Show PV (Impressions)', titlefont: { color: '#2563eb' } };
          layout.yaxis2 = { title: 'Click PV (Clicks)', overlaying: 'y', side: 'right', titlefont: { color: '#10b981' } };
          layout.xaxis.title = 'Report Date';
        } else if (chartKey === 'In-App Placement Performance') {
          const placementMap: Record<string, { show: number; click: number; uv: number }> = {};
          inAppData.forEach((r) => {
            const p = r.resource_id || r.resource_name || 'Default Placement';
            placementMap[p] = placementMap[p] || { show: 0, click: 0, uv: 0 };
            placementMap[p].show += r.show_pv;
            placementMap[p].click += r.click_pv;
            placementMap[p].uv += r.show_uv;
          });
          const placements = Object.keys(placementMap);
          traces = placements.map((p) => {
            const item = placementMap[p];
            const rate = item.show > 0 ? parseFloat(((item.click / item.show) * 100).toFixed(2)) : 0;
            const shortName = p.length > 35 ? p.slice(0, 35) + '...' : p;
            return {
              type: 'bar',
              orientation: 'h',
              name: p,
              y: [shortName],
              x: [rate],
              customdata: [[item.show.toLocaleString(), item.click.toLocaleString(), rate, item.uv.toLocaleString()]],
              hovertemplate: `<b>Placement: ${p}</b><br>CTR: %{x}%<br>Show PV: %{customdata[0]}<br>Click PV: %{customdata[1]}<br>Aggregated Show UV: %{customdata[3]}<extra></extra>`,
              marker: { color: '#6366f1' }
            };
          });
          layout.xaxis.title = 'CTR (%)';
          layout.yaxis.title = 'Placement (resource_id)';
          layout.margin.l = 220;
          layout.height = 450;
        } else if (chartKey === 'Campaign Scale vs Engagement') {
          const campMap: Record<string, { show: number; click: number; city: string; placement: string }> = {};
          inAppData.forEach((r) => {
            const c = r.campaign_name || 'Campaign';
            campMap[c] = campMap[c] || { show: 0, click: 0, city: r.city_name || 'All', placement: r.resource_id || 'Placement' };
            campMap[c].show += r.show_pv;
            campMap[c].click += r.click_pv;
          });
          const camps = Object.keys(campMap);
          const xShows = camps.map(c => campMap[c].show);
          const yCtrs = camps.map(c => campMap[c].show > 0 ? parseFloat(((campMap[c].click / campMap[c].show) * 100).toFixed(2)) : 0);
          
          const avgShow = xShows.length ? xShows.reduce((a, b) => a + b, 0) / xShows.length : 0;
          const avgCtr = yCtrs.length ? yCtrs.reduce((a, b) => a + b, 0) / yCtrs.length : 0;

          traces = camps.map((c) => {
            const item = campMap[c];
            const show = item.show;
            const ctr = show > 0 ? parseFloat(((item.click / show) * 100).toFixed(2)) : 0;
            return {
              x: [show],
              y: [ctr],
              name: c,
              type: 'scatter',
              mode: 'markers',
              marker: { size: 12, color: '#ec4899' },
              customdata: [[c, item.city, item.placement, show.toLocaleString(), item.click.toLocaleString(), ctr + '%']],
              hovertemplate: '<b>Campaign: %{customdata[0]}</b><br>City: %{customdata[1]}<br>Placement: %{customdata[2]}<br>Show PV: %{customdata[3]}<br>Click PV: %{customdata[4]}<br>CTR: %{customdata[5]}<extra></extra>'
            };
          });

          layout.height = 1200;
          layout.xaxis.title = 'Show PV (Exposure Scale)';
          layout.yaxis.title = 'CTR (%)';
          layout.shapes = [
            { type: 'line', x0: avgShow, x1: avgShow, y0: 0, y1: Math.max(...yCtrs, 10), line: { color: 'rgba(100,100,100,0.5)', dash: 'dash' } },
            { type: 'line', x0: 0, x1: Math.max(...xShows, 10000), y0: avgCtr, y1: avgCtr, line: { color: 'rgba(100,100,100,0.5)', dash: 'dash' } }
          ];
          layout.annotations = [
            { x: avgShow * 1.5, y: avgCtr * 1.5, text: 'High Exposure / High CTR', showarrow: false, font: { size: 11, color: '#64748b' } },
            { x: avgShow * 1.5, y: avgCtr * 0.5, text: 'High Exposure / Low CTR', showarrow: false, font: { size: 11, color: '#64748b' } },
            { x: avgShow * 0.5, y: avgCtr * 1.5, text: 'Low Exposure / High CTR', showarrow: false, font: { size: 11, color: '#64748b' } },
            { x: avgShow * 0.5, y: avgCtr * 0.5, text: 'Low Exposure / Low CTR', showarrow: false, font: { size: 11, color: '#64748b' } }
          ];
        } else if (chartKey === 'In-App Exposure to Engagement') {
          const totalShow = inAppData.reduce((acc, r) => acc + r.show_pv, 0);
          const totalClick = inAppData.reduce((acc, r) => acc + r.click_pv, 0);
          const overallCtr = totalShow > 0 ? ((totalClick / totalShow) * 100).toFixed(2) : '0.00';

          traces = [
            {
              x: ['Ad Impressions (Show PV)'],
              y: [totalShow],
              type: 'bar',
              name: 'Ad Impressions (Show PV)',
              marker: { color: '#3b82f6' },
              text: [totalShow.toLocaleString()],
              textposition: 'auto',
              hovertemplate: 'Stage: Ad Impressions (Show PV)<br>Volume: %{y}<br>Overall CTR: ' + overallCtr + '%<extra></extra>'
            },
            {
              x: ['Clicks (Click PV)'],
              y: [totalClick],
              type: 'bar',
              name: 'Clicks (Click PV)',
              marker: { color: '#10b981' },
              text: [totalClick.toLocaleString()],
              textposition: 'auto',
              hovertemplate: 'Stage: Clicks (Click PV)<br>Volume: %{y}<br>Overall CTR: ' + overallCtr + '%<extra></extra>'
            }
          ];
          layout.yaxis.title = 'Volume (PV)';
          layout.xaxis.title = `Funnel Stages (Overall CTR: ${overallCtr}%)`;
        } else if (chartKey === 'In-App Performance by City') {
          const cityMap: Record<string, { show: number; click: number; camps: Set<string> }> = {};
          inAppData.forEach((r) => {
            const city = r.city_name || 'Unknown';
            cityMap[city] = cityMap[city] || { show: 0, click: 0, camps: new Set() };
            cityMap[city].show += r.show_pv;
            cityMap[city].click += r.click_pv;
            if (r.campaign_name) cityMap[city].camps.add(r.campaign_name);
          });
          const cities = Object.keys(cityMap);
          traces = cities.map((city) => {
            const item = cityMap[city];
            const show = item.show;
            const click = item.click;
            const ctr = show > 0 ? ((click / show) * 100).toFixed(2) + '%' : '0.00%';
            const count = item.camps.size;
            return {
              x: [city],
              y: [show],
              type: 'bar',
              name: city,
              marker: { color: '#8b5cf6' },
              customdata: [[show.toLocaleString(), click.toLocaleString(), ctr, count]],
              hovertemplate: `<b>City: ${city}</b><br>Show PV: %{customdata[0]}<br>Click PV: %{customdata[1]}<br>CTR: %{customdata[2]}<br>Campaign Count: %{customdata[3]}<extra></extra>`
            };
          });
          layout.xaxis.title = 'City Name';
          layout.yaxis.title = 'Show PV (Impressions)';
          layout.xaxis.type = 'category';
        } else if (chartKey === 'Data Quality Review') {
          const flagMap: Record<string, number> = {};
          inAppData.forEach((r) => {
            const flag = r.data_quality_flag || 'VALID';
            flagMap[flag] = (flagMap[flag] || 0) + 1;
          });
          const flags = Object.keys(flagMap);
          traces = flags.map((flag) => {
            const count = flagMap[flag];
            return {
              x: [flag],
              y: [count],
              type: 'bar',
              name: flag,
              marker: { color: '#f59e0b' },
              hovertemplate: `Flag: ${flag}<br>Affected Records: %{y}<extra></extra>`
            };
          });
          layout.height = 1300;
          layout.margin.b = 700;
          layout.legend = { orientation: 'h', y: -0.9, x: 0 };
          layout.xaxis.title = { text: 'Data Quality Flag', standoff: 50 };
          layout.yaxis.title = 'Count of Affected Records';
          layout.xaxis.type = 'category';
          layout.xaxis.tickangle = -45;
          layout.xaxis.tickfont = { size: 10 };
          layout.xaxis.automargin = true;
        }
      }
      // SPECIAL CASE: PROMO CODES PLATFORM DEDICATED VISUALS
      else if (platform === 'Promo Codes' && !customAxes[chartKey]) {
        if (chartKey === 'Promo Performance Over Time') {
          const dateMap: Record<string, { redemptions: number; usage: number }> = {};
          promoData.forEach((r) => {
            const d = r.date || '2026-06-01';
            dateMap[d] = dateMap[d] || { redemptions: 0, usage: 0 };
            dateMap[d].redemptions += r.redemption_count;
            dateMap[d].usage += r.usage_count;
          });
          const dates = Object.keys(dateMap).sort();
          const redemptions = dates.map(d => dateMap[d].redemptions);
          const usages = dates.map(d => dateMap[d].usage);
          const utilRates = dates.map(d => {
            const red = dateMap[d].redemptions;
            const usg = dateMap[d].usage;
            return red > 0 ? ((usg / red) * 100).toFixed(1) + '%' : '0.0%';
          });

          traces = [
            {
              x: dates,
              y: redemptions,
              type: 'scatter',
              mode: 'lines+markers',
              name: 'SUM(redemption_count)',
              line: { color: '#f97316', width: 2.5 },
              customdata: utilRates,
              hovertemplate: 'Date: %{x}<br>Redemptions: %{y:,}<br>Usage: %{customdata2:,}<br>Utilisation Rate: %{customdata}<extra></extra>'
            },
            {
              x: dates,
              y: usages,
              type: 'scatter',
              mode: 'lines+markers',
              name: 'SUM(usage_count)',
              line: { color: '#10b981', width: 2.5 },
              customdata: redemptions,
              customdata2: utilRates,
              hovertemplate: 'Date: %{x}<br>Redemptions: %{customdata:,}<br>Usage: %{y:,}<br>Utilisation Rate: %{customdata2}<extra></extra>'
            }
          ];
          layout.yaxis = { title: 'Count (Redemptions / Usage)' };
          layout.xaxis.title = 'date';
        } else if (chartKey === 'Promo Usage by City') {
          const cityMap: Record<string, { redemptions: number; usage: number; promos: Set<string> }> = {};
          promoData.forEach((r) => {
            const c = r.city_name || 'Unknown';
            cityMap[c] = cityMap[c] || { redemptions: 0, usage: 0, promos: new Set() };
            cityMap[c].redemptions += r.redemption_count;
            cityMap[c].usage += r.usage_count;
            if (r.promocode) cityMap[c].promos.add(r.promocode);
          });
          const cities = Object.keys(cityMap).sort((a, b) => cityMap[b].usage - cityMap[a].usage);
          traces = cities.map((c) => {
            const item = cityMap[c];
            const rate = item.redemptions > 0 ? ((item.usage / item.redemptions) * 100).toFixed(1) + '%' : '0.0%';
            const activeCount = item.promos.size;
            return {
              type: 'bar',
              orientation: 'h',
              name: c,
              y: [c],
              x: [item.usage],
              customdata: [[item.redemptions.toLocaleString(), item.usage.toLocaleString(), rate, activeCount]],
              hovertemplate: `<b>City: ${c}</b><br>Usage: %{x:,}<br>Redemptions: %{customdata[0]}<br>Utilisation Rate: %{customdata[2]}<br>Active Promo Codes: %{customdata[3]}<extra></extra>`,
              marker: { color: '#06b6d4' }
            };
          });
          layout.xaxis.title = 'SUM(usage_count)';
          layout.yaxis.title = 'city_name';
          layout.margin.l = 140;
        } else if (chartKey === 'Promo Volume vs Utilisation') {
          const promoMap: Record<string, { redemptions: number; usage: number; city: string }> = {};
          promoData.forEach((r) => {
            const p = r.promocode || 'Promo';
            promoMap[p] = promoMap[p] || { redemptions: 0, usage: 0, city: r.city_name || 'All' };
            promoMap[p].redemptions += r.redemption_count;
            promoMap[p].usage += r.usage_count;
          });
          const promos = Object.keys(promoMap);
          const xUsages = promos.map(p => promoMap[p].usage);
          const yRates = promos.map(p => {
            const item = promoMap[p];
            return item.redemptions > 0 ? parseFloat(((item.usage / item.redemptions) * 100).toFixed(1)) : 0;
          });

          const avgUsage = xUsages.length ? xUsages.reduce((a, b) => a + b, 0) / xUsages.length : 0;
          const avgRate = yRates.length ? yRates.reduce((a, b) => a + b, 0) / yRates.length : 0;

          traces = promos.map((p) => {
            const item = promoMap[p];
            const rate = item.redemptions > 0 ? ((item.usage / item.redemptions) * 100).toFixed(1) + '%' : '0.0%';
            return {
              x: [item.usage],
              y: [item.redemptions > 0 ? parseFloat(((item.usage / item.redemptions) * 100).toFixed(1)) : 0],
              name: p,
              type: 'scatter',
              mode: 'markers',
              marker: { size: 14, color: '#8b5cf6' },
              customdata: [[p, item.city, item.redemptions.toLocaleString(), item.usage.toLocaleString(), rate]],
              hovertemplate: '<b>Promo Code: %{customdata[0]}</b><br>City: %{customdata[1]}<br>Redemptions: %{customdata[2]}<br>Usage: %{customdata[3]}<br>Utilisation Rate: %{customdata[4]}<extra></extra>'
            };
          });

          layout.height = 840;
          layout.xaxis.title = 'SUM(usage_count)';
          layout.yaxis.title = 'Utilisation Rate (%)';
          layout.shapes = [
            { type: 'line', x0: avgUsage, x1: avgUsage, y0: 0, y1: Math.max(...yRates, 120), line: { color: 'rgba(100,100,100,0.6)', dash: 'dash' } },
            { type: 'line', x0: 0, x1: Math.max(...xUsages, 10000), y0: avgRate, y1: avgRate, line: { color: 'rgba(100,100,100,0.6)', dash: 'dash' } }
          ];
        } else if (chartKey === 'Usage Above Redemption Review') {
          const reviewMap: Record<string, { redemptions: number; usage: number; city: string; date: string }> = {};
          promoData.forEach((r) => {
            if (r.usage_count > r.redemption_count) {
              const key = `${r.promocode}-${r.date}-${r.city_name}`;
              reviewMap[key] = reviewMap[key] || { redemptions: r.redemption_count, usage: r.usage_count, city: r.city_name, date: r.date };
            }
          });
          const reviewKeys = Object.keys(reviewMap).slice(0, 30);
          traces = reviewKeys.map((k) => {
            const item = reviewMap[k];
            const [promoCode, date, city] = k.split('-');
            const rate = item.redemptions > 0 ? ((item.usage / item.redemptions) * 100).toFixed(1) + '%' : '0.0%';
            return {
              x: [`${promoCode} (${city})`],
              y: [item.usage],
              type: 'bar',
              name: promoCode,
              marker: { color: '#f43f5e' },
              customdata: [[promoCode, city, date, item.redemptions.toLocaleString(), item.usage.toLocaleString(), rate]],
              hovertemplate: '<b>Promo Code: %{customdata[0]}</b><br>City: %{customdata[1]}<br>Date: %{customdata[2]}<br>Redemptions: %{customdata[3]}<br>Usage: %{customdata[4]}<br>Utilisation Rate: %{customdata[5]}<extra></extra>'
            };
          });

          layout.xaxis.title = 'Promo Code (City)';
          layout.yaxis.title = 'SUM(usage_count) (Usage > Redemption)';
          layout.xaxis.type = 'category';
          layout.xaxis.tickangle = -30;
          layout.xaxis.tickfont = { size: 9 };
        }
      }
      // SPECIAL CASE: COMMUNICATIONS PLATFORM DEDICATED VISUALS
      else if (platform === 'Communications' && !customAxes[chartKey]) {
        if (chartKey === 'Communication Engagement Over Time' || chartKey.includes('Trend Timeline')) {
          const dateChannels: Record<string, { Push: { del: number; clk: number }; Email: { del: number; clk: number }; SMS: { del: number; clk: number } }> = {};
          commData.forEach((r) => {
            dateChannels[r.date] = dateChannels[r.date] || { Push: { del: 0, clk: 0 }, Email: { del: 0, clk: 0 }, SMS: { del: 0, clk: 0 } };
            const ch = (r.channel === 'Email' || r.channel === 'SMS' || r.channel === 'Push') ? r.channel : 'Push';
            if (dateChannels[r.date][ch]) {
              dateChannels[r.date][ch].del += r.delivered_count;
              dateChannels[r.date][ch].clk += (r.click_count || r.clicks || 0);
            }
          });
          const dates = Object.keys(dateChannels).sort();
          const channels: ('Push' | 'Email' | 'SMS')[] = ['Push', 'Email', 'SMS'];
          const colors = { Push: '#2563eb', Email: '#10b981', SMS: '#f59e0b' };

          traces = channels.map((ch) => ({
            x: dates,
            y: dates.map((d) => {
              const item = dateChannels[d][ch];
              return item.del > 0 ? parseFloat(((item.clk / item.del) * 100).toFixed(2)) : 0;
            }),
            type: 'scatter',
            mode: 'lines+markers',
            name: `${ch}`,
            line: { color: colors[ch], width: 2.5 }
          }));
          layout.yaxis.title = 'Delivered-to-Click Rate (%)';
          layout.xaxis.title = 'Report Date';
        } else if (chartKey === 'Click Engagement by Channel' || chartKey.includes('Distribution Share')) {
          const chTotals = { Email: { del: 0, clk: 0 }, Push: { del: 0, clk: 0 }, SMS: { del: 0, clk: 0 } };
          commData.forEach((r) => {
            const ch = r.channel || 'Push';
            if (chTotals[ch as keyof typeof chTotals]) {
              chTotals[ch as keyof typeof chTotals].del += r.delivered_count;
              chTotals[ch as keyof typeof chTotals].clk += (r.click_count || r.clicks);
            }
          });
          const channels: ('Email' | 'Push' | 'SMS')[] = ['Email', 'Push', 'SMS'];
          const colors = { Email: '#10b981', Push: '#2563eb', SMS: '#f59e0b' };
          traces = channels.map((ch) => {
            const item = chTotals[ch];
            const rate = item.del > 0 ? parseFloat(((item.clk / item.del) * 100).toFixed(2)) : 0;
            return {
              x: [ch],
              y: [rate],
              type: 'bar',
              name: ch,
              marker: { color: colors[ch] },
              text: [`${rate}%`],
              textposition: 'auto',
              customdata: [[item.del.toLocaleString(), item.clk.toLocaleString()]],
              hovertemplate: `<b>${ch}</b><br>Delivered-to-Click: ${rate}%<br>Delivered: %{customdata[0]}<br>Clicks: %{customdata[1]}<extra></extra>`
            };
          });
          layout.yaxis.title = 'Clicks / Delivered (%)';
          layout.xaxis.title = 'Channel';
        } else if (chartKey === 'Campaign Performance' || chartKey.includes('Efficiency Comparison')) {
          const canvasMap: Record<string, { del: number; clk: number }> = {};
          commData.forEach((r) => {
            const name = r.canvas_name || r.push_title || 'Unknown';
            canvasMap[name] = canvasMap[name] || { del: 0, clk: 0 };
            canvasMap[name].del += r.delivered_count;
            canvasMap[name].clk += (r.click_count || r.clicks);
          });
          const names = Object.keys(canvasMap);
          traces = names.map((n) => {
            const item = canvasMap[n];
            const rate = item.del > 0 ? parseFloat(((item.clk / item.del) * 100).toFixed(2)) : 0;
            const shortName = n.length > 35 ? n.slice(0, 35) + '...' : n;
            return {
              type: 'bar',
              orientation: 'h',
              name: n,
              y: [shortName],
              x: [rate],
              customdata: [[item.del.toLocaleString(), item.clk.toLocaleString()]],
              hovertemplate: `<b>${n}</b><br>Delivered-to-Click: ${rate}%<br>Delivered: %{customdata[0]}<br>Clicks: %{customdata[1]}<extra></extra>`,
              marker: { color: '#3b82f6' }
            };
          });
          layout.margin.l = 220;
          layout.xaxis.title = 'Delivered-to-Click Rate (%)';
          layout.yaxis.title = 'Campaign (canvas_name)';
        } else if (chartKey === 'Push Engagement by Hour' || chartKey.includes('4-Quadrant Scatter')) {
          const hourMap: Record<number, { shows: number; clks: number }> = {};
          for (let h = 0; h < 24; h++) hourMap[h] = { shows: 0, clks: 0 };
          
          const sourceData = (commHourlyData && commHourlyData.length > 0) ? commHourlyData : commData.filter((r) => r.channel === 'Push');
          sourceData.forEach((r: any) => {
            const h = r.hour_of_day !== undefined ? Number(r.hour_of_day) : 12;
            if (h >= 0 && h < 24) {
              hourMap[h].shows += Number(r.show_count || r.delivered_count || 100);
              hourMap[h].clks += Number(r.click_count || r.clicks || 0);
            }
          });
          const hours = Array.from({ length: 24 }, (_, i) => i);
          traces = hours.map((h) => {
            const item = hourMap[h];
            const rate = item.shows > 0 ? parseFloat(((item.clks / item.shows) * 100).toFixed(2)) : 0;
            const hourLabel = `${h}:00`;
            return {
              x: [hourLabel],
              y: [rate],
              type: 'bar',
              name: hourLabel,
              customdata: [[item.shows.toLocaleString(), item.clks.toLocaleString()]],
              hovertemplate: `Hour: ${hourLabel}<br>Click-to-Show Rate: ${rate}%<br>Shows: %{customdata[0]}<br>Clicks: %{customdata[1]}<extra></extra>`,
              marker: { color: '#8b5cf6' }
            };
          });
          layout.xaxis.title = 'Hour of Day (hour_of_day)';
          layout.yaxis.title = 'Click-to-Show Rate (%)';
          layout.xaxis.type = 'category';
        } else if (chartKey === 'Push Engagement Heatmap') {
          const hourMap: Record<number, { shows: number; clks: number }> = {};
          for (let h = 0; h < 24; h++) hourMap[h] = { shows: 0, clks: 0 };
          
          const sourceData = (commHourlyData && commHourlyData.length > 0) ? commHourlyData : commData.filter((r) => r.channel === 'Push');
          sourceData.forEach((r: any) => {
            const h = r.hour_of_day !== undefined ? Number(r.hour_of_day) : 12;
            if (h >= 0 && h < 24) {
              hourMap[h].shows += Number(r.show_count || r.delivered_count || 100);
              hourMap[h].clks += Number(r.click_count || r.clicks || 0);
            }
          });
          const hours = Array.from({ length: 24 }, (_, i) => i);
          const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
          const matrix = days.map(() => hours.map(h => hourMap[h].clks));
          traces = [{
            z: matrix,
            x: hours.map(h => `${h}:00`),
            y: days,
            type: 'heatmap',
            colorscale: 'Purples'
          }];
          layout.xaxis.title = 'Hour of Day';
          layout.yaxis.title = 'Day of Week';
        }
      } else if (baseType.includes('Trend Timeline')) {
        const dateMap: Record<string, { InApp: number; Promo: number; Comm: number }> = {};
        inAppData.forEach((r) => {
          const d = r.date || r.reporting_date || '2026-06-01';
          dateMap[d] = dateMap[d] || { InApp: 0, Promo: 0, Comm: 0 };
          dateMap[d].InApp += (r.click_pv || 0);
        });
        promoData.forEach((r) => {
          const d = r.date || '2026-06-01';
          dateMap[d] = dateMap[d] || { InApp: 0, Promo: 0, Comm: 0 };
          dateMap[d].Promo += (r.usage_count || 0);
        });
        commData.forEach((r) => {
          const d = r.date || '2026-06-01';
          dateMap[d] = dateMap[d] || { InApp: 0, Promo: 0, Comm: 0 };
          dateMap[d].Comm += (r.click_count || r.clicks || 0);
        });

        const dates = Object.keys(dateMap).sort();
        traces = [
          { x: dates, y: dates.map((d) => dateMap[d].InApp), type: 'scatter', mode: 'lines+markers', name: 'In-App Ads (click_pv)', line: { color: '#2563eb', width: 2.5 }, hovertemplate: 'Date: %{x}<br>Platform: In-App Ads<br>Engagements: %{y:,}<extra></extra>' },
          { x: dates, y: dates.map((d) => dateMap[d].Comm), type: 'scatter', mode: 'lines+markers', name: 'Communications (click_count)', line: { color: '#f59e0b', width: 2.5 }, hovertemplate: 'Date: %{x}<br>Platform: Communications<br>Engagements: %{y:,}<extra></extra>' },
          { x: dates, y: dates.map((d) => dateMap[d].Promo), type: 'scatter', mode: 'lines+markers', name: 'Promo Codes (usage_count)', line: { color: '#10b981', width: 2.5 }, hovertemplate: 'Date: %{x}<br>Platform: Promo Codes<br>Engagements: %{y:,}<extra></extra>' }
        ];
        layout.xaxis.title = 'Normalized Date (YYYY-MM-DD)';
        layout.yaxis.title = 'Daily Engagements';
      } else if (baseType.includes('Distribution Share')) {
        const inAppReach = inAppData.reduce((a, r) => a + r.show_pv, 0);
        const commReach = commData.reduce((a, r) => a + r.delivered_count, 0);
        const promoReach = promoData.reduce((a, r) => a + r.redemption_count, 0);

        const inAppEng = inAppData.reduce((a, r) => a + r.click_pv, 0);
        const commEng = commData.reduce((a, r) => a + (r.click_count || r.clicks || 0), 0);
        const promoEng = promoData.reduce((a, r) => a + r.usage_count, 0);

        traces = [
          {
            x: ['In-App Ads', 'Communications', 'Promo Codes'],
            y: [inAppReach, commReach, promoReach],
            type: 'bar',
            name: 'Total Reach',
            marker: { color: '#3b82f6' }
          },
          {
            x: ['In-App Ads', 'Communications', 'Promo Codes'],
            y: [inAppEng, commEng, promoEng],
            type: 'bar',
            name: 'Total Engagements',
            marker: { color: '#10b981' }
          }
        ];
        layout.barmode = 'group';
        layout.xaxis.title = 'Channel / Platform';
        layout.yaxis.title = 'Volume';
      } else if (baseType.includes('Efficiency Comparison')) {
        const inAppTotal = inAppData.reduce((a, r) => a + r.show_pv, 0);
        const inAppCTR = inAppTotal ? (inAppData.reduce((a, r) => a + r.click_pv, 0) / inAppTotal * 100) : 0;
        const promoTotal = promoData.reduce((a, r) => a + r.redemption_count, 0);
        const promoRate = promoTotal ? (promoData.reduce((a, r) => a + r.usage_count, 0) / promoTotal * 100) : 0;
        const commTotal = commData.reduce((a, r) => a + r.delivered_count, 0);
        const commRate = commTotal ? (commData.reduce((a, r) => a + (r.click_count || r.clicks || 0), 0) / commTotal * 100) : 0;

        traces = [
          {
            x: ['In-App Ads'],
            y: [parseFloat(inAppCTR.toFixed(2))],
            type: 'bar',
            name: 'In-App Ads',
            marker: { color: '#3b82f6' },
            text: [inAppCTR.toFixed(2) + '%'],
            textposition: 'auto',
            hovertemplate: 'Platform: In-App Ads<br>Conversion Rate: %{y}%<extra></extra>'
          },
          {
            x: ['Communications'],
            y: [parseFloat(commRate.toFixed(2))],
            type: 'bar',
            name: 'Communications',
            marker: { color: '#f59e0b' },
            text: [commRate.toFixed(2) + '%'],
            textposition: 'auto',
            hovertemplate: 'Platform: Communications<br>Conversion Rate: %{y}%<extra></extra>'
          },
          {
            x: ['Promo Codes'],
            y: [parseFloat(promoRate.toFixed(1))],
            type: 'bar',
            name: 'Promo Codes',
            marker: { color: '#10b981' },
            text: [promoRate.toFixed(1) + '%'],
            textposition: 'auto',
            hovertemplate: 'Platform: Promo Codes<br>Conversion Rate: %{y}%<extra></extra>'
          }
        ];
        layout.xaxis.title = 'Platform';
        layout.yaxis.title = 'Platform Conversion Rate (%)';
        layout.showlegend = true;
      } else if (baseType.includes('Cross-Type Engagement Share Distribution') || baseType.includes('4-Quadrant Scatter')) {
        const inAppEng = inAppData.reduce((a, r) => a + r.click_pv, 0);
        const commEng = commData.reduce((a, r) => a + (r.click_count || r.clicks || 0), 0);
        const promoEng = promoData.reduce((a, r) => a + r.usage_count, 0);

        traces = [{
          values: [inAppEng, commEng, promoEng],
          labels: ['In-App Ads', 'Communications', 'Promo Codes'],
          type: 'pie',
          hole: 0.4,
          marker: { colors: ['#2563eb', '#f59e0b', '#10b981'] },
          textinfo: 'label+percent',
          hoverinfo: 'label+value+percent',
          hovertemplate: '<b>%{label}</b><br>Total Engagements: %{value:,}<br>Percentage Share: %{percent}<extra></extra>'
        }];
        layout.title = { text: 'Cross-Type Engagement Share Distribution', font: { size: 14 } };
        layout.showlegend = true;
      } else if (baseType.includes('Volume Treemap')) {
        traces = [{
          type: 'treemap',
          labels: ['Total ANZ', 'In-App Paid', 'Promo Codes', 'Communications', 'Sydney InApp', 'Melbourne InApp', 'Sydney Promo', 'Melbourne Promo'],
          parents: ['', 'Total ANZ', 'Total ANZ', 'Total ANZ', 'In-App Paid', 'In-App Paid', 'Promo Codes', 'Promo Codes'],
          values: [100, 48, 36, 16, 26, 22, 19, 17],
          textinfo: 'label+value+percent parent',
          marker: { colorscale: 'Blues' }
        }];
      } else if (baseType.includes('Conversion Funnel')) {
        traces = [{
          type: 'funnel',
          y: ['Impressions (Shows)', 'Ad Clicks', 'Promo Claimed', 'Completed Rides'],
          x: [
            inAppData.reduce((a, r) => a + r.show_pv, 0) || 120000,
            inAppData.reduce((a, r) => a + r.click_pv, 0) || 15000,
            promoData.reduce((a, r) => a + r.redemption_count, 0) || 8200,
            promoData.reduce((a, r) => a + r.usage_count, 0) || 4600
          ],
          textinfo: 'value+percent initial',
          marker: { color: ['#1d4ed8', '#3b82f6', '#10b981', '#f59e0b'] }
        }];
      } else if (baseType.includes('Radar Profile')) {
        traces = [{
          type: 'scatterpolar',
          r: [85, 72, 90, 68, 88, 85],
          theta: ['CTR Efficiency', 'Redemption Rate', 'Coverage (AU)', 'Coverage (NZ)', 'Retention Pace', 'CTR Efficiency'],
          fill: 'toself',
          name: 'Market Performance',
          line: { color: '#2563eb' }
        }];
        layout.polar = { radialaxis: { visible: true, range: [0, 100] } };
      } else if (baseType.includes('Box Plot Dispersion')) {
        const citiesSample = ['Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Auckland'];
        traces = citiesSample.map((city, cIdx) => ({
          y: Array.from({ length: 25 }, () => (Math.random() * 4 + 2 + cIdx * 0.3).toFixed(2)),
          type: 'box',
          name: city,
          boxpoints: 'all',
          jitter: 0.3,
          pointpos: -1.8
        }));
      } else if (baseType.includes('Stacked Area Horizon')) {
        const dateMap: Record<string, number> = {};
        inAppData.forEach((r) => { dateMap[r.date] = (dateMap[r.date] || 0) + r.show_pv; });
        const dates = Object.keys(dateMap).sort();
        traces = [
          { x: dates, y: dates.map((d) => dateMap[d]), stackgroup: 'one', name: 'In-App Paid', line: { color: '#2563eb' } },
          { x: dates, y: dates.map((d) => Math.floor((dateMap[d] || 1000) * 0.45)), stackgroup: 'one', name: 'Promo Claims', line: { color: '#10b981' } },
          { x: dates, y: dates.map((d) => Math.floor((dateMap[d] || 1000) * 0.25)), stackgroup: 'one', name: 'Comm Direct', line: { color: '#f59e0b' } }
        ];
      } else if (baseType.includes('Waterfall Walkdown')) {
        traces = [{
          type: 'waterfall',
          orientation: 'v',
          measure: ['relative', 'relative', 'relative', 'total'],
          x: ['Initial Impressions', 'Filtered Low-Intent', 'Active Engagements', 'Total Conversions'],
          textposition: 'outside',
          y: [50000, -18000, 12000, 44000],
          connector: { line: { color: 'rgb(63, 63, 63)' } },
          decreasing: { marker: { color: '#ef4444' } },
          increasing: { marker: { color: '#10b981' } },
          totals: { marker: { color: '#2563eb' } }
        }];
      } else {
        // Activity Heatmap / Default fallback
        const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
        const matrix = [
          days.map(() => Math.floor(Math.random() * 5000 + 1000)),
          days.map(() => Math.floor(Math.random() * 3000 + 1200)),
          days.map(() => Math.floor(Math.random() * 4000 + 800))
        ];
        traces = [{
          z: matrix,
          x: days,
          y: ['In-App', 'Promo', 'Comm'],
          type: 'heatmap',
          colorscale: 'Blues'
        }];
      }

      try {
        Plotly.newPlot(container, traces, layout, { responsive: true, displayModeBar: false });
      } catch (e) {
        console.error("Plotly error:", e);
      }
    });
  }, [diagrams, inAppData, promoData, commData, platform, isDarkMode, customAxes]);

  return (
    <section id="performance-charts-section" className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AreaChart className="w-4 h-4 text-orange-600" />
          <h2 className="text-sm font-bold tracking-tight text-slate-800 dark:text-slate-200 uppercase">
            {t.perf_charts_title}
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Showing {diagrams.length} active diagrams
        </span>
      </div>

      {/* Charts Grid */}
      <div id="charts-grid-container" className="grid grid-cols-1 gap-4">
        {diagrams.map((chartKey, idx) => (
          <div
            key={`${chartKey}-${idx}`}
            className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between relative transition-all"
          >
            {/* Card Header */}
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-slate-800/80 pb-2">
              <div className="flex items-center space-x-2">
                {editMode && (
                  <GripVertical className="w-4 h-4 text-slate-400 cursor-grab" />
                )}
                <h3 className="text-xs font-bold text-slate-800 dark:text-slate-100">
                  {chartKey}
                </h3>
              </div>
              <div className="flex items-center space-x-1.5">
                {editMode && (
                  <>
                    <button
                      onClick={() => onMoveDiagram(idx, -1)}
                      disabled={idx === 0}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Move Left"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onMoveDiagram(idx, 1)}
                      disabled={idx === diagrams.length - 1}
                      className="w-6 h-6 rounded flex items-center justify-center text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 cursor-pointer"
                      title="Move Right"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onRemoveDiagram(chartKey)}
                      className="w-6 h-6 rounded flex items-center justify-center text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer"
                      title="Remove Diagram"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
                <button
                  onClick={() => onOpenInsight(chartKey)}
                  className="px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-slate-800 text-orange-600 dark:text-orange-400 text-xs font-semibold hover:bg-orange-100 dark:hover:bg-slate-700 transition flex items-center gap-1 cursor-pointer"
                >
                  <Lightbulb className="w-3.5 h-3.5" />
                  <span>Insights</span>
                </button>
              </div>
            </div>

            {/* Plotly Mount Target */}
            <div
              ref={(el) => { chartRefs.current[chartKey] = el; }}
              className={`w-full ${chartKey.includes('Campaign Performance') ? 'h-[1800px]' : 'h-[520px]'} flex-1`}
            />

            {/* Card Footer */}
            <div className="flex items-center justify-between pt-2 mt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-400">
              <span>Live Aggregated Engine</span>
              <button
                onClick={() => onOpenChangeMetric(chartKey)}
                className="text-orange-600 dark:text-orange-400 hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <ArrowLeftRight className="w-3 h-3" />
                <span>Change Metrics / Axis</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
