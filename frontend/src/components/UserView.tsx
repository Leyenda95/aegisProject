import { useState } from 'react';

type Receipt = {
  id: string;
  store: string;
  category: string;
  subcategory: string;
  date: string;
};

const mockReceipts: Receipt[] = [
  { id: '1', store: 'TechStore', category: 'Electronics', subcategory: 'mobile', date: '2026-08-01' },
  { id: '2', store: 'SportShop', category: 'Sports', subcategory: 'footwear', date: '2026-08-05' },
  { id: '3', store: 'GreenGrocer', category: 'Food', subcategory: 'groceries', date: '2026-08-10' },
];

export default function UserView() {
  const [revealAge, setRevealAge] = useState(false);
  const [revealSpend, setRevealSpend] = useState(false);

  return (
    <div style={{ maxWidth: 560 }}>
      <h2>Bóveda de recibos</h2>
      <p style={{ color: '#666' }}>
        Categoría y subcategoría se revelan siempre. Edad y gasto medio son opcionales.
      </p>

      <fieldset style={{ marginBottom: 24 }}>
        <legend>Preferencias de revelación</legend>
        <label style={{ display: 'block', marginBottom: 8 }}>
          <input type="checkbox" checked={revealAge} onChange={e => setRevealAge(e.target.checked)} />
          {' '}Revelar edad (más campañas personalizadas)
        </label>
        <label style={{ display: 'block' }}>
          <input type="checkbox" checked={revealSpend} onChange={e => setRevealSpend(e.target.checked)} />
          {' '}Revelar gasto medio (más campañas personalizadas)
        </label>
      </fieldset>

      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ textAlign: 'left', borderBottom: '2px solid #ddd' }}>
            <th style={{ padding: 8 }}>Tienda</th>
            <th style={{ padding: 8 }}>Categoría</th>
            <th style={{ padding: 8 }}>Subcategoría</th>
            <th style={{ padding: 8 }}>Fecha</th>
          </tr>
        </thead>
        <tbody>
          {mockReceipts.map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: 8 }}>{r.store}</td>
              <td style={{ padding: 8 }}>{r.category}</td>
              <td style={{ padding: 8 }}>{r.subcategory}</td>
              <td style={{ padding: 8 }}>{r.date}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
