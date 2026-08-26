import http from 'node:http';
import { writeFileSync } from 'node:fs';
import type { ContractAddress } from '@midnight-ntwrk/compact-runtime';
import {
  Subcategory, registerCampaign, readState, buildDeployTx, buildSignalTx, buildSeedTx, type SeedData,
  buildRegisterStoreTx, buildAttestReceiptTx, makeReceipt, receiptFromJSON, receiptToJSON, type ReceiptJSON,
} from './contract.js';
import { generateInsights, matchCampaign, type Campaign } from './agent.js';
import type { AegisProviders } from './providers.js';

const NETWORK = process.env['MIDNIGHT_NETWORK'] ?? 'local';
const ADDRESS_FILE = `.contract-address-${NETWORK}`;

type AppContext = {
  providers: AegisProviders;
  contractAddress: ContractAddress | null;
  networkId: string;
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
    if (method === 'GET' && url === '/network') {
      return json(res, 200, { networkId: ctx.networkId });
    }

    if (method === 'GET' && url === '/contract-address') {
      return json(res, 200, { address: ctx.contractAddress ?? null });
    }

    // El frontend manda aquí la dirección tras desplegar con la wallet conectada
    if (method === 'POST' && url === '/contract-address') {
      const { address } = await parseBody(req);
      if (!address || typeof address !== 'string') return json(res, 400, { error: 'Missing address' });
      ctx.contractAddress = address as ContractAddress;
      writeFileSync(ADDRESS_FILE, address);
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
        'groceries','restaurant','drinks','snacks',
        'equipment','clothing','footwear','supplements',
        'furniture','appliances','decor','tools','other',
      ];
      for (const f of fields) {
        if (typeof body[f] !== 'number' || body[f] < 0 || body[f] > 65535) {
          return json(res, 400, { error: `Invalid value for ${f}: must be 0–65535` });
        }
      }
      const tx = await buildSeedTx(ctx.providers, ctx.contractAddress, body as SeedData);
      return json(res, 200, { tx });
    }

    // El admin da de alta la tienda de demo en el árbol de tiendas registradas.
    // Solo hace falta llamarlo una vez por contrato desplegado.
    if (method === 'GET' && url === '/build-tx/register-store') {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const tx = await buildRegisterStoreTx(ctx.providers, ctx.contractAddress);
      return json(res, 200, { tx });
    }

    // La tienda "vende" y sella el compromiso del recibo on-chain. Devuelve
    // el recibo completo: quien llama es responsable de convertirlo en QR y
    // de no guardarlo en ningún sitio más — ver el diseño de privacidad.
    if (method === 'POST' && url === '/build-tx/attest-receipt') {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const { subcategory, amount } = await parseBody(req);
      const subcat = Subcategory[subcategory as keyof typeof Subcategory];
      if (subcat === undefined) return json(res, 400, { error: 'Invalid subcategory' });
      if (typeof amount !== 'number' || amount < 0) return json(res, 400, { error: 'Invalid amount' });
      const receipt = makeReceipt(subcat, BigInt(amount));
      const tx = await buildAttestReceiptTx(ctx.providers, ctx.contractAddress, receipt);
      return json(res, 200, { tx, receipt: receiptToJSON(receipt) });
    }

    // El usuario envía como señal un recibo ya sellado (escaneado de un QR).
    if (method === 'POST' && url === '/build-tx/signal') {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const { receipt } = await parseBody(req) as { receipt: ReceiptJSON };
      if (!receipt) return json(res, 400, { error: 'Missing receipt' });
      const tx = await buildSignalTx(ctx.providers, ctx.contractAddress, receiptFromJSON(receipt));
      return json(res, 200, { tx });
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

    if (method === 'GET' && url?.startsWith('/insights')) {
      if (!ctx.contractAddress) return json(res, 400, { error: 'Contract not deployed yet' });
      const params = new URL(url, 'http://localhost').searchParams;
      const storeProfile = params.get('store') ?? undefined;
      const lang = params.get('lang') ?? 'en';
      const state = await readState(ctx.providers, ctx.contractAddress);
      const insights = await generateInsights(state, storeProfile, lang);
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

    if (method === 'GET' && url === '/state') {
      const zero = () => '0';
      if (!ctx.contractAddress) return json(res, 200, {
        signalsElectronics: zero(), signalsFashion: zero(), signalsFood: zero(),
        signalsSports: zero(), signalsHome: zero(), signalsOther: zero(),
        signalsMobile: zero(), signalsTablet: zero(), signalsComputer: zero(),
        signalsCamera: zero(), signalsAudio: zero(), signalsGaming: zero(),
        signalsShoes: zero(), signalsTops: zero(), signalsBottoms: zero(),
        signalsAccessories: zero(), signalsOuterwear: zero(),
        signalsGroceries: zero(), signalsRestaurant: zero(), signalsDrinks: zero(), signalsSnacks: zero(),
        signalsEquipment: zero(), signalsClothing: zero(), signalsFootwear: zero(), signalsSupplements: zero(),
        signalsFurniture: zero(), signalsAppliances: zero(), signalsDecor: zero(), signalsTools: zero(),
        totalSignals: zero(), campaignCount: zero(),
      });
      const s = await readState(ctx.providers, ctx.contractAddress);
      return json(res, 200, {
        signalsElectronics: s.signalsElectronics.toString(),
        signalsFashion: s.signalsFashion.toString(),
        signalsFood: s.signalsFood.toString(),
        signalsSports: s.signalsSports.toString(),
        signalsHome: s.signalsHome.toString(),
        signalsOther: s.signalsOther.toString(),
        signalsMobile: s.signalsMobile.toString(),
        signalsTablet: s.signalsTablet.toString(),
        signalsComputer: s.signalsComputer.toString(),
        signalsCamera: s.signalsCamera.toString(),
        signalsAudio: s.signalsAudio.toString(),
        signalsGaming: s.signalsGaming.toString(),
        signalsShoes: s.signalsShoes.toString(),
        signalsTops: s.signalsTops.toString(),
        signalsBottoms: s.signalsBottoms.toString(),
        signalsAccessories: s.signalsAccessories.toString(),
        signalsOuterwear: s.signalsOuterwear.toString(),
        signalsGroceries: s.signalsGroceries.toString(),
        signalsRestaurant: s.signalsRestaurant.toString(),
        signalsDrinks: s.signalsDrinks.toString(),
        signalsSnacks: s.signalsSnacks.toString(),
        signalsEquipment: s.signalsEquipment.toString(),
        signalsClothing: s.signalsClothing.toString(),
        signalsFootwear: s.signalsFootwear.toString(),
        signalsSupplements: s.signalsSupplements.toString(),
        signalsFurniture: s.signalsFurniture.toString(),
        signalsAppliances: s.signalsAppliances.toString(),
        signalsDecor: s.signalsDecor.toString(),
        signalsTools: s.signalsTools.toString(),
        totalSignals: s.totalSignals.toString(),
        campaignCount: s.campaignCount.toString(),
      });
    }

    json(res, 404, { error: 'Not found' });
  } catch (err: any) {
    json(res, 500, { error: err.message });
  }
}

export function createServer(ctx: AppContext, port = 3001): http.Server {
  ctx.contractAddress = ctx.contractAddress ?? null;
  const server = http.createServer((req, res) => handleRequest(req, res, ctx));
  server.listen(port, () => {
    console.log(`Aegis API running on http://localhost:${port}`);
  });
  return server;
}
