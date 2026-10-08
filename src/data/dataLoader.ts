// src/data/dataLoader.ts
export interface InAppData {
  pt: string;
  date: string;
  day_of_week: string;
  city_name: string;
  country: string;
  resource_id: string;
  resource_name: string;
  plan_id: string;
  plan_name: string;
  campaign_id: string;
  campaign_name: string;
  campaign_ver: string;
  plan_start_time: string;
  plan_end_time: string;
  show_pv: number;
  click_pv: number;
  show_uv: number;
  click_uv: number;
  reporting_date: string;
  template_id: string;
  ctr_click_pv_show_pv: string;
  frequency_show_pv_show_uv: string;
  unique_click_rate_click_uv_show_uv: string;
  data_quality_status: string;
  data_quality_flag: string;
  url: string;
}

export interface PromoData {
  date: string;
  day_of_week: string;
  city_name: string;
  country: string;
  promocode: string;
  redemption_count: number;
  usage_count: number;
  url: string;
}

export interface CommData {
  report_date: string;
  date: string;
  day_of_week: string;
  target_markets: string;
  country: string;
  channel: string;
  canvas_id: string;
  canvas_name: string;
  campaign_start_date: string;
  campaign_end_date: string;
  step_id: string;
  step_name: string;
  request_count: number;
  delivered_count: number;
  open_count: number;
  show_count: number;
  link_eligible_count: number;
  click_count: number;
  url: string;
}

export interface CommHourlyRecord {
  campaign_id: string;
  matched_canvas_id: string;
  canvas_name: string;
  step_id: string;
  request_hour: string;
  report_date: string;
  day_of_week: string;
  hour_of_day: number;
  show_count: number;
  click_count: number;
  mapping_status: string;
}

const nzCities = ['Auckland', 'Wellington', 'Christchurch', 'Christchurch City', 'RoANZ'];

// 清洗數字：移除逗號與空白
function cleanNum(val: any): number {
  if (val === undefined || val === null || val === '') return 0;
  const cleaned = String(val).replace(/,/g, '').trim();
  const num = Number(cleaned);
  return isNaN(num) ? 0 : num;
}

// 標準化日期為 YYYY-MM-DD 格式
function normalizeDate(raw: string): string {
  if (!raw) return '';
  const datePart = raw.trim().split(' ')[0]; // 移除可能帶有的 0:00 時間
  if (datePart.includes('/')) {
    // 處理 D/M/YYYY
    const [d, m, y] = datePart.split('/');
    if (d && m && y) {
      return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
    }
  }
  return datePart;
}

