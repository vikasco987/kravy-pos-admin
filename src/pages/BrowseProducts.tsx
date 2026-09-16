import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Edit2, Trash2, Save, X, Plus, Filter, Tag, Check, Image as ImageIcon, Sparkles, UploadCloud, Receipt, Ban, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const DEFAULT_ZONES = ["MAIN KITCHEN", "BAR", "GRILL", "BAKERY", "COUNTER"];

export default function BrowseProducts() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [merchantName, setMerchantName] = useState('');
    const [items, setItems] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const [filterZone, setFilterZone] = useState<string>('ALL');

    // Autocomplete State
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const suggestionRef = useRef<HTMLDivElement>(null);

    // Editing State
    const [editingItem, setEditingItem] = useState<any>(null);
    const [editForm, setEditForm] = useState({ name: '', price: '', description: '', zones: [] as string[] });

    // Adding State
    const [isAdding, setIsAdding] = useState(false);
    const [addForm, setAddForm] = useState({ name: '', price: '', description: '', category: '', zones: [] as string[] });

    // AI Upload State
    const [isAIUploading, setIsAIUploading] = useState(false);
    const [aiUploadFile, setAiUploadFile] = useState<File | null>(null);
    const [aiUploadZone, setAiUploadZone] = useState<string>('');
    const [aiProcessing, setAiProcessing] = useState(false);

    // Close suggestions on outside click
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Fetch Suggestions
    useEffect(() => {
        if (email.length < 2) {
            setSuggestions([]);
            return;
        }
        const fetchSuggestions = async () => {
            try {
                const res = await fetch(`http://localhost:15432/api/merchants/search?q=${encodeURIComponent(email)}`);
                const data = await res.json();
                setSuggestions(data.users || []);
            } catch (e) {
                console.error(e);
            }
        };
        const timeout = setTimeout(fetchSuggestions, 300);
        return () => clearTimeout(timeout);
    }, [email]);

    const selectSuggestion = (selectedEmail: string) => {
        setEmail(selectedEmail);
        setShowSuggestions(false);
        fetchMenu(selectedEmail);
    };

    const fetchMenu = async (emailToFetch = email) => {
        if (!emailToFetch) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:15432/api/menu/by-email?email=${encodeURIComponent(emailToFetch)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch');
            setItems(data.items);
            setMerchantName(data.merchantName);
        } catch (err: any) {
            setError(err.message);
            setItems([]);
            setMerchantName('');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm("Are you sure you want to delete this item? This action cannot be undone.")) return;
        try {
            const res = await fetch(`http://localhost:15432/api/menu/items/${id}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to delete');
            setItems(items.filter(i => i.id !== id));
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleEditStart = (item: any) => {
        setEditingItem(item);
        setEditForm({ 
            name: item.name, 
            price: item.price?.toString() || '0', 
            description: item.description || '',
            zones: Array.isArray(item.zones) ? item.zones : []
        });
    };

    const toggleZone = (zone: string, form: any, setForm: any) => {
        const currentZones = form.zones || [];
        if (currentZones.includes(zone)) {
            setForm({ ...form, zones: currentZones.filter((z: string) => z !== zone) });
        } else {
            setForm({ ...form, zones: [...currentZones, zone] });
        }
    };

    const handleEditSave = async () => {
        try {
            const res = await fetch(`http://localhost:15432/api/menu/items/${editingItem.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name: editForm.name,
                    price: parseFloat(editForm.price) || 0,
                    description: editForm.description,
                    zones: editForm.zones
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update');
            
            setItems(items.map(i => i.id === editingItem.id ? { ...i, ...data.item, category: i.category } : i));
            setEditingItem(null);
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleAddNewItem = async () => {
        if (!addForm.name || !addForm.price) {
            alert("Name and Price are required");
            return;
        }
        try {
            const res = await fetch(`http://localhost:15432/api/menu/items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    name: addForm.name,
                    price: parseFloat(addForm.price) || 0,
                    description: addForm.description,
                    category: addForm.category || 'Uncategorized',
                    zones: addForm.zones
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to add item');
            
            setItems([...items, data.item]);
            setIsAdding(false);
            setAddForm({ name: '', price: '', description: '', category: '', zones: [] });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleAIUploadSubmit = async () => {
        if (!aiUploadFile) return alert("Please select a file first");
        
        setAiProcessing(true);
        try {
            // 1. OCR Upload
            const formData = new FormData();
            formData.append('menuFile', aiUploadFile);
            formData.append('parseOnly', 'true');

            const uploadRes = await fetch('http://localhost:15432/api/menu/upload-ocr', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'OCR parsing failed');
            
            const parsedItems = uploadData.menu || uploadData.partsArray || [];
            if (parsedItems.length === 0) throw new Error("No items found in the menu");

            // 2. Bulk Upload to Merchant
            const bulkRes = await fetch('http://localhost:15432/api/menu/bulk-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    items: parsedItems,
                    zone: aiUploadZone || null
                })
            });
            
            const bulkData = await bulkRes.json();
            if (!bulkRes.ok) throw new Error(bulkData.error || 'Bulk upload failed');
            
            alert(`Successfully added ${bulkData.addedCount} items via AI!`);
            setIsAIUploading(false);
            setAiUploadFile(null);
            setAiUploadZone('');
            fetchMenu(); // Refresh
        } catch (err: any) {
            alert(err.message);
        } finally {
            setAiProcessing(false);
        }
    };

    const handleClearImages = async () => {
        if (!window.confirm("Are you sure you want to clear ALL images for this merchant?")) return;
        try {
            const res = await fetch(`http://localhost:15432/api/menu/items/clear-images`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error("Failed to clear images");
            alert("Images cleared successfully");
            fetchMenu();
        } catch(e: any) { alert(e.message); }
    };

    const handleClearMenu = async (zone: string = 'All') => {
        const msg = zone === 'All' ? "Are you sure you want to completely WIPE the entire catalog?" : `Are you sure you want to wipe all items in ${zone}?`;
        if (!window.confirm(msg)) return;
        
        try {
            const res = await fetch(`http://localhost:15432/api/menu/items/clear-all`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, zone })
            });
            if (!res.ok) throw new Error("Failed to wipe menu");
            alert("Menu wiped successfully");
            fetchMenu();
        } catch(e: any) { alert(e.message); }
    };

    const handleClearBills = async () => {
        if (!window.confirm("CRITICAL WARNING: Wiping all bills for this merchant is permanent. Continue?")) return;
        try {
            const res = await fetch(`http://localhost:15432/api/merchant/bills/clear`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error("Failed to clear bills");
            alert("Bills cleared successfully");
        } catch(e: any) { alert(e.message); }
    };


    // Filter by Zone
    const filteredItems = useMemo(() => {
        if (filterZone === 'ALL') return items;
        return items.filter(item => {
            const itemZones = Array.isArray(item.zones) ? item.zones.map((z: string) => z.toUpperCase()) : [];
            return itemZones.includes(filterZone);
        });
    }, [items, filterZone]);

    const groupedItems = filteredItems.reduce((acc, item) => {
        const catName = item.category?.name || "Uncategorized";
        if (!acc[catName]) acc[catName] = [];
        acc[catName].push(item);
        return acc;
    }, {} as Record<string, any[]>);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0B1A] p-6 text-gray-900 dark:text-gray-100 font-['Outfit']">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header & Search */}
                <div className="bg-white dark:bg-[#1A1A2E] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-black">Menu Viewer & Editor</h1>
                            <p className="text-sm text-gray-500 mt-1">Search any merchant's email to view and edit their catalog.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-4" ref={suggestionRef}>
                        <div className="flex-1 relative">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 block">Merchant Email Search</label>
                            <input 
                                type="email" 
                                value={email} 
                                onChange={e => {
                                    setEmail(e.target.value);
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={e => e.key === 'Enter' && fetchMenu()}
                                placeholder="Start typing email..."
                                className="w-full bg-gray-50 dark:bg-[#0F0F23] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 pl-11 text-sm font-medium outline-none focus:border-orange-500 transition-all"
                            />
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 bottom-3" />
                            
                            {/* Autocomplete Dropdown */}
                            {showSuggestions && suggestions.length > 0 && (
                                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl z-50 overflow-hidden">
                                    {suggestions.map((s, idx) => (
                                        <div 
                                            key={idx} 
                                            onClick={() => selectSuggestion(s.email)}
                                            className="px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-500/10 cursor-pointer flex justify-between items-center border-b border-gray-100 dark:border-gray-800 last:border-0"
                                        >
                                            <span className="font-bold text-sm text-gray-900 dark:text-white">{s.email}</span>
                                            <span className="text-xs font-bold text-orange-600 bg-orange-100 px-2 py-1 rounded">{s.restaurantName}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={() => fetchMenu()} 
                            disabled={loading}
                            className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50"
                        >
                            {loading ? 'Searching...' : 'Load Menu'}
                        </button>
                    </div>
                    {error && <div className="mt-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm font-medium border border-red-100">{error}</div>}
                </div>

                {/* Results Area */}
                {merchantName && (
                    <div className="space-y-6">
                        
                        {/* Global Actions Bar */}
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30 flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-bold text-sm">
                                <AlertTriangle className="w-5 h-5" /> Danger Zone Actions
                            </div>
                            <div className="flex items-center gap-3">
                                <button onClick={() => handleClearMenu('All')} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5"><Ban className="w-3.5 h-3.5"/> Wipe Menu</button>
                                <button onClick={handleClearImages} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5"/> Clear Images</button>
                                <button onClick={handleClearBills} className="px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5"/> Wipe Bills</button>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="bg-white dark:bg-[#1A1A2E] p-4 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 flex flex-wrap gap-4 justify-between items-center">
                            <div className="flex items-center gap-3">
                                <h2 className="text-lg font-bold">Catalog for <span className="text-orange-500">{merchantName}</span></h2>
                                <span className="text-xs font-bold px-2 py-1 bg-orange-100 text-orange-700 rounded-lg">{items.length} Items</span>
                            </div>

                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-gray-500" />
                                    <select 
                                        value={filterZone} 
                                        onChange={(e) => setFilterZone(e.target.value)}
                                        className="bg-gray-50 dark:bg-[#0F0F23] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                                    >
                                        <option value="ALL">All Zones</option>
                                        {DEFAULT_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsAdding(true)}
                                        className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:opacity-90 transition-opacity"
                                    >
                                        <Plus className="w-4 h-4" /> Add Item
                                    </button>
                                    <button 
                                        onClick={() => setIsAIUploading(true)}
                                        className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:shadow-lg transition-all"
                                    >
                                        <Sparkles className="w-4 h-4" /> AI Upload
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* AI Upload Modal */}
                        {isAIUploading && (
                            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-indigo-900/10 dark:to-blue-900/10 p-6 rounded-2xl border border-indigo-200 dark:border-indigo-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-black text-xl text-indigo-900 dark:text-indigo-100 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500"/> AI Menu Upload</h3>
                                    <button onClick={() => setIsAIUploading(false)} className="text-gray-500 hover:text-red-500"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="flex gap-6 items-start">
                                    <div className="flex-1 bg-white dark:bg-[#1A1A2E] p-6 rounded-xl border border-gray-200 dark:border-gray-700 border-dashed text-center">
                                        <input 
                                            type="file" 
                                            id="ai-upload" 
                                            className="hidden" 
                                            accept="image/*,application/pdf"
                                            onChange={e => setAiUploadFile(e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="ai-upload" className="cursor-pointer flex flex-col items-center">
                                            <UploadCloud className="w-10 h-10 text-indigo-400 mb-2" />
                                            <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                {aiUploadFile ? aiUploadFile.name : "Click to select Menu PDF/Image"}
                                            </span>
                                        </label>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Target Zone (Optional)</label>
                                            <select 
                                                value={aiUploadZone} 
                                                onChange={e => setAiUploadZone(e.target.value)}
                                                className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm outline-none"
                                            >
                                                <option value="">No Zone</option>
                                                {DEFAULT_ZONES.map(z => <option key={z} value={z}>{z}</option>)}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleAIUploadSubmit}
                                            disabled={!aiUploadFile || aiProcessing}
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-lg flex justify-center items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {aiProcessing ? 'Extracting via AI...' : 'Upload & Process'}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Add New Item Form */}
                        {isAdding && (
                            <div className="bg-blue-50/50 dark:bg-blue-900/10 p-6 rounded-2xl border border-blue-200 dark:border-blue-800">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-lg text-blue-900 dark:text-blue-100">Create New Item</h3>
                                    <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-red-500"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Name</label>
                                        <input type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Margherita Pizza" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Price (₹)</label>
                                        <input type="number" value={addForm.price} onChange={e => setAddForm({...addForm, price: e.target.value})} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-green-600 font-bold" placeholder="299" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Category</label>
                                        <input type="text" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Italian" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 uppercase block mb-1">Description</label>
                                        <input type="text" value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Optional details..." />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-gray-500 uppercase block mb-2">Assign Zones</label>
                                    <div className="flex flex-wrap gap-2">
                                        {DEFAULT_ZONES.map(zone => (
                                            <button 
                                                key={zone}
                                                onClick={() => toggleZone(zone, addForm, setAddForm)}
                                                className={`px-3 py-1.5 rounded-full text-xs font-bold border flex items-center gap-1.5 transition-all ${addForm.zones.includes(zone) ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'}`}
                                            >
                                                {addForm.zones.includes(zone) && <Check className="w-3 h-3" />} {zone}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex justify-end">
                                    <button onClick={handleAddNewItem} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg text-sm flex items-center gap-2">
                                        <Save className="w-4 h-4" /> Save Item
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="space-y-8">
                            {Object.entries(groupedItems).length === 0 ? (
                                <div className="bg-white dark:bg-[#1A1A2E] p-12 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
                                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-gray-500">No items found for this filter.</h3>
                                    {filterZone !== 'ALL' && (
                                        <button onClick={() => handleClearMenu(filterZone)} className="mt-4 text-xs font-bold text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50">
                                            Clear this empty Zone data
                                        </button>
                                    )}
                                </div>
                            ) : (
                                Object.entries(groupedItems).map(([category, catItems]) => (
                                    <div key={category} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                                        <div className="bg-gray-50 dark:bg-[#151525] px-6 py-4 border-b border-gray-200 dark:border-gray-800">
                                            <h3 className="text-lg font-black text-gray-800 dark:text-gray-100">{category}</h3>
                                        </div>
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {catItems.map(item => (
                                                <div key={item.id} className="group border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#151525] p-4 rounded-xl flex flex-col justify-between hover:shadow-md transition-shadow relative">
                                                    
                                                    {editingItem?.id === item.id ? (
                                                        <div className="space-y-3 z-10 bg-white dark:bg-[#151525]">
                                                            <div>
                                                                <label className="text-[10px] uppercase font-bold text-gray-400">Name</label>
                                                                <input type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F0F23] border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-sm font-bold" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase font-bold text-gray-400">Price (₹)</label>
                                                                <input type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F0F23] border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-sm text-green-600 font-bold" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase font-bold text-gray-400">Description</label>
                                                                <input type="text" value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full bg-gray-50 dark:bg-[#0F0F23] border border-gray-200 dark:border-gray-700 rounded px-2 py-1.5 text-xs" />
                                                            </div>
                                                            <div>
                                                                <label className="text-[10px] uppercase font-bold text-gray-400 mb-1 block">Zones</label>
                                                                <div className="flex flex-wrap gap-1.5">
                                                                    {DEFAULT_ZONES.map(zone => (
                                                                        <button key={zone} onClick={() => toggleZone(zone, editForm, setEditForm)} className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${editForm.zones.includes(zone) ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                                                                            {zone}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 justify-end mt-4">
                                                                <button onClick={() => setEditingItem(null)} className="px-3 py-1.5 text-gray-500 hover:bg-gray-100 rounded-lg text-sm font-bold">Cancel</button>
                                                                <button onClick={handleEditSave} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex gap-4">
                                                                {item.imageUrl ? (
                                                                    <img src={item.imageUrl} alt={item.name} className="w-20 h-20 object-cover rounded-xl bg-gray-100" />
                                                                ) : (
                                                                    <div className="w-20 h-20 rounded-xl bg-gray-100 dark:bg-gray-800 flex flex-col items-center justify-center text-gray-400">
                                                                        <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                                                                        <span className="text-[9px] font-bold uppercase tracking-wider">No Img</span>
                                                                    </div>
                                                                )}
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <h4 className="font-bold text-base text-gray-900 dark:text-gray-100 truncate" title={item.name}>{item.name}</h4>
                                                                        <span className="text-green-600 dark:text-green-400 font-black whitespace-nowrap">₹{item.price}</span>
                                                                    </div>
                                                                    {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{item.description}</p>}
                                                                    
                                                                    {/* Badges / Zones */}
                                                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                                                        {Array.isArray(item.zones) && item.zones.map((z: string) => (
                                                                            <span key={z} className="px-2 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 rounded text-[9px] font-black tracking-wider uppercase">
                                                                                {z}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Floating Actions on Hover */}
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                                                                <button onClick={() => handleEditStart(item)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"><Edit2 className="w-3.5 h-3.5" /></button>
                                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                                                            </div>
                                                        </>
                                                    )}

                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
