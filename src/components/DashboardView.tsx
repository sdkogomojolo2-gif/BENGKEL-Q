import React, { useState, useMemo } from 'react';
import {
  Users,
  Package,
  Wallet,
  TrendingUp,
  Receipt,
  ShoppingCart,
  Clock,
  ArrowRight,
  PlusCircle,
  BookOpen,
  Building2,
  CreditCard,
  Smartphone,
  Zap,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  Coins,
  Wrench,
  Car,
  Fuel,
  Utensils,
  Hammer,
  HelpCircle,
  Calendar,
  Filter,
  CheckCircle2,
  DollarSign,
  AlertTriangle,
  ChevronRight,
  BarChart3,
  Award,
} from 'lucide-react';
import {
  Product,
  Transaction,
  CustomerDebt,
  CashierShift,
  StoreSettings,
  StoreBranch,
  CashierUser,
  OperationalExpense,
  ExpenseCategory,
} from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';
import { TabType } from './Sidebar';

interface DashboardViewProps {
  products: Product[];
  transactions: Transaction[];
  expenses: OperationalExpense[];
  debts: CustomerDebt[];
  activeShift: CashierShift | null;
  settings: StoreSettings;
  branches?: StoreBranch[];
  activeBranchId?: string;
  onSetActiveBranch?: (branchId: string) => void;
  darkMode: boolean;
  onNavigate: (tab: TabType) => void;
  onOpenShiftModal: () => void;
  onViewReceipt: (trx: Transaction) => void;
  currentUser?: CashierUser | null;
  onSelectCashierGroup?: (group: 'ALL' | 'DIGITAL' | 'FISIK') => void;
}

type PeriodFilterType = 'TODAY' | 'MONTH' | 'ALL' | 'CUSTOM';

