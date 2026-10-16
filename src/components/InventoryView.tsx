import React, { useState, useMemo } from 'react';
import {
  Package,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  AlertTriangle,
  Edit2,
  Trash2,
  Check,
  X,
  Coins,
  CheckCircle2,
  Scan,
  TrendingDown,
  Layers,
  Wrench,
  Download,
  ChevronDown,
} from 'lucide-react';
import { Product, ProductCategory, StockLog, StoreSettings, ItemType } from '../types';
import { formatRupiah, exportStockToExcel, exportStockPDF } from '../services/export';
import { sound } from '../services/sound';
import { BarcodeScannerModal } from './BarcodeScannerModal';

const BENGKEL_CATEGORIES: ProductCategory[] = [
  'Oli & Pelumas',
  'Rem & Suspensi',
  'Kelistrikan & Aki',
  'Ban & Velg',
  'Sparepart Mesin',
  'Sparepart CVT & Transmisi',
  'Filter & Busi',
  'Baut & Aksesoris',
  'Jasa Servis & Perbaikan',
];

const CATEGORY_ICONS_MAP: Record<string, string> = {
  'Oli & Pelumas': '🛢️',
  'Rem & Suspensi': '🛑',
  'Kelistrikan & Aki': '🔋',
  'Ban & Velg': '🛞',
  'Sparepart Mesin': '⚙️',
  'Sparepart CVT & Transmisi': '🔄',
  'Filter & Busi': '⚡',
  'Baut & Aksesoris': '🔩',
  'Jasa Servis & Perbaikan': '🛠️',
  'Jasa Ganti Oli': '🛢️',
  'Jasa Tune Up': '🔧',
  'Jasa Turun Mesin': '🏗️',
  'Jasa Cuci Kendaraan': '🚿',
};

interface InventoryViewProps {
  products: Product[];
  onSaveProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onBulkDeleteProducts?: (productIds: string[]) => void;
  onAdjustStock: (productId: string, quantityChange: number, reason: string) => void;
  stockLogs: StockLog[];
  settings: StoreSettings;
  darkMode: boolean;
  onLoadSampleData?: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  products,
  onSaveProduct,
  onDeleteProduct,
  onBulkDeleteProducts,
  onAdjustStock,
  stockLogs,
  settings,
  darkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT'>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isPriceModalOpen, setIsPriceModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [adjustingProduct, setAdjustingProduct] = useState<Product | null>(null);
  const [priceAdjustProduct, setPriceAdjustProduct] = useState<Product | null>(null);

  // Quick Price Adjustment Form
  const [quickSellPrice, setQuickSellPrice] = useState<number>(0);
  const [quickBuyPrice, setQuickBuyPrice] = useState<number>(0);

  // Form State for Add / Edit
  const [formData, setFormData] = useState({
    barcode: '',
    name: '',
    category: 'Oli & Pelumas' as ProductCategory,
    itemType: 'SPAREPART' as ItemType,
    buyPrice: 0,
    sellPrice: 0,
    stock: 10,
    minStock: 3,
    unit: 'pcs',
  });

  // Stock Adjustment Form
  const [adjustQty, setAdjustQty] = useState<number>(5);
  const [adjustType, setAdjustType] = useState<'IN' | 'OUT'>('IN');
  const [adjustReason, setAdjustReason] = useState<string>('Kulakan Stok Baru / Pembelian');

