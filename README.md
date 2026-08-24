# Aegis

Comercio privado sobre Midnight Network.

## Estado actual

- [x] Circuito de señales anónimas por categoría/subcategoría (`contract/aegis.compact`)
- [x] Simulador + tests (`contract/`)
- [ ] Atestación de compra verificada (firma de tienda) — pendiente de diseñar
- [ ] Revelación opcional de edad/gasto medio ligada a pseudónimo — pendiente de diseñar
- [ ] Despliegue en devnet (nodo + indexer + proof server)
- [ ] Registro y matching de campañas
- [ ] Backend (agente + deploy)
- [ ] Frontend (tienda + usuario) conectado al contrato

## Contrato

```bash
cd contract
npm install
npm run compact     # compila con generación de claves ZK -> managed/aegis/
npm run demo        # transacción de ejemplo end-to-end en el simulador
npm test            # tests del contrato
```

Circuitos exportados:

| Circuito | Qué hace |
|---|---|
| `submitPurchase(subcat)` | Señal de compra: revela la subcategoría e incrementa sus contadores agregados. |
| `seed(...)` | Inicializa los contadores con valores de arranque. Solo se puede llamar una vez. |
| `registerCampaign()` | Da de alta una campaña y devuelve su id incremental. |

No hay todavía witness, recibo ni firma de tienda: `submitPurchase` confía en el argumento `subcat` tal cual se lo pasan, igual que en el contrato original. La atestación de compra y la revelación ligada a pseudónimo (ver checklist) son la siguiente pieza a diseñar e implementar, no algo ya construido.

## Frontend

```bash
cd frontend
npm install
npm run dev
```
