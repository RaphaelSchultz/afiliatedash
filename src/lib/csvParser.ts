// CSV Parser utilities for Brazilian format (comma as decimal, dot as thousand separator)
// Also handles international format (dot as decimal)

export function parseCurrency(value: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null;
  
  // Remove currency symbols, whitespace
  let cleaned = value.replace(/[R$\s]/g, '').trim();
  
  // If empty after cleaning, return null
  if (!cleaned) return null;
  
  // Check if it's already in international format (e.g., "21.9" or "1.752")
  // International format: has dots but no commas, or dot is the last separator
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');
  
  if (hasDot && !hasComma) {
    // Already international format (e.g., "21.9", "1.752", "1000.50")
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  } else if (hasComma && !hasDot) {
    // Brazilian format without thousands (e.g., "21,9")
    cleaned = cleaned.replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  } else if (hasComma && hasDot) {
    // Brazilian format with thousands (e.g., "1.250,50")
    // Remove thousand separators (dots) and convert decimal comma to dot
    cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  
  // Plain number without separators
  const num = parseFloat(cleaned);
  return isNaN(num) ? null : num;
}

export function parsePercentage(value: string): number | null {
  if (!value || value.trim() === '' || value.trim() === '-') return null;
  const cleaned = value.replace('%', '').trim();
  const num = parseCurrency(cleaned);
  return num !== null ? num / 100 : null;
}

export function parseDate(dateStr: string): string | null {
  if (!dateStr || dateStr.trim() === '') return null;
  
  const trimmed = dateStr.trim();
  
  // Try ISO-like format first: YYYY-MM-DD HH:mm:ss
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/.exec(trimmed);
  if (isoMatch) {
    const [, year, month, day, hours = '0', minutes = '0', seconds = '0'] = isoMatch;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  
  // Try Brazilian format: DD/MM/YYYY HH:mm:ss
  const brMatch = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2})(?::(\d{2}))?)?$/.exec(trimmed);
  if (brMatch) {
    const [, day, month, year, hours = '0', minutes = '0', seconds = '0'] = brMatch;
    const date = new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
    return isNaN(date.getTime()) ? null : date.toISOString();
  }
  
  // Last resort: try native parsing
  const fallback = new Date(trimmed);
  return isNaN(fallback.getTime()) ? null : fallback.toISOString();
}

export function parseInteger(value: string): number | null {
  if (!value || value.trim() === '') return null;
  const num = parseInt(value.trim(), 10);
  return isNaN(num) ? null : num;
}

export interface CSVParseResult {
  type: 'vendas' | 'clicks' | 'unknown';
  data: Record<string, unknown>[];
  headers: string[];
  rowCount: number;
}

