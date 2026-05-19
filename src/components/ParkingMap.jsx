import { useState, useCallback } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { MapContainer, TileLayer, Marker, GeoJSON, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import L from 'leaflet'

const HBG_CENTER = [56.046, 12.694]
const ZOOM = 14

const LAYERS = {
  light:     { label: 'Ljus',     url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',   attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>' },
  osm:       { label: 'Gata',     url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' },
  satellite: { label: 'Satellit', url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', attribution: '&copy; Esri' },
  dark:      { label: 'Mörk',     url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/">CARTO</a>' },
}

const LAYER_ICONS = {
  light: <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><circle cx="10" cy="10" r="4" fill="currentColor"/><path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>,
  osm: <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><path d="M3 7l7-4 7 4v9l-7 4-7-4V7z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 3v14M3 7l7 4 7-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/></svg>,
  satellite: <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/><ellipse cx="10" cy="10" rx="4" ry="7" stroke="currentColor" strokeWidth="1.5"/><path d="M3 10h14" stroke="currentColor" strokeWidth="1.5"/></svg>,
  dark: <svg viewBox="0 0 20 20" fill="none" width="20" height="20"><path d="M17 12A7 7 0 1 1 8 3a5 5 0 0 0 9 9z" fill="currentColor"/></svg>,
}

function featureKey(f) {
  if (f.properties?._zone) return `zone-${f.properties.OBJECTID ?? f.properties.Namn}`
  const [lng, lat] = f.geometry.coordinates
  return `${lat},${lng}`
}

function polygonCentroid(coords) {
  const ring = coords[0]
  let lat = 0, lng = 0
  for (const [x, y] of ring) { lng += x; lat += y }
  return [lat / ring.length, lng / ring.length]
}

const PRICE_COLORS = {
  light: { '5': '#2a9d5c', '10': '#e8a020', '15': '#e07020', '20': '#c0392b', '30': '#7b1fa2', 'fri': '#0097a7', 'gr_oreg': '#888888', default: '#0f4c75' },
  dark:  { '5': '#4ade80', '10': '#fbbf24', '15': '#fb923c', '20': '#f87171', '30': '#ce93d8', 'fri': '#4dd0e1', 'gr_oreg': '#aaaaaa', default: '#4fc3f7' },
}

function getPriceColor(price, dark) {
  const palette = dark ? PRICE_COLORS.dark : PRICE_COLORS.light
  return palette[String(price)] ?? palette.default
}

function createPinIcon(isSelected, dark, price) {
  const fill = isSelected ? '#e63946' : getPriceColor(price, dark)
  return L.divIcon({
    className: '',
    html: `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.163 0 0 7.163 0 16c0 10 16 24 16 24S32 26 32 16C32 7.163 24.837 0 16 0z" fill="${fill}" stroke="white" stroke-width="1.5"/>
      <text x="16" y="21" font-family="Arial,sans-serif" font-size="14" font-weight="bold" fill="white" text-anchor="middle">P</text>
    </svg>`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  })
}


function MouseCoords({ dark }) {
  const [pos, setPos] = useState(null)
  const [copied, setCopied] = useState(false)

  useMapEvents({
    mousemove: e => setPos(e.latlng),
    mouseout:  () => setPos(null),
  })

  if (!pos) return null

  const text = `${pos.lat.toFixed(6)}, ${pos.lng.toFixed(6)}`

  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div
      onClick={copy}
      title="Klicka för att kopiera"
      style={{
        position: 'absolute', bottom: 28, left: '50%', transform: 'translateX(-50%)',
        zIndex: 800,
        background: dark ? 'rgba(20,20,20,0.82)' : 'rgba(255,255,255,0.88)',
        color: dark ? '#e0e0e0' : '#333',
        borderRadius: 8, padding: '5px 12px',
        fontSize: 12, fontFamily: 'monospace', fontWeight: 600,
        boxShadow: '0 2px 8px rgba(0,0,0,0.18)',
        cursor: 'copy', userSelect: 'none', whiteSpace: 'nowrap',
      }}
    >
      {copied ? 'Kopierat!' : text}
    </div>
  )
}

const BTN = {
  width: 44, height: 44,
  borderRadius: 12,
  border: 'none',
  background: '#fff',
  boxShadow: '0 2px 12px rgba(0,0,0,0.22)',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  color: '#333',
  WebkitTapHighlightColor: 'transparent',
}

function MapButtons({ activeLayer, layerOpen, onLayerToggle }) {
  const map = useMap()

  const handleGps = useCallback(() => {
    if (!navigator.geolocation) return
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => map.flyTo([coords.latitude, coords.longitude], 16, { duration: 1.2 }),
      () => {},
      { maximumAge: 30000, timeout: 10000 },
    )
  }, [map])

  return (
    <div style={{ position: 'absolute', bottom: 28, right: 14, zIndex: 800, display: 'flex', flexDirection: 'column', gap: 10 }}>
      <button
        onClick={onLayerToggle}
        style={{ ...BTN, background: layerOpen ? '#0f4c75' : '#fff', color: layerOpen ? '#fff' : '#333' }}
        aria-label="Kartvy"
      >
        {LAYER_ICONS[activeLayer]}
      </button>
      <button onClick={handleGps} style={BTN} aria-label="Hitta min position">
        <svg viewBox="0 0 20 20" fill="none" width="20" height="20">
          <circle cx="10" cy="10" r="3" fill="currentColor"/>
          <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M10 1v3M10 16v3M1 10h3M16 10h3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  )
}

function LayerSheet({ activeLayer, onChange, onClose }) {
  return (
    <>
      <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 900 }} />
      <div style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 1000,
        background: '#fff', borderRadius: '20px 20px 0 0',
        padding: '12px 20px 44px',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.15)',
        animation: 'slideUp 0.25s ease-out',
      }}>
        <div style={{ width: 40, height: 4, background: '#ddd', borderRadius: 2, margin: '0 auto 20px' }} />
        <p style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#999', marginBottom: 14 }}>Kartvy</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {Object.entries(LAYERS).map(([id, layer]) => (
            <button
              key={id}
              onClick={() => onChange(id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 16px', borderRadius: 14,
                border: '2px solid',
                borderColor: activeLayer === id ? '#0f4c75' : '#e8e8e8',
                background: activeLayer === id ? '#e8f0fe' : '#fafafa',
                color: activeLayer === id ? '#0f4c75' : '#333',
                cursor: 'pointer', fontSize: 15, fontWeight: activeLayer === id ? 700 : 400,
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {LAYER_ICONS[id]}
              {layer.label}
            </button>
          ))}
        </div>
      </div>
    </>
  )
}

