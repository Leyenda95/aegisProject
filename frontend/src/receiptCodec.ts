import type { ReceiptJSON } from './lace.ts';

// El recibo que viaja en el QR puede crecer bastante (una linea por producto
// distinto, con nombre y precio). Para que el QR no se vuelva ilegible se
// codifica asi: se reestructura a arrays posicionales (sin claves repetidas),
// se comprime con deflate-raw (nativo del navegador, sin dependencias) y se
// pasa a base64. El prefijo marca formato y version.
//
// Formato compacto v1: [timestamp, nonce, lines, items]
//   lines: [[subcategory, qty, amount], ...]
//   items: [[name, qty, unitCents], ...]   (puede ir vacio)

const PREFIX = 'AEG1:';

type CompactLine = [number, number, string];
type CompactItem = [string, number, number];
type Compact = [string, string, CompactLine[], CompactItem[]];

function toCompact(r: ReceiptJSON): Compact {
  return [
    r.timestamp,
    r.nonce,
    r.lines.map((l): CompactLine => [l.subcategory, l.qty, l.amount]),
    (r.items ?? []).map((i): CompactItem => [i.name, i.qty, i.unitCents]),
  ];
}

function fromCompact(c: Compact): ReceiptJSON {
  const [timestamp, nonce, lines, items] = c;
  const receipt: ReceiptJSON = {
    timestamp,
    nonce,
    lines: lines.map(([subcategory, qty, amount]) => ({ subcategory, qty, amount })),
  };
  if (items && items.length > 0) {
    receipt.items = items.map(([name, qty, unitCents]) => ({ name, qty, unitCents }));
  }
  return receipt;
}

function bytesToBase64(bytes: Uint8Array): string {
  let bin = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    bin += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(bin);
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

async function pipe(bytes: Uint8Array, transform: CompressionStream | DecompressionStream): Promise<Uint8Array> {
  const writer = transform.writable.getWriter();
  void writer.write(new Uint8Array(bytes)); // copia respaldada por ArrayBuffer (lo que espera la API)
  void writer.close();

  const reader = transform.readable.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) { chunks.push(value as Uint8Array); total += (value as Uint8Array).length; }
  }

  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) { out.set(chunk, offset); offset += chunk.length; }
  return out;
}

/** ReceiptJSON -> texto para el QR (compacto + deflate + base64). */
export async function encodeReceiptForQr(receipt: ReceiptJSON): Promise<string> {
  const json = JSON.stringify(toCompact(receipt));
  const deflated = await pipe(new TextEncoder().encode(json), new CompressionStream('deflate-raw'));
  return PREFIX + bytesToBase64(deflated);
}

/** Texto del QR -> ReceiptJSON. Acepta el formato comprimido y, por tolerancia, JSON plano. */
export async function decodeReceiptFromQr(data: string): Promise<ReceiptJSON> {
  const trimmed = data.trim();
  if (trimmed.startsWith(PREFIX)) {
    const inflated = await pipe(base64ToBytes(trimmed.slice(PREFIX.length)), new DecompressionStream('deflate-raw'));
    return fromCompact(JSON.parse(new TextDecoder().decode(inflated)) as Compact);
  }
  return JSON.parse(trimmed) as ReceiptJSON;
}
