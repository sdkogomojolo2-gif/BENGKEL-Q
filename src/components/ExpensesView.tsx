import React, { useState, useMemo } from 'react';
import {
  Wallet,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Search,
  FileSpreadsheet,
  FileText,
  AlertCircle,
  CheckCircle2,
  Filter,
  DollarSign,
  TrendingDown,
  Building2,
  Clock,
  Tag,
  Fuel,
  Utensils,
  Zap,
  Wrench,
  HelpCircle,
  X,
  Layers,
} from 'lucide-react';
import {
  OperationalExpense,
  ExpenseCategory,
  StoreSettings,
  StoreBranch,
  CashierUser,
} from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';
import { sound } from '../services/sound';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExpensesViewProps {
  expenses: OperationalExpense[];
  onAddExpense: (expense: OperationalExpense, deductFromCashDrawer: boolean) => void;
  onUpdateExpense: (expense: OperationalExpense) => void;
  onDeleteExpense: (id: string) => void;
  activeBranch?: StoreBranch;
  settings: StoreSettings;
  currentUser: CashierUser | null;
  darkMode: boolean;
}

const CATEGORY_CONFIG: Record<
  ExpenseCategory,
  { label: string; icon: string; color: string; badge: string; desc: string }
> = {
  'Bensin/Solar': {
    label: 'Bensin/Solar',
    icon: '⛽',
    color: 'text-amber-400',
    badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    desc: 'Bensin cuci karburator/mesin, bahan bakar kompresor',
  },
  'Makan Mekanik': {
    label: 'Makan Mekanik',
    icon: '🍜',
    color: 'text-rose-400',
    badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
    desc: 'Uang makan siang, minum, kopi & snack para mekanik',
  },
  'Listrik': {
    label: 'Listrik',
    icon: '⚡',
    color: 'text-yellow-400',
    badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    desc: 'Token listrik PLN, daya kompresor angin, penerangan',
  },
  'Beli Alat': {
    label: 'Beli Alat',
    icon: '🧰',
    color: 'text-blue-400',
    badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    desc: 'Kunci-kunci, obeng, tracker, tang, alat bengkel baru',
  },
  'Lain-lain': {
    label: 'Lain-lain',
    icon: '📝',
    color: 'text-zinc-400',
    badge: 'bg-zinc-500/15 text-zinc-300 border-zinc-500/30',
    desc: 'Kain majun, sabun cuci tangan, air galon, kebersihan',
  },
};

