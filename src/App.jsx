import { useState, useEffect, useMemo } from 'react'
import ParkingMap from './components/ParkingMap'
import ParkingSheet from './components/ParkingSheet'
import SearchBar from './components/SearchBar'
import FilterSheet from './components/FilterSheet'
import LoadingScreen from './components/LoadingScreen'
import { useLocalStorage } from './hooks/useLocalStorage'

const DEFAULT_FILTERS = { prices: [], apps: [] }

export default function App() {
  const [allFeatures, setAllFeatures] = useState([])
  const [selected, setSelected] = useState(null)
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useLocalStorage('park-hbg:filters', DEFAULT_FILTERS)
  const [filterOpen, setFilterOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/parking')
      .then(r => { if (!r.ok) throw new Error(); return r.json() })
      .catch(() => fetch('/parkeringsautomater.geojson').then(r => r.json()))
      .then(data => {
        setAllFeatures(data.features.filter(f => f.properties.Status === 'aktiv'))
        setLoading(false)
      })
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

  const activeFilterCount = filters.prices.length + filters.apps.length

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
      <ParkingMap features={filteredFeatures} onSelect={handleSelect} selected={selected} />
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
