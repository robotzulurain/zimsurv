import { useEffect, useMemo, useState } from 'react'
import { geoFacilities } from '../api'
import { MapContainer, TileLayer, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'

const card  = { background:"#fff", border:"1px solid #eee", borderRadius:12, padding:16 }
const title = { fontSize:18, fontWeight:600, marginBottom:10 }

function HeatLayer({points, radius=25, blur=15}) {
  const map = useMap()
  useEffect(()=>{
    if (!map || !window.L?.heatLayer) return
    const layer = window.L.heatLayer(points, { radius, blur, maxZoom: 12 })
    layer.addTo(map)
    return ()=> { map.removeLayer(layer) }
  }, [map, points, radius, blur])
  return null
}

export default function Geo({ filters }) {
  const [rows, setRows] = useState([])
  const [err, setErr]   = useState(null)
  const key = useMemo(()=>JSON.stringify(filters||{}), [filters])

  useEffect(()=>{
    let alive = true
    geoFacilities(filters).then(d=>{
      const arr = Array.isArray(d?.rows) ? d.rows : Array.isArray(d) ? d : []
      if (alive) setRows(arr)
    }).catch(e => alive && setErr(String(e.message||e)))
    return ()=>{ alive=false }
  }, [key])

  const points = rows
    .map(r => [Number(r.lat ?? r.latitude), Number(r.lng ?? r.lon ?? r.longitude), Number(r.tests ?? 1)])
    .filter(p => isFinite(p[0]) && isFinite(p[1]))

  return (
    <div style={card}>
      <div style={title}>Geo (heat map)</div>
      {err && <div style={{color:'#b00'}}>Failed: {err}</div>}
      {!points.length ? (
        <div style={{opacity:.7}}>No mappable facilities for current filters.</div>
      ) : (
        <div style={{height:420}}>
          <MapContainer center={[ -17.8292, 31.0522 ]} zoom={6} style={{height:'100%', width:'100%'}}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                       attribution="© OpenStreetMap contributors" />
            <HeatLayer points={points} />
          </MapContainer>
        </div>
      )}
    </div>
  )
}
