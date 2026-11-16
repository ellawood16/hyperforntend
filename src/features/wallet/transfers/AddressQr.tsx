import { useMemo } from "react";
import QRCode from "@/vendor/qrcode";

export function AddressQr({ address, label }: { address: string; label: string }) {
  const qr = useMemo(() => {
    const encoder = new QRCode(-1, 0); // Auto version, error correction M.
    encoder.addData(address); encoder.make();
    const size = encoder.getModuleCount();
    let path = "";
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      if (encoder.isDark(y, x)) path += `M${x + 4},${y + 4}h1v1h-1z`;
    }
    return { size: size + 8, path }; // Four-module quiet zone on every edge.
  }, [address]);
  return <svg role="img" aria-label={label} viewBox={`0 0 ${qr.size} ${qr.size}`} className="mx-auto w-64 max-w-full" shapeRendering="crispEdges">
    <rect width={qr.size} height={qr.size} fill="var(--color-pure-white)" />
    <path d={qr.path} fill="var(--color-raw-black)" />
  </svg>;
}
