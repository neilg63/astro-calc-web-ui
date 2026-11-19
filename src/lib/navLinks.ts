export interface NavLink {
  to: string
  label: string
  icon: string
  blurb: string
}

export const ENDPOINT_LINKS: NavLink[] = [
  { to: '/longitudes', label: 'Longitudes', icon: 'format-list-numbered', blurb: 'Several bodies, longitude only' },
  { to: '/longitude-progress', label: 'Longitude Progress', icon: 'table-column', blurb: 'Longitudes over time, side by side' },
  { to: '/positions', label: 'Positions', icon: 'map-marker-multiple', blurb: 'Several bodies at once' },
  { to: '/extended-positions', label: 'Extended Positions', icon: 'table-large', blurb: 'Ecliptic, equatorial, horizontal' },
  { to: '/progress', label: 'Progress', icon: 'chart-timeline-variant', blurb: 'A series over time' },
  { to: '/ascendant', label: 'Ascendant', icon: 'arrow-up-bold-circle-outline', blurb: 'The rising degree' },
  { to: '/ascendant-progress', label: 'Ascendant Progress', icon: 'chart-bell-curve-cumulative', blurb: 'The rising degree over days' },
  { to: '/angles', label: 'Angles', icon: 'angle-acute', blurb: 'Asc, MC and the rest' },
  { to: '/houses', label: 'Houses', icon: 'view-dashboard-outline', blurb: 'Cusps, any system' },
  { to: '/ayanamsha', label: 'Ayanamsha', icon: 'orbit-variant', blurb: 'Sidereal offsets' },
  { to: '/rise-set', label: 'Rise / Set', icon: 'weather-sunset-up', blurb: 'Rise, set, transit' },
  { to: '/rise-sets', label: 'Rise / Set by Day', icon: 'calendar-range', blurb: 'Day-by-day rise, set, altitude' },
  { to: '/transposed-positions', label: 'Transposed Positions', icon: 'transfer', blurb: 'Historic points in the present sky' },
  { to: '/transposed-transits', label: 'Transposed Transits', icon: 'calendar-arrow-right', blurb: 'Rise and set of historic points' },
  { to: '/stations', label: 'Stations', icon: 'swap-vertical-bold', blurb: 'Retrograde turning points' },
  { to: '/moon-phases', label: 'Moon Phases', icon: 'moon-waning-crescent', blurb: 'New, full and between' },
  { to: '/indian-day', label: 'Indian Day', icon: 'white-balance-sunny', blurb: 'Ghati / vighati units' },
  { to: '/pheno', label: 'Phenomena', icon: 'telescope', blurb: 'Phase, magnitude, size' },
  { to: '/aspects', label: 'Aspects', icon: 'vector-triangle', blurb: 'Angles between bodies' },
  { to: '/bulk', label: 'Bulk', icon: 'database-outline', blurb: 'Charts and aspects for many records' },
  { to: '/bodies', label: 'Bodies', icon: 'earth', blurb: 'What this server knows' },
  { to: '/stars', label: 'Stars', icon: 'star-four-points-outline', blurb: 'Named fixed stars' },
]

export const ALL_LINKS: NavLink[] = [
  { to: '/', label: 'Home', icon: 'home-outline', blurb: 'Overview' },
  ...ENDPOINT_LINKS,
  { to: '/settings', label: 'Settings', icon: 'cog-outline', blurb: 'Preferences' },
]
