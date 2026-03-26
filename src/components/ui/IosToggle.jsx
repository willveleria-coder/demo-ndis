export default function IosToggle({ checked, onChange, color = 'green', size = 'default' }) {
  const colorClass = {
    green: 'active',
    teal: 'active active-teal',
    pink: 'active active-pink',
    blue: 'active active-blue',
    amber: 'active active-amber',
    emerald: 'active active-emerald',
  }

  const activeClass = checked ? (colorClass[color] || 'active') : ''
  const sizeClass = size === 'sm' ? 'ios-toggle-sm' : ''

  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`ios-toggle ${sizeClass} ${activeClass}`}
    >
      <div className="ios-toggle-knob" />
    </button>
  )
}