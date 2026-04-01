import { useEffect, useState } from 'react';

export default function Home() {
  const [salas, setSalas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Aquí llamarías a un endpoint que traiga salas activas
    fetch('/api/salas/activas') 
      .then(res => res.json())
      .then(data => {
        setSalas(data.salas || []);
        setLoading(false);
      })
      .catch(() => {
        setSalas([]);
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-white p-8">
      <h1 className="text-4xl font-bold mb-6">LlamaLeague — Dota 2</h1>
      
      {loading ? (
        <p>Cargando salas...</p>
      ) : (
        <div className="grid gap-4">
          {salas.length > 0 ? (
            salas.map(sala => (
              <div key={sala.id} className="p-4 border border-slate-700 rounded">
                <p>Sala: {sala?.name || 'Sin nombre'}</p>
                {/* Uso de ?. para evitar el error de Vercel */}
                <p>Estado: {sala?.status || 'Inactiva'}</p>
              </div>
            ))
          ) : (
            <p>No hay salas disponibles.</p>
          )}
        </div>
      )}
    </div>
  );
}