const SPECIAL_WORDS = {
  ndis: 'NDIS',
  id: 'ID',
  gps: 'GPS',
  sil: 'SIL',
  sda: 'SDA',
  ndia: 'NDIA',
  abn: 'ABN',
  acn: 'ACN',
  api: 'API',
  url: 'URL',
  csv: 'CSV',
  pdf: 'PDF',
}
 
export function formatLabel(value) {
  if (!value || typeof value !== 'string') return value || ''
  
  return value
    .replace(/_/g, ' ')
    .replace(/\b\w+/g, word => {
      const lower = word.toLowerCase()
      if (SPECIAL_WORDS[lower]) return SPECIAL_WORDS[lower]
      return lower.charAt(0).toUpperCase() + lower.slice(1)
    })
}