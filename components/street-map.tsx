/**
 * Static OpenStreetMap background centred on a point, at whatever scale the
 * caller needs (metres per screen pixel). Fractional zoom levels are drawn by
 * scaling the nearest whole-zoom tiles. No panning; pins sit on top.
 */
const TILE = 256;
const MAX_ZOOM = 19;

type Props = { lat: number; lng: number; metersPerPx: number; width: number; height: number };

export function StreetMap({ lat, lng, metersPerPx, width, height }: Props) {
  // Web Mercator: metres per pixel at zoom z is 156543.03 * cos(lat) / 2^z.
  const z = Math.min(MAX_ZOOM, Math.max(1, Math.log2((156543.03 * Math.cos((lat * Math.PI) / 180)) / metersPerPx)));
  const zi = Math.floor(z);
  const scale = 2 ** (z - zi);
  const n = 2 ** zi;

  // The centre point in world pixels at the whole zoom level.
  const latRad = (lat * Math.PI) / 180;
  const cx = ((lng + 180) / 360) * n * TILE;
  const cy = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n * TILE;

  const halfW = width / 2 / scale;
  const halfH = height / 2 / scale;
  const tiles: { key: string; src: string; left: number; top: number }[] = [];
  for (let ty = Math.floor((cy - halfH) / TILE); ty <= Math.floor((cy + halfH) / TILE); ty++) {
    if (ty < 0 || ty >= n) continue;
    for (let tx = Math.floor((cx - halfW) / TILE); tx <= Math.floor((cx + halfW) / TILE); tx++) {
      const wx = ((tx % n) + n) % n;
      tiles.push({
        key: `${zi}/${tx}/${ty}`,
        src: `https://tile.openstreetmap.org/${zi}/${wx}/${ty}.png`,
        left: width / 2 + (tx * TILE - cx) * scale,
        top: height / 2 + (ty * TILE - cy) * scale,
      });
    }
  }

  return (
    <>
      <div aria-hidden="true" className="absolute inset-0 overflow-hidden bg-map">
        {tiles.map((t) => (
          // Plain <img>: map tiles are already optimised and change with every zoom.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={t.key}
            src={t.src}
            alt=""
            draggable={false}
            className="absolute max-w-none select-none [filter:grayscale(0.8)_sepia(0.2)_contrast(0.9)_brightness(1.04)]"
            style={{ left: t.left, top: t.top, width: TILE * scale + 0.5, height: TILE * scale + 0.5 }}
          />
        ))}
      </div>
      <p className="absolute right-2 bottom-1 z-[2] m-0 rounded bg-surface/85 px-1.5 text-[11px] text-body">
        ©{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className="underline">
          OpenStreetMap
        </a>{" "}
        contributors
      </p>
    </>
  );
}
