# City Parkering HBG

Mobilanpassad webbapp för att hitta parkeringsautomater i Helsingborg.

## Funktioner

- Karta med alla aktiva parkeringsautomater
- Klustring av pins vid utzoomning
- Detaljinfo per automat (avgiftstider, taxa, TeleP- och EasyPark-nummer)
- Filter på pris och betalapp
- Sök på gatunamn
- Fyra kartvyer: Ljus, Gata, Satellit, Mörk
- GPS-knapp för att centrera på din position
- Filter och kartvy sparas mellan sessioner

## Data

Datakälla: [Helsingborg Open Data](https://oppnadata.helsingborg.se/sbf/transport/parkeringsautomater/parkeringsautomater.geojson)

Appen försöker hämta live-data vid start. Om det misslyckas används den lokala kopian i `public/parkeringsautomater.geojson`.

## Kom igång

```bash
npm install
npm run dev
```

Öppna [http://localhost:5173](http://localhost:5173).

## Bygg för produktion

```bash
npm run build
npm run preview
```

## Tech

- [Vite](https://vitejs.dev/) + [React](https://react.dev/)
- [Leaflet](https://leafletjs.com/) + [react-leaflet](https://react-leaflet.js.org/)
- [react-leaflet-cluster](https://github.com/Akursat/react-leaflet-cluster)
- Kartunderlag: CartoDB, OpenStreetMap, Esri
