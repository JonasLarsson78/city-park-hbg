import { useState, useEffect, useMemo } from 'react'
import ParkingMap from './components/ParkingMap'
import ParkingSheet from './components/ParkingSheet'
import SearchBar from './components/SearchBar'
import FilterSheet from './components/FilterSheet'
import LoadingScreen from './components/LoadingScreen'
import { useLocalStorage } from './hooks/useLocalStorage'

const DEFAULT_FILTERS = { prices: [], apps: [], hiddenTypes: [] }

function deduplicateFeatures(features) {
  const kept = []
  for (const f of features) {
    const [lng, lat] = f.geometry.coordinates
    const name = f.properties.Namn
    const price = f.properties.Taxa_avgbeltid
    const isDupe = kept.some(k => {
      if (k.properties.Namn !== name || k.properties.Taxa_avgbeltid !== price) return false
      const [klng, klat] = k.geometry.coordinates
      const dlat = Math.abs(lat - klat) * 111320
      const dlng = Math.abs(lng - klng) * 111320 * Math.cos(lat * Math.PI / 180)
      return Math.sqrt(dlat * dlat + dlng * dlng) < 50
    })
    if (!isDupe) kept.push(f)
  }
  return kept
}

export default function App() {
  const [allFeatures, setAllFeatures] = useState([])
  const [extraFeatures, setExtraFeatures] = useState([])
  const [zones, setZones] = useState([])
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [rawFilters, setFilters] = useLocalStorage('park-hbg:filters', DEFAULT_FILTERS)
  const filters = { ...DEFAULT_FILTERS, ...rawFilters }
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const spotsPromise = fetch('/api/parking')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .catch(() => fetch('/parkeringsautomater.geojson').then(r => r.json()))
      .then(async data => {
        const active = deduplicateFeatures(data.features.filter(f => f.properties.Status === 'aktiv'))
        const custom = await fetch('/egna-parkeringar.json').then(r => r.json()).catch(() => [])
        const customFeatures = custom.map(p => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [p.lng, p.lat] },
          properties: {
            Namn: p.namn,
            Taxa_avgbeltid: String(p.pris ?? ''),
            Antal_plats: p.platser ?? null,
            Avgbeltid_vardag: p.tider_vardag ?? null,
            Avgbeltid_helg: p.tider_helg ?? null,
            Tele_P_nr: p.telep ?? null,
            EasyPark_nr: p.easypark ?? null,
            Kom_ext: p.kommentar ?? null,
            Status: 'aktiv',
            _custom: true,
          },
        }))
        setAllFeatures([...active, ...customFeatures])
      })

    const zonesPromise = Promise.all([
      fetch('/parkeringszoner.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/ignorera-parkeringar.json').then(r => { if (!r.ok) throw new Error(); return r.json() }).catch(() => ({ objectids: [], namn: [] })),
    ]).then(([data, ignore]) => {
      const ignoredIds = new Set(ignore.objectids)
      const ignoredNames = new Set(ignore.namn)
      const filtered = data.features?.filter(f =>
        !ignoredIds.has(f.properties.OBJECTID) &&
        !ignoredNames.has(f.properties.Omradesnamn)
      ) ?? []
      setZones(filtered)
    }).catch(() => {})

    const extraPromise = Promise.all([
      fetch('/storr-parkeringar-stad.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/storr-parkeringar-privat.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/park-and-ride.geojson').then(r => r.json()).catch(() => ({ features: [] })),
      fetch('/ignorera-parkeringar.json').then(r => { if (!r.ok) throw new Error(); return r.json() }).catch(() => ({ objectids: [], namn: [] })),
    ]).then(([stad, priv, pr, ignore]) => {
      const ignoredIds = new Set(ignore.objectids)
      const ignoredNames = new Set(ignore.namn)
      const isIgnored = f =>
        ignoredIds.has(f.properties.OBJECTID) ||
        ignoredNames.has(f.properties.Namn)
      const toFeature = (f, type) => ({
        ...f,
        properties: {
          Namn: f.properties.Namn,
          Antal_plats: f.properties.Antal_plats ?? null,
          Kom_ext: f.properties.Kom_ext ?? null,
          Parkeringsplatstyp: f.properties.Parkeringsplatstyp ?? null,
          Taxa_avgbeltid: type === 'pr' ? 'fri' : null,
          Status: 'aktiv',
          _type: type,
        },
      })
      setExtraFeatures([
        ...stad.features.filter(f => f.properties.Status === 'oppen' && !isIgnored(f)).map(f => toFeature(f, 'stad')),
        ...priv.features.filter(f => f.properties.Status === 'oppen' && !isIgnored(f)).map(f => toFeature(f, 'priv')),
        ...pr.features.filter(f => f.properties.Status === 'oppen' && !isIgnored(f)).map(f => toFeature(f, 'pr')),
      ])
    })

    Promise.all([spotsPromise, zonesPromise, extraPromise])
      .then(() => setLoading(false))
      .catch(e => { setError(e.message); setLoading(false) })
  }, [])

  const filteredFeatures = useMemo(() => {
    let result = allFeatures

    if (query.trim()) {
      const q = query.trim().toLowerCase()
      result = result.filter(f => f.properties.Namn?.toLowerCase().includes(q))
    }

    if (filters.prices.length > 0) {
      result = result.filter(f => filters.prices.includes(f.properties.Taxa_avgbeltid))
    }

    if (filters.apps.length > 0) {
      result = result.filter(f => {
        const hasTeleP = !!f.properties.Tele_P_nr
        const hasEasyPark = !!f.properties.EasyPark_nr
        return filters.apps.some(app =>
          app === 'telep' ? hasTeleP : hasEasyPark
        )
      })
    }

    return result
  }, [allFeatures, query, filters])

  const filteredExtras = useMemo(() =>
    extraFeatures.filter(f => !filters.hiddenTypes.includes(f.properties._type))
  , [extraFeatures, filters.hiddenTypes])

  const activeFilterCount = filters.prices.length + filters.apps.length + filters.hiddenTypes.length

  const handleSelect = feature => {
    setSelected(feature)
    setQuery('')
  }

  if (loading) return <LoadingScreen />
  if (error) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', padding: '2rem', textAlign: 'center', color: '#555' }}>
      <p>Kunde inte ladda parkeringsdata.</p>
    </div>
  )

  return (
    <div style={{ height: '100%', position: 'relative' }}>
      <ParkingMap features={filteredFeatures} extraFeatures={filteredExtras} zones={zones} onSelect={handleSelect} selected={selected} />
      <SearchBar
        value={query}
        onChange={setQuery}
        onFilterOpen={() => setFilterOpen(true)}
        activeFilterCount={activeFilterCount}
        resultCount={filteredFeatures.length}
        total={allFeatures.length}
      />
      {filterOpen && (
        <FilterSheet
          filters={filters}
          onChange={setFilters}
          onClose={() => setFilterOpen(false)}
          totalVisible={filteredFeatures.length}
          total={allFeatures.length}
        />
      )}
      <ParkingSheet feature={selected} onClose={() => setSelected(null)} />
    </div>
  )
}
