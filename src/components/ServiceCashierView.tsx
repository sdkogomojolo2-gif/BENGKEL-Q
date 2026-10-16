import React, { useState, useMemo, useEffect } from 'react';
import {
  Wrench,
  Car,
  Plus,
  Search,
  Calendar,
  Clock,
  User,
  Users,
  Printer,
  Share2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  Phone,
  BarChart3,
  DollarSign,
  Tag,
  Gauge,
  Sparkles,
  ChevronRight,
  Eye,
  Filter,
} from 'lucide-react';
import {
  Product,
  Transaction,
  StoreBranch,
  StoreSettings,
  CashierUser,
} from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';
import { sound } from '../services/sound';
import { BengkelTransactionModal } from './BengkelTransactionModal';

interface ServiceCashierViewProps {
  products: Product[];
  transactions: Transaction[];
  settings: StoreSettings;
  currentUser: CashierUser | null;
  activeBranch: StoreBranch;
  branches?: StoreBranch[];
  mechanicsList: string[];
  onCompleteTransaction: (trx: Transaction) => void;
  onAdjustStock?: (productId: string, qtyChange: number, reason: string) => void;
  onViewReceipt: (trx: Transaction) => void;
  darkMode: boolean;
}

type PeriodFilterType = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL';

export const ServiceCashierView: React.FC<ServiceCashierViewProps> = ({
  products,
  transactions,
  settings,
  currentUser,
  activeBranch,
  branches = [],
  mechanicsList = [],
  onCompleteTransaction,
  onAdjustStock,
  onViewReceipt,
  darkMode,
}) => {
  // Modal State untuk Catat Servis Baru
  const [isBengkelModalOpen, setIsBengkelModalOpen] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('TODAY');
  const [selectedMechanicFilter, setSelectedMechanicFilter] = useState<string>('ALL');

  // Keyboard shortcut F3 to open Service Intake Form
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F3') {
        e.preventDefault();
        setIsBengkelModalOpen(true);
        sound.playBeep(750, 0.04);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter transactions that have vehicle service details or service items
  const serviceTransactions = useMemo(() => {
    return transactions.filter((t) => {
      const hasPlate = Boolean(t.vehiclePlate && t.vehiclePlate.trim());
      const hasMechanic = Boolean(t.mechanicName && t.mechanicName.trim());
      const hasServiceItem = (t.items || []).some(
        (item) => item.itemType === 'JASA' || (item.category && item.category.toLowerCase().includes('jasa'))
      );
      return hasPlate || hasMechanic || hasServiceItem;
    });
  }, [transactions]);

  // Filter by period bounds
  const periodFilteredTrxs = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).getTime();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).getTime();

    return serviceTransactions.filter((t) => {
      const tTime = new Date(t.date).getTime();
      if (periodFilter === 'TODAY') return tTime >= startOfToday;
      if (periodFilter === 'WEEK') return tTime >= startOfWeek;
      if (periodFilter === 'MONTH') return tTime >= startOfMonth;
      return true;
    });
  }, [serviceTransactions, periodFilter]);

  // Filter by search and selected mechanic
  const displayTransactions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return periodFilteredTrxs
      .filter((t) => {
        if (selectedMechanicFilter !== 'ALL') {
          if ((t.mechanicName || '').toLowerCase() !== selectedMechanicFilter.toLowerCase()) {
            return false;
          }
        }

        if (!q) return true;

        const plateMatch = (t.vehiclePlate || '').toLowerCase().includes(q);
        const modelMatch = (t.vehicleModel || '').toLowerCase().includes(q);
        const customerMatch = (t.customerName || '').toLowerCase().includes(q);
        const mechanicMatch = (t.mechanicName || '').toLowerCase().includes(q);
        const invoiceMatch = (t.invoiceNumber || '').toLowerCase().includes(q);
        const itemsMatch = (t.items || []).some((i) => i.productName.toLowerCase().includes(q));

        return plateMatch || modelMatch || customerMatch || mechanicMatch || invoiceMatch || itemsMatch;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [periodFilteredTrxs, searchQuery, selectedMechanicFilter]);

  // 1. STATISTIK RINGKASAN
  const totalVehiclesServiced = periodFilteredTrxs.length;

  const totalServiceOmzet = useMemo(() => {
    return periodFilteredTrxs.reduce((sum, t) => {
      // Hitung khusus item jasa
      const jasaTotal = (t.items || [])
        .filter((i) => i.itemType === 'JASA' || (i.category && i.category.toLowerCase().includes('jasa')))
        .reduce((itemSum, i) => itemSum + (i.subtotal || i.sellPrice * i.quantity), 0);
      return sum + (jasaTotal > 0 ? jasaTotal : t.serviceTotal || t.grandTotal);
    }, 0);
  }, [periodFilteredTrxs]);

  const activeMechanicsCount = useMemo(() => {
    const names = new Set<string>();
    periodFilteredTrxs.forEach((t) => {
      if (t.mechanicName && t.mechanicName.trim()) {
        names.add(t.mechanicName.trim());
      }
    });
    return names.size;
  }, [periodFilteredTrxs]);

  // 2. GRAFIK JASA SERVIS APA SAJA YANG SUDAH DILAKUKAN
  const serviceTypeStats = useMemo(() => {
    const map = new Map<string, { name: string; count: number; totalRevenue: number }>();

    periodFilteredTrxs.forEach((t) => {
      (t.items || []).forEach((item) => {
        const isJasa =
          item.itemType === 'JASA' ||
          (item.category && item.category.toLowerCase().includes('jasa')) ||
          item.productName.toLowerCase().includes('jasa') ||
          item.productName.toLowerCase().includes('servis');

        if (isJasa) {
          const name = item.productName || item.category || 'Jasa Servis';
          const existing = map.get(name);
          const revenue = item.subtotal || item.sellPrice * item.quantity;
          if (existing) {
            existing.count += item.quantity || 1;
            existing.totalRevenue += revenue;
          } else {
            map.set(name, {
              name,
              count: item.quantity || 1,
              totalRevenue: revenue,
            });
          }
        }
      });
    });

    const list = Array.from(map.values()).sort((a, b) => b.count - a.count);
    const maxCount = list.length > 0 ? Math.max(...list.map((s) => s.count)) : 1;
    return { list: list.slice(0, 7), maxCount };
  }, [periodFilteredTrxs]);

  // 3. GRAFIK REKAP SERVIS OLEH SIAPA SAJA (PERFORMA MEKANIK)
  const mechanicServiceStats = useMemo(() => {
    const map = new Map<
      string,
      {
        name: string;
        vehicleCount: number;
        serviceOmzet: number;
        servicesHandled: Map<string, number>;
      }
    >();

    periodFilteredTrxs.forEach((t) => {
      const mechName = t.mechanicName && t.mechanicName.trim() ? t.mechanicName.trim() : 'Mekanik Belum Dipilih';
      const existing = map.get(mechName) || {
        name: mechName,
        vehicleCount: 0,
        serviceOmzet: 0,
        servicesHandled: new Map<string, number>(),
      };

      existing.vehicleCount += 1;

      // Hitung pendapatan jasa servis
      const jasaTotal = (t.items || [])
        .filter((i) => i.itemType === 'JASA' || (i.category && i.category.toLowerCase().includes('jasa')))
        .reduce((s, i) => s + (i.subtotal || i.sellPrice * i.quantity), 0);
      existing.serviceOmzet += jasaTotal > 0 ? jasaTotal : t.serviceTotal || t.grandTotal;

      // Rekap jenis servis yang dikerjakan mekanik ini
      (t.items || []).forEach((item) => {
        if (item.itemType === 'JASA' || (item.category && item.category.toLowerCase().includes('jasa'))) {
          const sName = item.productName;
          existing.servicesHandled.set(sName, (existing.servicesHandled.get(sName) || 0) + item.quantity);
        }
      });

      map.set(mechName, existing);
    });

    const list = Array.from(map.values()).sort((a, b) => b.vehicleCount - a.vehicleCount);
    const maxVehicles = list.length > 0 ? Math.max(...list.map((m) => m.vehicleCount)) : 1;
    return { list, maxVehicles };
  }, [periodFilteredTrxs]);

  // WhatsApp Sender for Service Note
  const handleSendWhatsApp = (trx: Transaction) => {
    let cleanPhone = (trx.customerPhone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const serviceItems = (trx.items || [])
      .filter((i) => i.itemType === 'JASA' || (i.category && i.category.toLowerCase().includes('jasa')))
      .map((i) => `• ${i.productName} (${formatRupiah(i.subtotal || i.sellPrice * i.quantity)})`)
      .join('\n');

    const sparepartItems = (trx.items || [])
      .filter((i) => i.itemType !== 'JASA' && !(i.category && i.category.toLowerCase().includes('jasa')))
      .map((i) => `• ${i.productName} x${i.quantity} (${formatRupiah(i.subtotal || i.sellPrice * i.quantity)})`)
      .join('\n');

    const messageLines = [
      `*NOTA SERVIS KENDARAAN - ${settings.storeName || 'BENGKEL'}*`,
      `No. Nota: #${trx.invoiceNumber}`,
      `Tanggal : ${formatDateIndo(trx.date)}`,
      `---------------------------------`,
      `Plat Nomor  : *${trx.vehiclePlate || '-'}*`,
      `Kendaraan   : *${trx.vehicleModel || '-'}*`,
      `Pelanggan   : *${trx.customerName || '-'}*`,
      trx.odometerKm ? `Odometer KM : *${trx.odometerKm.toLocaleString('id-ID')} KM*` : '',
      `Mekanik     : *${trx.mechanicName || '-'}*`,
      `---------------------------------`,
      serviceItems ? `*JASA SERVIS:* \n${serviceItems}` : '',
      sparepartItems ? `\n*SPAREPART DIGANTI:* \n${sparepartItems}` : '',
      `---------------------------------`,
      `*TOTAL BIAYA: ${formatRupiah(trx.grandTotal)}*`,
      trx.paymentMethod === 'TEMPO' || trx.paymentMethod === 'KASBON'
        ? `Status: *TEMPO / KASBON* (Sisa: ${formatRupiah(trx.remainingDebt || 0)})`
        : `Pembayaran: *LUNAS* (${trx.paymentMethod || 'TUNAI'})`,
      `---------------------------------`,
      `Terima kasih telah mempercayakan servis kendaraan Anda kepada kami! 🙏`,
    ].filter(Boolean);

    const waText = encodeURIComponent(messageLines.join('\n'));
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${waText}` : `https://wa.me/?text=${waText}`;
    window.open(waUrl, '_blank');
    sound.playSuccess();
  };

  return (
    <div id="service-cashier-container" className="space-y-5 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Tombol Utama: + Servis Kendaraan Baru */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-3xl bg-gradient-to-r from-amber-500/15 via-amber-500/10 to-transparent border-2 border-amber-500/40 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center text-2xl font-black shrink-0 shadow-lg shadow-amber-500/20">
            🛠️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-2xl font-black text-zinc-950 dark:text-zinc-50 tracking-tight">
                Kasir Servis Kendaraan
              </h1>
              <span className="text-[11px] font-mono font-black px-2.5 py-0.5 rounded-full bg-amber-500 text-zinc-950">
                Servis Masuk
              </span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-medium mt-1">
              Catat langsung jasa servis tiap kendaraan, pantau grafik servis terpopuler &amp; rekap kerja mekanik.
            </p>
          </div>
        </div>

        {/* Tombol Utama + Catat Servis Kendaraan Baru */}
        <button
          id="btn-catat-servis-baru"
          type="button"
          onClick={() => {
            setIsBengkelModalOpen(true);
            sound.playBeep(750, 0.04);
          }}
          className="px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm sm:text-base flex items-center justify-center gap-3 shadow-lg shadow-amber-500/30 active:scale-95 transition-all cursor-pointer shrink-0"
        >
          <Wrench className="w-5 h-5 stroke-[2.5]" />
          <span>+ Servis Kendaraan Baru (Plat &amp; Mekanik)</span>
          <kbd className="hidden lg:inline-block px-2 py-0.5 text-xs font-mono bg-zinc-950 text-amber-400 rounded-md">
            F3
          </kbd>
        </button>
      </div>

      {/* 2. Kartu Ringkasan Real-Time Servis */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase font-mono">
              Kendaraan Diservis
            </div>
            <div className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 font-mono mt-1">
              {totalVehiclesServiced} <span className="text-sm font-sans font-bold text-zinc-400">Unit</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">
              {periodFilter === 'TODAY' ? 'Hari Ini' : periodFilter === 'WEEK' ? '7 Hari Terakhir' : 'Bulan Ini'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">
            🛵
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase font-mono">
              Pendapatan Jasa Servis
            </div>
            <div className="text-lg sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1 truncate">
              {formatRupiah(totalServiceOmzet)}
            </div>
            <div className="text-[10px] text-emerald-500 font-bold mt-0.5">Murni Biaya Jasa Mekanik</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl shrink-0">
            💰
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase font-mono">
              Mekanik Bertugas
            </div>
            <div className="text-2xl sm:text-3xl font-black text-purple-600 dark:text-purple-400 font-mono mt-1">
              {activeMechanicsCount} <span className="text-sm font-sans font-bold text-zinc-400">Mekanik</span>
            </div>
            <div className="text-[10px] text-zinc-400 mt-0.5">Terlibat servis periode ini</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center text-xl shrink-0">
            👨‍🔧
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold text-zinc-500 dark:text-zinc-400 uppercase font-mono">
              Jasa Paling Populer
            </div>
            <div className="text-sm sm:text-base font-black text-amber-500 truncate mt-1 max-w-[130px] sm:max-w-[160px]">
              {serviceTypeStats.list[0]?.name || 'Belum Ada'}
            </div>
            <div className="text-[10px] text-zinc-400 font-mono mt-0.5">
              {serviceTypeStats.list[0] ? `${serviceTypeStats.list[0].count}x pengerjaan` : 'Catat servis pertama'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl shrink-0">
            🏆
          </div>
        </div>
      </div>

      {/* 3. DUA GRAFIK UTAMA: (1) Jasa Servis Apa Saja & (2) Dikerjakan Oleh Siapa Saja */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* GRAFIK 1: Servis Apa Saja yang Sudah Dilakukan (7 cols) */}
        <div className="lg:col-span-7 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold text-sm">
                📊
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100">
                  Grafik Jasa Servis yang Sudah Dilakukan
                </h3>
                <p className="text-xs text-zinc-400">Rincian jenis servis kendaraan yang paling sering dikerjakan</p>
              </div>
            </div>

            {/* Filter Periode Cepat */}
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800 rounded-xl text-xs font-mono font-bold">
              {(['TODAY', 'WEEK', 'MONTH', 'ALL'] as PeriodFilterType[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodFilter(p)}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    periodFilter === p
                      ? 'bg-amber-500 text-zinc-950 font-black shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100'
                  }`}
                >
                  {p === 'TODAY' ? 'Hari Ini' : p === 'WEEK' ? '7 Hari' : p === 'MONTH' ? 'Bulan Ini' : 'Semua'}
                </button>
              ))}
            </div>
          </div>

          {serviceTypeStats.list.length === 0 ? (
            <div className="py-12 text-center space-y-3 border border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 mx-auto flex items-center justify-center text-2xl">
                🔧
              </div>
              <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Belum Ada Catatan Jasa Servis Pada Periode Ini
              </div>
              <p className="text-xs text-zinc-400 max-w-sm mx-auto">
                Klik tombol <strong>+ Servis Kendaraan Baru</strong> di atas untuk mulai mencatat pekerjaan mekanik.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {serviceTypeStats.list.map((item, idx) => {
                const percent = ((item.count / serviceTypeStats.maxCount) * 100).toFixed(0);
                return (
                  <div key={item.name} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs sm:text-sm font-bold">
                      <div className="flex items-center gap-2 truncate">
                        <span className="w-5 h-5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-500 text-[10px] font-mono flex items-center justify-center shrink-0">
                          #{idx + 1}
                        </span>
                        <span className="text-zinc-900 dark:text-zinc-100 font-extrabold truncate">
                          {item.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 shrink-0 font-mono text-xs">
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {item.count} Kendaraan
                        </span>
                        <span className="text-zinc-400">({formatRupiah(item.totalRevenue)})</span>
                      </div>
                    </div>
                    {/* Visual Progress Bar */}
                    <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* GRAFIK 2: Dikerjakan Oleh Siapa Saja (Performa Mekanik) (5 cols) */}
        <div className="lg:col-span-5 p-5 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
          <div className="border-b border-zinc-100 dark:border-zinc-800 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-500 flex items-center justify-center font-bold text-sm">
                👨‍🔧
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100">
                  Dikerjakan Oleh Siapa Saja (Mekanik)
                </h3>
                <p className="text-xs text-zinc-400">Rekap pembagian tugas dan jumlah unit servis tiap mekanik</p>
              </div>
            </div>
          </div>

          {mechanicServiceStats.list.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-400 border border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
              Belum ada riwayat mekanik yang mengerjakan servis pada periode ini.
            </div>
          ) : (
            <div className="space-y-3">
              {mechanicServiceStats.list.map((mech, idx) => {
                const percent = ((mech.vehicleCount / mechanicServiceStats.maxVehicles) * 100).toFixed(0);
                const topServices = Array.from(mech.servicesHandled.entries())
                  .sort((a, b) => b[1] - a[1])
                  .slice(0, 2)
                  .map(([sName, count]) => `${sName} (${count}x)`)
                  .join(', ');

                return (
                  <div
                    key={mech.name}
                    className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-purple-500/15 text-purple-500 font-black text-xs flex items-center justify-center font-mono">
                          #{idx + 1}
                        </div>
                        <div>
                          <div className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                            {mech.name}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            {mech.vehicleCount} Unit Motor / Mobil
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-black text-xs text-purple-600 dark:text-purple-400">
                          {formatRupiah(mech.serviceOmzet)}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">Total Jasa</div>
                      </div>
                    </div>

                    {/* Progress Bar Mekanik */}
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-purple-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    {topServices && (
                      <div className="text-[10px] text-zinc-500 dark:text-zinc-400 truncate">
                        Sering: <span className="font-medium text-zinc-700 dark:text-zinc-300">{topServices}</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 4. DATA RIWAYAT SERVIS KENDARAAN (LOGBOOK PENGERJAAN) */}
      <div className="rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden space-y-4 p-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-xl font-bold">
              📋
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                Data Riwayat Servis Kendaraan
              </h2>
              <p className="text-xs text-zinc-400">
                Daftar lengkap kendaraan masuk, rincian jasa servis yang dilakukan tiap motor/mobil &amp; mekanik penanggung jawab.
              </p>
            </div>
          </div>

          {/* Filter Bar: Pencarian & Filter Mekanik */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Mekanik */}
            <div className="relative">
              <select
                id="select-filter-mechanic-history"
                value={selectedMechanicFilter}
                onChange={(e) => setSelectedMechanicFilter(e.target.value)}
                className="appearance-none pl-3 pr-8 py-2 rounded-xl border text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
              >
                <option value="ALL">Semua Mekanik ({mechanicsList.length})</option>
                {mechanicsList.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>

            {/* Search Input Box */}
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                id="input-search-service-history"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Cari Plat Nomor, Mekanik, Jasa..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs font-bold bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-200"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Tabel Riwayat Servis Kendaraan */}
        {displayTransactions.length === 0 ? (
          <div className="py-16 text-center space-y-3 border border-dashed rounded-2xl border-zinc-200 dark:border-zinc-800">
            <div className="w-14 h-14 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 mx-auto flex items-center justify-center text-2xl">
              🔍
            </div>
            <div className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
              Tidak Ada Data Riwayat Servis Ditemukan
            </div>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {searchQuery
                ? 'Tidak ada kendaraan atau jasa servis yang cocok dengan kata kunci pencarian.'
                : 'Belum ada kendaraan yang dicatat pada filter ini. Gunakan tombol + Servis Kendaraan Baru untuk mencatat servis.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 font-mono font-black uppercase tracking-wider text-[11px]">
                  <th className="py-3.5 px-4">Kendaraan &amp; Plat</th>
                  <th className="py-3.5 px-4">Mekanik</th>
                  <th className="py-3.5 px-4">Rincian Jasa Servis yang Dilakukan</th>
                  <th className="py-3.5 px-4">Sparepart Terpasang</th>
                  <th className="py-3.5 px-4 text-right">Total Biaya</th>
                  <th className="py-3.5 px-4">Waktu</th>
                  <th className="py-3.5 px-4 text-center">Aksi Cepat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {displayTransactions.map((trx) => {
                  const jasaItems = (trx.items || []).filter(
                    (i) => i.itemType === 'JASA' || (i.category && i.category.toLowerCase().includes('jasa'))
                  );
                  const sparepartItems = (trx.items || []).filter(
                    (i) => i.itemType !== 'JASA' && !(i.category && i.category.toLowerCase().includes('jasa'))
                  );

                  return (
                    <tr
                      key={trx.id}
                      className="hover:bg-zinc-50 dark:hover:bg-zinc-850/60 transition-colors group"
                    >
                      {/* Kendaraan & Plat */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="px-2.5 py-1 rounded-lg bg-zinc-950 text-amber-400 font-mono font-black text-xs border border-zinc-700 shrink-0 shadow-xs">
                            {trx.vehiclePlate || 'BENGKEL'}
                          </div>
                          <div>
                            <div className="font-bold text-zinc-900 dark:text-zinc-100">
                              {trx.vehicleModel || trx.customerName || 'Servis Kendaraan'}
                            </div>
                            <div className="text-[10px] text-zinc-400 font-mono">
                              {trx.customerName && trx.customerName !== trx.vehicleModel ? `${trx.customerName} • ` : ''}
                              {trx.odometerKm ? `${trx.odometerKm.toLocaleString('id-ID')} KM` : '#Nota: ' + trx.invoiceNumber}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Mekanik */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/60 text-purple-700 dark:text-purple-300 font-bold font-mono">
                          <User className="w-3 h-3 text-purple-500" />
                          <span>{trx.mechanicName || '-'}</span>
                        </div>
                      </td>

                      {/* Rincian Jasa Servis */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1.5">
                          {jasaItems.length > 0 ? (
                            jasaItems.map((j) => (
                              <span
                                key={j.productId || j.productName}
                                className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-300 font-bold text-[11px]"
                              >
                                🛠️ {j.productName}
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-400 italic text-[11px]">Tidak ada jasa terpisah</span>
                          )}
                        </div>
                      </td>

                      {/* Sparepart Terpasang */}
                      <td className="py-3.5 px-4 max-w-xs">
                        <div className="flex flex-wrap gap-1">
                          {sparepartItems.length > 0 ? (
                            sparepartItems.map((p) => (
                              <span
                                key={p.productId || p.productName}
                                className="px-1.5 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-medium text-[10px]"
                              >
                                🔩 {p.productName} (x{p.quantity})
                              </span>
                            ))
                          ) : (
                            <span className="text-zinc-400 text-[10px]">-</span>
                          )}
                        </div>
                      </td>

                      {/* Total Biaya */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="font-mono font-black text-sm text-zinc-900 dark:text-zinc-100">
                          {formatRupiah(trx.grandTotal)}
                        </div>
                        <div className="text-[10px] font-mono">
                          {trx.paymentMethod === 'TEMPO' || trx.paymentMethod === 'KASBON' ? (
                            <span className="text-rose-500 font-bold">TEMPO (Hutang)</span>
                          ) : (
                            <span className="text-emerald-500 font-bold">LUNAS</span>
                          )}
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-zinc-800 dark:text-zinc-200">
                          {formatDateIndo(trx.date)}
                        </div>
                        <div className="text-[10px] text-zinc-400 font-mono">
                          {new Date(trx.date).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Aksi Cepat */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              onViewReceipt(trx);
                              sound.playBeep(700, 0.03);
                            }}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                            title="Lihat Detail & Cetak Struk"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-500" />
                          </button>

                          <button
                            type="button"
                            onClick={() => handleSendWhatsApp(trx)}
                            className="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
                            title="Kirim Nota Servis ke WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5 text-emerald-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 5. Modal Formulir Pendaftaran & Catat Servis Kendaraan Baru */}
      <BengkelTransactionModal
        isOpen={isBengkelModalOpen}
        onClose={() => setIsBengkelModalOpen(false)}
        products={products}
        settings={settings}
        currentUser={currentUser}
        activeBranch={activeBranch}
        mechanicsList={mechanicsList}
        onCompleteTransaction={(trx) => {
          onCompleteTransaction(trx);
          setIsBengkelModalOpen(false);
          onViewReceipt(trx);
        }}
        onAdjustStock={onAdjustStock}
        darkMode={darkMode}
      />
    </div>
  );
};