// EXACT header mappings for Shopee CSV (case-insensitive, BOM-stripped)
const VENDAS_HEADER_MAP: Record<string, string> = {
  // Identification
  'id do pedido': 'order_id',
  'order id': 'order_id',
  'id do item': 'item_id',
  'item id': 'item_id',
  'id do pagamento': 'conversion_id',
  'checkout id': 'checkout_id',
  
  // Timestamps
  'horário do pedido': 'purchase_time',
  'horario do pedido': 'purchase_time',
  'purchase time': 'purchase_time',
  'tempo de conclusão': 'complete_time',
  'tempo de conclusao': 'complete_time',
  'complete time': 'complete_time',
  'tempo dos cliques': 'click_time',
  'click time': 'click_time',
  
  // Financial - Currency fields
  'comissão líquida do afiliado(r$)': 'net_commission',
  'comissao liquida do afiliado(r$)': 'net_commission',
  'net commission': 'net_commission',
  'valor de compra(r$)': 'actual_amount',
  'actual amount': 'actual_amount',
  'preço(r$)': 'item_price',
  'preco(r$)': 'item_price',
  'price': 'item_price',
  'comissão total do pedido(r$)': 'total_commission',
  'comissao total do pedido(r$)': 'total_commission',
  'total commission': 'total_commission',
  'comissão total do item(r$)': 'item_commission',
  'comissao total do item(r$)': 'item_commission',
  'item commission': 'item_commission',
  'valor do reembolso(r$)': 'refund_amount',
  'refund amount': 'refund_amount',
  'comissão do item da shopee(r$)': 'shopee_commission',
  'comissao do item da shopee(r$)': 'shopee_commission',
  'comissão shopee(r$)': 'shopee_commission',
  'comissao shopee(r$)': 'shopee_commission',
  'comissão do item da marca(r$)': 'brand_commission',
  'comissao do item da marca(r$)': 'brand_commission',
  'comissão do vendedor(r$)': 'seller_commission',
  'comissao do vendedor(r$)': 'seller_commission',
  'fee de gestão da rm(r$)': 'mcn_fee',
  'fee de gestao da rm(r$)': 'mcn_fee',
  
  // Percentage fields
  'taxa de comissão shopee do item': 'item_shopee_commission_rate',
  'taxa de comissao shopee do item': 'item_shopee_commission_rate',
  'taxa de comissão do vendedor do item': 'item_seller_commission_rate',
  'taxa de comissao do vendedor do item': 'item_seller_commission_rate',
  'taxa do fee de gestão da rm': 'mcn_fee_rate',
  'taxa do fee de gestao da rm': 'mcn_fee_rate',
  'taxa de contrato do afiliado': 'rate',
  
  // Quantity
  'qtd': 'qty',
  'qty': 'qty',
  'quantity': 'qty',
  
  // Status fields
  'status do pedido': 'order_status',
  'order status': 'order_status',
  'status do item do afiliado': 'conversion_status',
  'affiliate item status': 'conversion_status',
  'status do comprador': 'buyer_type',
  'buyer type': 'buyer_type',
  
  // Shop information
  'nome da loja': 'shop_name',
  'shop name': 'shop_name',
  'id da loja': 'shop_id',
  'shop id': 'shop_id',
  'tipo da loja': 'shop_type',
  'shop type': 'shop_type',
  
  // Item details
  'nome do item': 'item_name',
  'item name': 'item_name',
  'modelo de id': 'item_model_id',
  'model id': 'item_model_id',
  'tipo de produto': 'product_type',
  'product type': 'product_type',
  'id da promoção': 'promotion_id',
  'id da promocao': 'promotion_id',
  'promotion id': 'promotion_id',
  'notas do item': 'item_notes',
  'item notes': 'item_notes',
  
  // Categories
  'categoria global l1': 'category_l1',
  'category l1': 'category_l1',
  'categoria global l2': 'category_l2',
  'category l2': 'category_l2',
  'categoria global l3': 'category_l3',
  'category l3': 'category_l3',
  
  // Campaign & Attribution
  'offer type': 'campaign_type',
  'tipo de atribuição': 'attribution_type',
  'tipo de atribuicao': 'attribution_type',
  'parceiro de campanha': 'campaign_partner_name',
  'campaign partner': 'campaign_partner_name',
  
  // MCN/RM
  'rm vinculada': 'mcn_name',
  'id de contrato da rm': 'mcn_name',
  
  // Sub IDs
  'sub_id1': 'sub_id1',
  'subid1': 'sub_id1',
  'sub id 1': 'sub_id1',
  'sub_id2': 'sub_id2',
  'subid2': 'sub_id2',
  'sub id 2': 'sub_id2',
  'sub_id3': 'sub_id3',
  'subid3': 'sub_id3',
  'sub id 3': 'sub_id3',
  'sub_id4': 'sub_id4',
  'subid4': 'sub_id4',
  'sub id 4': 'sub_id4',
  'sub_id5': 'sub_id5',
  'subid5': 'sub_id5',
  'sub id 5': 'sub_id5',
  
  // Channel
  'canal': 'channel',
  'channel': 'channel',
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
  'sub_id1': 'sub_id1',
  'subid1': 'sub_id1',
  'sub id 1': 'sub_id1',
  'sub_id2': 'sub_id2',
  'sub_id3': 'sub_id3',
  'sub_id4': 'sub_id4',
  'sub_id5': 'sub_id5',
  'click pv': 'click_pv',
};

