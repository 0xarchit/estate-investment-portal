export function MapEmbed({
  geo,
  address,
}: {
  geo?: { lat: number; lng: number };
  address?: string;
}) {
  if (!geo || !Number.isFinite(geo.lat) || !Number.isFinite(geo.lng))
    return (
      <div className="panel text-sm text-muted-foreground">
        {address ?? "Location"}
        <p className="mt-2">
          Map coordinates are not available for this property.
        </p>
      </div>
    );
  const { lat, lng } = geo;
  const bbox = [lng - 0.015, lat - 0.01, lng + 0.015, lat + 0.01].join(",");
  return (
    <div className="rounded-xl overflow-hidden border">
      <iframe
        title={`Location of ${address ?? "property"}`}
        className="w-full h-72"
        loading="lazy"
        referrerPolicy="no-referrer"
        src={`https://www.openstreetmap.org/export/embed.html?bbox=${encodeURIComponent(bbox)}&layer=mapnik&marker=${lat}%2C${lng}`}
      />
      <p className="p-3 bg-white text-sm text-muted-foreground">{address}</p>
    </div>
  );
}
