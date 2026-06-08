"use client";

import { useState, useEffect, useRef } from "react";
import { formatCurrency } from "@/lib/math";

interface Category {
  id: string;
  name: string;
  parentId: string | null;
  children?: Category[];
}

interface CategorySelectorProps {
  onSelect: (category: Category) => void;
  selectedId?: string;
}

export default function CategorySelector({ onSelect, selectedId }: CategorySelectorProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories();
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchCategories = async () => {
    const res = await fetch("/api/categories");
    if (res.ok) {
      const data = await res.json();
      // Organizar em árvore
      const tree: Category[] = [];
      const map: Record<string, Category> = {};
      data.forEach((cat: Category) => {
        map[cat.id] = { ...cat, children: [] };
      });
      data.forEach((cat: Category) => {
        if (cat.parentId && map[cat.parentId]) {
          map[cat.parentId].children?.push(map[cat.id]);
        } else if (!cat.parentId) {
          tree.push(map[cat.id]);
        }
      });
      setCategories(tree);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCatName) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCatName })
    });
    if (res.ok) {
      const newCat = await res.json();
      setNewCatName("");
      setIsAdding(false);
      await fetchCategories();
      onSelect(newCat);
      setIsOpen(false);
    }
  };

  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.children?.some(child => child.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const selectedCategory = [...categories, ...categories.flatMap(c => c.children || [])].find(c => c.id === selectedId);

  return (
    <div className="category-selector-container" ref={containerRef} style={{ position: 'relative' }}>
      <div 
        className="selector-trigger"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          padding: '0.75rem',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          background: 'white',
          cursor: 'pointer',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}
      >
        <span style={{ color: selectedCategory ? 'var(--text-primary)' : 'var(--text-tertiary)' }}>
          {selectedCategory ? selectedCategory.name : "Selecione uma categoria"}
        </span>
        <span style={{ fontSize: '0.8rem' }}>▼</span>
      </div>

      {isOpen && (
        <div className="selector-dropdown" style={{
          position: 'absolute',
          top: '100%',
          left: 0,
          right: 0,
          zIndex: 100,
          background: 'white',
          border: '1px solid var(--border)',
          borderRadius: '8px',
          marginTop: '4px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
          maxHeight: '400px',
          overflowY: 'auto'
        }}>
          <div style={{ padding: '8px', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
            <input 
              type="text"
              placeholder="Pesquisar..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              autoFocus
            />
            <button 
              type="button"
              onClick={() => setIsAdding(!isAdding)}
              style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', color: 'var(--primary)' }}
            >
              +
            </button>
          </div>

          {isAdding && (
            <div style={{ padding: '8px', background: '#f8fafc', borderBottom: '1px solid #f1f5f9', display: 'flex', gap: '8px' }}>
              <input 
                type="text"
                placeholder="Nome da nova categoria"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                style={{ flex: 1, padding: '6px 10px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '0.85rem' }}
              />
              <button 
                type="button"
                onClick={handleCreateCategory}
                style={{ background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', fontSize: '0.75rem', cursor: 'pointer' }}
              >
                Criar
              </button>
            </div>
          )}

          <div style={{ padding: '4px 0' }}>
            {filteredCategories.map(parent => (
              <div key={parent.id}>
                <div 
                  className="category-item parent"
                  onClick={() => { onSelect(parent); setIsOpen(false); }}
                  style={{ padding: '8px 12px', fontSize: '0.9rem', fontWeight: 'bold', color: 'var(--text-primary)', cursor: 'pointer', background: '#f8fafc' }}
                >
                  {parent.name}
                </div>
                {parent.children?.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase())).map(child => (
                  <div 
                    key={child.id}
                    className="category-item child"
                    onClick={() => { onSelect(child); setIsOpen(false); }}
                    style={{ padding: '8px 12px 8px 24px', fontSize: '0.85rem', color: 'var(--text-secondary)', cursor: 'pointer' }}
                  >
                    {child.name}
                  </div>
                ))}
              </div>
            ))}
            {filteredCategories.length === 0 && (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>
                Nenhuma categoria encontrada.
              </div>
            )}
          </div>
        </div>
      )}
      <style jsx>{`
        .category-item:hover {
          background-color: #f1f5f9 !important;
          color: var(--primary) !important;
        }
      `}</style>
    </div>
  );
}
