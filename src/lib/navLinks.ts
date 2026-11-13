export interface NavLink {
  to: string
  label: string
  icon: string
  blurb: string
}

export const ENDPOINT_LINKS: NavLink[] = [
  { to: '/position', label: 'Position', icon: 'crosshairs-gps', blurb: 'One body, full detail' },
  { to: '/positions', label: 'Positions', icon: 'map-marker-multiple', blurb: 'Several bodies at once' },
  { to: '/progress', label: 'Progress', icon: 'chart-timeline-variant', blurb: 'A series over time' },
  { to: '/ascendant', label: 'Ascendant', icon: 'arrow-up-bold-circle-outline', blurb: 'The rising degree' },
  { to: '/angles', label: 'Angles', icon: 'angle-acute', blurb: 'Asc, MC and the rest' },
  { to: '/houses', label: 'Houses', icon: 'view-dashboard-outline', blurb: 'Cusps, any system' },
  { to: '/ayanamsha', label: 'Ayanamsha', icon: 'orbit-variant', blurb: 'Sidereal offsets' },
  { to: '/rise-set', label: 'Rise / Set', icon: 'weather-sunset-up', blurb: 'Rise, set, transit' },
  { to: '/stations', label: 'Stations', icon: 'swap-vertical-bold', blurb: 'Retrograde turning points' },
  { to: '/moon-phases', label: 'Moon Phases', icon: 'moon-waning-crescent', blurb: 'New, full and between' },
  { to: '/indian-day', label: 'Indian Day', icon: 'white-balance-sunny', blurb: 'Ghati / vighati units' },
  { to: '/pheno', label: 'Phenomena', icon: 'telescope', blurb: 'Phase, magnitude, size' },
  { to: '/aspects', label: 'Aspects', icon: 'vector-triangle', blurb: 'Angles between bodies' },
  { to: '/bodies', label: 'Bodies', icon: 'earth', blurb: 'What this server knows' },
  { to: '/stars', label: 'Stars', icon: 'star-four-points-outline', blurb: 'Named fixed stars' },
]

export const ALL_LINKS: NavLink[] = [
  { to: '/', label: 'Home', icon: 'home-outline', blurb: 'Overview' },
  ...ENDPOINT_LINKS,
  { to: '/settings', label: 'Settings', icon: 'cog-outline', blurb: 'Preferences' },
]