function makeZoneStyle(dark) {
  return feature => {
    const price = feature.properties?.Taxa_avgbeltid
    const color = getPriceColor(price, dark)
    return { fillColor: color, fillOpacity: 0.55, color, weight: 0, opacity: 0 }
  }
}

function zoneToFeature(zone) {
  const p = zone.properties
  return {
    ...zone,
    properties: {
      Namn: p.Omradesnamn,
      Taxa_avgbeltid: p.Taxa_avgbeltid,
      Avgbeltid_vardag: p.Avgbeltid_vardag,
      Avgbeltid_vard_helg: p.Avgbeltid_vard_helg,
      Avgbeltid_helg: p.Avgbeltid_helg,
      Tid_avgbeltid: p.Tid_avgbeltid,
      OBJECTID: p.OBJECTID,
      _zone: true,
    },
  }
}

export default function ParkingMap({ features, extraFeatures = [], zones, onSelect, selected }) {
  const [activeLayer, setActiveLayer] = useLocalStorage('park-hbg:layer', 'light')
  const [layerOpen, setLayerOpen] = useState(false)
  const selectedKey = selected ? featureKey(selected) : null
  const layer = LAYERS[activeLayer]

  const handleLayerChange = (id) => {
    setActiveLayer(id)
    setLayerOpen(false)
  }

  const onEachZone = useCallback((feature, layer) => {
    layer.on('click', () => onSelect(zoneToFeature(feature)))
  }, [onSelect])

  return (
    <MapContainer center={HBG_CENTER} zoom={ZOOM} style={{ height: '100%', width: '100%' }} zoomControl={false}>
      <TileLayer key={activeLayer} url={layer.url} attribution={layer.attribution} maxZoom={19} />
      {zones.length > 0 && (
        <GeoJSON
          key={`${zones.length}-${activeLayer}`}
          data={{ type: 'FeatureCollection', features: zones.filter(f => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon') }}
          style={makeZoneStyle(activeLayer === 'dark')}
          onEachFeature={onEachZone}
        />
      )}
      <MarkerClusterGroup chunkedLoading showCoverageOnHover={false} maxClusterRadius={50} disableClusteringAtZoom={19}>
        {features.map(feature => {
          const [lng, lat] = feature.geometry.coordinates
          const key = featureKey(feature)
          const price = feature.properties?.Taxa_avgbeltid
          return (
            <Marker
              key={key}
              position={[lat, lng]}
              icon={createPinIcon(key === selectedKey, activeLayer === 'dark', price)}
              eventHandlers={{ click: () => onSelect(feature) }}
            />
          )
        })}
        {extraFeatures.map(feature => {
          const [lng, lat] = feature.geometry.coordinates
          const key = featureKey(feature)
          const price = feature.properties?.Taxa_avgbeltid
          return (
            <Marker
              key={`extra-${key}`}
              position={[lat, lng]}
              icon={createPinIcon(key === selectedKey, activeLayer === 'dark', price)}
              eventHandlers={{ click: () => onSelect(feature) }}
            />
          )
        })}
        {zones.filter(f => f.geometry?.type === 'Polygon' || f.geometry?.type === 'MultiPolygon').filter(zone => {
          const coords = zone.geometry.type === 'Polygon' ? zone.geometry.coordinates : zone.geometry.coordinates[0]
          const [zlat, zlng] = polygonCentroid(coords)
          return !features.some(f => {
            const [flng, flat] = f.geometry.coordinates
            const dlat = (flat - zlat) * 111320
            const dlng = (flng - zlng) * 111320 * Math.cos(zlat * Math.PI / 180)
            return Math.sqrt(dlat * dlat + dlng * dlng) < 80
          })
        }).map(zone => {
          const coords = zone.geometry.type === 'Polygon' ? zone.geometry.coordinates : zone.geometry.coordinates[0]
          const [lat, lng] = polygonCentroid(coords)
          const zf = zoneToFeature(zone)
          const key = featureKey(zf)
          const price = zone.properties?.Taxa_avgbeltid
          return (
            <Marker
              key={key}
              position={[lat, lng]}
              icon={createPinIcon(key === selectedKey, activeLayer === 'dark', price)}
              eventHandlers={{ click: () => onSelect(zf) }}
            />
          )
        })}
      </MarkerClusterGroup>
      <MouseCoords dark={activeLayer === 'dark'} />
      <MapButtons activeLayer={activeLayer} layerOpen={layerOpen} onLayerToggle={() => setLayerOpen(o => !o)} />
      {layerOpen && <LayerSheet activeLayer={activeLayer} onChange={handleLayerChange} onClose={() => setLayerOpen(false)} />}
    </MapContainer>
  )
}
