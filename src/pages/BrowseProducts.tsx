import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Search, Edit2, Trash2, Save, X, Plus, Filter, Tag, Check, Image as ImageIcon, Sparkles, UploadCloud, Receipt, Ban, AlertTriangle, Star, Eye, EyeOff, Settings2, RefreshCw } from 'lucide-react';
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

    const [isAIUploading, setIsAIUploading] = useState(false);
    const [aiUploadFiles, setAiUploadFiles] = useState<File[]>([]);
    const [aiUploadZone, setAiUploadZone] = useState<string>('');
    const [aiProcessing, setAiProcessing] = useState(false);
    
    // AI Preview State
    const [extractedMenuItems, setExtractedMenuItems] = useState<any[]>([]);
    const [isPreviewing, setIsPreviewing] = useState(false);

    // FoodSnap Search State
    const [isFoodSnapOpen, setIsFoodSnapOpen] = useState(false);
    const [foodSnapItem, setFoodSnapItem] = useState<any>(null);
    const [foodSnapQuery, setFoodSnapQuery] = useState('');
    const [foodSnapResults, setFoodSnapResults] = useState<any[]>([]);
    const [foodSnapLoading, setFoodSnapLoading] = useState(false);

    // Drag and Drop State
    const [isDragOver, setIsDragOver] = useState(false);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(true);
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files?.length > 0) {
            setAiUploadFiles(prev => [...prev, ...Array.from(e.dataTransfer.files!)]);
        }
    };

    // Variant Editor State
    const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
    const [variantItem, setVariantItem] = useState<any>(null);
    const [variantForm, setVariantForm] = useState<any[]>([]);

    // Category Edit State
    const [editingCategory, setEditingCategory] = useState<string | null>(null);
    const [editCategoryName, setEditCategoryName] = useState('');

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

    const [availableZones, setAvailableZones] = useState<string[]>(DEFAULT_ZONES);
    const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set());
    const [bulkZone, setBulkZone] = useState<string>('');
    const [isBulkUpdating, setIsBulkUpdating] = useState(false);

    const fetchMenu = async (emailToFetch = email) => {
        if (!emailToFetch) return;
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`http://localhost:15432/api/menu/by-email?email=${encodeURIComponent(emailToFetch)}`);
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to fetch');
            setItems(data.items);
            setMerchantName(data.merchantName || data.profile?.businessName || data.user?.name);
            setAvailableZones(data.zones || DEFAULT_ZONES);
            setBulkSelectedIds(new Set()); // Reset selection on new menu fetch
        } catch (err: any) {
            setError(err.message);
            setItems([]);
            setMerchantName('');
            setAvailableZones(DEFAULT_ZONES);
        } finally {
            setLoading(false);
        }
    };

    const updateItem = async (id: string, updateData: any) => {
        try {
            const res = await fetch(`http://localhost:15432/api/menu/items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, ...updateData })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to update item');
            
            setItems(items.map(i => i.id === id ? { ...i, ...data.item, category: i.category } : i));
            return data.item;
        } catch (err: any) {
            alert(err.message);
            throw err;
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

    // --- ITEM ACTIONS ---
    const handleToggleFavorite = (item: any) => updateItem(item.id, { isFavorite: !item.isFavorite });
    const handleToggleActive = (item: any) => updateItem(item.id, { isActive: !item.isActive });
    const handleRemoveImage = (item: any) => updateItem(item.id, { imageUrl: null });

    // --- VARIANT MANAGEMENT ---
    const openVariantModal = (item: any) => {
        setVariantItem(item);
        setVariantForm(item.variants ? (typeof item.variants === 'string' ? JSON.parse(item.variants) : item.variants) : []);
        setIsVariantModalOpen(true);
    };

    const handleSaveVariants = async () => {
        await updateItem(variantItem.id, { variants: variantForm });
        setIsVariantModalOpen(false);
    };

    const addVariantGroup = () => setVariantForm([...variantForm, { groupName: 'New Group', type: 'radio', required: false, options: [] }]);
    const updateVariantGroup = (idx: number, updates: any) => {
        const newForm = [...variantForm];
        newForm[idx] = { ...newForm[idx], ...updates };
        setVariantForm(newForm);
    };
    const addVariantOption = (gIdx: number) => {
        const newForm = [...variantForm];
        newForm[gIdx].options.push({ name: 'New Option', price: 0 });
        setVariantForm(newForm);
    };
    const updateVariantOption = (gIdx: number, oIdx: number, updates: any) => {
        const newForm = [...variantForm];
        newForm[gIdx].options[oIdx] = { ...newForm[gIdx].options[oIdx], ...updates };
        setVariantForm(newForm);
    };
    const removeVariantOption = (gIdx: number, oIdx: number) => {
        const newForm = [...variantForm];
        newForm[gIdx].options.splice(oIdx, 1);
        setVariantForm(newForm);
    };

    // --- CATEGORY MANAGEMENT ---
    const handleSaveCategory = async (categoryId: string) => {
        if (!editCategoryName.trim()) return;
        try {
            const res = await fetch(`http://localhost:15432/api/menu/categories/${categoryId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, name: editCategoryName })
            });
            if (!res.ok) throw new Error("Failed to rename category");
            fetchMenu();
            setEditingCategory(null);
        } catch(e:any) { alert(e.message); }
    };

    const handleDeleteCategory = async (categoryId: string) => {
        if (!window.confirm("WARNING: This will delete the category AND all items inside it. Continue?")) return;
        try {
            const res = await fetch(`http://localhost:15432/api/menu/categories/${categoryId}`, {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });
            if (!res.ok) throw new Error("Failed to delete category");
            fetchMenu();
        } catch(e:any) { alert(e.message); }
    };


    // --- FOODSNAP SEARCH ---
    const searchFoodSnap = async (query: string = foodSnapQuery) => {
        if (!query) return;
        setFoodSnapLoading(true);
        try {
            const res = await fetch(`http://localhost:15432/api/images/search?q=${encodeURIComponent(query)}`);
            const data = await res.json();
            setFoodSnapResults(data.data || []);
        } catch(e) { console.error(e); }
        setFoodSnapLoading(false);
    };

    const applyFoodSnapImage = async (url: string) => {
        await updateItem(foodSnapItem.id, { imageUrl: url });
        setIsFoodSnapOpen(false);
    };


    // --- INLINE EDITING ---
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
        await updateItem(editingItem.id, {
            name: editForm.name,
            price: parseFloat(editForm.price) || 0,
            description: editForm.description,
            zones: editForm.zones
        });
        setEditingItem(null);
    };


    // --- ADD/UPLOAD ITEMS ---
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
            
            fetchMenu();
            setIsAdding(false);
            setAddForm({ name: '', price: '', description: '', category: '', zones: [] });
        } catch (err: any) {
            alert(err.message);
        }
    };

    const handleExtractMenu = async () => {
        if (aiUploadFiles.length === 0) return alert("Please select a file first");
        
        setAiProcessing(true);
        try {
            const formData = new FormData();
            for (const file of aiUploadFiles) {
                formData.append('menuFiles', file);
            }

            const uploadRes = await fetch('http://localhost:15432/api/menu/upload-ocr', {
                method: 'POST',
                body: formData
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) throw new Error(uploadData.error || 'OCR parsing failed');
            
            const parsedItems = uploadData.menu || uploadData.partsArray || [];
            
            if (parsedItems.length === 0) throw new Error("No items found in the uploaded menus");

            setAiProcessing(true); // Ensure UI shows loading
            const itemsWithImages = await Promise.all(
                parsedItems.map(async (item: any) => {
                    try {
                        const rawName = item.item_name || item.name || "";
                        let cleanName = rawName.replace(/^\(v\)\s*/i, '').replace(/\[.*?\]|\(.*?\)/g, '').trim();
                        if (!cleanName) cleanName = rawName.trim();
                        
                        let finalPrice = typeof item.price === 'string' ? parseFloat(item.price) : item.price;
                        if (!finalPrice || isNaN(finalPrice) || finalPrice === 0) {
                            if (item.variants?.length > 0) {
                                const allVariantPrices = item.variants.flatMap((v: any) => {
                                    const opts = (v.options && Array.isArray(v.options)) ? v.options : (v.name && v.price !== undefined ? [v] : []);
                                    return opts.map((o: any) => typeof o.price === 'string' ? parseFloat(o.price) : o.price);
                                });
                                const validPrices = allVariantPrices.filter((p: any) => typeof p === 'number' && !isNaN(p) && p > 0);
                                if (validPrices.length > 0) {
                                    finalPrice = Math.min(...validPrices);
                                }
                            }
                        }

                        const imgRes = await fetch(`http://localhost:15432/api/proxy/image-search?q=${encodeURIComponent(cleanName)}`);
                        const imgData = await imgRes.json();
                        const photos = imgData.data || [];
                        let firstImage = null;
                        for (const photo of photos) {
                            if (photo.image_url || photo.image || photo.url) {
                                firstImage = photo;
                                break;
                            }
                        }
                        return { 
                            ...item, 
                            price: finalPrice || 0,
                            imageUrl: firstImage ? (firstImage.image_url || firstImage.image || firstImage.url || firstImage) : null,
                            checked: true 
                        };
                    } catch (e) {
                        return { ...item, checked: true };
                    }
                })
            );

            setExtractedMenuItems(itemsWithImages);
            setIsPreviewing(true);
            setIsAIUploading(false); // Switch to preview modal
        } catch (err: any) {
            alert(err.message);
        } finally {
            setAiProcessing(false);
        }
    };

    const handleConfirmUpload = async () => {
        const selectedItems = extractedMenuItems.filter(i => i.checked);
        if (selectedItems.length === 0) return alert("No items selected");
        
        setAiProcessing(true);
        try {
            // 2. Bulk Upload to Merchant
            const bulkRes = await fetch('http://localhost:15432/api/menu/bulk-upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email,
                    items: selectedItems,
                    zone: aiUploadZone || null
                })
            });
            
            const bulkData = await bulkRes.json();
            if (!bulkRes.ok) throw new Error(bulkData.error || 'Bulk upload failed');
            
            alert(`Successfully added ${bulkData.addedCount} items via AI!`);
            setIsPreviewing(false);
            setExtractedMenuItems([]);
            setAiUploadFile(null);
            setAiUploadZone('');
            fetchMenu(); // Refresh
        } catch (err: any) {
            alert(err.message);
        } finally {
            setAiProcessing(false);
        }
    };

    // --- DANGER ZONE ACTIONS ---
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
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) throw new Error(data.error || "Failed to wipe menu. Please check your internet connection.");
            alert("Menu wiped successfully");
            fetchMenu();
        } catch(e: any) { alert(`Wipe Error: ${e.message}`); }
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
        const catId = item.category?.id || "uncat";
        if (!acc[catName]) acc[catName] = { id: catId, items: [] };
        acc[catName].items.push(item);
        return acc;
    }, {} as Record<string, { id: string, items: any[] }>);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0B1A] p-6 text-gray-900 dark:text-gray-100 font-['Outfit'] relative">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* Header & Search */}
                <div className="bg-white dark:bg-[#1A1A2E] p-6 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h1 className="text-2xl font-black flex items-center gap-2"><Settings2 className="w-6 h-6 text-orange-500" /> Menu Viewer & Editor</h1>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Advanced management interface for modifying merchant catalogs.</p>
                        </div>
                    </div>
                    
                    <div className="flex items-end gap-4" ref={suggestionRef}>
                        <div className="flex-1 relative">
                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Merchant Email Search</label>
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
                            <Search className="w-5 h-5 text-gray-400 absolute left-4 bottom-3 pointer-events-none" />
                            
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
                            {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Load Menu'}
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
                                <button onClick={async (e) => {
                                    const btn = e.currentTarget;
                                    const originalHtml = btn.innerHTML;
                                    btn.innerHTML = '<svg class="animate-spin h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Wiping...';
                                    btn.disabled = true;
                                    await handleClearMenu('All');
                                    btn.innerHTML = originalHtml;
                                    btn.disabled = false;
                                }} className="px-3 py-1.5 bg-white dark:bg-[#1A1A2E] border border-red-200 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5"><Ban className="w-3.5 h-3.5"/> Wipe Menu</button>
                                <button onClick={handleClearImages} className="px-3 py-1.5 bg-white dark:bg-[#1A1A2E] border border-red-200 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5"><ImageIcon className="w-3.5 h-3.5"/> Clear Images</button>
                                <button onClick={handleClearBills} className="px-3 py-1.5 bg-white dark:bg-[#1A1A2E] border border-red-200 text-red-600 rounded hover:bg-red-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5"><Receipt className="w-3.5 h-3.5"/> Wipe Bills</button>
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
                                    <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                                    <select 
                                        value={filterZone} 
                                        onChange={(e) => setFilterZone(e.target.value)}
                                        className="bg-gray-50 dark:bg-[#0F0F23] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm font-medium outline-none"
                                    >
                                        <option value="ALL">All Zones</option>
                                        {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                                    </select>
                                </div>
                                
                                <div className="flex gap-2">
                                    <button 
                                        onClick={() => setIsAdding(true)}
                                        className="bg-gray-900 dark:bg-white dark:bg-[#1A1A2E] text-white dark:text-gray-900 dark:text-white font-bold px-4 py-2 rounded-lg flex items-center gap-2 text-sm hover:opacity-90 transition-opacity"
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
                                    <button onClick={() => setIsAIUploading(false)} className="text-gray-500 dark:text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="flex gap-6 items-start">
                                    <div 
                                        onDragOver={handleDragOver} 
                                        onDragLeave={handleDragLeave} 
                                        onDrop={handleDrop}
                                        className={`flex-1 p-6 rounded-xl border-2 border-dashed text-center transition-all ${isDragOver ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'bg-white dark:bg-[#1A1A2E] border-gray-200 dark:border-gray-700 hover:border-indigo-400'}`}
                                    >
                                        <input 
                                            type="file" 
                                            id="ai-upload" 
                                            className="hidden" 
                                            multiple
                                            accept="image/*,application/pdf,.xlsx,.xls,.csv,.doc,.docx"
                                            onChange={e => setAiUploadFiles(prev => [...prev, ...(e.target.files ? Array.from(e.target.files) : [])])}
                                        />
                                        <div className="flex flex-col w-full h-full">
                                            {aiUploadFiles.length > 0 ? (
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-h-60 overflow-y-auto p-2">
                                                    {aiUploadFiles.map((file, idx) => (
                                                        <div key={idx} className="relative group rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 aspect-square flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-800">
                                                            {file.type.startsWith('image/') ? (
                                                                <>
                                                                    <img src={URL.createObjectURL(file)} alt={file.name} className={`w-full h-full object-cover transition-all ${aiProcessing ? 'opacity-50 blur-[2px] grayscale-[50%]' : ''}`} />
                                                                    {aiProcessing && (
                                                                        <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden rounded-xl">
                                                                            <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_15px_4px_rgba(129,140,248,0.8)] absolute" style={{ animation: 'scanline 2s cubic-bezier(0.4, 0, 0.2, 1) infinite' }} />
                                                                            <style>{`
                                                                                @keyframes scanline {
                                                                                    0% { top: -10%; opacity: 0; }
                                                                                    10% { opacity: 1; }
                                                                                    90% { opacity: 1; }
                                                                                    100% { top: 110%; opacity: 0; }
                                                                                }
                                                                            `}</style>
                                                                        </div>
                                                                    )}
                                                                </>
                                                            ) : (
                                                                <UploadCloud className={`w-8 h-8 text-indigo-400 ${aiProcessing ? 'animate-pulse' : ''}`} />
                                                            )}
                                                            <button 
                                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); setAiUploadFiles(prev => prev.filter((_, i) => i !== idx)); }}
                                                                className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                                                            >
                                                                <X className="w-3 h-3" />
                                                            </button>
                                                            <div className="absolute inset-x-0 bottom-0 bg-black/70 p-1.5 truncate text-[10px] text-white text-center font-bold">
                                                                {file.name}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    <label htmlFor="ai-upload" className="cursor-pointer border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-400 rounded-xl aspect-square flex flex-col items-center justify-center bg-gray-50 dark:bg-[#0F0F23]/50 dark:bg-gray-800/50 transition-colors">
                                                        <Plus className="w-6 h-6 text-gray-400" />
                                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-bold mt-1">Add More</span>
                                                    </label>
                                                </div>
                                            ) : (
                                                <label htmlFor="ai-upload" className="cursor-pointer flex flex-col items-center justify-center w-full h-full">
                                                <>
                                                    <UploadCloud className={`w-10 h-10 mb-2 transition-colors ${isDragOver ? 'text-indigo-600' : 'text-indigo-400'}`} />
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                                        Drag & Drop or Click to Select Menu Files
                                                    </span>
                                                    <span className="text-[10px] text-gray-400 font-medium uppercase mt-1">
                                                        Image, PDF, Word, Excel (Multiple allowed)
                                                    </span>
                                                </>
                                                </label>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex-1 space-y-4">
                                        <div>
                                            <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Target Zone (Optional)</label>
                                            <select 
                                                value={aiUploadZone} 
                                                onChange={e => {
                                                    if (e.target.value === "CREATE_NEW_ZONE") {
                                                        const newZ = prompt("Enter New Zone Name:");
                                                        if (newZ && newZ.trim()) {
                                                            const upperZ = newZ.trim().toUpperCase();
                                                            fetch("http://localhost:15432/api/profile/zones", {
                                                                method: "POST",
                                                                headers: { "Content-Type": "application/json" },
                                                                body: JSON.stringify({ email, zoneName: upperZ })
                                                            }).then(res => res.json()).then(res => {
                                                                if (res.success) {
                                                                    setAvailableZones(res.zones);
                                                                    setAiUploadZone(upperZ);
                                                                }
                                                            });
                                                        }
                                                    } else {
                                                        setAiUploadZone(e.target.value);
                                                    }
                                                }}
                                                className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2.5 text-sm outline-none"
                                            >
                                                <option value="">No Zone</option>
                                                <option value="CREATE_NEW_ZONE" className="bg-indigo-100 font-bold text-indigo-700">+ Create New Zone</option>
                                                {availableZones.map(z => <option key={z} value={z}>{z}</option>)}
                                            </select>
                                        </div>
                                        <button 
                                            onClick={handleExtractMenu}
                                            disabled={aiUploadFiles.length === 0 || aiProcessing}
                                            className={`relative w-full overflow-hidden font-black py-3.5 rounded-xl flex justify-center items-center gap-2 transition-all disabled:cursor-not-allowed ${
                                                aiProcessing 
                                                ? 'shadow-[0_0_20px_rgba(99,102,241,0.5)] border border-indigo-400' 
                                                : 'bg-indigo-600 hover:bg-indigo-700 text-white hover:shadow-lg hover:shadow-indigo-500/30 disabled:bg-gray-300 disabled:dark:bg-gray-700 disabled:text-gray-500 disabled:shadow-none'
                                            }`}
                                        >
                                            {aiProcessing ? (
                                                <>
                                                    <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-[ai-pulse_2s_linear_infinite]" />
                                                    <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4xIi8+PC9zdmc+')] pointer-events-none" />
                                                    <div className="absolute -inset-[100%] bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-[30deg] animate-[shine_1.5s_infinite_ease-in-out]" />
                                                    
                                                    <Sparkles className="w-5 h-5 text-indigo-100 animate-pulse relative z-10" />
                                                    <span className="relative z-10 tracking-widest text-white text-sm flex items-center gap-1">
                                                        EXTRACTING VIA AI
                                                        <span className="flex gap-0.5 ml-1">
                                                            <span className="animate-[bounce_1s_infinite_0ms] text-lg leading-none">.</span>
                                                            <span className="animate-[bounce_1s_infinite_100ms] text-lg leading-none">.</span>
                                                            <span className="animate-[bounce_1s_infinite_200ms] text-lg leading-none">.</span>
                                                        </span>
                                                    </span>
                                                    <style>{`
                                                        @keyframes ai-pulse { 0% { background-position: 0% center; } 100% { background-position: 200% center; } }
                                                        @keyframes shine { 0% { left: -100%; } 100% { left: 100%; } }
                                                    `}</style>
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 text-indigo-200" />
                                                    Preview Items
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* AI Preview Modal */}
                        {isPreviewing && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                                <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                                    <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                                        <div>
                                            <h3 className="font-black text-xl text-indigo-900 dark:text-indigo-100 flex items-center gap-2"><Sparkles className="w-5 h-5 text-indigo-500"/> Parsed Menu Preview</h3>
                                            <p className="text-xs text-indigo-600 font-bold mt-1">Found {extractedMenuItems.length} items. Uncheck items you don't want to import.</p>
                                        </div>
                                        <button onClick={() => setIsPreviewing(false)} className="text-gray-500 dark:text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                                    </div>
                                    
                                    <div className="p-6 overflow-y-auto flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {extractedMenuItems.map((item, idx) => (
                                            <div 
                                                key={idx} 
                                                className={`bg-gray-50 dark:bg-gray-800/30 border rounded-xl p-4 flex items-center gap-4 transition-all ${
                                                    item.checked ? "border-indigo-500 shadow-sm" : "border-gray-200 dark:border-gray-800 opacity-50"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={item.checked}
                                                    onChange={(e) => {
                                                        const newItems = [...extractedMenuItems];
                                                        newItems[idx].checked = e.target.checked;
                                                        setExtractedMenuItems(newItems);
                                                    }}
                                                    className="w-5 h-5 rounded border-gray-300 dark:border-gray-700 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                />
                                                <div className="w-12 h-12 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0 overflow-hidden">
                                                    {item.imageUrl ? (
                                                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                            <ImageIcon className="w-5 h-5" />
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h5 className="font-bold text-sm text-gray-900 dark:text-white truncate" title={item.name}>{item.name}</h5>
                                                    <div className="flex items-center justify-between mt-1">
                                                        <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded">{item.category}</span>
                                                        <span className="text-sm font-black text-green-600">
                                                            {item.variants?.length > 0 ? `Starts at ₹${item.price}` : `₹${item.price}`}
                                                        </span>
                                                    </div>
                                                    {item.variants?.length > 0 && (
                                                        <div className="mt-1.5 flex flex-wrap gap-1">
                                                            {item.variants.flatMap((v: any) => {
                                                                const opts = (v.options && Array.isArray(v.options)) ? v.options : (v.name && v.price !== undefined ? [v] : []);
                                                                return opts;
                                                            }).map((opt: any, i: number) => (
                                                                <span key={i} className="text-[9px] font-bold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                                                                    {opt.name} (₹{opt.price})
                                                                </span>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    
                                    <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-end gap-3 bg-white dark:bg-[#1A1A2E]">
                                        <button onClick={() => setIsPreviewing(false)} className="px-6 py-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold">Cancel</button>
                                        <button 
                                            onClick={handleConfirmUpload} 
                                            disabled={aiProcessing || extractedMenuItems.filter(i => i.checked).length === 0}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-2 rounded-lg flex items-center gap-2 transition-all disabled:opacity-50"
                                        >
                                            {aiProcessing ? <RefreshCw className="w-4 h-4 animate-spin"/> : <UploadCloud className="w-4 h-4"/>}
                                            Import {extractedMenuItems.filter(i => i.checked).length} Items
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
                                    <button onClick={() => setIsAdding(false)} className="text-gray-500 dark:text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Name</label>
                                        <input type="text" value={addForm.name} onChange={e => setAddForm({...addForm, name: e.target.value})} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Margherita Pizza" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Price (₹)</label>
                                        <input type="number" value={addForm.price} onChange={e => setAddForm({...addForm, price: e.target.value})} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-green-600 font-bold" placeholder="299" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Category</label>
                                        <input type="text" value={addForm.category} onChange={e => setAddForm({...addForm, category: e.target.value})} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="e.g. Italian" />
                                    </div>
                                    <div>
                                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-1">Description</label>
                                        <input type="text" value={addForm.description} onChange={e => setAddForm({...addForm, description: e.target.value})} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm" placeholder="Optional details..." />
                                    </div>
                                </div>
                                <div className="mb-6">
                                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase block mb-2">Assign Zones</label>
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

                        {/* Catalog Items */}
                        <div className="space-y-8">
                            {Object.entries(groupedItems).length === 0 ? (
                                <div className="bg-white dark:bg-[#1A1A2E] p-12 rounded-2xl border border-gray-200 dark:border-gray-800 text-center">
                                    <Tag className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                                    <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">No items found for this filter.</h3>
                                </div>
                            ) : (
                                Object.entries(groupedItems).map(([category, catData]) => (
                                    <div key={category} className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 overflow-hidden">
                                        
                                        {/* CATEGORY HEADER */}
                                        <div className="bg-gray-50 dark:bg-[#151525] px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center group/cat">
                                            {editingCategory === catData.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input 
                                                        value={editCategoryName} 
                                                        onChange={e => setEditCategoryName(e.target.value)}
                                                        className="px-3 py-1.5 text-lg font-black bg-white dark:bg-[#0F0F23] border border-gray-300 dark:border-gray-700 rounded outline-none"
                                                    />
                                                    <button onClick={() => handleSaveCategory(catData.id)} className="bg-green-500 text-white p-1.5 rounded hover:bg-green-600"><Check className="w-4 h-4"/></button>
                                                    <button onClick={() => setEditingCategory(null)} className="text-gray-500 dark:text-gray-400 p-1.5 hover:bg-gray-200 rounded"><X className="w-4 h-4"/></button>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-4">
                                                    <h3 className="text-xl font-black text-gray-800 dark:text-gray-100">{category}</h3>
                                                    {catData.id !== "uncat" && (
                                                        <div className="opacity-0 group-hover/cat:opacity-100 transition-opacity flex items-center gap-2">
                                                            <button 
                                                                onClick={() => { setEditingCategory(catData.id); setEditCategoryName(category); }}
                                                                className="text-gray-400 hover:text-blue-500 text-xs font-bold flex items-center gap-1"
                                                            ><Edit2 className="w-3 h-3"/> Rename</button>
                                                            <button 
                                                                onClick={() => handleDeleteCategory(catData.id)}
                                                                className="text-gray-400 hover:text-red-500 text-xs font-bold flex items-center gap-1"
                                                            ><Trash2 className="w-3 h-3"/> Delete</button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>

                                        {/* CATEGORY ITEMS */}
                                        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {catData.items.map(item => (
                                                <div key={item.id} className={`group border border-gray-100 dark:border-gray-800 bg-white dark:bg-[#151525] p-4 rounded-xl flex flex-col justify-between hover:shadow-md transition-all relative ${!item.isActive ? 'opacity-60' : ''}`}>
                                                    
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
                                                                    {availableZones.map(zone => (
                                                                        <button key={zone} onClick={() => toggleZone(zone, editForm, setEditForm)} className={`px-2 py-1 rounded text-[10px] font-bold border transition-colors ${editForm.zones.includes(zone) ? 'bg-orange-100 border-orange-300 text-orange-700' : 'bg-gray-50 dark:bg-[#0F0F23] border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400'}`}>
                                                                            {zone}
                                                                        </button>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                            <div className="flex gap-2 justify-end mt-4">
                                                                <button onClick={() => setEditingItem(null)} className="px-3 py-1.5 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-bold">Cancel</button>
                                                                <button onClick={handleEditSave} className="px-3 py-1.5 bg-green-500 text-white rounded-lg text-sm font-bold flex items-center gap-1.5"><Save className="w-3.5 h-3.5" /> Save</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <div className="flex gap-4 relative">
                                                                {/* BULK SELECT & TOGGLES */}
                                                                <div className="absolute -top-2 -left-2 flex flex-col gap-1 z-10">
                                                                    <button 
                                                                        onClick={() => {
                                                                            const newSet = new Set(bulkSelectedIds);
                                                                            if (newSet.has(item.id)) newSet.delete(item.id);
                                                                            else newSet.add(item.id);
                                                                            setBulkSelectedIds(newSet);
                                                                        }} 
                                                                        className={`p-1.5 rounded-full shadow-sm bg-white dark:bg-[#1A1A2E] border ${bulkSelectedIds.has(item.id) ? 'border-indigo-500 bg-indigo-50 text-indigo-600' : 'border-gray-200 dark:border-gray-800 text-gray-300 hover:text-indigo-400'}`}
                                                                        title="Select for bulk action"
                                                                    >
                                                                        <Check className="w-3 h-3" />
                                                                    </button>
                                                                    <button onClick={() => handleToggleFavorite(item)} className={`p-1.5 rounded-full shadow-sm bg-white dark:bg-[#1A1A2E] border ${item.isFavorite ? 'border-yellow-400 text-yellow-500' : 'border-gray-200 dark:border-gray-800 text-gray-300 hover:text-yellow-400'}`}>
                                                                        <Star className="w-3 h-3" fill={item.isFavorite ? "currentColor" : "none"} />
                                                                    </button>
                                                                    <button onClick={() => handleToggleActive(item)} className={`p-1.5 rounded-full shadow-sm bg-white dark:bg-[#1A1A2E] border ${item.isActive ? 'border-green-400 text-green-500' : 'border-gray-200 dark:border-gray-800 text-gray-300 hover:text-green-500'}`}>
                                                                        {item.isActive ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                                    </button>
                                                                </div>

                                                                {/* IMAGE WITH FOODSNAP & REMOVE */}
                                                                <div className="relative group/img w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 flex-shrink-0 cursor-pointer" 
                                                                     onClick={() => { setFoodSnapItem(item); setFoodSnapQuery(item.name); searchFoodSnap(item.name); setIsFoodSnapOpen(true); }}
                                                                     title="Click to search FoodSnap for an image"
                                                                >
                                                                    {item.imageUrl ? (
                                                                        <>
                                                                            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                                                                            <button 
                                                                                onClick={(e) => { e.stopPropagation(); handleRemoveImage(item); }}
                                                                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                            ><Trash2 className="w-3 h-3" /></button>
                                                                        </>
                                                                    ) : (
                                                                        <div className="w-full h-full flex flex-col items-center justify-center text-gray-400 hover:bg-indigo-50 hover:text-indigo-500 transition-colors">
                                                                            <ImageIcon className="w-6 h-6 mb-1 opacity-50" />
                                                                            <span className="text-[8px] font-black uppercase tracking-wider text-center">Add Img</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                
                                                                <div className="flex-1 min-w-0">
                                                                    <div className="flex justify-between items-start gap-2">
                                                                        <h4 className={`font-bold text-base text-gray-900 dark:text-gray-100 truncate ${!item.isActive ? 'line-through opacity-70' : ''}`} title={item.name}>{item.name}</h4>
                                                                        <span className="text-green-600 dark:text-green-400 font-black whitespace-nowrap">₹{item.price}</span>
                                                                    </div>
                                                                    {item.description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-1 leading-relaxed">{item.description}</p>}
                                                                    
                                                                    <div className="flex flex-wrap gap-1 mt-2">
                                                                        {Array.isArray(item.zones) && item.zones.map((z: string) => (
                                                                            <span key={z} className="px-1.5 py-0.5 bg-orange-50 dark:bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-500/20 rounded text-[8px] font-black tracking-wider uppercase">
                                                                                {z}
                                                                            </span>
                                                                        ))}
                                                                        
                                                                        {/* Variants Badge */}
                                                                        {item.variants && (Array.isArray(item.variants) || (typeof item.variants === 'string' && item.variants.length > 5)) && (
                                                                            <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded text-[8px] font-black tracking-wider uppercase flex items-center gap-1">
                                                                                <Settings2 className="w-2.5 h-2.5"/> Variants
                                                                            </span>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* Floating Actions on Hover */}
                                                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1.5 bg-white dark:bg-[#1A1A2E]/90 dark:bg-gray-900/90 backdrop-blur-sm p-1 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm z-20">
                                                                <button onClick={() => openVariantModal(item)} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors" title="Manage Variants"><Settings2 className="w-3.5 h-3.5" /></button>
                                                                <button onClick={() => handleEditStart(item)} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Edit Item"><Edit2 className="w-3.5 h-3.5" /></button>
                                                                <button onClick={() => handleDelete(item.id)} className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Delete Item"><Trash2 className="w-3.5 h-3.5" /></button>
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


                {/* MODALS OVERLAYS */}

                {/* Variant Editor Modal */}
                {isVariantModalOpen && variantItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                                <h3 className="font-black text-xl text-indigo-900 dark:text-indigo-100">Variant Editor: {variantItem.name}</h3>
                                <button onClick={() => setIsVariantModalOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="p-6 overflow-y-auto flex-1 space-y-6">
                                {variantForm.length === 0 ? (
                                    <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                                        <Settings2 className="w-12 h-12 mx-auto mb-3 opacity-20" />
                                        <p>No variants configured for this item.</p>
                                    </div>
                                ) : (
                                    variantForm.map((group, gIdx) => (
                                        <div key={gIdx} className="border border-indigo-100 rounded-xl p-4 bg-gray-50 dark:bg-gray-800/30">
                                            <div className="flex gap-4 mb-4 items-end">
                                                <div className="flex-1">
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Group Name</label>
                                                    <input type="text" value={group.groupName} onChange={e => updateVariantGroup(gIdx, { groupName: e.target.value })} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-800 rounded px-3 py-2 text-sm font-bold mt-1" />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">Type</label>
                                                    <select value={group.type} onChange={e => updateVariantGroup(gIdx, { type: e.target.value })} className="w-full bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-800 rounded px-3 py-2 text-sm mt-1">
                                                        <option value="radio">Single Choice (Radio)</option>
                                                        <option value="checkbox">Multiple (Checkbox)</option>
                                                    </select>
                                                </div>
                                                <div className="pb-2">
                                                    <label className="flex items-center gap-2 text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer">
                                                        <input type="checkbox" checked={group.required} onChange={e => updateVariantGroup(gIdx, { required: e.target.checked })} /> Required
                                                    </label>
                                                </div>
                                            </div>

                                            <div className="space-y-2 pl-4 border-l-2 border-indigo-200">
                                                {group.options.map((opt: any, oIdx: number) => (
                                                    <div key={oIdx} className="flex gap-3 items-center">
                                                        <input type="text" value={opt.name} onChange={e => updateVariantOption(gIdx, oIdx, { name: e.target.value })} className="flex-1 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-800 rounded px-2 py-1 text-sm" placeholder="Option Name" />
                                                        <span className="text-gray-400 font-bold">+₹</span>
                                                        <input type="number" value={opt.price} onChange={e => updateVariantOption(gIdx, oIdx, { price: parseFloat(e.target.value) || 0 })} className="w-24 bg-white dark:bg-[#1A1A2E] border border-gray-200 dark:border-gray-800 rounded px-2 py-1 text-sm font-bold text-green-600" placeholder="0" />
                                                        <button onClick={() => removeVariantOption(gIdx, oIdx)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                                                    </div>
                                                ))}
                                                <button onClick={() => addVariantOption(gIdx)} className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1 mt-2"><Plus className="w-3 h-3"/> Add Option</button>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                            
                            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-800 flex justify-between bg-white dark:bg-[#1A1A2E]">
                                <button onClick={addVariantGroup} className="text-sm font-bold text-indigo-600 flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 rounded-lg"><Plus className="w-4 h-4" /> Add Variant Group</button>
                                <button onClick={handleSaveVariants} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-6 py-2 rounded-lg flex items-center gap-2"><Save className="w-4 h-4"/> Save JSON</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* FoodSnap Image Search Modal */}
                {isFoodSnapOpen && foodSnapItem && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                        <div className="bg-white dark:bg-[#1A1A2E] rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
                            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-emerald-50 dark:bg-emerald-900/20">
                                <div>
                                    <h3 className="font-black text-xl text-emerald-900 dark:text-emerald-100 flex items-center gap-2"><Sparkles className="w-5 h-5 text-emerald-500"/> FoodSnap DB Search</h3>
                                    <p className="text-xs text-emerald-600 font-bold mt-1">Select an image for: {foodSnapItem.name}</p>
                                </div>
                                <button onClick={() => setIsFoodSnapOpen(false)} className="text-gray-500 dark:text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                            </div>
                            
                            <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex gap-4 relative">
                                <input 
                                    type="text" 
                                    value={foodSnapQuery} 
                                    onChange={e => setFoodSnapQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && searchFoodSnap()}
                                    className="flex-1 bg-gray-50 dark:bg-[#0F0F23] border border-gray-200 dark:border-gray-800 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-emerald-500"
                                    placeholder="Search food items..."
                                />
                                <button onClick={() => searchFoodSnap()} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold px-6 rounded-xl flex items-center gap-2">
                                    <Search className="w-4 h-4 pointer-events-none" /> Search
                                </button>
                            </div>

                            <div className="p-6 overflow-y-auto flex-1">
                                {foodSnapLoading ? (
                                    <div className="flex flex-col items-center justify-center py-20 text-emerald-600">
                                        <RefreshCw className="w-10 h-10 animate-spin mb-4" />
                                        <span className="font-bold">Fetching from FoodSnap...</span>
                                    </div>
                                ) : foodSnapResults.length === 0 ? (
                                    <div className="text-center py-20 text-gray-500 dark:text-gray-400">
                                        No images found for "{foodSnapQuery}".
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                                        {foodSnapResults.map((img: any, idx: number) => (
                                            <div 
                                                key={idx} 
                                                onClick={() => applyFoodSnapImage(img.image_url || img.imageUrl || img.url)}
                                                className="aspect-square rounded-xl overflow-hidden border border-gray-200 dark:border-gray-800 cursor-pointer hover:border-emerald-500 hover:shadow-lg transition-all group/fimg relative"
                                            >
                                                <img src={img.image_url || img.imageUrl || img.url} alt="FoodSnap Result" className="w-full h-full object-cover" />
                                                <div className="absolute inset-0 bg-emerald-500/80 flex items-center justify-center opacity-0 group-hover/fimg:opacity-100 transition-opacity">
                                                    <span className="text-white font-black text-sm uppercase tracking-wider">Select</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Bulk Action Bar */}
                {bulkSelectedIds.size > 0 && (
                    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-gray-900 dark:bg-white dark:bg-[#1A1A2E] text-white dark:text-gray-900 dark:text-white rounded-2xl shadow-2xl px-6 py-4 flex items-center gap-6 z-40 border border-gray-700 dark:border-gray-200 dark:border-gray-800">
                        <div className="flex items-center gap-2">
                            <span className="font-black text-xl">{bulkSelectedIds.size}</span>
                            <span className="text-xs font-bold uppercase tracking-wider opacity-70">Items Selected</span>
                        </div>
                        
                        <div className="h-8 w-[1px] bg-white dark:bg-[#1A1A2E]/20 dark:bg-black/20"></div>
                        
                        <div className="flex items-center gap-3">
                            <select 
                                value={bulkZone} 
                                onChange={e => {
                                    if (e.target.value === "CREATE_NEW_ZONE") {
                                        const newZ = prompt("Enter New Zone Name:");
                                        if (newZ && newZ.trim()) {
                                            const upperZ = newZ.trim().toUpperCase();
                                            fetch("http://localhost:15432/api/profile/zones", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify({ email, zoneName: upperZ })
                                            }).then(res => res.json()).then(res => {
                                                if (res.success) {
                                                    setAvailableZones(res.zones);
                                                    setBulkZone(upperZ);
                                                }
                                            });
                                        }
                                    } else {
                                        setBulkZone(e.target.value)
                                    }
                                }}
                                className="bg-white dark:bg-[#1A1A2E]/10 dark:bg-black/5 border border-white/20 dark:border-black/10 rounded-lg px-3 py-2 text-sm font-bold outline-none cursor-pointer"
                            >
                                <option value="" className="bg-gray-900 dark:bg-white dark:bg-[#1A1A2E]">Select Target Zone</option>
                                <option value="CREATE_NEW_ZONE" className="bg-indigo-900 text-indigo-100 dark:bg-indigo-100 dark:text-indigo-900">+ Create New Zone</option>
                                {availableZones.map(z => <option key={z} value={z} className="bg-gray-900 dark:bg-white dark:bg-[#1A1A2E]">{z}</option>)}
                            </select>
                            
                            <button 
                                disabled={!bulkZone || isBulkUpdating}
                                onClick={async () => {
                                    setIsBulkUpdating(true);
                                    try {
                                        const res = await fetch("http://localhost:15432/api/items/bulk-update", {
                                            method: "PUT",
                                            headers: { "Content-Type": "application/json" },
                                            body: JSON.stringify({ email, ids: Array.from(bulkSelectedIds), zones: [bulkZone] })
                                        });
                                        const data = await res.json();
                                        if (!res.ok) throw new Error(data.error || "Failed to update");
                                        
                                        // Reset selection and refetch menu
                                        setBulkSelectedIds(new Set());
                                        setBulkZone('');
                                        fetchMenu();
                                    } catch (err: any) {
                                        alert(err.message);
                                    } finally {
                                        setIsBulkUpdating(false);
                                    }
                                }}
                                className="bg-indigo-500 hover:bg-indigo-600 text-white px-5 py-2 rounded-lg font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isBulkUpdating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                Apply Transfer
                            </button>
                            <button onClick={() => setBulkSelectedIds(new Set())} className="p-2 hover:bg-white dark:bg-[#1A1A2E]/10 dark:hover:bg-black/5 rounded-full transition-colors ml-2">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
}
