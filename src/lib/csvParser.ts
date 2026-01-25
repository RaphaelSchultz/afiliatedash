// CSV Parser utilities for Brazilian format (comma as decimal, dot as thousand separator)

export function parseBrazilianNumber(value: string): number {
  if (!value || value.trim() === '') return 0;
  
  // Remove currency symbols and whitespace
  let cleaned = value.replace(/[R$\s]/g, '').trim();
  
  // Check if it's already in international format (dot as decimal)
  // If it has a dot followed by 1-2 digits at the end, treat as decimal
  if (/^\d+\.\d{1,2}$/.test(cleaned) || /^\d+\.\d{1,4}$/.test(cleaned)) {
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }
  
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
  
  // Try ISO format first (2026-01-24 05:57:32)
  const isoMatch = /^(\d{4})-(\d{2})-(\d{2})(?:\s+(\d{2}):(\d{2}):(\d{2}))?$/.exec(dateStr);
  if (isoMatch) {
    const [, year, month, day, hours = '0', minutes = '0', seconds = '0'] = isoMatch;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hours),
      parseInt(minutes),
      parseInt(seconds)
    );
  }
  
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

export function parsePercentage(value: string): number {
  if (!value || value.trim() === '') return 0;
  const cleaned = value.replace('%', '').trim();
  return parseBrazilianNumber(cleaned) / 100;
}

export interface CSVParseResult {
  type: 'vendas' | 'clicks' | 'unknown';
  data: Record<string, unknown>[];
  headers: string[];
  rowCount: number;
}

// Header mappings for different CSV formats - comprehensive Shopee mapping
const VENDAS_HEADER_MAP: Record<string, string> = {
  // Order identification
  'order id': 'order_id',
  'id do pedido': 'order_id',
  'order_id': 'order_id',
  
  // Item identification
  'item id': 'item_id',
  'id do item': 'item_id',
  'item_id': 'item_id',
  
  // Timestamps
  'purchase time': 'purchase_time',
  'data da compra': 'purchase_time',
  'hora da compra': 'purchase_time',
  'horário do pedido': 'purchase_time',
  'horario do pedido': 'purchase_time',
  'tempo de conclusão': 'complete_time',
  'tempo de conclusao': 'complete_time',
  'complete time': 'complete_time',
  'tempo dos cliques': 'click_time',
  'click time': 'click_time',
  
  // Status fields
  'status': 'status',
  'status do pedido': 'order_status',
  'order status': 'order_status',
  'status do item do afiliado': 'conversion_status',
  'affiliate item status': 'conversion_status',
  'status do comprador': 'buyer_type',
  'buyer type': 'buyer_type',
  
  // Checkout & Payment
  'id do pagamento': 'checkout_id',
  'checkout id': 'checkout_id',
  'payment id': 'checkout_id',
  
  // Shop information
  'shop name': 'shop_name',
  'nome da loja': 'shop_name',
  'loja': 'shop_name',
  'shop id': 'shop_id',
  'id da loja': 'shop_id',
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
  
  // Categories
  'categoria global l1': 'category_l1',
  'category l1': 'category_l1',
  'categoria global l2': 'category_l2',
  'category l2': 'category_l2',
  'categoria global l3': 'category_l3',
  'category l3': 'category_l3',
  
  // Pricing and quantity
  'preço(r$)': 'item_price',
  'preco(r$)': 'item_price',
  'price': 'item_price',
  'item price': 'item_price',
  'qtd': 'qty',
  'qty': 'qty',
  'quantity': 'qty',
  
  // Offer and Campaign
  'offer type': 'attribution_type',
  'tipo de atribuição': 'attribution_type',
  'tipo de atribuicao': 'attribution_type',
  'parceiro de campanha': 'campaign_partner_name',
  'campaign partner': 'campaign_partner_name',
  
  // Amounts
  'valor de compra(r$)': 'actual_amount',
  'actual amount': 'actual_amount',
  'valor real': 'actual_amount',
  'valor gmv': 'actual_amount',
  'gmv': 'actual_amount',
  'valor do reembolso(r$)': 'refund_amount',
  'refund amount': 'refund_amount',
  
  // Commission rates and amounts
  'taxa de comissão shopee do item': 'item_shopee_commission_rate',
  'taxa de comissao shopee do item': 'item_shopee_commission_rate',
  'comissão do item da shopee(r$)': 'shopee_commission',
  'comissao do item da shopee(r$)': 'shopee_commission',
  'shopee commission': 'shopee_commission',
  
  'taxa de comissão do vendedor do item': 'item_seller_commission_rate',
  'taxa de comissao do vendedor do item': 'item_seller_commission_rate',
  'comissão do item da marca(r$)': 'brand_commission',
  'comissao do item da marca(r$)': 'brand_commission',
  'seller commission': 'seller_commission',
  
  'comissão total do item(r$)': 'item_total_commission',
  'comissao total do item(r$)': 'item_total_commission',
  'comissão shopee(r$)': 'shopee_commission',
  'comissao shopee(r$)': 'shopee_commission',
  'comissão do vendedor(r$)': 'seller_commission',
  'comissao do vendedor(r$)': 'seller_commission',
  
  'comissão total do pedido(r$)': 'gross_commission',
  'comissao total do pedido(r$)': 'gross_commission',
  'total commission': 'total_commission',
  'comissão total': 'total_commission',
  'comissao total': 'total_commission',
  
  // MCN/RM (Multi-Channel Network)
  'rm vinculada': 'mcn_name',
  'id de contrato da rm': 'mcn_name',
  'taxa do fee de gestão da rm': 'mcn_fee_rate',
  'taxa do fee de gestao da rm': 'mcn_fee_rate',
  'fee de gestão da rm(r$)': 'mcn_fee',
  'fee de gestao da rm(r$)': 'mcn_fee',
  
  // Affiliate commission
  'taxa de contrato do afiliado': 'rate',
  'affiliate contract rate': 'rate',
  'comissão líquida do afiliado(r$)': 'net_commission',
  'comissao liquida do afiliado(r$)': 'net_commission',
  'net commission': 'net_commission',
  'comissão líquida': 'net_commission',
  'comissao liquida': 'net_commission',
  
  // Notes
  'notas do item': 'item_notes',
  'item notes': 'item_notes',
  
  // Sub IDs
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
  
  // Channel
  'channel': 'channel',
  'canal': 'channel',
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
  'click pv': 'click_pv',
};

