// Filtering and extraction regex rules

export const isTransactionSms = (text) => {
  const lowerText = text.toLowerCase();
  
  // Reject
  if (
    lowerText.includes('otp') ||
    lowerText.includes('verification') ||
    lowerText.includes('code is')
  ) {
    return false;
  }

  // Accept keywords
  const keywords = ['debited', 'credited', 'upi', 'paid', 'spent', 'received', 'txn'];
  return keywords.some(kw => lowerText.includes(kw));
};

export const extractTransactionData = (text) => {
  const lowerText = text.toLowerCase();

  // Type
  const isCredit = /(credited|received|refund)/.test(lowerText) && !/(debited|spent|paid)/.test(lowerText);
  const type = isCredit ? 'credit' : 'debit';

  // Amount
  const amtMatch = lowerText.match(/(?:rs\.?|inr|₹)\s*([\d,]+\.?\d*)/);
  const amount = amtMatch ? parseFloat(amtMatch[1].replace(/,/g, '')) : null;

  // Merchant
  let merchant = 'Unknown';
  const toMatch = lowerText.match(/to\s+([a-z0-9\s@\.]+?)(?:\s+(?:on|via|ref|upi|from|$))/i);
  const atMatch = lowerText.match(/at\s+([a-z0-9\s@\.]+?)(?:\s+(?:on|via|ref|upi|from|$))/i);
  const fromMatch = lowerText.match(/from\s+([a-z0-9\s@\.]+?)(?:\s+(?:on|via|ref|upi|to|$))/i);

  if (toMatch && toMatch[1]) merchant = toMatch[1].trim();
  else if (atMatch && atMatch[1]) merchant = atMatch[1].trim();
  else if (fromMatch && fromMatch[1]) merchant = fromMatch[1].trim();
  
  // Clean UPI strings common in India
  merchant = merchant.split(' a/c')[0].replace(/vpa\s*/g, '').trim();
  // Capitalize properly
  merchant = merchant.charAt(0).toUpperCase() + merchant.slice(1);

  return { type, amount, merchant };
};

export const generateHash = (amount, merchant, dateString) => {
  const raw = `${amount}-${merchant}-${dateString}`.toLowerCase().replace(/\s/g, '');
  let hash = 0;
  for (let i = 0; i < raw.length; i++) hash = Math.imul(31, hash) + raw.charCodeAt(i) | 0;
  return String(hash);
};