const CATEGORIES: ExpenseCategory[] = [
  'Bensin/Solar',
  'Makan Mekanik',
  'Listrik',
  'Beli Alat',
  'Lain-lain',
];

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  expenses = [],
  onAddExpense,
  onUpdateExpense,
  onDeleteExpense,
  activeBranch,
  settings,
  currentUser,
  darkMode,
}) => {
  // Filter States
  const [periodFilter, setPeriodFilter] = useState<'TODAY' | 'THIS_MONTH' | '7DAYS' | 'ALL'>('THIS_MONTH');
  const [selectedCategory, setSelectedCategory] = useState<'ALL' | ExpenseCategory>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Form State for New Expense
  const [formDate, setFormDate] = useState(() => new Date().toISOString().slice(0, 16));
  const [formCategory, setFormCategory] = useState<ExpenseCategory>('Makan Mekanik');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formAmountInput, setFormAmountInput] = useState<string>('');
  const [formNotes, setFormNotes] = useState<string>('');
  const [deductDrawer, setDeductDrawer] = useState<boolean>(true);

  // Edit Modal State
  const [editingExpense, setEditingExpense] = useState<OperationalExpense | null>(null);

  // Quick denomination helper
  const handleSelectQuickAmount = (val: number) => {
    setFormAmount(val);
    setFormAmountInput(String(val));
    sound.playBeep(700, 0.03);
  };

  // Filtered expenses list
  const filteredExpenses = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const sevenDaysAgo = todayStart - 7 * 24 * 60 * 60 * 1000;

    return expenses.filter((item) => {
      const itemTime = new Date(item.date).getTime();

      let matchPeriod = true;
      if (periodFilter === 'TODAY') matchPeriod = itemTime >= todayStart;
      else if (periodFilter === 'THIS_MONTH') matchPeriod = itemTime >= monthStart;
      else if (periodFilter === '7DAYS') matchPeriod = itemTime >= sevenDaysAgo;

      let matchCat = true;
      if (selectedCategory !== 'ALL') matchCat = item.category === selectedCategory;

      let matchQuery = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        matchQuery =
          item.notes.toLowerCase().includes(q) ||
          item.category.toLowerCase().includes(q) ||
          (item.cashierName && item.cashierName.toLowerCase().includes(q));
      }

      return matchPeriod && matchCat && matchQuery;
    });
  }, [expenses, periodFilter, selectedCategory, searchQuery]);

  // Overall Financial Metric calculations
  const todayTotal = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayTime = today.getTime();
    return expenses
      .filter((e) => new Date(e.date).getTime() >= todayTime)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const monthTotal = useMemo(() => {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    return expenses
      .filter((e) => new Date(e.date).getTime() >= monthStart)
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses]);

  const filteredTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  // Category breakdown for charts & summary
  const categoryBreakdown = useMemo(() => {
    const map: Record<ExpenseCategory, number> = {
      'Bensin/Solar': 0,
      'Makan Mekanik': 0,
      'Listrik': 0,
      'Beli Alat': 0,
      'Lain-lain': 0,
    };
    filteredExpenses.forEach((e) => {
      if (map[e.category] !== undefined) {
        map[e.category] += e.amount;
      } else {
        map['Lain-lain'] += e.amount;
      }
    });
    return map;
  }, [filteredExpenses]);

  // Submit New Expense
  const handleCreateExpense = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formAmount || formAmount <= 0) {
      sound.playError();
      alert('Mohon masukkan nominal pengeluaran yang valid!');
      return;
    }

    if (!formNotes.trim()) {
      sound.playError();
      alert('Mohon isi catatan atau keterangan pengeluaran!');
      return;
    }

    const newExpense: OperationalExpense = {
      id: `exp-${Date.now()}`,
      date: new Date(formDate).toISOString(),
      category: formCategory,
      amount: Number(formAmount),
      notes: formNotes.trim(),
      cashierName: currentUser?.name || 'Kasir Bengkel',
      branchId: activeBranch?.id || 'branch-pusat',
      createdAt: new Date().toISOString(),
    };

    onAddExpense(newExpense, deductDrawer);
    sound.playSuccess();

    // Reset Form
    setFormAmount(0);
    setFormAmountInput('');
    setFormNotes('');
    setFormDate(new Date().toISOString().slice(0, 16));
  };

  // Submit Edit
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingExpense) return;

    onUpdateExpense(editingExpense);
    sound.playSuccess();
    setEditingExpense(null);
  };

  // Export to Excel
  const handleExportExcel = () => {
    try {
      const rows = filteredExpenses.map((e, idx) => ({
        No: idx + 1,
        Tanggal: formatDateIndo(e.date),
        Kategori: e.category,
        Nominal: e.amount,
        Catatan: e.notes,
        Petugas: e.cashierName || '-',
      }));

      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Kas_Keluar_Bengkel');
      XLSX.writeFile(
        wb,
        `Kas_Keluar_Bengkel_${new Date().toISOString().slice(0, 10)}.xlsx`
      );
      sound.playSuccess();
    } catch (err) {
      console.error(err);
      sound.playError();
      alert('Gagal mengekspor data Excel.');
    }
  };

  // Export to PDF
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFontSize(14);
      doc.text(
        `${settings.storeName || 'BENGKEL MOTOR & MOBIL'} - BUKU KAS OPERASIONAL`,
        14,
        15
      );
      doc.setFontSize(10);
      doc.text(
        `Periode: ${
          periodFilter === 'TODAY'
            ? 'Hari Ini'
            : periodFilter === 'THIS_MONTH'
            ? 'Bulan Ini'
            : periodFilter === '7DAYS'
            ? '7 Hari Terakhir'
            : 'Semua Periode'
        } | Dicetak: ${formatDateIndo(new Date().toISOString())}`,
        14,
        22
      );

      const tableData = filteredExpenses.map((e, idx) => [
        idx + 1,
        formatDateIndo(e.date),
        e.category,
        e.notes,
        formatRupiah(e.amount),
        e.cashierName || '-',
      ]);

      autoTable(doc, {
        head: [['No', 'Tanggal', 'Kategori', 'Catatan / Keterangan', 'Nominal', 'Petugas']],
        body: tableData,
        startY: 28,
        theme: 'grid',
        headStyles: { fillColor: [245, 158, 11], textColor: [9, 9, 11], fontStyle: 'bold' },
        foot: [['', '', '', 'TOTAL PENGELUARAN:', formatRupiah(filteredTotal), '']],
        footStyles: { fillColor: [24, 24, 27], textColor: [255, 255, 255], fontStyle: 'bold' },
      });

      doc.save(`Laporan_Kas_Keluar_Bengkel_${new Date().toISOString().slice(0, 10)}.pdf`);
      sound.playSuccess();
    } catch (err) {
      console.error(err);
      sound.playError();
      alert('Gagal mengekspor PDF.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-xl shadow-inner">
              <Wallet className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                <span>Operasional &amp; Kas Keluar</span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 text-xs font-mono font-bold">
                  Buku Kas Bengkel
                </span>
              </h1>
              <p className="text-xs text-zinc-400">
                Catat pengeluaran operasional bengkel: Bensin/Solar, Makan Mekanik, Listrik, Beli Alat, dan Lain-lain.
              </p>
            </div>
          </div>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span>Excel</span>
          </button>
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-zinc-300 hover:text-white flex items-center gap-1.5 cursor-pointer shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-rose-400" />
            <span>PDF</span>
          </button>
        </div>
      </div>

      {/* Hero Financial Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Card 1: Hari Ini */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Pengeluaran Hari Ini
            </div>
            <div className="text-xl font-black text-rose-400 font-mono mt-1">
              {formatRupiah(todayTotal)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Operasional harian berjalan
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Bulan Ini */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Total Bulan Ini
            </div>
            <div className="text-xl font-black text-amber-400 font-mono mt-1">
              {formatRupiah(monthTotal)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Akumulasi bulan berjalan
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Calendar className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Total Pada Filter Terpilih */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Total Periode Terpilih
            </div>
            <div className="text-xl font-black text-white font-mono mt-1">
              {formatRupiah(filteredTotal)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              {filteredExpenses.length} catatan pengeluaran
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300">
            <TrendingDown className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Saldo Kas Laci Fisik Tersedia */}
        <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-zinc-100 flex items-center justify-between shadow-sm">
          <div>
            <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Kas Laci Tunai Bengkel
            </div>
            <div className="text-xl font-black text-emerald-400 font-mono mt-1">
              {formatRupiah(activeBranch?.cashDrawerBalance || 0)}
            </div>
            <div className="text-[10px] text-zinc-500 font-mono mt-0.5">
              Uang kas fisik di meja kasir
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Building2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Content Layout: Form Input on Left/Top, Table on Right/Bottom */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* LEFT COLUMN: Input Form Kas Keluar Bengkel */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="border-b border-zinc-800 pb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold text-sm">
                +
              </span>
              <h2 className="font-black text-sm text-white tracking-wide uppercase">
                Input Kas Keluar Baru
              </h2>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              Form Pengeluaran Bengkel
            </span>
          </div>

          <form onSubmit={handleCreateExpense} className="space-y-4 text-xs">
            {/* Field 1: Tanggal */}
            <div>
              <label className="block font-bold text-zinc-300 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                <span>Tanggal &amp; Jam:</span>
              </label>
              <input
                type="datetime-local"
                required
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono font-bold text-xs focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Field 2: Kategori Biaya */}
            <div>
              <label className="block font-bold text-zinc-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>Kategori Biaya Pengeluaran:</span>
                </span>
                <span className="text-[10px] text-amber-400 font-mono font-bold">
                  {CATEGORY_CONFIG[formCategory].icon} {formCategory}
                </span>
              </label>

              {/* Quick Category Buttons */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
                {CATEGORIES.map((cat) => {
                  const cfg = CATEGORY_CONFIG[cat];
                  const isSelected = formCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => {
                        setFormCategory(cat);
                        sound.playBeep(650, 0.03);
                      }}
                      className={`p-2 rounded-xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 font-black border-amber-500 shadow-md'
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-sm shrink-0">{cfg.icon}</span>
                      <span className="truncate text-[11px]">{cat}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-zinc-400 italic">
                {CATEGORY_CONFIG[formCategory].desc}
              </p>
            </div>

            {/* Field 3: Nominal */}
            <div>
              <label className="block font-bold text-zinc-300 mb-1 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-amber-400" />
                  <span>Nominal Pengeluaran (Rp):</span>
                </span>
                {formAmount > 0 && (
                  <span className="text-xs font-mono font-black text-rose-400">
                    - {formatRupiah(formAmount)}
                  </span>
                )}
              </label>
              <input
                type="number"
                required
                min={100}
                value={formAmountInput}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormAmountInput(val);
                  setFormAmount(Number(val) || 0);
                }}
                placeholder="Contoh: 50000"
                className="w-full px-3.5 py-2.5 rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono font-black text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />

              {/* Quick Amount Chips */}
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[10000, 25000, 50000, 100000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => handleSelectQuickAmount(amt)}
                    className="py-1.5 px-1 rounded-lg bg-zinc-950 border border-zinc-800 hover:border-amber-500/50 text-[11px] font-mono font-bold text-zinc-300 hover:text-amber-400 transition-colors cursor-pointer text-center"
                  >
                    +{formatRupiah(amt).replace('Rp ', '')}
                  </button>
                ))}
              </div>
            </div>

            {/* Field 4: Catatan */}
            <div>
              <label className="block font-bold text-zinc-300 mb-1">
                Catatan / Keterangan Pengeluaran: <span className="text-rose-400">*</span>
              </label>
              <textarea
                required
                rows={3}
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                placeholder="Contoh: Beli bensin 3L untuk bersihkan CVT dan karburator motor pelanggan..."
                className="w-full px-3.5 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white placeholder-zinc-500 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Option: Potong Kas Laci */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-zinc-200 text-xs">
                  Potong Kas Laci Tunai Otomatis
                </div>
                <div className="text-[10px] text-zinc-400">
                  Uang diambil langsung dari laci kasir bengkel
                </div>
              </div>
              <input
                type="checkbox"
                checked={deductDrawer}
                onChange={(e) => setDeductDrawer(e.target.checked)}
                className="w-4 h-4 rounded text-amber-500 focus:ring-amber-400 bg-zinc-900 border-zinc-700"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 transition-all"
            >
              <CheckCircle2 className="w-5 h-5 stroke-[2.5]" />
              <span>Simpan Pengeluaran Kas ({formatRupiah(formAmount)})</span>
            </button>
          </form>
        </div>

        {/* RIGHT COLUMN: Table & Breakdown by Category */}
        <div className="lg:col-span-7 space-y-4">
          {/* Category Breakdown Progress Bar */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-zinc-300 font-mono uppercase tracking-wider">
                Proporsi Kategori Biaya ({periodFilter === 'TODAY' ? 'Hari Ini' : periodFilter === 'THIS_MONTH' ? 'Bulan Ini' : 'Periode'})
              </span>
              <span className="font-black text-amber-400 font-mono">
                Total: {formatRupiah(filteredTotal)}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-xs font-mono">
              {CATEGORIES.map((cat) => {
                const amt = categoryBreakdown[cat] || 0;
                const pct = filteredTotal > 0 ? Math.round((amt / filteredTotal) * 100) : 0;
                const cfg = CATEGORY_CONFIG[cat];
                return (
                  <div
                    key={cat}
                    onClick={() => setSelectedCategory(selectedCategory === cat ? 'ALL' : cat)}
                    className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-zinc-800 border-amber-500 ring-1 ring-amber-500'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="text-sm">{cfg.icon}</div>
                    <div className="text-[10px] font-bold text-zinc-400 truncate mt-0.5">
                      {cat}
                    </div>
                    <div className="font-black text-[11px] text-white mt-0.5">
                      {formatRupiah(amt).replace('Rp ', '')}
                    </div>
                    <div className="text-[9px] text-zinc-400 mt-0.5">
                      {pct}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Table Container */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl shadow-xl overflow-hidden">
            {/* Filter Bar */}
            <div className="p-4 border-b border-zinc-800 bg-zinc-950/70 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                {/* Period Filter Buttons */}
                <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-xl border border-zinc-800 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('TODAY')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      periodFilter === 'TODAY'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Hari Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('THIS_MONTH')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      periodFilter === 'THIS_MONTH'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Bulan Ini
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('7DAYS')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      periodFilter === '7DAYS'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    7 Hari
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      periodFilter === 'ALL'
                        ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Semua
                  </button>
                </div>

                {/* Category Select Dropdown */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value as any)}
                  className="px-3 py-1.5 rounded-xl border text-xs font-bold bg-zinc-900 border-zinc-700 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ALL">Semua Kategori Biaya</option>
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_CONFIG[c].icon} {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari catatan pengeluaran, nama mekanik, atau keterangan..."
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl border text-xs bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-950/40 text-[10px] font-black uppercase text-zinc-400 font-mono">
                    <th className="py-3 px-3">Tanggal</th>
                    <th className="py-3 px-3">Kategori</th>
                    <th className="py-3 px-3">Catatan / Keterangan</th>
                    <th className="py-3 px-3 text-right">Nominal</th>
                    <th className="py-3 px-3 text-center">Petugas</th>
                    <th className="py-3 px-3 text-center">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800 font-mono">
                  {filteredExpenses.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-zinc-500 text-xs">
                        Tidak ada riwayat pengeluaran kas pada filter ini.
                      </td>
                    </tr>
                  ) : (
                    filteredExpenses.map((exp) => {
                      const cfg = CATEGORY_CONFIG[exp.category] || CATEGORY_CONFIG['Lain-lain'];
                      return (
                        <tr key={exp.id} className="hover:bg-zinc-800/40 transition-colors">
                          <td className="py-2.5 px-3 whitespace-nowrap text-zinc-400 text-[11px]">
                            {formatDateIndo(exp.date)}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${cfg.badge}`}
                            >
                              {cfg.icon} {exp.category}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans font-medium text-zinc-200 max-w-xs truncate">
                            {exp.notes}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-400 whitespace-nowrap">
                            - {formatRupiah(exp.amount)}
                          </td>
                          <td className="py-2.5 px-3 text-center text-[10px] text-zinc-400 whitespace-nowrap font-sans">
                            {exp.cashierName || 'Kasir'}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => setEditingExpense(exp)}
                                className="p-1 rounded text-zinc-400 hover:text-amber-400 hover:bg-zinc-800 cursor-pointer"
                                title="Edit Pengeluaran"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`Hapus catatan pengeluaran "${exp.notes}" (${formatRupiah(exp.amount)})?`)) {
                                    onDeleteExpense(exp.id);
                                    sound.playBeep(400, 0.05);
                                  }
                                }}
                                className="p-1 rounded text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 cursor-pointer"
                                title="Hapus Pengeluaran"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
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

            {/* Table Footer */}
            <div className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-400">
                Menampilkan {filteredExpenses.length} transaksi pengeluaran
              </span>
              <div className="flex items-center gap-2">
                <span className="text-zinc-400">Total Kas Keluar:</span>
                <span className="font-black text-rose-400 text-sm">
                  {formatRupiah(filteredTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Edit Pengeluaran */}
      {editingExpense && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between bg-zinc-950/80">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-amber-400" />
                <span>Edit Catatan Kas Keluar</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingExpense(null)}
                className="p-1 rounded text-zinc-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-zinc-300 mb-1">Tanggal:</label>
                <input
                  type="datetime-local"
                  required
                  value={editingExpense.date.slice(0, 16)}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      date: new Date(e.target.value).toISOString(),
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white font-mono text-xs"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Kategori Biaya:</label>
                <select
                  value={editingExpense.category}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      category: e.target.value as ExpenseCategory,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white font-bold"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_CONFIG[c].icon} {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Nominal (Rp):</label>
                <input
                  type="number"
                  required
                  value={editingExpense.amount}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      amount: Number(e.target.value) || 0,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-amber-400 font-mono font-black text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-zinc-300 mb-1">Catatan:</label>
                <textarea
                  required
                  rows={3}
                  value={editingExpense.notes}
                  onChange={(e) =>
                    setEditingExpense({
                      ...editingExpense,
                      notes: e.target.value,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl border border-zinc-700 bg-zinc-950 text-white text-xs resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setEditingExpense(null)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black cursor-pointer shadow-md"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
