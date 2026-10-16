import React, { useState, useEffect, useMemo } from 'react';
import {
  Wrench,
  Zap,
  Plus,
  Trash2,
  X,
  CheckCircle2,
  AlertTriangle,
  User,
  Car,
  CreditCard,
  Phone,
  Tag,
  DollarSign,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';
import {
  Product,
  Transaction,
  StoreBranch,
  StoreSettings,
  CashierUser,
  PaymentMethod,
  ItemType,
  TransactionItem,
} from '../types';
import { formatRupiah } from '../services/export';
import { sound } from '../services/sound';
import { db } from '../services/db';

interface SelectedServiceItem {
  id: string; // temporary row id
  productId?: string;
  name: string;
  category: string;
  itemType: ItemType;
  buyPrice: number; // 0 for JASA
  sellPrice: number;
  quantity: number;
  unit: string;
  availableStock?: number;
  mechanicName?: string;
}

interface BengkelTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  settings: StoreSettings;
  currentUser: CashierUser | null;
  activeBranch: StoreBranch;
  mechanicsList: string[];
  onCompleteTransaction: (trx: Transaction) => void;
  onAdjustStock?: (productId: string, qtyChange: number, reason: string) => void;
  darkMode: boolean;
}

export const BengkelTransactionModal: React.FC<BengkelTransactionModalProps> = ({
  isOpen,
  onClose,
  products,
  settings,
  currentUser,
  activeBranch,
  mechanicsList = [],
  onCompleteTransaction,
  onAdjustStock,
  darkMode,
}) => {
  // Vehicle & Customer Information
  const [vehiclePlate, setVehiclePlate] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [selectedMechanic, setSelectedMechanic] = useState('');
  const [customMechanicInput, setCustomMechanicInput] = useState('');
  const [isAddingNewMechanic, setIsAddingNewMechanic] = useState(false);
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [odometerKm, setOdometerKm] = useState<number | ''>('');
  const [notes, setNotes] = useState('');

  // Items in transaction
  const [selectedItems, setSelectedItems] = useState<SelectedServiceItem[]>([]);

  // Catalog picker states
  const [catalogTab, setCatalogTab] = useState<'ALL' | 'SPAREPART' | 'JASA'>('ALL');
  const [catalogSearch, setCatalogSearch] = useState('');

  // Quick custom item modal / accordion
  const [isCustomItemOpen, setIsCustomItemOpen] = useState(false);
  const [customItemType, setCustomItemType] = useState<ItemType>('SPAREPART');
  const [customItemName, setCustomItemName] = useState('');
  const [customItemBuyPrice, setCustomItemBuyPrice] = useState<number>(0);
  const [customItemSellPrice, setCustomItemSellPrice] = useState<number>(0);
  const [customItemQty, setCustomItemQty] = useState<number>(1);
  const [customItemUnit, setCustomItemUnit] = useState('pcs');

  // Payment State (Prompt 5: Tempo / Hutang)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('TUNAI');
  const [cashGiven, setCashGiven] = useState<number>(0);
  const [downPayment, setDownPayment] = useState<number>(0);
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Initialize defaults on open
  useEffect(() => {
    if (isOpen) {
      setVehiclePlate('');
      setVehicleModel('');
      setOdometerKm('');
      setSelectedMechanic(mechanicsList[0] || 'Agus Santoso');
      setCustomMechanicInput('');
      setIsAddingNewMechanic(false);
      setCustomerName('');
      setCustomerPhone('');
      setNotes('');
      setSelectedItems([]);
      setPaymentMethod('TUNAI');
      setCashGiven(0);
      setDownPayment(0);
      setDueDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setIsSubmitting(false);
      setCatalogSearch('');
      setIsCustomItemOpen(false);
    }
  }, [isOpen, mechanicsList]);

  // Calculations
  const sparepartTotal = useMemo(() => {
    return selectedItems
      .filter((i) => i.itemType === 'SPAREPART')
      .reduce((sum, i) => sum + i.sellPrice * i.quantity, 0);
  }, [selectedItems]);

  const serviceTotal = useMemo(() => {
    return selectedItems
      .filter((i) => i.itemType === 'JASA')
      .reduce((sum, i) => sum + i.sellPrice * i.quantity, 0);
  }, [selectedItems]);

  const totalCost = useMemo(() => {
    // Modal HPP strictly comes from SPAREPART items!
    return selectedItems
      .filter((i) => i.itemType === 'SPAREPART')
      .reduce((sum, i) => sum + i.buyPrice * i.quantity, 0);
  }, [selectedItems]);

  const grandTotal = sparepartTotal + serviceTotal;
  const totalProfit = Math.max(0, grandTotal - totalCost);

  // Sisa Hutang untuk Pembayaran Tempo / Kasbon (Prompt 5)
  const remainingDebt = useMemo(() => {
    return Math.max(0, grandTotal - (Number(downPayment) || 0));
  }, [grandTotal, downPayment]);

  // Auto set cash given when grand total changes
  useEffect(() => {
    if (paymentMethod === 'TUNAI') {
      setCashGiven(grandTotal);
    }
  }, [grandTotal, paymentMethod]);

  if (!isOpen) return null;

  // Available catalog products filtered
  const filteredCatalog = products.filter((p) => {
    if (!p.isActive) return false;
    if (catalogTab === 'SPAREPART' && p.itemType !== 'SPAREPART') return false;
    if (catalogTab === 'JASA' && p.itemType !== 'JASA') return false;

    if (catalogSearch.trim()) {
      const q = catalogSearch.toLowerCase().trim();
      return (
        p.name.toLowerCase().includes(q) ||
        p.barcode.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleAddItemFromCatalog = (product: Product) => {
    const existingIndex = selectedItems.findIndex((i) => i.productId === product.id);
    if (existingIndex !== -1) {
      // Increment quantity
      setSelectedItems((prev) =>
        prev.map((item, idx) =>
          idx === existingIndex
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // Add new
      setSelectedItems((prev) => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          productId: product.id,
          name: product.name,
          category: product.category,
          itemType: product.itemType || (product.buyPrice === 0 ? 'JASA' : 'SPAREPART'),
          buyPrice: product.buyPrice || 0,
          sellPrice: product.sellPrice || 0,
          quantity: 1,
          unit: product.unit || (product.itemType === 'JASA' ? 'jasa' : 'pcs'),
          availableStock: product.stock,
          mechanicName: selectedMechanic,
        },
      ]);
    }
    sound.playBeep(700, 0.03);
  };

  const handleAddCustomItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customItemName.trim()) return;

    const isSparepart = customItemType === 'SPAREPART';
    const buyPrice = isSparepart ? Number(customItemBuyPrice) || 0 : 0;
    const sellPrice = Number(customItemSellPrice) || 0;

    setSelectedItems((prev) => [
      ...prev,
      {
        id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        name: customItemName.trim(),
        category: isSparepart ? 'Sparepart Khusus' : 'Jasa Servis Khusus',
        itemType: customItemType,
        buyPrice,
        sellPrice,
        quantity: Math.max(1, Number(customItemQty) || 1),
        unit: customItemUnit || (isSparepart ? 'pcs' : 'jasa'),
        mechanicName: selectedMechanic,
      },
    ]);

    // Reset custom form
    setCustomItemName('');
    setCustomItemBuyPrice(0);
    setCustomItemSellPrice(0);
    setCustomItemQty(1);
    setIsCustomItemOpen(false);
    sound.playSuccess();
  };

  const handleUpdateItemQty = (id: string, newQty: number) => {
    if (newQty <= 0) {
      handleRemoveItem(id);
      return;
    }
    setSelectedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: newQty } : item))
    );
  };

  const handleRemoveItem = (id: string) => {
    setSelectedItems((prev) => prev.filter((item) => item.id !== id));
    sound.playBeep(450, 0.04);
  };

  // Submit and finalize the transaction
  const handleSubmitTransaction = (e: React.FormEvent) => {
    e.preventDefault();

    if (!vehiclePlate.trim()) {
      sound.playError();
      alert('Mohon isi Plat Nomor Kendaraan terlebih dahulu!');
      return;
    }

    const effectiveMechanic = isAddingNewMechanic
      ? customMechanicInput.trim()
      : selectedMechanic;

    if (!effectiveMechanic) {
      sound.playError();
      alert('Mohon pilih atau masukkan Nama Mekanik yang bertugas!');
      return;
    }

    // Simpan otomatis ke daftar mekanik aktif jika input nama baru
    if (isAddingNewMechanic && customMechanicInput.trim()) {
      db.addMechanic(customMechanicInput.trim());
    }

    if (selectedItems.length === 0) {
      sound.playError();
      alert('Pilih minimal 1 item Sparepart atau Jasa Servis!');
      return;
    }

    if (paymentMethod === 'TUNAI' && cashGiven < grandTotal) {
      sound.playError();
      alert(`Uang tunai pembayaran kurang! Total: ${formatRupiah(grandTotal)}, Diterima: ${formatRupiah(cashGiven)}`);
      return;
    }

    const isTempo = paymentMethod === 'KASBON' || (paymentMethod as string) === 'TEMPO';
    if (isTempo && !customerName.trim() && !vehiclePlate.trim()) {
      sound.playError();
      alert('Untuk pembayaran Tempo / Hutang, wajib mencantumkan Plat Nomor atau Nama Pelanggan!');
      return;
    }

    setIsSubmitting(true);

    const nowIso = new Date().toISOString();
    const invoiceNumber = `INV-${new Date().getFullYear()}${(new Date().getMonth() + 1)
      .toString()
      .padStart(2, '0')}${new Date().getDate().toString().padStart(2, '0')}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;

    // Prepare Transaction Items
    const trxItems: TransactionItem[] = selectedItems.map((item) => {
      const itemSubtotal = item.sellPrice * item.quantity;
      const itemCost = item.itemType === 'SPAREPART' ? item.buyPrice * item.quantity : 0;
      const itemProfit = itemSubtotal - itemCost;

      // Deduct stock in local inventory for SPAREPART only!
      if (item.itemType === 'SPAREPART' && item.productId && onAdjustStock) {
        onAdjustStock(
          item.productId,
          -item.quantity,
          `Terjual pada Servis Kendaraan ${vehiclePlate.toUpperCase()} (Faktur ${invoiceNumber})`
        );
      }

      return {
        productId: item.productId || `custom-${Date.now()}`,
        productName: item.name,
        barcode: item.productId || 'CUSTOM',
        category: item.category,
        itemType: item.itemType,
        buyPrice: item.itemType === 'SPAREPART' ? item.buyPrice : 0,
        sellPrice: item.sellPrice,
        quantity: item.quantity,
        unit: item.unit,
        discount: 0,
        subtotal: itemSubtotal,
        profit: itemProfit,
        mechanicName: item.mechanicName || effectiveMechanic,
      };
    });

    const parsedOdometer = typeof odometerKm === 'number' && odometerKm > 0 ? odometerKm : undefined;

    const newTransaction: Transaction = {
      id: `trx-${Date.now()}`,
      invoiceNumber,
      date: nowIso,
      cashierId: currentUser?.id || 'kasir-bengkel-1',
      cashierName: currentUser?.name || 'Kasir Bengkel',
      branchId: activeBranch.id,
      branchName: activeBranch.name,

      // Bengkel Specific Fields
      vehiclePlate: vehiclePlate.toUpperCase().trim(),
      mechanicName: effectiveMechanic,
      vehicleModel: vehicleModel.trim() || undefined,
      odometerKm: parsedOdometer,
      sparepartTotal,
      serviceTotal,

      // Detail Servis Tempo / Kasbon (Prompt 5)
      downPayment: isTempo ? Number(downPayment) : undefined,
      remainingDebt: isTempo ? remainingDebt : undefined,
      dueDate: isTempo ? dueDate : undefined,

      items: trxItems,
      totalQuantity: trxItems.reduce((acc, i) => acc + i.quantity, 0),
      subtotal: grandTotal,
      discount: 0,
      grandTotal,
      totalCost,
      totalProfit,
      paymentMethod,
      cashAmount:
        paymentMethod === 'TUNAI'
          ? cashGiven
          : isTempo
          ? Number(downPayment)
          : grandTotal,
      changeAmount: paymentMethod === 'TUNAI' ? Math.max(0, cashGiven - grandTotal) : 0,
      customerName: customerName.trim() || undefined,
      customerPhone: customerPhone.trim() || undefined,
      notes: notes.trim() || undefined,
      status: 'COMPLETED',
    };

    onCompleteTransaction(newTransaction);
    sound.playSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-zinc-950/85 backdrop-blur-md overflow-y-auto">
      <div
        className={`w-full max-w-4xl rounded-2xl shadow-2xl border my-4 flex flex-col max-h-[92vh] overflow-hidden ${
          darkMode ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-white border-zinc-200 text-zinc-900'
        }`}
      >
        {/* Top Header */}
        <div className="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl">
              🔧
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-black text-base tracking-tight text-zinc-900 dark:text-zinc-100">
                  Formulir Transaksi Kasir Bengkel
                </h2>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-[10px] font-mono font-black uppercase">
                  Servis &amp; Part
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Catat Plat Nomor, Mekanik, Sparepart (stok berkurang) &amp; Jasa Servis (tanpa stok)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <form onSubmit={handleSubmitTransaction} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Section 1: Data Kendaraan & Mekanik */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3.5">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Car className="w-4 h-4" />
                <span>1. Data Kendaraan &amp; Mekanik</span>
              </span>
              <span className="text-[10px] text-zinc-400 font-mono">
                Cabang: <strong className="text-zinc-200">{activeBranch.name}</strong>
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Plat Nomor Kendaraan */}
              <div>
                <label className="block text-sm font-black text-zinc-200 mb-1.5">
                  Plat Nomor Kendaraan: <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    value={vehiclePlate}
                    onChange={(e) => setVehiclePlate(e.target.value.toUpperCase())}
                    placeholder="B 1234 ABC"
                    className="w-full px-4 py-3 rounded-xl border font-mono font-black text-base bg-zinc-900 border-zinc-700 text-amber-400 placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 uppercase tracking-wider"
                    autoFocus
                  />
                </div>
              </div>

              {/* Nama Mekanik */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-black text-zinc-200">
                    Nama Mekanik: <span className="text-rose-400">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setIsAddingNewMechanic(!isAddingNewMechanic)}
                    className="text-xs font-bold text-amber-400 hover:underline cursor-pointer"
                  >
                    {isAddingNewMechanic ? 'Pilih List' : '+ Ketik Baru'}
                  </button>
                </div>

                {isAddingNewMechanic ? (
                  <input
                    type="text"
                    required
                    value={customMechanicInput}
                    onChange={(e) => setCustomMechanicInput(e.target.value)}
                    placeholder="Nama mekanik..."
                    className="w-full px-4 py-3 rounded-xl border text-sm font-bold bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  />
                ) : (
                  <select
                    value={selectedMechanic}
                    onChange={(e) => setSelectedMechanic(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl border text-sm font-bold bg-zinc-900 border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                  >
                    {mechanicsList.map((mech) => (
                      <option key={mech} value={mech}>
                        👨‍🔧 {mech}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Model / Tipe Kendaraan */}
              <div>
                <label className="block text-sm font-black text-zinc-200 mb-1.5">
                  Model Motor / Mobil:
                </label>
                <input
                  type="text"
                  value={vehicleModel}
                  onChange={(e) => setVehicleModel(e.target.value)}
                  placeholder="Vario 150 / Avanza / Beat"
                  className="w-full px-4 py-3 rounded-xl border text-sm font-bold bg-zinc-900 border-zinc-700 text-white placeholder-zinc-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                />
              </div>
            </div>

            {/* Customer Name, Phone & Odometer KM (Prompt 3) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 pt-1.5">
              <div>
                <label className="block text-sm font-black text-zinc-200 mb-1.5">
                  Nama Pelanggan (Opsional):
                </label>
                <input
                  type="text"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Contoh: Pak Budi"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-zinc-200 mb-1.5">
                  No. WhatsApp Pelanggan:
                </label>
                <input
                  type="tel"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  placeholder="08123456789"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500 font-bold"
                />
              </div>
              <div>
                <label className="block text-sm font-black text-emerald-400 mb-1.5 font-mono">
                  KM Kendaraan (Odometer):
                </label>
                <input
                  type="number"
                  min={0}
                  value={odometerKm}
                  onChange={(e) => setOdometerKm(e.target.value ? Number(e.target.value) : '')}
                  placeholder="Contoh: 25000"
                  className="w-full px-4 py-2.5 rounded-xl border text-sm font-mono bg-zinc-900 border-zinc-800 text-emerald-400 placeholder-zinc-600 focus:outline-none focus:border-emerald-500 font-bold"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pemilihan Item (Sparepart & Jasa Servis) */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3.5">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-2">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Wrench className="w-4 h-4" />
                <span>2. Tambah Sparepart &amp; Jasa Servis</span>
              </span>

              {/* Fast Toggle: Catalog Filter */}
              <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setCatalogTab('ALL')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    catalogTab === 'ALL' ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  Semua
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTab('SPAREPART')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    catalogTab === 'SPAREPART' ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>🔧</span>
                  <span>Sparepart (Stok)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setCatalogTab('JASA')}
                  className={`px-2.5 py-1 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                    catalogTab === 'JASA' ? 'bg-amber-500 text-zinc-950 font-black' : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <span>⚡</span>
                  <span>Jasa Servis</span>
                </button>
              </div>
            </div>

            {/* Quick Catalog Search & Add Custom Button */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Cari sparepart (oli, kampas rem, busi, ban) atau jasa (tune up, ganti oli)..."
                className="flex-1 px-3.5 py-2 rounded-xl border text-xs bg-zinc-900 border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
              />
              <button
                type="button"
                onClick={() => setIsCustomItemOpen(!isCustomItemOpen)}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Item Kustom</span>
              </button>
            </div>

            {/* Custom Item Form Accordion */}
            {isCustomItemOpen && (
              <div className="p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-black text-amber-400 uppercase tracking-wide">
                    Input Item Cepat (Tanpa Masuk Katalog)
                  </div>
                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800 text-xs">
                    <button
                      type="button"
                      onClick={() => setCustomItemType('SPAREPART')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        customItemType === 'SPAREPART' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
                      }`}
                    >
                      🔧 Sparepart
                    </button>
                    <button
                      type="button"
                      onClick={() => setCustomItemType('JASA')}
                      className={`px-2 py-0.5 rounded font-bold cursor-pointer ${
                        customItemType === 'JASA' ? 'bg-amber-500 text-zinc-950' : 'text-zinc-400'
                      }`}
                    >
                      ⚡ Jasa Servis
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-zinc-400 mb-0.5">
                      Nama Item / Jasa:
                    </label>
                    <input
                      type="text"
                      value={customItemName}
                      onChange={(e) => setCustomItemName(e.target.value)}
                      placeholder={customItemType === 'SPAREPART' ? 'Contoh: Baut Knalpot 12mm' : 'Contoh: Jasa Bubut Piringan'}
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs bg-zinc-900 border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>

                  {customItemType === 'SPAREPART' && (
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-0.5">
                        Harga Modal (Beli):
                      </label>
                      <input
                        type="number"
                        value={customItemBuyPrice || ''}
                        onChange={(e) => setCustomItemBuyPrice(Number(e.target.value))}
                        placeholder="Rp 0"
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-bold text-zinc-400 mb-0.5">
                      {customItemType === 'SPAREPART' ? 'Harga Jual:' : 'Tarif Jasa:'}
                    </label>
                    <input
                      type="number"
                      value={customItemSellPrice || ''}
                      onChange={(e) => setCustomItemSellPrice(Number(e.target.value))}
                      placeholder="Rp 0"
                      className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-amber-400 focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCustomItemOpen(false)}
                    className="px-3 py-1 rounded-lg text-xs text-zinc-400 hover:text-white"
                  >
                    Batal
                  </button>
                  <button
                    type="button"
                    onClick={handleAddCustomItem}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs cursor-pointer shadow-sm"
                  >
                    + Masukkan ke Daftar Transaksi
                  </button>
                </div>
              </div>
            )}

            {/* Quick Catalog Chips / List for fast selection */}
            <div className="max-h-40 overflow-y-auto space-y-1.5 pr-1 scrollbar-thin">
              <div className="text-[11px] font-bold text-zinc-500 font-mono mb-1">
                KLIK ITEM DI BAWAH INI UNTUK MENAMBAHKAN:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {filteredCatalog.slice(0, 15).map((prod) => {
                  const isSparepart = prod.itemType === 'SPAREPART';
                  return (
                    <button
                      key={prod.id}
                      type="button"
                      onClick={() => handleAddItemFromCatalog(prod)}
                      className="p-2 rounded-xl border text-left flex items-center justify-between gap-2 bg-zinc-900 hover:bg-zinc-800/80 border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer group"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs">
                            {isSparepart ? '🔧' : '⚡'}
                          </span>
                          <span className="text-xs font-bold text-zinc-200 group-hover:text-amber-400 truncate">
                            {prod.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-zinc-400 font-mono mt-0.5">
                          <span className="font-bold text-amber-400">
                            {formatRupiah(prod.sellPrice)}
                          </span>
                          {isSparepart ? (
                            <span className="text-zinc-500">
                              Stok: <strong className="text-zinc-300">{prod.stock}</strong>
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-bold">
                              Jasa
                            </span>
                          )}
                        </div>
                      </div>
                      <Plus className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 shrink-0" />
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Section 3: Daftar Item yang Dipilih dalam Transaksi Ini */}
          <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950/60 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <div className="text-xs font-black text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Tag className="w-4 h-4" />
                <span>3. Rincian Item Pengerjaan ({selectedItems.length} Item)</span>
              </div>
              <div className="text-xs text-zinc-400 font-mono">
                Sparepart: <strong className="text-white">{formatRupiah(sparepartTotal)}</strong> | Jasa: <strong className="text-white">{formatRupiah(serviceTotal)}</strong>
              </div>
            </div>

            {selectedItems.length === 0 ? (
              <div className="p-6 text-center text-zinc-500 text-xs border border-dashed border-zinc-800 rounded-xl">
                Belum ada sparepart atau jasa yang dimasukkan. Pilih dari katalog di atas atau tambah item kustom.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-zinc-800 text-[10px] font-black uppercase text-zinc-400 font-mono">
                      <th className="py-2 px-2">Jenis</th>
                      <th className="py-2 px-2">Nama Item / Jasa</th>
                      <th className="py-2 px-2 text-right">Modal</th>
                      <th className="py-2 px-2 text-right">Harga Jual / Tarif</th>
                      <th className="py-2 px-2 text-center">Jumlah</th>
                      <th className="py-2 px-2 text-right">Subtotal</th>
                      <th className="py-2 px-2 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60 font-mono">
                    {selectedItems.map((item) => {
                      const isSparepart = item.itemType === 'SPAREPART';
                      const itemSubtotal = item.sellPrice * item.quantity;
                      return (
                        <tr key={item.id} className="hover:bg-zinc-900/50">
                          <td className="py-2 px-2 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                                isSparepart
                                  ? 'bg-blue-500/15 text-blue-400 border border-blue-500/30'
                                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                              }`}
                            >
                              {isSparepart ? '🔧 SPAREPART' : '⚡ JASA'}
                            </span>
                          </td>
                          <td className="py-2 px-2 font-sans font-bold text-zinc-200">
                            <div>{item.name}</div>
                            {isSparepart && item.availableStock !== undefined && (
                              <div className="text-[10px] text-zinc-500 font-mono">
                                Stok berkurang: {item.availableStock} ➔ {item.availableStock - item.quantity}
                              </div>
                            )}
                            {!isSparepart && (
                              <div className="text-[10px] text-emerald-400 font-mono">
                                Tarif Jasa (Tanpa pengurangan stok)
                              </div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-right text-zinc-400">
                            {isSparepart ? formatRupiah(item.buyPrice) : '-'}
                          </td>
                          <td className="py-2 px-2 text-right font-bold text-zinc-200">
                            {formatRupiah(item.sellPrice)}
                          </td>
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 bg-zinc-900 border border-zinc-700 rounded-lg px-2 py-1">
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.id, item.quantity - 1)}
                                className="text-zinc-400 hover:text-white font-bold cursor-pointer"
                              >
                                -
                              </button>
                              <span className="font-bold text-xs w-6 text-center">
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleUpdateItemQty(item.id, item.quantity + 1)}
                                className="text-zinc-400 hover:text-white font-bold cursor-pointer"
                              >
                                +
                              </button>
                            </div>
                          </td>
                          <td className="py-2 px-2 text-right font-black text-amber-400">
                            {formatRupiah(itemSubtotal)}
                          </td>
                          <td className="py-2 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(item.id)}
                              className="p-1 rounded text-zinc-500 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Ringkasan Biaya & Pembayaran */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left: Financial Breakdown */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-2 text-xs font-mono">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-2">
                Ringkasan Laba Kotor Transaksi
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400">Total Belanja Sparepart:</span>
                <span className="font-bold text-zinc-200">{formatRupiah(sparepartTotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80">
                <span className="text-zinc-400">Total Ongkos Jasa Servis:</span>
                <span className="font-bold text-zinc-200">{formatRupiah(serviceTotal)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-zinc-800/80 text-rose-400">
                <span>Modal Sparepart (HPP):</span>
                <span>- {formatRupiah(totalCost)}</span>
              </div>
              <div className="flex justify-between py-1.5 border-t border-zinc-700 text-sm">
                <span className="font-bold text-zinc-300">Estimasi Laba Kotor:</span>
                <span className="font-black text-emerald-400">+{formatRupiah(totalProfit)}</span>
              </div>
              <div className="flex justify-between py-2 bg-amber-500/10 border border-amber-500/20 px-3 rounded-xl mt-2">
                <span className="font-black text-amber-400 text-sm">TOTAL TAGIHAN:</span>
                <span className="font-black text-amber-400 text-base">{formatRupiah(grandTotal)}</span>
              </div>
            </div>

            {/* Right: Payment Method & Cash Received */}
            <div className="p-4 rounded-xl border border-zinc-800 bg-zinc-950 space-y-3 text-xs">
              <div className="text-[11px] font-black uppercase tracking-wider text-amber-400">
                Metode Pembayaran
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5 font-bold text-xs">
                {(
                  [
                    { id: 'TUNAI', label: '💵 Tunai' },
                    { id: 'QRIS', label: '📱 QRIS' },
                    { id: 'TRANSFER_BANK', label: '🏦 Transfer' },
                    { id: 'KASBON', label: '⏳ Tempo / Hutang' },
                  ] as const
                ).map(({ id, label }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => {
                      setPaymentMethod(id as PaymentMethod);
                      if (id === 'TUNAI') setCashGiven(grandTotal);
                      if (id === 'KASBON') setDownPayment(0);
                    }}
                    className={`py-2 px-1 text-center rounded-xl border transition-all cursor-pointer ${
                      paymentMethod === id
                        ? id === 'KASBON'
                          ? 'bg-rose-600 text-white border-rose-600 font-black shadow-md'
                          : 'bg-amber-500 text-zinc-950 border-amber-500 font-black shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* Cash given input if Tunai */}
              {paymentMethod === 'TUNAI' && (
                <div className="space-y-2 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-zinc-400">
                      Uang Tunai Diterima:
                    </label>
                    <div className="flex gap-1">
                      <button
                        type="button"
                        onClick={() => setCashGiven(grandTotal)}
                        className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-amber-400 hover:bg-zinc-700 font-bold"
                      >
                        Uang Pas
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={cashGiven || ''}
                    onChange={(e) => setCashGiven(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border text-sm font-mono font-bold bg-zinc-900 border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                    placeholder="Rp 0"
                  />
                  <div className="flex justify-between items-center text-xs font-mono font-bold pt-1">
                    <span className="text-zinc-400">Kembalian:</span>
                    <span className={`text-sm ${cashGiven >= grandTotal ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {formatRupiah(Math.max(0, cashGiven - grandTotal))}
                    </span>
                  </div>
                </div>
              )}

              {/* PROMPT 5: Form Servis Tempo / Hutang (DP, Sisa Hutang, Jatuh Tempo) */}
              {(paymentMethod === 'KASBON' || (paymentMethod as string) === 'TEMPO') && (
                <div className="p-3 bg-rose-950/20 border border-rose-800/60 rounded-xl space-y-2.5 pt-2 animate-in fade-in">
                  <div className="text-[11px] font-black text-rose-400 uppercase tracking-wider font-mono flex items-center justify-between">
                    <span>Kasbon / Servis Tempo Pelanggan</span>
                    <span className="text-[10px] text-zinc-400">Tercatat di Buku Piutang</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Uang Muka (DP):
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={grandTotal}
                        value={downPayment || ''}
                        onChange={(e) => setDownPayment(Number(e.target.value))}
                        placeholder="Rp 0 (Jika tanpa DP)"
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold bg-zinc-900 border-zinc-700 text-emerald-400"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                        Jatuh Tempo:
                      </label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-zinc-900 border-zinc-700 text-white"
                      />
                    </div>
                  </div>

                  {/* Sisa Hutang Terhitung Otomatis */}
                  <div className="flex items-center justify-between pt-1 border-t border-rose-900/60 text-xs">
                    <span className="font-bold text-zinc-400">Sisa Hutang Pelanggan:</span>
                    <span className="text-base font-black font-mono text-rose-400">
                      {formatRupiah(remainingDebt)}
                    </span>
                  </div>
                </div>
              )}

              {/* Catatan Servis */}
              <div>
                <label className="block text-[11px] font-bold text-zinc-400 mb-1">
                  Catatan Pengerjaan / Keluhan Pelanggan:
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Oli sudah diganti, tarikan enteng, garansi servis 7 hari"
                  className="w-full px-3 py-2 rounded-xl border text-xs bg-zinc-900 border-zinc-800 text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 border-t border-zinc-800 flex items-center justify-end gap-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2.5 rounded-xl border border-zinc-700 text-zinc-300 hover:bg-zinc-800 font-bold text-xs cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || selectedItems.length === 0}
              className={`px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all ${
                selectedItems.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Selesaikan Transaksi &amp; Cetak Struk ({formatRupiah(grandTotal)})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
