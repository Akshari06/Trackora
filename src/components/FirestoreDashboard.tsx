import React, { useState, useEffect } from 'react';
import { firebaseService } from '../services/firebaseService';
import { 
  Database, 
  Plus, 
  Trash2, 
  Edit2, 
  Search, 
  ChevronLeft, 
  ChevronRight,
  RefreshCcw,
  Loader2,
  Table as TableIcon,
  AlertTriangle,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import blueprint from '../../firebase-blueprint.json';

export default function FirestoreDashboard() {
  const { theme } = useTheme();
  const availableTables = Object.keys(blueprint.firestore);
  const [activeTable, setActiveTable] = useState<string>(availableTables[0]);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Search & Filtering
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [docHistory, setDocHistory] = useState<any[]>([]);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  const [formData, setFormData] = useState<any>({});

  const fetchData = async (reset = false) => {
    setLoading(true);
    setError(null);
    try {
      const result = await firebaseService.getAll(activeTable, {
        limit: pageSize,
        lastDoc: reset ? undefined : (page > 0 ? docHistory[page - 1] : undefined)
      });
      setData(result.data);
      if (result.lastDoc) {
        const newHistory = [...docHistory];
        newHistory[page] = result.lastDoc;
        setDocHistory(newHistory);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPage(0);
    setDocHistory([]);
    fetchData(true);
  }, [activeTable]);

  useEffect(() => {
    fetchData();
  }, [page]);

  const handleCreateOrUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingItem) {
        await firebaseService.updateRecord(activeTable, editingItem.id, formData);
      } else {
        await firebaseService.createRecord(activeTable, formData);
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({});
      fetchData(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this record?')) return;
    try {
      await firebaseService.deleteRecord(activeTable, id);
      fetchData(true);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const openEditModal = (item: any) => {
    setEditingItem(item);
    setFormData(item);
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({});
    setIsModalOpen(true);
  };

  const getEntityFields = () => {
    const firestoreEntry = (blueprint.firestore as any)[activeTable];
    const schemaRef = firestoreEntry.schema;
    const entity = (blueprint.entities as any)[schemaRef];
    return entity.properties;
  };

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-2 italic uppercase">
            <Database className="text-orange-500" />
            Firestore Engine
          </h1>
          <p className="text-[10px] uppercase font-black tracking-[0.2em] opacity-40">
            Database Explorer | Live System Integrator
          </p>
        </div>

        <div className="flex gap-2">
           <button 
            onClick={() => fetchData(true)}
            className="p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-body"
           >
             <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
           </button>
           <button 
            onClick={openCreateModal}
            className="px-6 py-3 rounded-2xl bg-orange-600 text-white font-bold text-sm flex items-center gap-2 shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
          >
            <Plus size={18} />
            New Entry
          </button>
        </div>
      </div>

      {/* Table Selector */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar items-center">
        {availableTables.map(table => (
          <button
            key={table}
            onClick={() => setActiveTable(table)}
            className={cn(
              "px-6 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTable === table 
                ? "bg-orange-600 text-white border-orange-500 shadow-lg shadow-orange-500/20" 
                : "bg-white/5 border-white/10 opacity-40 hover:opacity-100"
            )}
          >
            <TableIcon size={12} className="inline mr-2" />
            {table}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 flex gap-4 items-start">
           <AlertTriangle className="text-red-500 shrink-0" />
           <div>
             <p className="text-sm font-bold text-red-500 mb-1">Authorization or Logic Error</p>
             <p className="text-xs opacity-60 leading-relaxed max-w-lg">{error}</p>
           </div>
        </div>
      )}

      {/* Dynamic Data Table */}
      <div className={cn(
        "glass-card border overflow-hidden",
        theme === 'dark' ? "border-white/10 bg-white/[0.02]" : "bg-white border-slate-200 shadow-sm"
      )}>
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
           <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-white/5 border border-white/10 w-64">
              <Search className="w-4 h-4 text-white/40" />
              <input 
                placeholder={`Filter ${activeTable}...`}
                className="bg-transparent border-none text-xs focus:outline-none w-full"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                disabled={page === 0}
                onClick={() => setPage(prev => prev - 1)}
                className="p-2 rounded-lg bg-white/5 disabled:opacity-20 transition-opacity"
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Segment {page + 1}</span>
              <button 
                disabled={data.length < pageSize}
                onClick={() => setPage(prev => prev + 1)}
                className="p-2 rounded-lg bg-white/5 disabled:opacity-20 transition-opacity"
              >
                <ChevronRight size={16} />
              </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 bg-white/5">
                {data.length > 0 ? Object.keys(data[0]).map(key => (
                  <th key={key} className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">
                    {key.replace(/([A-Z])/g, ' $1')}
                  </th>
                )) : (
                  <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40 whitespace-nowrap">Fields</th>
                )}
                <th className="p-6 text-[10px] font-black uppercase tracking-widest opacity-40 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                   <td colSpan={20} className="p-20 text-center">
                      <Loader2 className="animate-spin inline-block text-orange-500 mb-4" size={32} />
                      <p className="text-[10px] uppercase font-black tracking-widest opacity-40">Accessing Galactic Database...</p>
                   </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={20} className="p-20 text-center opacity-40 italic">
                    No records in {activeTable}.
                  </td>
                </tr>
              ) : (
                data.map((row, i) => (
                  <tr key={row.id || i} className="border-b border-white/5 group hover:bg-white/[0.01] transition-colors">
                    {Object.keys(row).map(key => (
                      <td key={key} className="p-6 text-xs font-medium whitespace-nowrap">
                        {typeof row[key] === 'object' && row[key] !== null 
                          ? (row[key].seconds ? new Date(row[key].seconds * 1000).toLocaleString() : JSON.stringify(row[key]))
                          : String(row[key])}
                      </td>
                    ))}
                    <td className="p-6 text-right">
                       <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button 
                          onClick={() => openEditModal(row)}
                          className="p-2 rounded-lg bg-blue-500/10 text-blue-500 hover:bg-blue-500/20"
                         >
                           <Edit2 size={14} />
                         </button>
                         <button 
                          onClick={() => handleDelete(row.id)}
                          className="p-2 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20"
                         >
                           <Trash2 size={14} />
                         </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.form
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onSubmit={handleCreateOrUpdate}
              className={cn(
                "relative w-full max-w-lg glass-card p-8 border",
                theme === 'dark' ? "border-white/10 bg-black shadow-2xl" : "bg-white shadow-2xl"
              )}
            >
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl font-black italic tracking-tighter uppercase">
                  {editingItem ? 'PATCH' : 'INITIALIZE'} {activeTable.slice(0, -1)}
                </h2>
                <button type="button" onClick={() => setIsModalOpen(false)}><X /></button>
              </div>

              <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 no-scrollbar">
                {Object.entries(getEntityFields()).map(([key, field]: [string, any]) => {
                  if (key === 'id' || key === 'createdAt' || key === 'updatedAt') return null;
                  return (
                    <div key={key}>
                      <label className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-2 block">{key}</label>
                      {field.enum ? (
                        <select
                          value={formData[key] || ''}
                          onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-orange-500/50 text-sm"
                        >
                          <option value="">Select Option...</option>
                          {field.enum.map((opt: string) => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input 
                          type={field.type === 'number' ? 'number' : 'text'}
                          value={formData[key] || ''}
                          onChange={e => setFormData({ ...formData, [key]: field.type === 'number' ? parseFloat(e.target.value) : e.target.value })}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 ring-orange-500/50 text-sm"
                          placeholder={`Enter ${key}...`}
                        />
                      )}
                    </div>
                  );
                })}
              </div>

              <button className="w-full mt-8 py-4 rounded-xl bg-orange-600 text-white font-bold uppercase tracking-widest shadow-lg shadow-orange-500/20 active:scale-95 transition-all">
                {editingItem ? 'Commit Patch' : 'Execute Creation'}
              </button>
            </motion.form>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
