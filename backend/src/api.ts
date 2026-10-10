import http from 'node:http';
import { writeFileSync } from 'node:fs';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  Subcategory, registerCampaign, readState, buildDeployTx, buildSignalTx, buildSeedTx, type SeedData,
  buildRegisterStoreTx, buildAttestReceiptTx, isStoreRegistered, makeReceipt, receiptFromJSON, receiptToJSON,
  getReceiptStatus, type ReceiptJSON, type ReceiptLineInput,
} from './contract.js';
import { generateInsights, matchCampaign, type Campaign } from './agent.js';
import { COUNTER_FIELDS, latestCounters, parseRange, readPeriodStates, trackContractHistory } from './history.js';
import { sponsorAvailable, sponsorConfigured, sponsorTx, takeSponsorQuota } from './sponsor.js';
import type { AegisProviders } from './providers.js';
import type { NetworkConfig } from './config.js';

const NETWORK = process.env['MIDNIGHT_NETWORK'] ?? 'local';
const ADDRESS_FILE = `.contract-address-${NETWORK}`;
// Ver MOCK_CHAIN en contract.ts, aquí solo se usa para no exigir un
// contrato desplegado en las rutas que en modo mock no lo necesitan.
const MOCK_CHAIN = process.env['MOCK_CHAIN'] === 'true';
const TOO_MANY_SPONSORED = 'Too many sponsored transactions from this connection, try again later';

type AppContext = {
  providers: AegisProviders;
  contractAddress: ContractAddress | null;
  networkId: string;
  config: NetworkConfig;
};

const campaigns = new Map<string, Campaign>();
let campaignCounter = 0;

function parseBody(req: http.IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => { body += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(body)); }
      catch { reject(new Error('Invalid JSON')); }
    });
  });
}

function json(res: http.ServerResponse, status: number, data: unknown) {
  const body = JSON.stringify(data);
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(body);
}

