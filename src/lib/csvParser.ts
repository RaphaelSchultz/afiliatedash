// CSV Parser utilities for Brazilian format (comma as decimal, dot as thousand separator)

export function parseBrazilianNumber(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[R$\s]/g, '').trim();
  
  // Handle Brazilian format: 1.234,56 -> 1234.56
  // First remove thousand separators (dots)
  cleaned = cleaned.replace(/\./g, '');
  // Then convert decimal separator (comma) to dot
  cleaned = cleaned.replace(',', '.');
  
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
}

export function parseBrazilianDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  
  // Try DD/MM/YYYY format
  const ddmmyyyy = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/;
  const match = dateStr.match(ddmmyyyy);
  
  if (match) {
    const [, day, month, year, hours = '0', minutes = '0', seconds = '0'] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
  }
  
  // Try ISO format fallback
  const isoDate = new Date(dateStr);
  return isNaN(isoDate.getTime()) ? null : isoDate;
}

export interface CSVParseResult {
  type: 'vendas' | 'clicks' | 'unknown';
  data: Record<string, unknown>[];
  headers: string[];
  rowCount: number;
}

// Header mappings for different CSV formats
const VENDAS_HEADER_MAP: Record<string, string> = {
  'order id': 'order_id',
  'id do pedido': 'order_id',
  'item id': 'item_id',
  'id do item': 'item_id',
  'purchase time': 'purchase_time',
  'data da compra': 'purchase_time',
  'hora da compra': 'purchase_time',
  'actual amount': 'actual_amount',
  'valor real': 'actual_amount',
  'valor gmv': 'actual_amount',
  'gmv': 'actual_amount',
  'net commission': 'net_commission',
  'comissão líquida': 'net_commission',
  'comissao liquida': 'net_commission',
  'total commission': 'total_commission',
  'comissão total': 'total_commission',
  'comissao total': 'total_commission',
  'status': 'status',
  'sub id 1': 'sub_id1',
  'sub_id1': 'sub_id1',
  'subid1': 'sub_id1',
  'sub id 2': 'sub_id2',
  'sub_id2': 'sub_id2',
  'subid2': 'sub_id2',
  'sub id 3': 'sub_id3',
  'sub_id3': 'sub_id3',
  'subid3': 'sub_id3',
  'sub id 4': 'sub_id4',
  'sub_id4': 'sub_id4',
  'subid4': 'sub_id4',
  'sub id 5': 'sub_id5',
  'sub_id5': 'sub_id5',
  'subid5': 'sub_id5',
  'channel': 'channel',
  'canal': 'channel',
  'shop name': 'shop_name',
  'nome da loja': 'shop_name',
  'loja': 'shop_name',
};

const CLICKS_HEADER_MAP: Record<string, string> = {
  'click time': 'click_time',
  'hora do clique': 'click_time',
  'data do clique': 'click_time',
  'region': 'region',
  'região': 'region',
  'regiao': 'region',
  'referrer': 'referrer',
  'origem': 'referrer',
  'sub id 1': 'sub_id1',
  'sub_id1': 'sub_id1',
  'subid1': 'sub_id1',
};

function normalizeHeader(header: string): string {
  return header.toLowerCase().trim();
}

function detectCSVType(headers: string[]): 'vendas' | 'clicks' | 'unknown' {
  const normalizedHeaders = headers.map(normalizeHeader);
  
  // Check for vendas-specific headers
  const hasOrderId = normalizedHeaders.some(h => 
    h.includes('order') || h.includes('pedido')
  );
  const hasCommission = normalizedHeaders.some(h => 
    h.includes('commission') || h.includes('comiss')
  );
  
  if (hasOrderId || hasCommission) {
    return 'vendas';
  }
  
  // Check for clicks-specific headers
  const hasClickTime = normalizedHeaders.some(h => 
    h.includes('click') || h.includes('clique')
  );
  
  if (hasClickTime) {
    return 'clicks';
  }
  
  return 'unknown';
}

function mapHeaders(headers: string[], type: 'vendas' | 'clicks'): string[] {
  const headerMap = type === 'vendas' ? VENDAS_HEADER_MAP : CLICKS_HEADER_MAP;
  
  return headers.map(header => {
    const normalized = normalizeHeader(header);
    return headerMap[normalized] || header;
  });
}

export function parseCSV(content: string): CSVParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    return { type: 'unknown', data: [], headers: [], rowCount: 0 };
  }
  
  // Parse headers (handle both comma and semicolon delimiters)
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const rawHeaders = lines[0].split(delimiter).map(h => h.replace(/"/g, '').trim());
  
  // Detect type
  const type = detectCSVType(rawHeaders);
  
  if (type === 'unknown') {
    return { type: 'unknown', data: [], headers: rawHeaders, rowCount: 0 };
  }
  
  // Map headers to database columns
  const mappedHeaders = mapHeaders(rawHeaders, type);
  
  // Parse data rows
  const data: Record<string, unknown>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    // Simple CSV parsing (handles basic quoted fields)
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if ((char === delimiter) && !inQuotes) {
        values.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    values.push(current.trim());
    
    // Create row object
    const row: Record<string, unknown> = {};
    
    mappedHeaders.forEach((header, index) => {
      const value = values[index]?.replace(/"/g, '') || '';
      
      // Parse specific field types
      if (header === 'actual_amount' || header === 'net_commission' || header === 'total_commission') {
        row[header] = parseBrazilianNumber(value);
      } else if (header === 'item_id') {
        row[header] = parseInt(value) || null;
      } else if (header === 'purchase_time' || header === 'click_time') {
        const date = parseBrazilianDate(value);
        row[header] = date ? date.toISOString() : null;
      } else {
        row[header] = value || null;
      }
    });
    
    data.push(row);
  }
  
  return {
    type,
    data,
    headers: mappedHeaders,
    rowCount: data.length,
  };
}

export function validateVendaRow(row: Record<string, unknown>): boolean {
  return !!row.order_id;
}

export function validateClickRow(row: Record<string, unknown>): boolean {
  return !!row.click_time;
}
