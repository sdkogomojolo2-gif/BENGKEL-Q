import React, { useState, useMemo } from 'react';
import {
  Users,
  Award,
  Calendar,
  Percent,
  DollarSign,
  FileSpreadsheet,
  FileText,
  Share2,
  ChevronRight,
  ChevronDown,
  Wrench,
  CheckCircle2,
  Car,
  Search,
  Edit2,
  UserPlus,
  Trash2,
  X,
  AlertTriangle,
  Settings2,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { Transaction, StoreSettings, MechanicPerformance, MechanicCommissionItem } from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';
import { sound } from '../services/sound';

interface MechanicCommissionViewProps {
  transactions: Transaction[];
  mechanicsList?: string[];
  onAddMechanic?: (name: string) => void;
  onEditMechanic?: (oldName: string, newName: string) => void;
  onDeleteMechanic?: (name: string) => void;
  settings: StoreSettings;
  darkMode: boolean;
  onViewReceipt?: (trx: Transaction) => void;
}

type PeriodFilterType = 'TODAY' | 'WEEK' | 'MONTH' | 'ALL' | 'CUSTOM';

export const MechanicCommissionView: React.FC<MechanicCommissionViewProps> = ({
  transactions,
  mechanicsList = ['Agus Santoso', 'Joko Susilo', 'Rudi Haryanto'],
  onAddMechanic,
  onEditMechanic,
  onDeleteMechanic,
  settings,
  darkMode,
  onViewReceipt,
}) => {
  // Filter Periode (Hari ini, Minggu ini, Bulan ini, Semua, Custom)
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('TODAY');
  const [customStartDate, setCustomStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Persentase Bagi Hasil Global (Default 50% jasa untuk mekanik)
  const [commissionPct, setCommissionPct] = useState<number>(50);

  // Persentase kustom per mekanik jika ada yang beda
  const [customMechanicPct, setCustomMechanicPct] = useState<Record<string, number>>({});

  // Mekanik yang sedang dibuka rincian nota-nya
  const [expandedMechanic, setExpandedMechanic] = useState<string | null>(null);

  // Search filter
  const [searchMechanic, setSearchMechanic] = useState<string>('');

  // Modals & form state for Mechanic Management (Tambah, Edit, Hapus)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMechanicName, setNewMechanicName] = useState('');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingOldName, setEditingOldName] = useState('');
  const [editingNewName, setEditingNewName] = useState('');

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingMechanicName, setDeletingMechanicName] = useState('');

  const [isManageDrawerOpen, setIsManageDrawerOpen] = useState(false);

  const handleSaveNewMechanic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newMechanicName.trim();
    if (!trimmed) return;
    if (onAddMechanic) {
      onAddMechanic(trimmed);
    }
    setNewMechanicName('');
    setIsAddModalOpen(false);
  };

  const handleSaveEditMechanic = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = editingNewName.trim();
    if (!trimmed || trimmed === editingOldName) return;
    if (onEditMechanic) {
      onEditMechanic(editingOldName, trimmed);
    }
    setIsEditModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingMechanicName) return;
    if (onDeleteMechanic) {
      onDeleteMechanic(deletingMechanicName);
    }
    setIsDeleteModalOpen(false);
  };

  // Hitung rentang waktu berdasarkan periodFilter
  const periodBounds = useMemo(() => {
    const now = new Date();
    if (periodFilter === 'TODAY') {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start: start.getTime(), end: end.getTime(), label: 'Hari Ini' };
    }
    if (periodFilter === 'WEEK') {
      // 7 Hari Terakhir
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      start.setHours(0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      return { start: start.getTime(), end: end.getTime(), label: '7 Hari Terakhir (Mingguan)' };
    }
    if (periodFilter === 'MONTH') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
      ];
      return { start: start.getTime(), end: end.getTime(), label: `Bulan ${monthNames[now.getMonth()]} ${now.getFullYear()}` };
    }
    if (periodFilter === 'CUSTOM') {
      const start = new Date(`${customStartDate}T00:00:00`).getTime();
      const end = new Date(`${customEndDate}T23:59:59.999`).getTime();
      return { start, end, label: `${customStartDate} s/d ${customEndDate}` };
    }
    return { start: 0, end: Infinity, label: 'Semua Waktu' };
  }, [periodFilter, customStartDate, customEndDate]);

  // Filter transaksi selesai dalam rentang waktu
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.status !== 'COMPLETED') return false;
      const tTime = new Date(t.date).getTime();
      return tTime >= periodBounds.start && tTime <= periodBounds.end;
    });
  }, [transactions, periodBounds]);

  // Kalkulasi Rekap Kinerja & Komisi per Mekanik
  const mechanicPerformances = useMemo(() => {
    const map: Record<string, MechanicPerformance> = {};

    // Inisialisasi semua mekanik terdaftar
    const allMechanics = Array.from(new Set([...mechanicsList, ...transactions.map((t) => t.mechanicName).filter(Boolean) as string[]]));

    allMechanics.forEach((mName) => {
      const pct = customMechanicPct[mName] !== undefined ? customMechanicPct[mName] : commissionPct;
      map[mName] = {
        mechanicName: mName,
        vehicleCount: 0,
        serviceRevenue: 0,
        sparepartRevenue: 0,
        totalRevenue: 0,
        commissionPercentage: pct,
        totalCommission: 0,
        items: [],
      };
    });

    // Proses transaksi
    periodTransactions.forEach((trx) => {
      const mName = trx.mechanicName || 'Mekanik Umum';
      if (!map[mName]) {
        const pct = customMechanicPct[mName] !== undefined ? customMechanicPct[mName] : commissionPct;
        map[mName] = {
          mechanicName: mName,
          vehicleCount: 0,
          serviceRevenue: 0,
          sparepartRevenue: 0,
          totalRevenue: 0,
          commissionPercentage: pct,
          totalCommission: 0,
          items: [],
        };
      }

      map[mName].vehicleCount += 1;
      map[mName].totalRevenue += trx.grandTotal;
      map[mName].sparepartRevenue += trx.sparepartTotal || 0;

      // Nilai Jasa Servis
      let trxServiceRev = trx.serviceTotal || 0;
      if (trxServiceRev === 0) {
        trxServiceRev = trx.items
          .filter((i) => i.itemType === 'JASA' || (i.buyPrice === 0 && i.itemType !== 'SPAREPART'))
          .reduce((sum, i) => sum + i.subtotal, 0);
      }

      map[mName].serviceRevenue += trxServiceRev;

      const pct = map[mName].commissionPercentage;
      const trxCommission = Math.round(trxServiceRev * (pct / 100));
      map[mName].totalCommission += trxCommission;

      // Item pengerjaan detail
      const serviceNames = trx.items
        .filter((i) => i.itemType === 'JASA' || (i.buyPrice === 0 && i.itemType !== 'SPAREPART'))
        .map((i) => i.productName)
        .join(', ') || 'Jasa Servis';

      const commItem: MechanicCommissionItem = {
        transactionId: trx.id,
        invoiceNumber: trx.invoiceNumber,
        date: trx.date,
        vehiclePlate: trx.vehiclePlate,
        customerName: trx.customerName,
        serviceName: serviceNames,
        serviceRevenue: trxServiceRev,
        commissionPercentage: pct,
        commissionAmount: trxCommission,
      };

      map[mName].items.push(commItem);
    });

    return Object.values(map)
      .filter((m) => {
        if (!searchMechanic.trim()) return true;
        return m.mechanicName.toLowerCase().includes(searchMechanic.toLowerCase());
      })
      .sort((a, b) => b.totalCommission - a.totalCommission);
  }, [mechanicsList, transactions, periodTransactions, commissionPct, customMechanicPct, searchMechanic]);

  // Total Keseluruhan
  const totalAllServiceRevenue = useMemo(() => {
    return mechanicPerformances.reduce((sum, m) => sum + m.serviceRevenue, 0);
  }, [mechanicPerformances]);

  const totalAllCommission = useMemo(() => {
    return mechanicPerformances.reduce((sum, m) => sum + m.totalCommission, 0);
  }, [mechanicPerformances]);

  const totalVehiclesHandled = useMemo(() => {
    return mechanicPerformances.reduce((sum, m) => sum + m.vehicleCount, 0);
  }, [mechanicPerformances]);

  // Ekspor Rekap Komisi ke Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();

    // Sheet 1: Ringkasan Komisi
    const summaryRows = mechanicPerformances.map((m, idx) => ({
      No: idx + 1,
      'Nama Mekanik': m.mechanicName,
      'Jumlah Kendaraan': m.vehicleCount,
      'Total Nilai Jasa (Rp)': m.serviceRevenue,
      'Bagi Hasil Mekanik (%)': `${m.commissionPercentage}%`,
      'Total Komisi Dibayarkan (Rp)': m.totalCommission,
      'Porsi Bengkel (Rp)': m.serviceRevenue - m.totalCommission,
    }));

    const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, wsSummary, 'Ringkasan Komisi');

    // Sheet 2: Detail Nota Servis
    const detailRows: any[] = [];
    mechanicPerformances.forEach((m) => {
      m.items.forEach((item) => {
        detailRows.push({
          'Nama Mekanik': m.mechanicName,
          Tanggal: formatDateIndo(item.date),
          'No. Nota': item.invoiceNumber,
          'Plat Nomor': item.vehiclePlate || '-',
          Pelanggan: item.customerName || '-',
          'Pekerjaan / Jasa Servis': item.serviceName,
          'Nilai Jasa (Rp)': item.serviceRevenue,
          'Persen (%)': `${item.commissionPercentage}%`,
          'Komisi Mekanik (Rp)': item.commissionAmount,
        });
      });
    });

    const wsDetails = XLSX.utils.json_to_sheet(detailRows);
    XLSX.utils.book_append_sheet(wb, wsDetails, 'Rincian Per Nota');

    const fileName = `Rekap_Komisi_Mekanik_${settings.storeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    sound.playSuccess();
  };

  // Cetak Rekap Komisi ke PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(settings.storeName || 'KASIR BENGKEL', 14, 15);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Laporan Kinerja & Komisi Mekanik (${periodBounds.label})`, 14, 22);
    doc.text(`Tanggal Cetak: ${formatDateIndo(new Date().toISOString())}`, 14, 28);

    doc.line(14, 32, 196, 32);

    let y = 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Nama Mekanik', 14, y);
    doc.text('Unit', 75, y);
    doc.text('Total Jasa', 95, y);
    doc.text('Bagi Hasil', 135, y);
    doc.text('Komisi (Rp)', 165, y);

    doc.line(14, y + 2, 196, y + 2);
    y += 7;

    doc.setFont('helvetica', 'normal');
    mechanicPerformances.forEach((m) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(m.mechanicName.slice(0, 28), 14, y);
      doc.text(`${m.vehicleCount} unit`, 75, y);
      doc.text(formatRupiah(m.serviceRevenue), 95, y);
      doc.text(`${m.commissionPercentage}%`, 135, y);
      doc.setFont('helvetica', 'bold');
      doc.text(formatRupiah(m.totalCommission), 165, y);
      doc.setFont('helvetica', 'normal');
      y += 6;
    });

    doc.line(14, y + 2, 196, y + 2);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL KOMISI DIBAYARKAN:', 14, y);
    doc.text(formatRupiah(totalAllCommission), 165, y);

    doc.save(`Komisi_Mekanik_${new Date().toISOString().slice(0, 10)}.pdf`);
    sound.playSuccess();
  };

  // Kirim Rekap Komisi ke WhatsApp Mekanik
  const handleShareWAMechanic = (m: MechanicPerformance) => {
    const textLines = [
      `*REKAP KOMISI SERVIS MEKANIK*`,
      `*${settings.storeName}*`,
      `Periode: ${periodBounds.label}`,
      `---------------------------------`,
      `Nama Mekanik : *${m.mechanicName}*`,
      `Total Kendaraan Ditangani : *${m.vehicleCount} Unit*`,
      `Total Nilai Jasa Servis   : *${formatRupiah(m.serviceRevenue)}*`,
      `Persentase Bagi Hasil     : *${m.commissionPercentage}%*`,
      `---------------------------------`,
      `*TOTAL KOMISI DITERIMA : ${formatRupiah(m.totalCommission)}*`,
      `---------------------------------`,
      `Rincian Pekerjaan:`,
      ...m.items.slice(0, 15).map((it, idx) => `${idx + 1}. ${it.vehiclePlate ? `[${it.vehiclePlate}]` : ''} ${it.serviceName} = ${formatRupiah(it.serviceRevenue)} (Komisi: ${formatRupiah(it.commissionAmount)})`),
      m.items.length > 15 ? `...dan ${m.items.length - 15} nota lainnya.` : '',
      `---------------------------------`,
      `Terima kasih atas kerja keras & dedikasinya! 🔧`,
    ].filter(Boolean);

    const text = encodeURIComponent(textLines.join('\n'));
    window.open(`https://wa.me/?text=${text}`, '_blank');
    sound.playSuccess();
  };

  return (
    <div id="mechanic-commission-container" className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Header Bar: Filter Waktu & Slider Bagi Hasil */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-2xl font-black shrink-0 border border-amber-500/30">
              👨‍🔧
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-zinc-950 dark:text-zinc-50">
                  Laporan Kinerja &amp; Komisi Mekanik
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Bagi Hasil Jasa
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Hitung otomatis upah bagi hasil jasa mekanik berdasarkan nota servis kendaraan.
              </p>
            </div>
          </div>

          {/* Filter Periode: Hari Ini, Mingguan, Bulanan, Semua */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              onClick={() => setPeriodFilter('TODAY')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                periodFilter === 'TODAY'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              📅 Hari Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('WEEK')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                periodFilter === 'WEEK'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              🗓️ 7 Hari (Mingguan)
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('MONTH')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                periodFilter === 'MONTH'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              📊 Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setPeriodFilter('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
                periodFilter === 'ALL'
                  ? 'bg-amber-500 text-zinc-950 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Semua
            </button>
          </div>
        </div>

        {/* 2. PENGATURAN PERSENTASE BAGI HASIL JASA (PROMPT 2 REQUIREMENT) */}
        <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Percent className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-black text-zinc-800 dark:text-zinc-200 uppercase tracking-wider font-mono">
              Persentase Bagi Hasil Jasa:
            </span>
            <span className="text-sm font-black text-amber-600 dark:text-amber-400 font-mono">
              {commissionPct}% untuk Mekanik ({100 - commissionPct}% Bengkel)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            {[40, 45, 50, 60].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => setCommissionPct(pct)}
                className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
                  commissionPct === pct
                    ? 'bg-amber-500 text-zinc-950 shadow-xs font-black'
                    : 'bg-white dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-600'
                }`}
              >
                {pct}%
              </button>
            ))}
            <div className="flex items-center gap-1 ml-2">
              <span className="text-xs text-zinc-400 font-bold">Kustom:</span>
              <input
                type="number"
                min={0}
                max={100}
                value={commissionPct}
                onChange={(e) => setCommissionPct(Math.min(100, Math.max(0, Number(e.target.value))))}
                className="w-16 px-2 py-1 rounded-lg border font-mono font-bold text-xs bg-white dark:bg-zinc-700 border-zinc-300 dark:border-zinc-600 text-center"
              />
              <span className="text-xs font-bold text-zinc-500">%</span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Kartu Ringkasan Total Komisi Seluruh Mekanik */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Total Nilai Jasa Servis
            </div>
            <div className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono mt-1">
              {formatRupiah(totalAllServiceRevenue)}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              Dari {totalVehiclesHandled} unit pengerjaan servis
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-2xl shrink-0">
            🛠️
          </div>
        </div>

        {/* TOTAL KOMISI MEKANIK */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-300 dark:border-emerald-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider font-mono">
              Total Komisi Mekanik
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {formatRupiah(totalAllCommission)}
            </div>
            <div className="text-xs text-emerald-700/80 dark:text-emerald-400/80 font-bold mt-0.5">
              Siap dibayarkan ({commissionPct}% bagi hasil)
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center text-2xl shrink-0">
            💵
          </div>
        </div>

        {/* Porsi Pendapatan Bersih Jasa untuk Pemilik Bengkel */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Porsi Jasa Pemilik Bengkel
            </div>
            <div className="text-xl sm:text-2xl font-black text-amber-500 font-mono mt-1">
              {formatRupiah(totalAllServiceRevenue - totalAllCommission)}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">
              {100 - commissionPct}% bagian kas bengkel
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl shrink-0">
            🏛️
          </div>
        </div>
      </div>

      {/* 4. Action Bar: Ekspor Excel & PDF */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            value={searchMechanic}
            onChange={(e) => setSearchMechanic(e.target.value)}
            placeholder="Cari nama mekanik..."
            className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs sm:text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Tombol Tambah Mekanik Baru */}
          <button
            type="button"
            onClick={() => {
              setNewMechanicName('');
              setIsAddModalOpen(true);
            }}
            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-md shadow-amber-500/20 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4 stroke-[2.5]" />
            <span>+ Tambah Mekanik</span>
          </button>

          {/* Tombol Kelola Semua Mekanik */}
          <button
            type="button"
            onClick={() => setIsManageDrawerOpen(true)}
            className="px-3.5 py-2 rounded-xl border border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20 text-amber-950 dark:text-amber-200 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            title="Daftar & Kelola Semua Mekanik Bengkel"
          >
            <Settings2 className="w-4 h-4 text-amber-500" />
            <span className="hidden sm:inline">Kelola Mekanik</span>
          </button>

          <button
            type="button"
            onClick={handleExportExcel}
            className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span className="hidden md:inline">Ekspor Excel</span>
          </button>

          <button
            type="button"
            onClick={handleExportPDF}
            className="px-3 py-2 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
          >
            <FileText className="w-4 h-4 text-rose-500" />
            <span className="hidden md:inline">Cetak PDF</span>
          </button>
        </div>
      </div>

      {/* 5. DAFTAR KARTU MEKANIK & RINCIAN KOMISI */}
      <div className="space-y-3">
        {mechanicPerformances.length === 0 ? (
          <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400">
            <Users className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
            <div className="font-bold text-base text-zinc-600 dark:text-zinc-300">
              Belum ada riwayat pengerjaan mekanik pada periode ini
            </div>
            <div className="text-xs text-zinc-400 mt-1">
              Klik &quot;+ Tambah Mekanik&quot; untuk menambahkan mekanik baru atau input saat transaksi di kasir.
            </div>
          </div>
        ) : (
          mechanicPerformances.map((m) => {
            const isExpanded = expandedMechanic === m.mechanicName;

            return (
              <div
                key={m.mechanicName}
                className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden"
              >
                {/* Header Kartu Mekanik */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center justify-center text-xl font-black shrink-0">
                      {m.mechanicName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                        <span>{m.mechanicName}</span>
                      </h3>
                      <div className="flex items-center gap-3 text-xs text-zinc-500 dark:text-zinc-400 font-medium mt-0.5">
                        <span className="flex items-center gap-1">
                          <Car className="w-3.5 h-3.5 text-zinc-400" />
                          <span>{m.vehicleCount} Kendaraan</span>
                        </span>
                        <span>•</span>
                        <span>Omzet Jasa: <strong className="text-zinc-800 dark:text-zinc-200">{formatRupiah(m.serviceRevenue)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Nominal Komisi & Tombol Aksi */}
                  <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 pt-3 md:pt-0 border-t md:border-t-0 border-zinc-100 dark:border-zinc-800">
                    <div className="text-right">
                      <div className="text-[11px] font-bold text-zinc-400 uppercase font-mono">
                        Komisi ({m.commissionPercentage}%)
                      </div>
                      <div className="text-lg sm:text-xl font-black text-emerald-600 dark:text-emerald-400 font-mono">
                        {formatRupiah(m.totalCommission)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 sm:gap-2">
                      {/* Tombol Edit Nama Mekanik */}
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOldName(m.mechanicName);
                          setEditingNewName(m.mechanicName);
                          setIsEditModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
                        title={`Ubah / Edit Nama Mekanik ${m.mechanicName}`}
                      >
                        <Edit2 className="w-3.5 h-3.5 text-amber-500" />
                        <span className="hidden sm:inline">Edit</span>
                      </button>

                      {/* Tombol Hapus Mekanik */}
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingMechanicName(m.mechanicName);
                          setIsDeleteModalOpen(true);
                        }}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors border border-rose-200 dark:border-rose-900/50"
                        title={`Hapus Mekanik ${m.mechanicName} (Mekanik Berhenti / Keluar)`}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hapus</span>
                      </button>

                      {/* Tombol Kirim WA */}
                      <button
                        type="button"
                        onClick={() => handleShareWAMechanic(m)}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 cursor-pointer shadow-sm"
                        title="Kirim rincian komisi via WhatsApp ke mekanik"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kirim WA</span>
                      </button>

                      {/* Tombol Rincian */}
                      <button
                        type="button"
                        onClick={() => setExpandedMechanic(isExpanded ? null : m.mechanicName)}
                        className="px-2.5 py-1.5 sm:px-3 sm:py-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-bold text-xs flex items-center gap-1 cursor-pointer"
                      >
                        <span>{isExpanded ? 'Tutup' : `Rincian (${m.items.length})`}</span>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Sub-Tabel Rincian Nota yang dikerjakan Mekanik ini */}
                {isExpanded && (
                  <div className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 p-4 animate-in fade-in">
                    <div className="text-xs font-black uppercase text-zinc-500 font-mono mb-2">
                      Rincian Nota Transaksi Dikerjakan:
                    </div>
                    {m.items.length === 0 ? (
                      <div className="text-xs text-zinc-400 italic py-2">
                        Tidak ada transaksi jasa pada periode ini.
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-xs">
                          <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-mono font-bold">
                              <th className="py-2 px-3">Tanggal</th>
                              <th className="py-2 px-3">No. Nota</th>
                              <th className="py-2 px-3">Plat Nomor</th>
                              <th className="py-2 px-3">Pelanggan</th>
                              <th className="py-2 px-3">Pekerjaan Jasa</th>
                              <th className="py-2 px-3 text-right">Nilai Jasa</th>
                              <th className="py-2 px-3 text-right font-black text-emerald-600 dark:text-emerald-400">
                                Komisi ({m.commissionPercentage}%)
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200/60 dark:divide-zinc-800/60 font-medium">
                            {m.items.map((it) => (
                              <tr key={it.transactionId} className="hover:bg-zinc-100/60 dark:hover:bg-zinc-800/30">
                                <td className="py-2.5 px-3 text-zinc-500 font-mono">
                                  {formatDateIndo(it.date)}
                                </td>
                                <td className="py-2.5 px-3 font-mono font-bold text-amber-500">
                                  #{it.invoiceNumber}
                                </td>
                                <td className="py-2.5 px-3">
                                  {it.vehiclePlate ? (
                                    <span className="font-mono font-black px-1.5 py-0.5 rounded bg-zinc-200 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100">
                                      {it.vehiclePlate}
                                    </span>
                                  ) : (
                                    <span className="text-zinc-400">-</span>
                                  )}
                                </td>
                                <td className="py-2.5 px-3 text-zinc-600 dark:text-zinc-300">
                                  {it.customerName || '-'}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-zinc-900 dark:text-zinc-100">
                                  {it.serviceName}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-bold">
                                  {formatRupiah(it.serviceRevenue)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-mono font-black text-emerald-600 dark:text-emerald-400">
                                  {formatRupiah(it.commissionAmount)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* 6. MODAL TAMBAH MEKANIK BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xl font-black">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-950 dark:text-white">
                    Tambah Mekanik Baru
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Daftarkan nama mekanik baru bengkel Anda
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewMechanic} className="p-6 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 mb-1.5">
                  Nama Lengkap Mekanik:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={newMechanicName}
                  onChange={(e) => setNewMechanicName(e.target.value)}
                  placeholder="Contoh: Dedi Pratama / Mas Tri"
                  className="w-full px-4 py-3 rounded-xl border text-sm sm:text-base font-bold bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                  Nama ini akan langsung tersedia di pilihan mekanik saat kasir menginput nota servis kendaraan.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!newMechanicName.trim()}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Mekanik Baru</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. MODAL EDIT NAMA MEKANIK */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xl font-black">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-950 dark:text-white">
                    Edit Data Mekanik
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Perbarui nama mekanik {editingOldName}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditMechanic} className="p-6 space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-black text-zinc-800 dark:text-zinc-200 mb-1.5">
                  Nama Mekanik Baru:
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  value={editingNewName}
                  onChange={(e) => setEditingNewName(e.target.value)}
                  placeholder="Nama mekanik..."
                  className="w-full px-4 py-3 rounded-xl border text-sm sm:text-base font-bold bg-zinc-50 dark:bg-zinc-950 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5">
                  Mengubah nama mekanik akan otomatis menyelaraskan seluruh riwayat nota dan komisi servis yang bersangkutan.
                </p>
              </div>

              <div className="pt-3 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={!editingNewName.trim() || editingNewName.trim() === editingOldName}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Perubahan</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 8. MODAL KONFIRMASI HAPUS MEKANIK (BERHENTI / KELUAR) */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            <div className="p-6 space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/15 text-rose-500 flex items-center justify-center text-2xl mx-auto border border-rose-500/30">
                <Trash2 className="w-6 h-6" />
              </div>
              <div className="text-center">
                <h3 className="font-black text-lg text-zinc-950 dark:text-white">
                  Hapus Mekanik {deletingMechanicName}?
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-2 leading-relaxed">
                  Apakah Anda yakin ingin menghapus <strong className="text-rose-500">{deletingMechanicName}</strong> dari daftar mekanik aktif bengkel?
                </p>
                <div className="mt-3 p-3 rounded-xl bg-zinc-100 dark:bg-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300 text-left space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-zinc-800 dark:text-zinc-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                    <span>Riwayat Transaksi Aman:</span>
                  </div>
                  <p className="opacity-90 pl-5">
                    Seluruh nota servis masa lalu yang dikerjakan oleh mekanik ini tetap tersimpan utuh di pembukuan dan laporan keuangan.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsDeleteModalOpen(false)}
                  className="w-1/2 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="w-1/2 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs sm:text-sm rounded-xl shadow-md cursor-pointer transition-all active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Ya, Hapus Mekanik</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL KELOLA SEMUA MEKANIK BENGKEL */}
      {isManageDrawerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-xl font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-zinc-950 dark:text-white">
                    Kelola Seluruh Mekanik Bengkel
                  </h3>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Total {mechanicsList.length} mekanik terdaftar
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsManageDrawerOpen(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Add Form on top */}
            <div className="p-4 bg-zinc-100 dark:bg-zinc-800/60 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
              <form onSubmit={handleSaveNewMechanic} className="flex gap-2">
                <input
                  type="text"
                  value={newMechanicName}
                  onChange={(e) => setNewMechanicName(e.target.value)}
                  placeholder="Ketik nama mekanik baru..."
                  className="flex-1 px-3.5 py-2 rounded-xl border text-xs sm:text-sm font-bold bg-white dark:bg-zinc-900 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <button
                  type="submit"
                  disabled={!newMechanicName.trim()}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 font-black text-xs sm:text-sm rounded-xl cursor-pointer shadow-xs transition-all flex items-center gap-1.5 shrink-0"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Tambah</span>
                </button>
              </form>
            </div>

            {/* Mechanics List */}
            <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-zinc-200 dark:divide-zinc-800">
              {mechanicsList.length === 0 ? (
                <div className="text-center py-8 text-zinc-400 text-xs">
                  Belum ada mekanik terdaftar. Gunakan formulir di atas untuk menambahkan mekanik.
                </div>
              ) : (
                mechanicsList.map((mName, idx) => (
                  <div key={mName} className="flex items-center justify-between pt-2.5 first:pt-0">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-500 font-bold flex items-center justify-center text-xs font-mono">
                        {idx + 1}
                      </div>
                      <span className="font-black text-sm text-zinc-900 dark:text-zinc-100">
                        {mName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingOldName(mName);
                          setEditingNewName(mName);
                          setIsEditModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                        title="Edit Nama"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeletingMechanicName(mName);
                          setIsDeleteModalOpen(true);
                        }}
                        className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/30 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 cursor-pointer"
                        title="Hapus Mekanik"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex justify-end shrink-0">
              <button
                type="button"
                onClick={() => setIsManageDrawerOpen(false)}
                className="px-5 py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-black text-xs sm:text-sm rounded-xl cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