  // Low stock products count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => p.isActive && p.itemType !== 'JASA' && p.stock <= p.minStock && p.stock > 0).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter((p) => p.isActive && p.itemType !== 'JASA' && p.stock <= 0).length;
  }, [products]);

  const totalAssetValue = useMemo(() => {
    return products
      .filter((p) => p.isActive && p.itemType !== 'JASA')
      .reduce((acc, p) => acc + p.buyPrice * p.stock, 0);
  }, [products]);

  // Filtered products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (!p.isActive) return false;
      const matchCat = selectedCategory === 'ALL' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);

      let matchStock = true;
      if (stockFilter === 'LOW') matchStock = p.stock <= p.minStock && p.itemType !== 'JASA';
      if (stockFilter === 'OUT') matchStock = p.stock <= 0 && p.itemType !== 'JASA';

      return matchCat && matchQuery && matchStock;
    });
  }, [products, selectedCategory, searchQuery, stockFilter]);

  // List of all active categories for dropdown
  const allCategoriesList = useMemo(() => {
    const catsSet = new Set<string>(BENGKEL_CATEGORIES);
    products.forEach((p) => {
      if (p.category && p.isActive) {
        catsSet.add(p.category);
      }
    });
    return Array.from(catsSet);
  }, [products]);

  const openAddModal = () => {
    setEditingProduct(null);
    setFormData({
      barcode: `PART-${Math.floor(1000 + Math.random() * 9000)}`,
      name: '',
      category: 'Oli & Pelumas',
      itemType: 'SPAREPART',
      buyPrice: 35000,
      sellPrice: 50000,
      stock: 10,
      minStock: 3,
      unit: 'pcs',
    });
    setIsModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProduct(product);
    setFormData({
      barcode: product.barcode,
      name: product.name,
      category: product.category,
      itemType: product.itemType || 'SPAREPART',
      buyPrice: product.buyPrice,
      sellPrice: product.sellPrice,
      stock: product.stock,
      minStock: product.minStock,
      unit: product.unit,
    });
    setIsModalOpen(true);
  };

  const openPriceModal = (product: Product) => {
    setPriceAdjustProduct(product);
    setQuickSellPrice(product.sellPrice);
    setQuickBuyPrice(product.buyPrice);
    setIsPriceModalOpen(true);
  };

  const openAdjustModal = (product: Product) => {
    setAdjustingProduct(product);
    setAdjustQty(5);
    setAdjustType('IN');
    setAdjustReason('Kulakan Stok Baru / Pembelian');
    setIsAdjustModalOpen(true);
  };

  const handleSavePriceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceAdjustProduct) return;

    const updated: Product = {
      ...priceAdjustProduct,
      sellPrice: Number(quickSellPrice),
      buyPrice: Number(quickBuyPrice),
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct(updated);
    sound.playSuccess();
    setIsPriceModalOpen(false);
  };

  const handleSaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama sparepart wajib diisi.');
      return;
    }

    const isJasa = formData.itemType === 'JASA';

    const productToSave: Product = {
      id: editingProduct ? editingProduct.id : `pr-${Date.now()}`,
      barcode: formData.barcode.trim() || `PART-${Date.now().toString().slice(-6)}`,
      name: formData.name.trim(),
      category: formData.category,
      itemType: formData.itemType,
      buyPrice: isJasa ? 0 : Number(formData.buyPrice),
      sellPrice: Number(formData.sellPrice),
      stock: isJasa ? 9999 : Number(formData.stock),
      minStock: isJasa ? 0 : Number(formData.minStock),
      unit: formData.unit.trim() || (isJasa ? 'jasa' : 'pcs'),
      isActive: true,
      createdAt: editingProduct ? editingProduct.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    onSaveProduct(productToSave);
    sound.playSuccess();
    setIsModalOpen(false);
  };

  const handleAdjustSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustingProduct) return;
    const finalChange = adjustType === 'IN' ? Math.abs(adjustQty) : -Math.abs(adjustQty);
    onAdjustStock(adjustingProduct.id, finalChange, adjustReason);
    sound.playSuccess();
    setIsAdjustModalOpen(false);
  };

  return (
    <div id="inventory-view-container" className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Header Ringkasan & Peringatan Stok Menipis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sparepart */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Total Jenis Sparepart
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono mt-1">
              {products.filter((p) => p.isActive && p.itemType !== 'JASA').length}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Suku cadang aktif di katalog</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl shrink-0">
            🔩
          </div>
        </div>

        {/* Peringatan Stok Menipis (MERAH) - PROMPT 1 REQUIREMENT */}
        <div
          onClick={() => setStockFilter(stockFilter === 'LOW' ? 'ALL' : 'LOW')}
          className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            lowStockCount > 0
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-300 dark:border-rose-900 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              <span>Stok Menipis</span>
            </div>
            <div className="text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              {lowStockCount} Item
            </div>
            <div className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium mt-0.5">
              {lowStockCount > 0 ? 'Klik untuk filter stok kritis' : 'Semua stok aman di atas batas'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl shrink-0">
            ⚠️
          </div>
        </div>

        {/* Stok Habis (0) */}
        <div
          onClick={() => setStockFilter(stockFilter === 'OUT' ? 'ALL' : 'OUT')}
          className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            outOfStockCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">
              Stok Kosong / Habis
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
              {outOfStockCount} Item
            </div>
            <div className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium mt-0.5">
              Perlu kulakan / restock segera
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl shrink-0">
            📦
          </div>
        </div>

        {/* Total Nilai Aset Modal */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Nilai Aset Modal Sparepart
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {formatRupiah(totalAssetValue)}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Total modal tertanam di rak</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl shrink-0">
            💰
          </div>
        </div>
      </div>

      {/* 2. Action Bar: Search, Category Filter, Ekspor Laporan, Tambah Part */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box Besar & Jelas */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="input-inventory-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari nama sparepart, oli, kode part, atau kategori... (contoh: kampas, MPX2, ban)"
              className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm sm:text-base font-medium bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 hover:text-zinc-200"
              >
                ✕
              </button>
            )}
          </div>

          {/* Tombol Aksi: Ekspor Excel, Ekspor PDF & Tambah Sparepart */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              id="btn-export-excel-stock"
              type="button"
              onClick={() => {
                exportStockToExcel(products, settings);
                sound.playSuccess();
              }}
              className="px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              title="Unduh laporan stok format Microsoft Excel (.xlsx)"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            <button
              id="btn-export-pdf-stock"
              type="button"
              onClick={() => {
                exportStockPDF(products, settings);
                sound.playSuccess();
              }}
              className="px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm flex items-center gap-2 cursor-pointer transition-colors shadow-xs"
              title="Cetak atau simpan laporan stok format PDF"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Cetak / PDF</span>
            </button>

            <button
              id="btn-add-new-part"
              type="button"
              onClick={openAddModal}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Tambah Sparepart</span>
            </button>
          </div>
        </div>

        {/* Menu Drop Down Kategori & Status Stok (Tanpa Perlu Scroll Kesamping) */}
        <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-end">
          {/* 1. Menu Drop Down Kategori Sparepart & Oli */}
          <div className="sm:col-span-1 lg:col-span-6 space-y-1.5">
            <label
              htmlFor="select-inventory-category-dropdown"
              className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <Package className="w-4 h-4 text-amber-500" />
                <span>Pilih Kategori Sparepart &amp; Oli:</span>
              </span>
              {selectedCategory !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ALL')}
                  className="text-amber-500 hover:text-amber-400 text-[11px] font-bold cursor-pointer"
                >
                  Semua Kategori ✕
                </button>
              )}
            </label>
            <div className="relative">
              <select
                id="select-inventory-category-dropdown"
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  sound.playBeep(600, 0.02);
                }}
                className="w-full appearance-none pl-3.5 pr-10 py-3 rounded-xl border text-xs sm:text-sm font-bold bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 cursor-pointer shadow-xs"
              >
                <option value="ALL">
                  🏷️ SEMUA KATEGORI ({products.filter((p) => p.isActive).length} Total Barang)
                </option>
                {allCategoriesList.map((cat) => {
                  const count = products.filter((p) => p.isActive && p.category === cat).length;
                  const icon = CATEGORY_ICONS_MAP[cat] || '📦';
                  return (
                    <option key={cat} value={cat}>
                      {icon} {cat} ({count} Barang)
                    </option>
                  );
                })}
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* 2. Menu Drop Down Status Stok */}
          <div className="sm:col-span-1 lg:col-span-4 space-y-1.5">
            <label
              htmlFor="select-inventory-stock-filter"
              className="text-xs font-black text-zinc-700 dark:text-zinc-300 uppercase tracking-wider font-mono flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" />
                <span>Filter Kondisi Stok:</span>
              </span>
              {stockFilter !== 'ALL' && (
                <button
                  type="button"
                  onClick={() => setStockFilter('ALL')}
                  className="text-rose-500 hover:text-rose-400 text-[11px] font-bold cursor-pointer"
                >
                  Reset Status ✕
                </button>
              )}
            </label>
            <div className="relative">
              <select
                id="select-inventory-stock-filter"
                value={stockFilter}
                onChange={(e) => {
                  setStockFilter(e.target.value as any);
                  sound.playBeep(600, 0.02);
                }}
                className={`w-full appearance-none pl-3.5 pr-10 py-3 rounded-xl border text-xs sm:text-sm font-bold focus:outline-none focus:ring-2 cursor-pointer shadow-xs ${
                  stockFilter === 'LOW'
                    ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-300 focus:ring-rose-500'
                    : stockFilter === 'OUT'
                    ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-300 focus:ring-amber-500'
                    : 'bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:ring-amber-500'
                }`}
              >
                <option value="ALL">📦 Semua Kondisi Stok</option>
                <option value="LOW">⚠️ Stok Menipis / Kritis ({lowStockCount} Barang)</option>
                <option value="OUT">🚫 Stok Habis / Kosong ({outOfStockCount} Barang)</option>
              </select>
              <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-zinc-400">
                <ChevronDown className="w-5 h-5 stroke-[2.5]" />
              </div>
            </div>
          </div>

          {/* 3. Summary & Reset Filter */}
          <div className="sm:col-span-2 lg:col-span-2 flex items-center justify-end">
            {selectedCategory !== 'ALL' || stockFilter !== 'ALL' || searchQuery ? (
              <button
                type="button"
                onClick={() => {
                  setSelectedCategory('ALL');
                  setStockFilter('ALL');
                  setSearchQuery('');
                  sound.playSuccess();
                }}
                className="w-full py-3 px-3.5 rounded-xl bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 text-xs sm:text-sm font-black flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-xs"
                title="Reset semua filter kategori dan pencarian"
              >
                <X className="w-4 h-4 text-zinc-500" />
                <span>Reset Filter</span>
              </button>
            ) : (
              <div className="w-full py-3 px-3.5 rounded-xl bg-zinc-100/70 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-700 text-center text-xs font-mono font-bold text-zinc-600 dark:text-zinc-300 truncate">
                {filteredProducts.length} Item Sesuai
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 3. TABEL MANAJEMEN STOK SPAREPART (PROMPT 1 REQUIREMENTS) */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-800/50 text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Kode Barang</th>
                <th className="py-3 px-4">Nama Sparepart</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-right">Harga Beli (Modal)</th>
                <th className="py-3 px-4 text-right">Harga Jual</th>
                <th className="py-3 px-4 text-center">Stok Saat Ini</th>
                <th className="py-3 px-4 text-center">Min. Stok</th>
                <th className="py-3 px-4 text-center">Aksi Cepat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <Package className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                    <div className="font-bold text-base text-zinc-600 dark:text-zinc-300">
                      Tidak ada sparepart yang sesuai pencarian
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      Coba ganti kata kunci pencarian atau tambah sparepart baru.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isJasa = p.itemType === 'JASA';
                  const isLow = !isJasa && p.stock <= p.minStock && p.stock > 0;
                  const isOut = !isJasa && p.stock <= 0;

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        isOut
                          ? 'bg-rose-50/70 dark:bg-rose-950/20'
                          : isLow
                          ? 'bg-amber-50/50 dark:bg-amber-950/20'
                          : ''
                      }`}
                    >
                      {/* 1. Kode Barang */}
                      <td className="py-3.5 px-4">
                        <span className="font-mono font-black text-xs px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
                          {p.barcode}
                        </span>
                      </td>

                      {/* 2. Nama Sparepart */}
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="flex items-center gap-2">
                          <span className="text-base">{p.name}</span>
                          {isJasa && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-black font-mono bg-blue-500/15 text-blue-500 border border-blue-500/30">
                              JASA
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Kategori */}
                      <td className="py-3.5 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                        {p.category}
                      </td>

                      {/* 4. Harga Beli (Modal) */}
                      <td className="py-3.5 px-4 text-right font-mono font-bold text-zinc-600 dark:text-zinc-400">
                        {isJasa ? '-' : formatRupiah(p.buyPrice)}
                      </td>

                      {/* 5. Harga Jual */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-zinc-950 dark:text-zinc-50 text-base">
                        {formatRupiah(p.sellPrice)}
                      </td>

                      {/* 6. Stok Saat Ini & Indikator Warna Merah (PROMPT 1) */}
                      <td className="py-3.5 px-4 text-center">
                        {isJasa ? (
                          <span className="text-xs font-mono font-bold text-zinc-400">Tak Terbatas</span>
                        ) : isOut ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black font-mono bg-rose-600 text-white animate-pulse">
                              0 {p.unit || 'pcs'} (HABIS)
                            </span>
                          </div>
                        ) : isLow ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="px-2.5 py-1 rounded-full text-xs font-black font-mono bg-rose-500/20 text-rose-600 dark:text-rose-400 border border-rose-500/40">
                              ⚠️ {p.stock} {p.unit || 'pcs'} (KRITIS)
                            </span>
                          </div>
                        ) : (
                          <span className="font-mono font-black text-base text-zinc-900 dark:text-zinc-100">
                            {p.stock} <span className="text-xs font-normal text-zinc-400">{p.unit || 'pcs'}</span>
                          </span>
                        )}
                      </td>

                      {/* 7. Batas Minimal Stok */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs text-zinc-500 font-bold">
                        {isJasa ? '-' : `${p.minStock} ${p.unit || 'pcs'}`}
                      </td>

                      {/* 8. Aksi Cepat */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {!isJasa && (
                            <button
                              type="button"
                              onClick={() => openAdjustModal(p)}
                              className="px-2.5 py-1 rounded-lg bg-zinc-100 hover:bg-amber-500 hover:text-zinc-950 dark:bg-zinc-800 dark:hover:bg-amber-500 font-bold text-xs transition-colors cursor-pointer"
                              title="Tambah / Kurangi Stok"
                            >
                              +/- Stok
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => openPriceModal(p)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Ubah Harga"
                          >
                            <Coins className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => openEditModal(p)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Edit Sparepart"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`Hapus sparepart "${p.name}" dari katalog?`)) {
                                onDeleteProduct(p.id);
                                sound.playSuccess();
                              }
                            }}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 transition-colors cursor-pointer"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: Tambah / Edit Sparepart */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">🔩</span>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  {editingProduct ? 'Edit Data Sparepart' : 'Tambah Sparepart / Jasa Baru'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSubmit} className="space-y-4 text-sm">
              {/* Jenis Item: Sparepart vs Jasa */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1.5 font-mono">
                  Tipe Item
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, itemType: 'SPAREPART', unit: 'pcs' })}
                    className={`p-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      formData.itemType === 'SPAREPART'
                        ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <span>🔩 Sparepart (Ada Stok)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, itemType: 'JASA', buyPrice: 0, unit: 'jasa' })}
                    className={`p-2.5 rounded-xl font-black text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      formData.itemType === 'JASA'
                        ? 'bg-blue-500 text-white border-blue-500 shadow-sm'
                        : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                    }`}
                  >
                    <span>🛠️ Jasa Servis (Tarif Tanpa Stok)</span>
                  </button>
                </div>
              </div>

              {/* Nama Sparepart */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Nama Sparepart / Jasa *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Contoh: Oli Mesin MPX2 0.8L atau Kampas Rem Depan"
                  className="w-full px-3.5 py-2.5 rounded-xl border font-bold text-base bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                />
              </div>

              {/* Kode Barcode & Kategori */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                    Kode Barang / Barcode
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value.toUpperCase() })}
                    placeholder="Contoh: OLI-MPX2"
                    className="w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                    Kategori
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as ProductCategory })}
                    className="w-full px-3 py-2.5 rounded-xl border font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  >
                    {BENGKEL_CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Harga Beli & Harga Jual */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.itemType === 'SPAREPART' && (
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                      Harga Beli (Modal / HPP)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.buyPrice}
                      onChange={(e) => setFormData({ ...formData, buyPrice: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-base bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                    />
                  </div>
                )}
                <div className={formData.itemType === 'JASA' ? 'sm:col-span-2' : ''}>
                  <label className="block text-xs font-black uppercase tracking-wider text-amber-500 mb-1 font-mono">
                    {formData.itemType === 'JASA' ? 'Tarif Jasa Servis (Rp)' : 'Harga Jual ke Pelanggan (Rp)'}
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={formData.sellPrice}
                    onChange={(e) => setFormData({ ...formData, sellPrice: Number(e.target.value) })}
                    className="w-full px-3.5 py-2.5 rounded-xl border font-mono font-black text-lg bg-zinc-50 dark:bg-zinc-800 border-amber-500 text-amber-600 dark:text-amber-400"
                  />
                </div>
              </div>

              {/* Stok Awal, Batas Minimal & Satuan */}
              {formData.itemType === 'SPAREPART' && (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                      Stok Saat Ini
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border font-mono font-bold text-base bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-rose-500 mb-1 font-mono">
                      Min. Stok (Merah)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={formData.minStock}
                      onChange={(e) => setFormData({ ...formData, minStock: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border font-mono font-bold text-base bg-zinc-50 dark:bg-zinc-800 border-rose-300 dark:border-rose-700 text-rose-500 text-center"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                      Satuan
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      placeholder="botol/pcs/set"
                      className="w-full px-3 py-2.5 rounded-xl border font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-center"
                    />
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm shadow-md transition-all"
                >
                  {editingProduct ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Penyesuaian Stok Cepat (+/- Stok) */}
      {isAdjustModalOpen && adjustingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  Sesuaikan Stok Sparepart
                </h3>
                <p className="text-xs text-zinc-400 font-bold">{adjustingProduct.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustSubmit} className="space-y-4 text-sm">
              <div className="p-3 bg-zinc-100 dark:bg-zinc-800/80 rounded-2xl flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-500">Stok Saat Ini:</span>
                <span className="text-lg font-black font-mono text-zinc-900 dark:text-zinc-100">
                  {adjustingProduct.stock} {adjustingProduct.unit || 'pcs'}
                </span>
              </div>

              {/* Tipe: Tambah (Kulakan) vs Kurang (Rusak/Hilang) */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustType('IN')}
                  className={`p-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border cursor-pointer ${
                    adjustType === 'IN'
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-500 font-black shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  <span>+ Tambah Stok (Kulakan)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustType('OUT')}
                  className={`p-3 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 border cursor-pointer ${
                    adjustType === 'OUT'
                      ? 'bg-rose-500 text-white border-rose-500 font-black shadow-sm'
                      : 'bg-zinc-100 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'
                  }`}
                >
                  <span>- Kurangi Stok (Rusak)</span>
                </button>
              </div>

              {/* Jumlah Unit */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Jumlah Perubahan (Unit)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    required
                    value={adjustQty}
                    onChange={(e) => setAdjustQty(Number(e.target.value))}
                    className="flex-1 px-4 py-3 rounded-xl border font-mono font-black text-xl text-center bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                {/* Quick Add Buttons */}
                <div className="flex items-center justify-center gap-2 mt-2">
                  {[5, 10, 20, 50].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setAdjustQty(n)}
                      className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-amber-500 hover:text-zinc-950 transition-colors"
                    >
                      +{n}
                    </button>
                  ))}
                </div>
              </div>

              {/* Alasan */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Keterangan / Alasan
                </label>
                <input
                  type="text"
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Contoh: Kulakan baru dari distributor"
                  className="w-full px-3.5 py-2 rounded-xl border text-xs font-medium bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm"
                >
                  Terapkan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Ubah Cepat Harga */}
      {isPriceModalOpen && priceAdjustProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-sm shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100">
                  Ubah Harga Sparepart
                </h3>
                <p className="text-xs text-zinc-400 font-bold truncate max-w-[220px]">
                  {priceAdjustProduct.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPriceModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePriceSubmit} className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-black uppercase text-zinc-500 mb-1 font-mono">
                  Harga Beli (Modal)
                </label>
                <input
                  type="number"
                  min={0}
                  value={quickBuyPrice}
                  onChange={(e) => setQuickBuyPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border font-mono font-bold text-base bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase text-amber-500 mb-1 font-mono">
                  Harga Jual ke Pelanggan (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  required
                  value={quickSellPrice}
                  onChange={(e) => setQuickSellPrice(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border font-mono font-black text-xl bg-zinc-50 dark:bg-zinc-800 border-amber-500 text-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPriceModalOpen(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm"
                >
                  Simpan Harga
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
