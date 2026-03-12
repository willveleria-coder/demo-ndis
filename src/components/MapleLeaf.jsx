const LOGO_URL = 'https://ojobajaedarprixqecxr.supabase.co/storage/v1/object/public/documents/logo.png'

const MapleLeaf = ({ size = 20, className = '' }) => (
  <img
    src={LOGO_URL}
    alt="MCS"
    width={size}
    height={size}
    className={`object-contain ${className}`}
    style={{ width: size, height: size }}
    onError={e => { e.target.style.display = 'none' }}
  />
)

export default MapleLeaf