import { useState } from 'react';

type Campaign = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
};

export default function StoreView() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Electronics');
  const [subcategory, setSubcategory] = useState('mobile');

  function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setCampaigns(prev => [...prev, { id: crypto.randomUUID(), name, category, subcategory }]);
    setName('');
  }

  return (
    <div style={{ maxWidth: 560 }}>
      <h2>Crear campaña</h2>

      <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        <label>
          Nombre de campaña
          <input value={name} onChange={e => setName(e.target.value)} style={{ display: 'block', width: '100%' }} />
        </label>
        <label>
          Categoría objetivo
          <select value={category} onChange={e => setCategory(e.target.value)} style={{ display: 'block', width: '100%' }}>
            <option>Electronics</option>
            <option>Fashion</option>
            <option>Food</option>
            <option>Sports</option>
            <option>Home</option>
          </select>
        </label>
        <label>
          Subcategoría objetivo
          <input value={subcategory} onChange={e => setSubcategory(e.target.value)} style={{ display: 'block', width: '100%' }} />
        </label>
        <button type="submit">Crear campaña</button>
      </form>

      <h3>Campañas activas</h3>
      {campaigns.length === 0 ? (
        <p style={{ color: '#666' }}>Todavía no has creado ninguna campaña.</p>
      ) : (
        <ul>
          {campaigns.map(c => (
            <li key={c.id}>{c.name} — {c.category} / {c.subcategory}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
