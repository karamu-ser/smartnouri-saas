import { API_BASE } from '../utils/api';
import React, { useState } from 'react';


interface MenuEditorProps {
  restaurant: any;
  token: string;
  onUpdate: () => void;
}

export default function MenuEditor({ restaurant, token, onUpdate }: MenuEditorProps) {
  const [newCatName, setNewCatName] = useState("");
  const [addingItemToCat, setAddingItemToCat] = useState<number | null>(null);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState("");

  const menu = restaurant.menus?.[0];

  const handleAddCategory = async () => {
    if (!newCatName.trim() || !menu) return;
    try {
      const res = await fetch(`${API_BASE}/menus/${menu.id}/categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newCatName, sort_order: 0 })
      });
      if (res.ok) {
        setNewCatName("");
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteCategory = async (catId: number) => {
    if (!confirm("Supprimer cette catégorie et tous ses plats ?")) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${catId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddItem = async (catId: number) => {
    if (!newItemName.trim() || !newItemPrice) return;
    try {
      const res = await fetch(`${API_BASE}/categories/${catId}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: newItemName, price: parseFloat(newItemPrice) })
      });
      if (res.ok) {
        setAddingItemToCat(null);
        setNewItemName("");
        setNewItemPrice("");
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateItem = async (itemId: number, data: any) => {
    try {
      const res = await fetch(`${API_BASE}/menu_items/${itemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(data)
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!confirm("Supprimer ce plat ?")) return;
    try {
      const res = await fetch(`${API_BASE}/menu_items/${itemId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) onUpdate();
    } catch (e) {
      console.error(e);
    }
  };

  const handleImageUpload = async (itemId: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64String = event.target?.result as string;
      try {
        const res = await fetch(`${API_BASE}/menu_items/${itemId}/image`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ image_base64: base64String })
        });
        if (res.ok) onUpdate();
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  if (!menu) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-12 text-center text-gray-500">
        Aucun menu trouvé pour ce restaurant. Demandez à l'IA d'en extraire un ou ajoutez un menu vide (bientôt).
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Categories */}
      {menu.categories.map((category: any) => (
        <div key={category.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="bg-gray-50/50 px-6 py-4 border-b border-gray-100 flex justify-between items-center group">
            <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              {category.name}
              <span className="text-xs text-gray-500 font-normal">({category.items.length} plats)</span>
            </h3>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
              <button onClick={() => handleDeleteCategory(category.id)} className="text-xs text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded">Supprimer catégorie</button>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {category.items.map((item: any) => (
              <div key={item.id} className="p-6 hover:bg-gray-50/30 transition-colors flex flex-col md:flex-row gap-4 group">
                {/* Image Upload Area */}
                <div className="shrink-0">
                  <label className="cursor-pointer block relative w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 hover:border-accent-purple overflow-hidden flex items-center justify-center bg-gray-50 group-hover:bg-white transition-colors">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-400 text-xs text-center px-2">📷 <br/> Photo</span>
                    )}
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(item.id, e)} />
                  </label>
                </div>
                
                {/* Item Details */}
                <div className="flex-1">
                  <input 
                    type="text"
                    defaultValue={item.name}
                    onBlur={(e) => { if(e.target.value !== item.name) handleUpdateItem(item.id, { ...item, name: e.target.value })}}
                    className="font-bold text-lg text-gray-900 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-accent-purple focus:ring-0 px-1 -ml-1 w-full"
                  />
                  <input 
                    type="text"
                    defaultValue={item.description || ''}
                    placeholder="Description..."
                    onBlur={(e) => { if(e.target.value !== item.description) handleUpdateItem(item.id, { ...item, description: e.target.value })}}
                    className="text-sm text-gray-500 mt-1 bg-transparent border-b border-transparent hover:border-gray-300 focus:border-accent-purple focus:ring-0 px-1 -ml-1 w-full"
                  />
                </div>
                
                {/* Price and Actions */}
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="flex items-center gap-1">
                    <input 
                      type="number"
                      defaultValue={item.price}
                      onBlur={(e) => { if(parseFloat(e.target.value) !== item.price) handleUpdateItem(item.id, { ...item, price: parseFloat(e.target.value) })}}
                      className="font-bold text-lg text-accent-purple bg-accent-purple/5 border border-transparent hover:border-accent-purple/30 focus:border-accent-purple rounded px-2 py-1 w-24 text-right"
                    />
                    <span className="text-gray-500 font-medium">DH</span>
                  </div>
                  <button onClick={() => handleDeleteItem(item.id)} className="text-xs text-red-400 hover:text-red-600 px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    🗑️ Supprimer
                  </button>
                </div>
              </div>
            ))}
            
            {/* Add Item form */}
            {addingItemToCat === category.id ? (
              <div className="p-4 bg-gray-50 border-t border-gray-100 flex gap-2 items-center">
                <input type="text" placeholder="Nom du plat" value={newItemName} onChange={e => setNewItemName(e.target.value)} className="flex-1 bg-white border border-gray-200 rounded p-2 text-sm" />
                <input type="number" placeholder="Prix" value={newItemPrice} onChange={e => setNewItemPrice(e.target.value)} className="w-24 bg-white border border-gray-200 rounded p-2 text-sm" />
                <button onClick={() => handleAddItem(category.id)} className="btn-primary py-2 px-4 text-sm">Ajouter</button>
                <button onClick={() => setAddingItemToCat(null)} className="text-gray-500 text-sm px-2">Annuler</button>
              </div>
            ) : (
              <button onClick={() => setAddingItemToCat(category.id)} className="w-full text-center py-3 text-sm text-accent-purple font-medium hover:bg-gray-50 transition-colors border-t border-gray-100">
                + Ajouter un plat
              </button>
            )}
          </div>
        </div>
      ))}

      {/* Add Category */}
      <div className="bg-white border-2 border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center gap-4">
        <h4 className="text-gray-500 font-medium">Créer une nouvelle catégorie</h4>
        <div className="flex gap-2 w-full max-w-sm">
          <input type="text" placeholder="ex: Boissons Chaudes" value={newCatName} onChange={e => setNewCatName(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm" />
          <button onClick={handleAddCategory} className="bg-gray-800 text-white rounded-lg px-4 font-medium text-sm hover:bg-gray-700">Créer</button>
        </div>
      </div>
    </div>
  );
}
