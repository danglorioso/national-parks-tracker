import L from 'leaflet';

// Only run on client side
if (typeof window !== 'undefined') {
  // Delete private _getIconUrl method to fix Leaflet icon path issues
  // _getIconUrl is a private property not in TypeScript definitions, so we use type assertion
  const prototype = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown };
  delete prototype._getIconUrl;

  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  });
}