function normalizeHeader(header: string): string {
  // Remove BOM and normalize
  return header.replace(/^\uFEFF/, '').toLowerCase().trim();
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

// Fields that should be parsed as numbers
const NUMERIC_FIELDS = [
  'actual_amount', 'net_commission', 'total_commission', 'gross_commission',
  'item_price', 'refund_amount', 'shopee_commission', 'seller_commission',
  'brand_commission', 'item_total_commission', 'mcn_fee', 'qty'
];

// Fields that should be parsed as percentages (decimal)
const PERCENTAGE_FIELDS = [
  'item_shopee_commission_rate', 'item_seller_commission_rate', 'mcn_fee_rate', 'rate'
];

// Fields that should be parsed as dates
const DATE_FIELDS = ['purchase_time', 'click_time', 'complete_time'];

export function parseCSV(content: string): CSVParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim());
  
  if (lines.length < 2) {
    return { type: 'unknown', data: [], headers: [], rowCount: 0 };
  }
  
  // Parse headers (handle both comma and semicolon delimiters)
  const delimiter = lines[0].includes(';') ? ';' : ',';
  const rawHeaders = lines[0].split(delimiter).map(h => h.replace(/"/g, '').replace(/^\uFEFF/, '').trim());
  
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
      if (NUMERIC_FIELDS.includes(header)) {
        row[header] = parseBrazilianNumber(value);
      } else if (PERCENTAGE_FIELDS.includes(header)) {
        row[header] = parsePercentage(value);
      } else if (header === 'item_id') {
        row[header] = parseInt(value) || null;
      } else if (DATE_FIELDS.includes(header)) {
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