// 支援引號與逗號的強健 CSV 解析器
function parseCSV(text: string): Record<string, string>[] {
  const cleanText = text.charCodeAt(0) === 0xFEFF ? text.slice(1) : text;
  const lines = cleanText.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  
  const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;

    const row: string[] = [];
    let insideQuote = false;
    let entry = '';

    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(entry.trim().replace(/^["']|["']$/g, ''));
        entry = '';
      } else {
        entry += char;
      }
    }
    row.push(entry.trim().replace(/^["']|["']$/g, ''));

    const obj: Record<string, string> = {};
    headers.forEach((h, idx) => {
      obj[h] = row[idx] || '';
    });
    results.push(obj);
  }
  return results;
}

export interface CommHourlyRecord {
  campaign_id: string;
  matched_canvas_id: string;
  canvas_name: string;
  step_id: string;
  request_hour: string;
  report_date: string;
  day_of_week: string;
  hour_of_day: number;
  show_count: number;
  click_count: number;
  mapping_status: string;
}

export async function loadRealDatasets(): Promise<{
  inapp: InAppData[];
  promo: PromoData[];
  comm: CommData[];
  commHourly: CommHourlyRecord[];
}> {
  const [inappRaw, promoRaw, commRaw, commHourlyRaw] = await Promise.all([
    import('./inapp.csv?raw').then(m => m.default),
    import('./Promocode.csv?raw').then(m => m.default),
    import('./Communication-1.csv?raw').then(m => m.default),
    import('./Communication2.csv?raw').then(m => m.default)
  ]);

  const defaultUrl = 'https://web.didiglobal.com/au/';

  const inapp: InAppData[] = parseCSV(inappRaw).map(r => {
    const normDate = normalizeDate(r.pt || r.reporting_date || '');
    const city = r.city_name || '';
    return {
      pt: normDate,
      date: normDate,
      day_of_week: normDate ? new Date(normDate).toLocaleDateString('en-US', { weekday: 'long' }) : '',
      city_name: city,
      country: nzCities.includes(city) ? 'New Zealand' : 'Australia',
      resource_id: r.resource_id || '',
      resource_name: r.resource_name || '',
      plan_id: r.plan_id || '',
      plan_name: r.plan_name || '',
      campaign_id: r.campaign_id || '',
      campaign_name: r.campaign_name || r.plan_name || '',
      campaign_ver: r.campaign_ver || 'All',
      plan_start_time: r.plan_start_time || '',
      plan_end_time: r.plan_end_time || '',
      show_pv: cleanNum(r.show_pv),
      click_pv: cleanNum(r.click_pv),
      show_uv: cleanNum(r.show_uv),
      click_uv: cleanNum(r.click_uv),
      reporting_date: normalizeDate(r.reporting_date || r.pt || ''),
      template_id: r.template_id || '',
      ctr_click_pv_show_pv: r.ctr_click_pv_show_pv || '',
      frequency_show_pv_show_uv: r.frequency_show_pv_show_uv || '',
      unique_click_rate_click_uv_show_uv: r.unique_click_rate_click_uv_show_uv || '',
      data_quality_status: r.data_quality_status || 'Valid',
      data_quality_flag: r.data_quality_flag || 'VALID',
      url: defaultUrl
    };
  });

  const promo: PromoData[] = parseCSV(promoRaw).map(r => {
    const normDate = normalizeDate(r.date || '');
    const city = r.city_name || '';
    return {
      date: normDate,
      day_of_week: normDate ? new Date(normDate).toLocaleDateString('en-US', { weekday: 'long' }) : '',
      city_name: city,
      country: nzCities.includes(city) ? 'New Zealand' : 'Australia',
      promocode: r.promocode || '',
      redemption_count: cleanNum(r.redemption_count),
      usage_count: cleanNum(r.usage_count),
      url: defaultUrl
    };
  });

  const comm: CommData[] = parseCSV(commRaw).map(r => {
    const normDate = normalizeDate(r.report_date || '');
    let market = 'Sydney';
    const nameLower = (r.canvas_name || '').toLowerCase();
    if (nameLower.includes('gold coast')) market = 'Gold Coast';
    else if (nameLower.includes('auckland')) market = 'Auckland';
    else if (nameLower.includes('brisbane')) market = 'Brisbane';
    else if (nameLower.includes('melbourne')) market = 'Melbourne';
    else if (nameLower.includes('perth')) market = 'Perth';
    else if (nameLower.includes('adelaide')) market = 'Adelaide';
    else if (nameLower.includes('wellington')) market = 'Wellington';
    else if (nameLower.includes('christchurch')) market = 'Christchurch';

    return {
      report_date: normDate,
      date: normDate,
      day_of_week: normDate ? new Date(normDate).toLocaleDateString('en-US', { weekday: 'long' }) : '',
      target_markets: market,
      country: ['Auckland', 'Wellington', 'Christchurch'].includes(market) ? 'New Zealand' : 'Australia',
      channel: r.channel || 'Push',
      canvas_id: String(r.canvas_id || ''),
      canvas_name: r.canvas_name || '',
      campaign_start_date: normalizeDate(r.campaign_start_date || ''),
      campaign_end_date: normalizeDate(r.campaign_end_date || ''),
      step_id: String(r.step_id || ''),
      step_name: r.step_name || '',
      request_count: cleanNum(r.request_count),
      delivered_count: cleanNum(r.delivered_count),
      open_count: cleanNum(r.open_count),
      show_count: cleanNum(r.show_count),
      link_eligible_count: cleanNum(r.link_eligible_count),
      click_count: cleanNum(r.click_count),
      url: defaultUrl
    };
  });

  const commHourly: CommHourlyRecord[] = parseCSV(commHourlyRaw).map(r => ({
    campaign_id: String(r.campaign_id || ''),
    matched_canvas_id: String(r.matched_canvas_id || ''),
    canvas_name: r.canvas_name || '',
    step_id: String(r.step_id || ''),
    request_hour: r.request_hour || '',
    report_date: normalizeDate(r.report_date || ''),
    day_of_week: r.day_of_week || '',
    hour_of_day: cleanNum(r.hour_of_day),
    show_count: cleanNum(r.show_count),
    click_count: cleanNum(r.click_count),
    mapping_status: r.mapping_status || ''
  }));

  return { inapp, promo, comm, commHourly };
}