async function handleRequest(
  req: http.IncomingMessage,
  res: http.ServerResponse,
  ctx: AppContext,
) {
  const { method, url } = req;

  if (method === 'OPTIONS') {
    res.writeHead(204, { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS' });
    res.end();
    return;
  }

  try {
    // El frontend manda aquí la dirección tras desplegar con la wallet conectada
    if (method === 'POST' && url === '/contract-address') {
      const { address } = await parseBody(req);
      if (!address || typeof address !== 'string') return json(res, 400, { error: 'Missing address' });
      ctx.contractAddress = address as ContractAddress;
      writeFileSync(ADDRESS_FILE, address);
      void trackContractHistory(ctx.config, ctx.contractAddress);
      return json(res, 200, { ok: true });
    }

    // Construye+prueba la tx de despliegue; la wallet la firma y la envía
    if (method === 'GET' && url === '/build-tx/deploy') {
      const result = await buildDeployTx(ctx.providers);
      return json(res, 200, result);
    }

    if (method === 'POST' && url === '/build-tx/seed') {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const body = await parseBody(req);
      const fields: Array<keyof SeedData> = [
        'mobile','tablet','computer','camera','audio','gaming',
        'shoes','tops','bottoms','accessories','outerwear',
        'groceries','restaurant','cafes','fastfood','localshops',
        'equipment','clothing','footwear','supplements',
        'furniture','appliances','decor','tools','other',
      ];
      for (const f of fields) {
        if (typeof body[f] !== 'number' || body[f] < 0 || body[f] > 65535) {
          return json(res, 400, { error: `Invalid value for ${f}: must be 0-65535` });
        }
      }
      const tx = await buildSeedTx(ctx.providers, ctx.contractAddress, body as SeedData);
      return json(res, 200, { tx });
    }

    // ¿Ya está la tienda de demo registrada on-chain? Lo comprueba contra
    // el ledger, sin necesitar wallet, así el frontend no repite el alta
    // en cada recarga (ver diseño de privacidad/backend en la memoria).
    if (method === 'GET' && url === '/store-registered') {
      if (!ctx.contractAddress && !MOCK_CHAIN) return json(res, 200, { registered: false });
      const registered = await isStoreRegistered(ctx.providers, ctx.contractAddress as any);
      return json(res, 200, { registered });
    }

    // El admin da de alta la tienda de demo en el árbol de tiendas registradas.
    // El backend prueba; Lace (conectada en el navegador) balancea, firma y
    // envía. Con MOCK_CHAIN=true no hace falta contrato desplegado (ver contract.ts).
    if (method === 'POST' && url === '/register-store') {
      if (!ctx.contractAddress && !MOCK_CHAIN) return json(res, 400, { error: 'Contract not deployed yet' });
      const tx = await buildRegisterStoreTx(ctx.providers, ctx.contractAddress as any);
      return json(res, 200, { tx });
    }

    // La tienda "vende" y sella el compromiso del recibo on-chain. Igual
    // que arriba, el backend prueba; envía Lace o, si se pide, el sponsor
    // (ver sponsor.ts). Devuelve el recibo
    // completo: quien llama es responsable de convertirlo en QR y de no
    // guardarlo en ningún sitio más, ver el diseño de privacidad.
    if (method === 'POST' && url === '/attest-receipt') {
      if (!ctx.contractAddress && !MOCK_CHAIN) return json(res, 400, { error: 'Contract not deployed yet' });
      const body = await parseBody(req) as { lines?: { subcategory: string; qty: number; amount: number }[]; sponsor?: boolean };
      const sponsor = body.sponsor === true && sponsorConfigured();
      if (sponsor && !takeSponsorQuota(req)) return json(res, 429, { error: TOO_MANY_SPONSORED });
      const rawLines = Array.isArray(body.lines) ? body.lines : [];
      const lines: ReceiptLineInput[] = [];
      for (const l of rawLines) {
        const idx = Subcategory[l.subcategory as keyof typeof Subcategory];
        if (idx === undefined) return json(res, 400, { error: `Invalid subcategory: ${l.subcategory}` });
        if (typeof l.qty !== 'number' || l.qty <= 0) return json(res, 400, { error: 'Invalid qty' });
        if (typeof l.amount !== 'number' || l.amount < 0) return json(res, 400, { error: 'Invalid amount' });
        lines.push({ subcategory: idx as unknown as number, qty: Math.round(l.qty), amount: Math.round(l.amount) });
      }
      if (lines.length === 0) return json(res, 400, { error: 'Empty receipt' });
      const receipt = makeReceipt(lines);
      const { tx, commitmentHex } = await buildAttestReceiptTx(ctx.providers, ctx.contractAddress as any, receipt);
      if (sponsor) {
        const txId = await sponsorTx(tx);
        return json(res, 200, { sponsored: true, txId, receipt: receiptToJSON(receipt), commitmentHex });
      }
      return json(res, 200, { tx, receipt: receiptToJSON(receipt), commitmentHex });
    }

    // El usuario envía como señal un recibo ya sellado (escaneado de un QR).
    if (method === 'POST' && url === '/build-tx/signal') {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const body = await parseBody(req) as { receipt?: ReceiptJSON; sponsor?: boolean };
      if (!body.receipt) return json(res, 400, { error: 'Missing receipt' });
      const sponsor = body.sponsor === true && sponsorConfigured();
      if (sponsor && !takeSponsorQuota(req)) return json(res, 429, { error: TOO_MANY_SPONSORED });
      const { tx, commitmentHex } = await buildSignalTx(ctx.providers, ctx.contractAddress, receiptFromJSON(body.receipt));
      if (sponsor) {
        const txId = await sponsorTx(tx);
        return json(res, 200, { sponsored: true, txId, commitmentHex });
      }
      return json(res, 200, { tx, commitmentHex });
    }

    // ¿Puede el backend pagar las transacciones del usuario? (ver sponsor.ts)
    // El frontend lo consulta al cargar para saber si hace falta wallet.
    if (method === 'GET' && url === '/sponsor-status') {
      return json(res, 200, { available: sponsorAvailable() });
    }

    // Consulta barata (sin probar nada) de si un commitment ya está sellado
    // y/o usado on-chain, según lo que ve el backend por el indexer. El
    // frontend la usa para esperar a que una transacción se confirme antes
    // de dejar lanzar la siguiente, en vez de adivinar un tiempo fijo.
    if (method === 'GET' && url?.startsWith('/receipt-status')) {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const params = new URL(url, 'http://localhost').searchParams;
      const commitmentHex = params.get('commitment');
      if (!commitmentHex) return json(res, 400, { error: 'Missing commitment' });
      const status = await getReceiptStatus(ctx.providers, ctx.contractAddress, commitmentHex);
      return json(res, 200, status);
    }

    if (method === 'POST' && url === '/campaigns') {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const { targetCategory, minSignals, message } = await parseBody(req);
      const id = String(campaignCounter++);
      await registerCampaign(ctx.providers, ctx.contractAddress);
      const campaign: Campaign = { id, targetCategory, minSignals, message };
      campaigns.set(id, campaign);
      return json(res, 201, { id });
    }

    // Contadores públicos del contrato para el frontend. Antes el navegador
    // los leía directamente del indexer, pero el de preprod ahora es de
    // Blockfrost y pide un token que no debe acabar en el navegador (quien
    // lo copiara gastaría nuestra cuota), así que la lectura pasa por aquí.
    if (method === 'GET' && url === '/state') {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      // Desde la memoria de history.ts (al instante y sin bloquear el
      // proceso); solo se pregunta al indexer mientras se carga el historial.
      const state = latestCounters(ctx.contractAddress) ?? await readState(ctx.providers, ctx.contractAddress);
      return json(res, 200, Object.fromEntries(COUNTER_FIELDS.map((k) => [k, state[k].toString()])));
    }

    if (method === 'GET' && url?.startsWith('/insights')) {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const params = new URL(url, 'http://localhost').searchParams;
      const storeProfile = params.get('store') ?? undefined;
      const lang = params.get('lang') ?? 'en';
      const period = await readPeriodStates(ctx.config, ctx.contractAddress, parseRange(params.get('range')));
      const insights = await generateInsights(period, storeProfile, lang);
      return json(res, 200, insights);
    }

    if (method === 'GET' && url?.startsWith('/match/')) {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const id = url.split('/')[2];
      const campaign = campaigns.get(id);
      if (!campaign) return json(res, 404, { error: 'Campaign not found' });
      const state = await readState(ctx.providers, ctx.contractAddress);
      const result = await matchCampaign(campaign, state);
      return json(res, 200, result);
    }

    json(res, 404, { error: 'Not found' });
  } catch (err: any) {
    console.error('[DEBUG error]', url, err); // DEBUG temporal
    json(res, 500, { error: err.message });
  }
}

export function createServer(ctx: AppContext, port = 3001): http.Server {
  ctx.contractAddress = ctx.contractAddress ?? null;
  // Empieza a cargar el historial del contrato ya al arrancar, para que el
  // primer informe por periodos no tenga que esperarlo.
  if (ctx.contractAddress) void trackContractHistory(ctx.config, ctx.contractAddress);
  const server = http.createServer((req, res) => {
    // Cuánto tarda cada petición que construye o prueba algo (las POST),
    // para ver en el log dónde se va el tiempo si la app va lenta.
    if (req.method === 'POST') {
      const started = Date.now();
      res.on('finish', () => console.log(`[api] ${req.url} ${res.statusCode} (${((Date.now() - started) / 1000).toFixed(1)}s)`));
    }
    void handleRequest(req, res, ctx);
  });
  server.listen(port, () => {
    console.log(`Aegis API running on http://localhost:${port}`);
  });
  return server;
}
