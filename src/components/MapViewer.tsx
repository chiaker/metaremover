import { MapContainer, Marker, TileLayer } from 'react-leaflet';

type MapViewerProps = {
  latitude: number;
  longitude: number;
};

export function MapViewer({ latitude, longitude }: MapViewerProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10">
      <MapContainer center={[latitude, longitude]} zoom={13} scrollWheelZoom={false} className="h-64 w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={[latitude, longitude]} />
      </MapContainer>
    </div>
  );
}