// Field type definitions
const CURRENCY_FIELDS = new Set([
  'net_commission', 'actual_amount', 'item_price', 'total_commission',
  'item_commission', 'refund_amount', 'shopee_commission', 'brand_commission',
  'seller_commission', 'mcn_fee', 'gross_commission', 'item_total_commission'
]);

const PERCENTAGE_FIELDS = new Set([
  'item_shopee_commission_rate', 'item_seller_commission_rate', 'mcn_fee_rate', 'rate'
]);

const DATE_FIELDS = new Set([
  'purchase_time', 'complete_time', 'click_time'
]);

const INTEGER_FIELDS = new Set([
  'qty', 'item_id', 'conversion_id'
]);

function normalizeHeader(header: string): string {
  return header
    .replace(/^\uFEFF/, '') // Remove BOM
    .toLowerCase()
    .trim();
}

function detectCSVType(headers: string[]): 'vendas' | 'clicks' | 'unknown' {
  const normalizedHeaders = headers.map(normalizeHeader);
  
  const hasOrderId = normalizedHeaders.some(h => 
    h.includes('pedido') || h.includes('order')
  );
  const hasCommission = normalizedHeaders.some(h => 
    h.includes('comiss') || h.includes('commission')
  );
  
  if (hasOrderId || hasCommission) {
    return 'vendas';
  }
  
  const hasClickTime = normalizedHeaders.some(h => 
    h.includes('clique') || (h.includes('click') && !h.includes('pedido'))
  );
  
  if (hasClickTime) {
    return 'clicks';
  }
  
  return 'unknown';
}

function mapHeader(header: string, type: 'vendas' | 'clicks'): string {
  const headerMap = type === 'vendas' ? VENDAS_HEADER_MAP : CLICKS_HEADER_MAP;
  const normalized = normalizeHeader(header);
  return headerMap[normalized] || header;
}

function parseCSVLine(line: string, delimiter: string): string[] {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++; // Skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

export function parseCSV(content: string): CSVParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    return { type: 'unknown', data: [], headers: [], rowCount: 0 };
  }
  
  // Detect delimiter
  const firstLine = lines[0];
  const delimiter = firstLine.includes(';') ? ';' : ',';
  
  // Parse headers
  const rawHeaders = parseCSVLine(firstLine, delimiter).map(h => 
    h.replace(/"/g, '').replace(/^\uFEFF/, '').trim()
  );
  
  // Detect type
  const type = detectCSVType(rawHeaders);
  
  if (type === 'unknown') {
    return { type: 'unknown', data: [], headers: rawHeaders, rowCount: 0 };
  }
  
  // Map headers to database columns
  const mappedHeaders = rawHeaders.map(h => mapHeader(h, type));
  
  // Parse data rows
  const data: Record<string, unknown>[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    
    const values = parseCSVLine(line, delimiter);
    const row: Record<string, unknown> = {};
    
    mappedHeaders.forEach((dbColumn, index) => {
      const rawValue = values[index]?.replace(/^"|"$/g, '') || '';
      
      if (CURRENCY_FIELDS.has(dbColumn)) {
        row[dbColumn] = parseCurrency(rawValue);
      } else if (PERCENTAGE_FIELDS.has(dbColumn)) {
        row[dbColumn] = parsePercentage(rawValue);
      } else if (DATE_FIELDS.has(dbColumn)) {
        row[dbColumn] = parseDate(rawValue);
      } else if (INTEGER_FIELDS.has(dbColumn)) {
        row[dbColumn] = parseInteger(rawValue);
      } else {
        // String field - null if empty
        row[dbColumn] = rawValue || null;
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
  return !!row.order_id && row.item_id !== null && row.item_id !== undefined;
}

export function validateClickRow(row: Record<string, unknown>): boolean {
  return !!row.click_time;
}
