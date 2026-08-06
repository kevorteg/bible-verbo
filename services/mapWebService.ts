import { Platform } from 'react-native';

const MAPTILER_KEY = '';

export const MAPTILER_STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/streets-v2-light/style.json?key=${MAPTILER_KEY}`
  : null;

export function buildLeafletHtml(
  churches: { id: string; name: string; lat: number; lng: number; type: string; address: string }[],
  userLat?: number,
  userLng?: number,
  routeCoords?: [number, number][],
): string {
  const markersJs = JSON.stringify(churches.map(c => ({
    name: c.name,
    lat: c.lat,
    lng: c.lng,
    type: c.type,
    address: c.address,
  })));

  const userJs = userLat !== undefined && userLng !== undefined
    ? `[${userLat}, ${userLng}]`
    : 'null';

  const routeJs = routeCoords && routeCoords.length > 0
    ? JSON.stringify(routeCoords.map(c => [c[1], c[0]]))
    : 'null';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    body { font-family: 'Plus Jakarta Sans', sans-serif; }
    #map { width: 100vw; height: 100vh; }
    .leaflet-tile-pane { filter: saturate(0.3) hue-rotate(200deg) brightness(1.05); }
    .custom-marker {
      width: 36px; height: 36px; border-radius: 10px;
      display: flex; align-items: center; justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      transform: rotate(45deg);
      cursor: pointer;
    }
    .custom-marker span { transform: rotate(-45deg); color: #fff; font-size: 18px; }
    .ipuc-marker { background: #449BD1; }
    .ipuic-marker { background: #F58634; }
    .user-marker {
      width: 20px; height: 20px; border-radius: 50%;
      background: #449BD1; border: 3px solid #fff;
      box-shadow: 0 2px 8px rgba(0,0,0,0.3);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      padding: 4px;
    }
    .leaflet-popup-content { margin: 8px 12px; font-size: 13px; }
    .leaflet-popup-content strong { font-size: 15px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', {
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(map);

    const markers = ${markersJs};
    const bounds = [];
    const icon = L.divIcon({ className: '', html: '<div class="custom-marker ipuc-marker"><span>+</span></div>', iconSize: [36, 36], iconAnchor: [18, 18] });
    const iconIpuic = L.divIcon({ className: '', html: '<div class="custom-marker ipuic-marker"><span>+</span></div>', iconSize: [36, 36], iconAnchor: [18, 18] });

    markers.forEach(function(c) {
      const m = L.marker([c.lat, c.lng], { icon: c.type === 'IPUIC' ? iconIpuic : icon })
        .addTo(map)
        .bindPopup('<strong>' + c.name + '</strong><br/>' + c.address + '<br/><em>' + c.type + '</em>');
      bounds.push([c.lat, c.lng]);
    });

    const userPos = ${userJs};
    if (userPos) {
      L.circleMarker(userPos, {
        radius: 8, color: '#449BD1', fillColor: '#449BD1',
        fillOpacity: 0.8, weight: 3,
      }).addTo(map);
      bounds.push(userPos);
    }

    const routeCoords = ${routeJs};
    if (routeCoords && routeCoords.length > 0) {
      const latlngs = routeCoords.map(function(c) { return [c[0], c[1]]; });
      L.polyline(latlngs, { color: '#449BD1', weight: 4, opacity: 0.8 }).addTo(map);
      latlngs.forEach(function(c) { bounds.push(c); });
    }

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [40, 40] });
    } else {
      map.setView([4.5709, -74.2973], 5);
    }

    document.addEventListener('message', function(e) {
      try {
        const data = JSON.parse(e.data);
        if (data.type === 'markerPress' && data.churchId) {
          const c = markers.find(function(m) { return m.id === data.churchId; });
          if (c) map.flyTo([c.lat, c.lng], 15, { duration: 1 });
        }
      } catch(err) {}
    });
  </script>
</body>
</html>`;
}

export function isWeb(): boolean {
  return Platform.OS === 'web';
}