export const DashboardView: React.FC<DashboardViewProps> = ({
  products,
  transactions,
  expenses = [],
  debts,
  activeShift,
  settings,
  branches = [],
  activeBranchId,
  onSetActiveBranch,
  darkMode,
  onNavigate,
  onOpenShiftModal,
  onViewReceipt,
  currentUser,
  onSelectCashierGroup,
}) => {
  // Period filter: default to 'TODAY' (Hari Ini), with options for 'MONTH' (Bulan Ini), 'ALL', 'CUSTOM'
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('TODAY');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  const isCashier = currentUser?.role === 'KASIR';
  const cashierBranchId = isCashier
    ? (currentUser?.branchId || activeBranchId || branches[0]?.id || 'branch-cabang-2')
    : null;

  const [selectedBranchFilter, setSelectedBranchFilter] = useState<string>('ALL');

  // Effective branch filter: for cashiers, ALWAYS strictly their assigned branch!
  const effectiveBranchFilter = isCashier ? cashierBranchId! : selectedBranchFilter;

  // Filter transactions by branch
  const branchTransactions = useMemo(() => {
    if (effectiveBranchFilter === 'ALL') return transactions;
    return transactions.filter((t) => t.branchId === effectiveBranchFilter);
  }, [transactions, effectiveBranchFilter]);

  // Filter expenses by branch
  const branchExpenses = useMemo(() => {
    if (effectiveBranchFilter === 'ALL') return expenses;
    return expenses.filter((e) => !e.branchId || e.branchId === effectiveBranchFilter);
  }, [expenses, effectiveBranchFilter]);

  // Determine date bounds based on periodFilter
  const periodBounds = useMemo(() => {
    const now = new Date();
    if (periodFilter === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start: start.getTime(), end: end.getTime(), label: 'Hari Ini' };
    }
    if (periodFilter === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return { start: start.getTime(), end: end.getTime(), label: `Bulan Ini (${monthNames[now.getMonth()]} ${now.getFullYear()})` };
    }
    if (periodFilter === 'CUSTOM') {
      const start = new Date(`${customStartDate}T00:00:00`).getTime();
      const end = new Date(`${customEndDate}T23:59:59.999`).getTime();
      return { start, end, label: `${customStartDate} s/d ${customEndDate}` };
    }
    // 'ALL'
    return { start: 0, end: Infinity, label: 'Semua Waktu' };
  }, [periodFilter, customStartDate, customEndDate]);

  // Filtered completed transactions within selected period
  const periodTransactions = useMemo(() => {
    return branchTransactions.filter((t) => {
      if (t.status !== 'COMPLETED') return false;
      const tTime = new Date(t.date).getTime();
      return tTime >= periodBounds.start && tTime <= periodBounds.end;
    });
  }, [branchTransactions, periodBounds]);

  // Filtered operational expenses within selected period
  const periodExpenses = useMemo(() => {
    return branchExpenses.filter((e) => {
      const eTime = new Date(e.date).getTime();
      return eTime >= periodBounds.start && eTime <= periodBounds.end;
    });
  }, [branchExpenses, periodBounds]);

  // ==========================================
  // 5 CORE METRICS FOR LANGKAH 3 (KASIR BENGKEL)
  // ==========================================

  // 1. Total Omzet = Total pendapatan dari Sparepart + Jasa Servis
  const totalOmzet = useMemo(() => {
    return periodTransactions.reduce((acc, t) => acc + t.grandTotal, 0);
  }, [periodTransactions]);

  // Breakdown: Omzet Sparepart vs Omzet Jasa
  const sparepartOmzet = useMemo(() => {
    return periodTransactions.reduce((acc, t) => {
      if (typeof t.sparepartTotal === 'number') {
        return acc + t.sparepartTotal;
      }
      // Fallback: sum items with itemType === 'SPAREPART'
      const partSum = t.items
        .filter((i) => i.itemType === 'SPAREPART' || (i.buyPrice > 0 && i.itemType !== 'JASA'))
        .reduce((sum, i) => sum + i.subtotal, 0);
      return acc + partSum;
    }, 0);
  }, [periodTransactions]);

  const serviceOmzet = useMemo(() => {
    return periodTransactions.reduce((acc, t) => {
      if (typeof t.serviceTotal === 'number') {
        return acc + t.serviceTotal;
      }
      // Fallback: sum items with itemType === 'JASA'
      const jasaSum = t.items
        .filter((i) => i.itemType === 'JASA' || (i.buyPrice === 0 && i.itemType !== 'SPAREPART'))
        .reduce((sum, i) => sum + i.subtotal, 0);
      return acc + jasaSum;
    }, 0);
  }, [periodTransactions]);

  // 2. Modal Sparepart Terjual (HPP) = Total harga modal/beli dari sparepart yang terjual (Jasa modalnya 0)
  const totalModalSparepart = useMemo(() => {
    return periodTransactions.reduce((acc, t) => {
      if (typeof t.totalCost === 'number') {
        return acc + t.totalCost;
      }
      // Fallback calculate buyPrice * qty
      const cost = t.items
        .filter((i) => i.itemType === 'SPAREPART' || (i.buyPrice > 0 && i.itemType !== 'JASA'))
        .reduce((sum, i) => sum + i.buyPrice * i.quantity, 0);
      return acc + cost;
    }, 0);
  }, [periodTransactions]);

  // 3. Laba Kotor = Total Omzet - Modal Sparepart Terjual
  const labaKotor = useMemo(() => {
    return Math.max(0, totalOmzet - totalModalSparepart);
  }, [totalOmzet, totalModalSparepart]);

  // 4. Total Pengeluaran Operasional = Total biaya dari Buku Kas Operasional
  const totalPengeluaranOperasional = useMemo(() => {
    return periodExpenses.reduce((acc, e) => acc + e.amount, 0);
  }, [periodExpenses]);

  // 5. Laba Bersih = Laba Kotor - Total Pengeluaran Operasional
  const labaBersih = useMemo(() => {
    return labaKotor - totalPengeluaranOperasional;
  }, [labaKotor, totalPengeluaranOperasional]);

  // Margins
  const grossMarginPct = totalOmzet > 0 ? (labaKotor / totalOmzet) * 100 : 0;
  const netMarginPct = totalOmzet > 0 ? (labaBersih / totalOmzet) * 100 : 0;

  // Breakdown Pengeluaran Operasional per Kategori
  const expenseCategoryBreakdown = useMemo(() => {
    const catMap: Record<ExpenseCategory, { total: number; count: number; icon: string; color: string }> = {
      'Bensin/Solar': { total: 0, count: 0, icon: '⛽', color: 'bg-amber-500' },
      'Makan Mekanik': { total: 0, count: 0, icon: '🍜', color: 'bg-rose-500' },
      'Listrik': { total: 0, count: 0, icon: '⚡', color: 'bg-yellow-500' },
      'Beli Alat': { total: 0, count: 0, icon: '🧰', color: 'bg-blue-500' },
      'Lain-lain': { total: 0, count: 0, icon: '📝', color: 'bg-zinc-500' },
    };

    periodExpenses.forEach((exp) => {
      if (catMap[exp.category]) {
        catMap[exp.category].total += exp.amount;
        catMap[exp.category].count += 1;
      } else {
        catMap['Lain-lain'].total += exp.amount;
        catMap['Lain-lain'].count += 1;
      }
    });

    return catMap;
  }, [periodExpenses]);

  // Performa Mekanik Bengkel
  const mechanicPerformance = useMemo(() => {
    const map: Record<string, { name: string; vehicleCount: number; serviceOmzet: number; sparepartOmzet: number; totalOmzet: number }> = {};

    periodTransactions.forEach((trx) => {
      const mechName = trx.mechanicName || 'Mekanik Umum';
      if (!map[mechName]) {
        map[mechName] = {
          name: mechName,
          vehicleCount: 0,
          serviceOmzet: 0,
          sparepartOmzet: 0,
          totalOmzet: 0,
        };
      }
      map[mechName].vehicleCount += 1;
      map[mechName].totalOmzet += trx.grandTotal;
      map[mechName].serviceOmzet += trx.serviceTotal || 0;
      map[mechName].sparepartOmzet += trx.sparepartTotal || 0;
    });

    return Object.values(map).sort((a, b) => b.totalOmzet - a.totalOmzet);
  }, [periodTransactions]);

  // Active Branch or Total Balances
  const currentBranch = useMemo(() => {
    if (effectiveBranchFilter !== 'ALL') {
      return branches.find((b) => b.id === effectiveBranchFilter) || branches[0];
    }
    return branches.find((b) => b.id === activeBranchId) || branches[0];
  }, [branches, effectiveBranchFilter, activeBranchId]);

  const totalCashAcross = useMemo(() => {
    if (effectiveBranchFilter !== 'ALL' && currentBranch) {
      return currentBranch.cashDrawerBalance || 0;
    }
    return branches.reduce((sum, b) => sum + (b.cashDrawerBalance || 0), 0);
  }, [branches, effectiveBranchFilter, currentBranch]);

  const totalBankAcross = useMemo(() => {
    if (effectiveBranchFilter !== 'ALL' && currentBranch) {
      return currentBranch.bankBalance || 0;
    }
    return branches.reduce((sum, b) => sum + (b.bankBalance || 0), 0);
  }, [branches, effectiveBranchFilter, currentBranch]);

  // Low stock products warning
  const lowStockProducts = useMemo(() => {
    return products.filter((p) => p.isActive && p.itemType === 'SPAREPART' && p.stock <= p.minStock);
  }, [products]);

  // Recent Transactions
  const recentTransactions = useMemo(() => {
    return [...branchTransactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 8);
  }, [branchTransactions]);

  return (
    <div id="dashboard-bengkel-container" className="space-y-5 max-w-7xl mx-auto pb-12">
      {/* 1. Header Bar: Info Bengkel & Filter Periode Otomatis (Per Hari / Per Bulan) */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-500 flex items-center justify-center text-xl shrink-0 shadow-inner">
            🔧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black tracking-tight text-zinc-950 dark:text-zinc-50">
                {settings.storeName || 'KASIR BENGKEL MOTOR / MOBIL'}
              </h2>
              <span className="text-[10px] font-mono font-black px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                Ringkasan Keuangan
              </span>
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
              Pantau Total Omzet, Modal Sparepart, Laba Kotor, Biaya Operasional, dan Laba Bersih Bengkel.
            </p>
          </div>
        </div>

        {/* Periode Controls: Hari Ini, Bulan Ini, Semua Waktu, Custom */}
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700/80">
          <button
            type="button"
            onClick={() => setPeriodFilter('TODAY')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              periodFilter === 'TODAY'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            📅 Hari Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('MONTH')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              periodFilter === 'MONTH'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            🗓️ Bulan Ini
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              periodFilter === 'ALL'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            type="button"
            onClick={() => setPeriodFilter('CUSTOM')}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              periodFilter === 'CUSTOM'
                ? 'bg-amber-500 text-zinc-950 shadow-sm'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-white'
            }`}
          >
            Filter Tanggal
          </button>
        </div>
      </div>

      {/* Custom Date Picker Bar if selected */}
      {periodFilter === 'CUSTOM' && (
        <div className="p-3 bg-zinc-100 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center gap-3 text-xs animate-in fade-in">
          <span className="font-bold text-zinc-700 dark:text-zinc-300">Pilih Rentang Tanggal:</span>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
            />
            <span className="text-zinc-400 font-bold">s/d</span>
            <input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-mono bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
            />
          </div>
          <span className="text-zinc-400 font-mono text-[11px]">
            ({periodTransactions.length} transaksi servis, {periodExpenses.length} biaya operasional)
          </span>
        </div>
      )}

      {/* 2. PERSAMAAN FINANSIAL BENGKEL (Mathematical Financial Formula Banner) */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-zinc-900 border border-zinc-800 text-white shadow-md">
        <div className="text-[11px] font-black uppercase tracking-wider text-amber-400 mb-2 font-mono flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Rumus Perhitungan Keuangan Bengkel ({periodBounds.label})</span>
          </span>
          <span className="text-zinc-400 font-normal">
            Total {periodTransactions.length} Unit Kendaraan Dilayani
          </span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-center text-xs">
          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-[10px] text-zinc-400 font-bold">1. Total Omzet</div>
            <div className="font-black text-amber-400 text-sm sm:text-base font-mono mt-0.5">
              {formatRupiah(totalOmzet)}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono">Part + Jasa Servis</div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-[10px] text-zinc-400 font-bold">2. Modal Part Terjual</div>
            <div className="font-black text-rose-400 text-sm sm:text-base font-mono mt-0.5">
              -{formatRupiah(totalModalSparepart)}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono">HPP Suku Cadang</div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-[10px] text-zinc-400 font-bold">3. Laba Kotor</div>
            <div className="font-black text-blue-400 text-sm sm:text-base font-mono mt-0.5">
              {formatRupiah(labaKotor)}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono">Margin: {grossMarginPct.toFixed(1)}%</div>
          </div>

          <div className="p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80">
            <div className="text-[10px] text-zinc-400 font-bold">4. Biaya Operasional</div>
            <div className="font-black text-orange-400 text-sm sm:text-base font-mono mt-0.5">
              -{formatRupiah(totalPengeluaranOperasional)}
            </div>
            <div className="text-[9px] text-zinc-500 font-mono">Buku Kas Keluar</div>
          </div>

          <div className={`p-2 rounded-xl border col-span-2 md:col-span-1 ${
            labaBersih >= 0
              ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
              : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
          }`}>
            <div className="text-[10px] font-black uppercase">5. LABA BERSIH</div>
            <div className="font-black text-sm sm:text-lg font-mono mt-0.5">
              {formatRupiah(labaBersih)}
            </div>
            <div className="text-[9px] font-mono">
              {labaBersih >= 0 ? `Surplus Net (${netMarginPct.toFixed(1)}%)` : 'Defisit Operasional'}
            </div>
          </div>
        </div>
      </div>

      {/* 3. 5 KARTU METRIK UTAMA BENGKEL (LANGKAH 3) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Card 1: Total Omzet */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Total Omzet</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-sm">
              💰
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {formatRupiah(totalOmzet)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
              <span>{periodTransactions.length} transaksi</span>
              <span>•</span>
              <span className="text-emerald-500 font-bold">100% omzet</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex justify-between">
            <span>Part: {formatRupiah(sparepartOmzet)}</span>
            <span>Jasa: {formatRupiah(serviceOmzet)}</span>
          </div>
        </div>

        {/* Card 2: Modal Sparepart Terjual (HPP) */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Modal Part Terjual</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-sm">
              📦
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono">
              {formatRupiah(totalModalSparepart)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-rose-500 font-bold mt-1">
              <span>HPP Suku Cadang</span>
              <span>•</span>
              <span>Jasa Rp 0</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex justify-between">
            <span>Modal Oli &amp; Part Terpasang</span>
          </div>
        </div>

        {/* Card 3: Laba Kotor */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Laba Kotor</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-sm">
              📈
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 dark:text-blue-400 font-mono">
              {formatRupiah(labaKotor)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-blue-500 font-bold mt-1">
              <span>Margin {grossMarginPct.toFixed(1)}%</span>
              <span>•</span>
              <span>Omzet - Modal</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex justify-between">
            <span>Sebelum Biaya Operasional</span>
          </div>
        </div>

        {/* Card 4: Total Pengeluaran Operasional */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400">Biaya Operasional</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-sm">
              💸
            </div>
          </div>
          <div>
            <div className="text-xl sm:text-2xl font-black text-orange-600 dark:text-orange-400 font-mono">
              {formatRupiah(totalPengeluaranOperasional)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-orange-500 font-bold mt-1">
              <span>{periodExpenses.length} catatan pengeluaran</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-[10px] text-zinc-400 flex justify-between">
            <span>Bensin, Makan, Listrik, Alat</span>
          </div>
        </div>

        {/* Card 5: Laba Bersih (Net Profit) */}
        <div className={`sm:col-span-2 lg:col-span-1 p-4 rounded-2xl border shadow-sm relative overflow-hidden flex flex-col justify-between ${
          labaBersih >= 0
            ? 'bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border-emerald-500/40 text-emerald-950 dark:text-emerald-100'
            : 'bg-gradient-to-br from-rose-500/10 via-rose-500/5 to-transparent border-rose-500/40 text-rose-950 dark:text-rose-100'
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-black uppercase tracking-wider">Laba Bersih</span>
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm ${
              labaBersih >= 0 ? 'bg-emerald-500 text-zinc-950' : 'bg-rose-500 text-white'
            }`}>
              {labaBersih >= 0 ? '🏆' : '⚠️'}
            </div>
          </div>
          <div>
            <div className={`text-xl sm:text-2xl font-black font-mono ${
              labaBersih >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}>
              {formatRupiah(labaBersih)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] font-bold mt-1">
              <span>Net Margin {netMarginPct.toFixed(1)}%</span>
              <span>•</span>
              <span>{labaBersih >= 0 ? 'Untung Bersih' : 'Rugi'}</span>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-emerald-500/20 text-[10px] opacity-80 flex justify-between">
            <span>Laba Kotor - Biaya Kas</span>
          </div>
        </div>
      </div>

      {/* 4. DUA PANEL UTAMA: Komposisi Omzet & Rincian Pengeluaran Operasional */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Komposisi Omzet Sparepart vs Jasa Servis (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">⚙️</span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                Komposisi Pendapatan Bengkel
              </h3>
            </div>
            <span className="text-[11px] font-mono text-zinc-400">
              {periodBounds.label}
            </span>
          </div>

          <div className="space-y-3">
            {/* Sparepart Bar */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <span>🔩</span>
                  <span>Penjualan Sparepart &amp; Oli</span>
                </span>
                <span className="font-mono text-amber-500 font-black">
                  {formatRupiah(sparepartOmzet)}
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${totalOmzet > 0 ? (sparepartOmzet / totalOmzet) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>Kontribusi: {totalOmzet > 0 ? ((sparepartOmzet / totalOmzet) * 100).toFixed(1) : 0}%</span>
                <span>Modal: {formatRupiah(totalModalSparepart)}</span>
              </div>
            </div>

            {/* Jasa Servis Bar */}
            <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                  <span>🛠️</span>
                  <span>Pendapatan Jasa Servis Kendaraan</span>
                </span>
                <span className="font-mono text-emerald-500 font-black">
                  {formatRupiah(serviceOmzet)}
                </span>
              </div>
              <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                  style={{ width: `${totalOmzet > 0 ? (serviceOmzet / totalOmzet) * 100 : 0}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
                <span>Kontribusi: {totalOmzet > 0 ? ((serviceOmzet / totalOmzet) * 100).toFixed(1) : 0}%</span>
                <span className="text-emerald-500 font-bold">100% Margin Laba</span>
              </div>
            </div>

            {/* Balances Summary */}
            <div className="pt-2 border-t border-zinc-200 dark:border-zinc-800 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <div className="text-[10px] text-zinc-400 font-bold">Uang Kas Laci Fisik</div>
                <div className="font-mono font-black text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {formatRupiah(totalCashAcross)}
                </div>
              </div>
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <div className="text-[10px] text-zinc-400 font-bold">Saldo Bank / QRIS</div>
                <div className="font-mono font-black text-zinc-900 dark:text-zinc-100 text-sm mt-0.5">
                  {formatRupiah(totalBankAcross)}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Rincian Pengeluaran Operasional Bengkel (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📕</span>
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                Buku Kas Operasional &amp; Kas Keluar Bengkel
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('expenses')}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>Buka Menu Operasional</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* 5 Expense Categories Breakdown Bars */}
          <div className="space-y-2">
            {(Object.keys(expenseCategoryBreakdown) as ExpenseCategory[]).map((catKey) => {
              const catData = expenseCategoryBreakdown[catKey];
              const pct = totalPengeluaranOperasional > 0 ? (catData.total / totalPengeluaranOperasional) * 100 : 0;

              return (
                <div
                  key={catKey}
                  className="p-2.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5 min-w-[140px]">
                    <span className="text-base">{catData.icon}</span>
                    <div>
                      <div className="font-bold text-zinc-800 dark:text-zinc-200">{catKey}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">{catData.count} transaksi</div>
                    </div>
                  </div>

                  <div className="flex-1 max-w-xs hidden sm:block">
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                      <div
                        className={`${catData.color} h-full rounded-full transition-all`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(catData.total)}
                    </div>
                    <div className="text-[10px] text-zinc-400 font-mono">{pct.toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-between text-xs">
            <span className="font-bold text-amber-500">
              Total Pengeluaran Kas Operasional:
            </span>
            <span className="font-black font-mono text-sm text-amber-500">
              {formatRupiah(totalPengeluaranOperasional)}
            </span>
          </div>
        </div>
      </div>

      {/* 5. PERFORMA MEKANIK & STATUS ANTREAN KENDARAAN TERBARU */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Performa Mekanik (5 cols) */}
        <div className="lg:col-span-5 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                Performa Mekanik ({periodBounds.label})
              </h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400">
              {mechanicPerformance.length} Mekanik Aktif
            </span>
          </div>

          {mechanicPerformance.length === 0 ? (
            <div className="p-6 text-center text-xs text-zinc-400 border border-dashed rounded-xl border-zinc-300 dark:border-zinc-800">
              Belum ada data pengerjaan mekanik pada periode ini.
            </div>
          ) : (
            <div className="space-y-2">
              {mechanicPerformance.map((mech, idx) => (
                <div
                  key={mech.name}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center font-mono">
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="font-black text-zinc-900 dark:text-zinc-100">{mech.name}</div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {mech.vehicleCount} unit motor/mobil
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-black text-zinc-900 dark:text-zinc-100">
                      {formatRupiah(mech.totalOmzet)}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-mono">
                      Jasa: {formatRupiah(mech.serviceOmzet)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Servis Kendaraan Terbaru (7 cols) */}
        <div className="lg:col-span-7 p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Car className="w-4 h-4 text-amber-500" />
              <h3 className="text-sm font-black text-zinc-900 dark:text-zinc-100">
                Riwayat Servis Kendaraan Terbaru
              </h3>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('reports')}
              className="text-xs font-bold text-amber-500 hover:text-amber-400 flex items-center gap-1 cursor-pointer"
            >
              <span>Semua Laporan</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="p-8 text-center text-xs text-zinc-400 border border-dashed rounded-xl border-zinc-300 dark:border-zinc-800">
              Belum ada riwayat transaksi servis bengkel.
            </div>
          ) : (
            <div className="space-y-2 overflow-x-auto">
              {recentTransactions.map((trx) => (
                <div
                  key={trx.id}
                  onClick={() => onViewReceipt(trx)}
                  className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200 dark:border-zinc-800 hover:border-amber-500/50 cursor-pointer transition-all flex items-center justify-between gap-3 text-xs group"
                >
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded-lg bg-zinc-900 text-amber-400 font-mono font-black text-xs border border-zinc-700 shrink-0">
                      {trx.vehiclePlate || 'BENGKEL'}
                    </div>
                    <div>
                      <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>{trx.vehicleModel || trx.customerName || 'Servis Kendaraan'}</span>
                        {trx.mechanicName && (
                          <span className="text-[10px] text-zinc-400 font-normal">
                            ({trx.mechanicName})
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-zinc-400 font-mono">
                        {formatDateIndo(trx.date)} • #{trx.invoiceNumber} • {trx.items.length} item
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div>
                      <div className="font-mono font-black text-zinc-900 dark:text-zinc-100 text-sm">
                        {formatRupiah(trx.grandTotal)}
                      </div>
                      <div className="text-[9px] font-mono text-zinc-400 uppercase">
                        {trx.paymentMethod}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-amber-500 group-hover:translate-x-0.5 transition-all" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 6. TOMBOL AKSI CEPAT KASIR BENGKEL */}
      <div className="p-4 rounded-2xl bg-zinc-100 dark:bg-zinc-850 border border-zinc-200 dark:border-zinc-800 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-bold text-zinc-700 dark:text-zinc-300">
          <span>⚡ Aksi Cepat Bengkel:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => onNavigate('cashier')}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-sm cursor-pointer transition-all active:scale-95"
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>+ Kasir Servis &amp; Part</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('expenses')}
            className="px-3.5 py-2 rounded-xl text-xs font-black bg-rose-500/15 hover:bg-rose-500/25 text-rose-500 border border-rose-500/30 flex items-center gap-1.5 cursor-pointer transition-all active:scale-95"
          >
            <Wallet className="w-3.5 h-3.5" />
            <span>+ Catat Kas Keluar</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigate('inventory')}
            className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700 flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Package className="w-3.5 h-3.5" />
            <span>Stok Sparepart {lowStockProducts.length > 0 ? `(${lowStockProducts.length} menipis)` : ''}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
