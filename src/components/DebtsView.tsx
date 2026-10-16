import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  Search,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Share2,
  Calendar,
  X,
  Car,
  Phone,
  DollarSign,
  ArrowRight,
  Clock,
  User,
  AlertTriangle,
  Receipt,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { CustomerDebt, StoreSettings, CashierUser } from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';
import { sound } from '../services/sound';

interface DebtsViewProps {
  debts: CustomerDebt[];
  onSaveDebt: (debt: CustomerDebt) => void;
  onRecordPayment: (debtId: string, amount: number, notes?: string) => void;
  settings: StoreSettings;
  currentUser: CashierUser | null;
  darkMode: boolean;
}

export const DebtsView: React.FC<DebtsViewProps> = ({
  debts,
  onSaveDebt,
  onRecordPayment,
  settings,
  currentUser,
  darkMode,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'UNPAID' | 'OVERDUE' | 'PAID'>('UNPAID');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [selectedDebt, setSelectedDebt] = useState<CustomerDebt | null>(null);

  // New Debt Form
  const [formData, setFormData] = useState({
    customerName: '',
    phone: '',
    vehiclePlate: '',
    vehicleModel: '',
    totalBill: 150000,
    downPayment: 50000,
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    notes: 'Servis motor berkala & ganti oli',
  });

  // Repayment form
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payNotes, setPayNotes] = useState<string>('Pelunasan piutang servis');

  // Filtered debts
  const filteredDebts = useMemo(() => {
    const nowTime = Date.now();
    return debts.filter((d) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        d.customerName.toLowerCase().includes(q) ||
        (d.vehiclePlate && d.vehiclePlate.toLowerCase().includes(q)) ||
        (d.phone && d.phone.includes(q)) ||
        (d.notes && d.notes.toLowerCase().includes(q));

      const isUnpaid = d.totalDebt > 0;
      const isOverdue = isUnpaid && d.dueDate && new Date(d.dueDate).getTime() < nowTime;

      let matchStatus = true;
      if (statusFilter === 'UNPAID') matchStatus = isUnpaid;
      if (statusFilter === 'OVERDUE') matchStatus = Boolean(isOverdue);
      if (statusFilter === 'PAID') matchStatus = !isUnpaid;

      return matchSearch && matchStatus;
    });
  }, [debts, searchQuery, statusFilter]);

  // Aggregate Metrics
  const totalUnpaidDebt = useMemo(() => {
    return debts.reduce((sum, d) => sum + (d.totalDebt > 0 ? d.totalDebt : 0), 0);
  }, [debts]);

  const unpaidCustomersCount = useMemo(() => {
    return debts.filter((d) => d.totalDebt > 0).length;
  }, [debts]);

  const overdueCount = useMemo(() => {
    const nowTime = Date.now();
    return debts.filter((d) => d.totalDebt > 0 && d.dueDate && new Date(d.dueDate).getTime() < nowTime).length;
  }, [debts]);

  const totalCollected = useMemo(() => {
    return debts.reduce((acc, d) => {
      const paymentsSum = (d.payments || []).reduce((s, p) => s + p.amount, 0);
      return acc + paymentsSum + (d.downPayment || 0);
    }, 0);
  }, [debts]);

  // Handle open payment modal
  const openPaymentModal = (debt: CustomerDebt) => {
    setSelectedDebt(debt);
    setPayAmount(debt.totalDebt); // Default to full payoff
    setPayNotes('Pelunasan biaya servis');
    setIsPayModalOpen(true);
  };

  // Submit Payment / Settle Debt
  const handlePaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDebt) return;
    if (payAmount <= 0) {
      alert('Nominal pembayaran harus lebih besar dari Rp 0');
      return;
    }

    onRecordPayment(selectedDebt.id, Number(payAmount), payNotes);
    sound.playSuccess();
    setIsPayModalOpen(false);
    setSelectedDebt(null);
  };

  // Submit Add Manual Debt
  const handleAddDebtSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerName.trim()) {
      alert('Nama pelanggan wajib diisi.');
      return;
    }

    const remaining = Math.max(0, formData.totalBill - formData.downPayment);

    const newDebt: CustomerDebt = {
      id: `debt-${Date.now()}`,
      customerName: formData.customerName.trim(),
      phone: formData.phone.trim() || undefined,
      vehiclePlate: formData.vehiclePlate.trim().toUpperCase() || undefined,
      vehicleModel: formData.vehicleModel.trim() || undefined,
      totalDebt: remaining,
      originalAmount: Number(formData.totalBill),
      downPayment: Number(formData.downPayment),
      createdAt: new Date().toISOString(),
      dueDate: formData.dueDate,
      notes: formData.notes.trim(),
      transactions: [
        {
          transactionId: `manual-trx-${Date.now()}`,
          invoiceNumber: `TEMPO-${new Date().getFullYear()}${Math.floor(1000 + Math.random() * 9000)}`,
          date: new Date().toISOString(),
          amount: Number(formData.totalBill),
          description: formData.notes.trim() || 'Servis Kendaraan Tempo',
          vehiclePlate: formData.vehiclePlate.trim().toUpperCase() || undefined,
        },
      ],
      payments:
        formData.downPayment > 0
          ? [
              {
                id: `pay-dp-${Date.now()}`,
                date: new Date().toISOString(),
                amount: Number(formData.downPayment),
                cashierName: currentUser?.name || 'Kasir',
                notes: 'Uang Muka (DP) Awal',
              },
            ]
          : [],
    };

    onSaveDebt(newDebt);
    sound.playSuccess();
    setIsAddModalOpen(false);
  };

  // Kirim Pengingat Tagihan WhatsApp
  const handleSendWAReminder = (debt: CustomerDebt) => {
    let cleanPhone = (debt.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const msgLines = [
      `*PEMBERITAHUAN BIAYA SERVIS BENGKEL*`,
      `*${settings.storeName.toUpperCase()}*`,
      settings.phone ? `Telp/WA: ${settings.phone}` : '',
      `---------------------------------`,
      `Halo Bapak/Ibu *${debt.customerName}*,`,
      `Kami menginformasikan catatan servis kendaraan Anda:`,
      debt.vehiclePlate ? `Plat Nomor : *${debt.vehiclePlate}*` : '',
      debt.vehicleModel ? `Kendaraan  : ${debt.vehicleModel}` : '',
      debt.originalAmount ? `Total Tagihan Servis : ${formatRupiah(debt.originalAmount)}` : '',
      debt.downPayment ? `Uang Muka (DP)       : ${formatRupiah(debt.downPayment)}` : '',
      `*SISA HUTANG/TEMPO   : ${formatRupiah(debt.totalDebt)}*`,
      debt.dueDate ? `Jatuh Tempo          : *${formatDateIndo(debt.dueDate)}*` : '',
      `---------------------------------`,
      `Pembayaran dapat dilakukan langsung ke bengkel atau transfer ke rekening bengkel kami.`,
      `Terima kasih atas kerjasamanya! 🔧`,
    ].filter(Boolean);

    const text = encodeURIComponent(msgLines.join('\n'));
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
    sound.playSuccess();
  };

  // Ekspor Piutang ke Excel
  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = debts.map((d, idx) => ({
      No: idx + 1,
      'Plat Nomor': d.vehiclePlate || '-',
      'Nama Pelanggan': d.customerName,
      'No. WhatsApp': d.phone || '-',
      'Model Kendaraan': d.vehicleModel || '-',
      'Total Servis Awal (Rp)': d.originalAmount || d.totalDebt,
      'Uang Muka DP (Rp)': d.downPayment || 0,
      'Sisa Piutang (Rp)': d.totalDebt,
      'Tanggal Jatuh Tempo': d.dueDate ? formatDateIndo(d.dueDate) : '-',
      Status: d.totalDebt === 0 ? 'LUNAS' : 'BELUM LUNAS',
      Catatan: d.notes || '-',
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    XLSX.utils.book_append_sheet(wb, ws, 'Buku Piutang Servis');

    const fileName = `Buku_Piutang_Servis_${settings.storeName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    sound.playSuccess();
  };

  // Ekspor Piutang ke PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(settings.storeName || 'KASIR BENGKEL', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`BUKU PIUTANG SERVIS & KASBON PELANGGAN`, 14, 22);
    doc.text(`Tanggal: ${formatDateIndo(new Date().toISOString())}`, 14, 28);

    doc.line(14, 32, 196, 32);

    let y = 40;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text('Plat / Pelanggan', 14, y);
    doc.text('No. WA', 75, y);
    doc.text('Awal (Rp)', 110, y);
    doc.text('Sisa Hutang', 145, y);
    doc.text('Status', 178, y);

    doc.line(14, y + 2, 196, y + 2);
    y += 7;

    doc.setFont('helvetica', 'normal');
    debts.forEach((d) => {
      if (y > 270) {
        doc.addPage();
        y = 20;
      }
      doc.text(`${d.vehiclePlate ? `[${d.vehiclePlate}] ` : ''}${d.customerName}`.slice(0, 30), 14, y);
      doc.text((d.phone || '-').slice(0, 16), 75, y);
      doc.text(formatRupiah(d.originalAmount || d.totalDebt), 110, y);
      doc.setFont('helvetica', 'bold');
      doc.text(formatRupiah(d.totalDebt), 145, y);
      doc.setFont('helvetica', 'normal');
      doc.text(d.totalDebt === 0 ? 'LUNAS' : 'TEMPO', 178, y);
      y += 6;
    });

    doc.line(14, y + 2, 196, y + 2);
    y += 8;
    doc.setFont('helvetica', 'bold');
    doc.text('TOTAL SISA PIUTANG BENGKEL:', 14, y);
    doc.text(formatRupiah(totalUnpaidDebt), 145, y);

    doc.save(`Buku_Piutang_Servis_${new Date().toISOString().slice(0, 10)}.pdf`);
    sound.playSuccess();
  };

  return (
    <div id="debts-view-container" className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Header Ringkasan Keuangan Piutang Servis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sisa Piutang */}
        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-950/30 border border-rose-300 dark:border-rose-900 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-black text-rose-600 dark:text-rose-400 uppercase tracking-wider font-mono">
              Total Sisa Piutang Servis
            </div>
            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400 font-mono mt-1">
              {formatRupiah(totalUnpaidDebt)}
            </div>
            <div className="text-xs text-rose-600/80 dark:text-rose-400/80 font-medium mt-0.5">
              Uang bengkel belum tertagih
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center text-2xl shrink-0">
            ⏳
          </div>
        </div>

        {/* Pelanggan Belum Lunas */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'UNPAID' ? 'ALL' : 'UNPAID')}
          className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between cursor-pointer hover:border-amber-500 transition-colors"
        >
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Pelanggan Belum Lunas
            </div>
            <div className="text-2xl font-black text-zinc-900 dark:text-zinc-100 font-mono mt-1">
              {unpaidCustomersCount} Orang
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Memiliki sisa tagihan aktif</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl shrink-0">
            🛵
          </div>
        </div>

        {/* Lewat Jatuh Tempo */}
        <div
          onClick={() => setStatusFilter(statusFilter === 'OVERDUE' ? 'ALL' : 'OVERDUE')}
          className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between cursor-pointer transition-all ${
            overdueCount > 0
              ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-300 dark:border-amber-900'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800'
          }`}
        >
          <div>
            <div className="text-xs font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono">
              Lewat Jatuh Tempo
            </div>
            <div className="text-2xl font-black text-amber-600 dark:text-amber-400 font-mono mt-1">
              {overdueCount} Tagihan
            </div>
            <div className="text-xs text-amber-600/80 dark:text-amber-400/80 font-medium mt-0.5">
              {overdueCount > 0 ? 'Perlu diingatkan via WhatsApp' : 'Semua jatuh tempo aman'}
            </div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center text-2xl shrink-0">
            ⚠️
          </div>
        </div>

        {/* Total Berhasil Ditagih */}
        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Total Terbayar / Dilunasi
            </div>
            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 font-mono mt-1">
              {formatRupiah(totalCollected)}
            </div>
            <div className="text-xs text-zinc-400 mt-0.5">Akumulasi uang masuk (DP + Cicilan)</div>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-2xl shrink-0">
            ✅
          </div>
        </div>
      </div>

      {/* 2. Action Bar: Search, Status Filter, Ekspor & Tambah Piutang */}
      <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
            <input
              id="input-debt-search"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari Plat Nomor, Nama Pelanggan, atau No. WhatsApp..."
              className="w-full pl-11 pr-4 py-3 rounded-xl border text-sm sm:text-base font-medium bg-zinc-50 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400"
              >
                ✕
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Excel</span>
            </button>

            <button
              type="button"
              onClick={handleExportPDF}
              className="px-3.5 py-2.5 rounded-xl border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs sm:text-sm flex items-center gap-1.5 cursor-pointer shadow-xs"
            >
              <FileText className="w-4 h-4 text-rose-500" />
              <span>Cetak / PDF</span>
            </button>

            <button
              id="btn-add-debt"
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>+ Catat Piutang Manual</span>
            </button>
          </div>
        </div>

        {/* Filter Status Cepat */}
        <div className="flex items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => setStatusFilter('UNPAID')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              statusFilter === 'UNPAID'
                ? 'bg-rose-600 text-white shadow-xs font-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Belum Lunas ({unpaidCustomersCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('OVERDUE')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              statusFilter === 'OVERDUE'
                ? 'bg-amber-500 text-zinc-950 shadow-xs font-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Lewat Jatuh Tempo ({overdueCount})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              statusFilter === 'ALL'
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 font-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Semua Catatan ({debts.length})
          </button>
          <button
            type="button"
            onClick={() => setStatusFilter('PAID')}
            className={`px-3 py-1.5 rounded-lg font-bold cursor-pointer transition-all ${
              statusFilter === 'PAID'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
            }`}
          >
            Sudah Lunas
          </button>
        </div>
      </div>

      {/* 3. TABEL BUKU PIUTANG SERVIS (PROMPT 5 REQUIREMENTS) */}
      <div className="rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-zinc-200 dark:border-zinc-800 bg-zinc-100/70 dark:bg-zinc-800/50 text-xs font-black text-zinc-600 dark:text-zinc-400 uppercase tracking-wider font-mono">
                <th className="py-3 px-4">Plat Kendaraan</th>
                <th className="py-3 px-4">Nama Pelanggan &amp; WA</th>
                <th className="py-3 px-4 text-right">Biaya Awal</th>
                <th className="py-3 px-4 text-right">Uang Muka (DP)</th>
                <th className="py-3 px-4 text-right">Sisa Piutang</th>
                <th className="py-3 px-4 text-center">Jatuh Tempo</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-center">Aksi Pelunasan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800 text-sm">
              {filteredDebts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-zinc-400">
                    <BookOpen className="w-10 h-10 mx-auto text-zinc-300 dark:text-zinc-700 mb-2" />
                    <div className="font-bold text-base text-zinc-600 dark:text-zinc-300">
                      Tidak ada catatan piutang servis pada filter ini
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      Saat kasir memilih pembayaran "Tempo / Hutang", data otomatis tercatat di sini.
                    </div>
                  </td>
                </tr>
              ) : (
                filteredDebts.map((debt) => {
                  const isUnpaid = debt.totalDebt > 0;
                  const isOverdue = isUnpaid && debt.dueDate && new Date(debt.dueDate).getTime() < Date.now();

                  return (
                    <tr
                      key={debt.id}
                      className={`hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors ${
                        isOverdue
                          ? 'bg-rose-50/60 dark:bg-rose-950/20'
                          : isUnpaid
                          ? 'bg-amber-50/30 dark:bg-amber-950/10'
                          : ''
                      }`}
                    >
                      {/* 1. Plat Kendaraan */}
                      <td className="py-3.5 px-4 font-mono">
                        {debt.vehiclePlate ? (
                          <div className="inline-block px-2.5 py-1 rounded-lg bg-zinc-950 text-white font-black text-xs border border-zinc-700 tracking-wider">
                            {debt.vehiclePlate}
                          </div>
                        ) : (
                          <span className="text-zinc-400 text-xs">-</span>
                        )}
                        {debt.vehicleModel && (
                          <div className="text-[11px] text-zinc-400 mt-0.5">{debt.vehicleModel}</div>
                        )}
                      </td>

                      {/* 2. Pelanggan & WA */}
                      <td className="py-3.5 px-4 font-bold text-zinc-900 dark:text-zinc-100">
                        <div className="text-base">{debt.customerName}</div>
                        {debt.phone && (
                          <div className="text-xs font-mono font-medium text-emerald-600 dark:text-emerald-400 mt-0.5 flex items-center gap-1">
                            <Phone className="w-3 h-3" />
                            <span>{debt.phone}</span>
                          </div>
                        )}
                        {debt.notes && (
                          <div className="text-[11px] text-zinc-400 font-normal italic mt-0.5">
                            "{debt.notes}"
                          </div>
                        )}
                      </td>

                      {/* 3. Biaya Servis Awal */}
                      <td className="py-3.5 px-4 text-right font-mono text-zinc-600 dark:text-zinc-400">
                        {formatRupiah(debt.originalAmount || debt.totalDebt)}
                      </td>

                      {/* 4. Uang Muka (DP) */}
                      <td className="py-3.5 px-4 text-right font-mono text-emerald-600 dark:text-emerald-400 font-bold">
                        {debt.downPayment ? formatRupiah(debt.downPayment) : '-'}
                      </td>

                      {/* 5. Sisa Piutang (PROMPT 5: Teks Besar & Mencolok) */}
                      <td className="py-3.5 px-4 text-right font-mono font-black text-base text-rose-600 dark:text-rose-400">
                        {formatRupiah(debt.totalDebt)}
                      </td>

                      {/* 6. Tanggal Jatuh Tempo */}
                      <td className="py-3.5 px-4 text-center font-mono text-xs">
                        {debt.dueDate ? (
                          <div className="inline-flex flex-col items-center">
                            <span className="font-bold text-zinc-700 dark:text-zinc-300">
                              {formatDateIndo(debt.dueDate)}
                            </span>
                            {isOverdue && (
                              <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded mt-0.5">
                                ⚠️ Lewat Tempo
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-zinc-400">-</span>
                        )}
                      </td>

                      {/* 7. Status */}
                      <td className="py-3.5 px-4 text-center">
                        {debt.totalDebt === 0 ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black font-mono bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30">
                            ✓ LUNAS
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 rounded-full text-xs font-black font-mono bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30">
                            BELUM LUNAS
                          </span>
                        )}
                      </td>

                      {/* 8. Tombol Pelunasan (PROMPT 5) & WhatsApp */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          {debt.totalDebt > 0 && (
                            <button
                              id={`btn-settle-${debt.id}`}
                              type="button"
                              onClick={() => openPaymentModal(debt)}
                              className="px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-sm cursor-pointer transition-all active:scale-95"
                              title="Catat pembayaran pelunasan atau cicilan"
                            >
                              Bayar / Lunas
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => handleSendWAReminder(debt)}
                            className="p-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer transition-colors shadow-xs"
                            title="Kirim pengingat tagihan via WhatsApp"
                          >
                            <Share2 className="w-3.5 h-3.5" />
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

      {/* MODAL 1: Pelunasan Piutang Servis (Prompt 5) */}
      {isPayModalOpen && selectedDebt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Pelunasan Piutang Servis
                </h3>
                <p className="text-xs text-zinc-400 font-bold">
                  {selectedDebt.customerName} {selectedDebt.vehiclePlate ? `(${selectedDebt.vehiclePlate})` : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsPayModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit} className="space-y-4 text-sm">
              <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 rounded-2xl border border-rose-200 dark:border-rose-900 flex items-center justify-between">
                <span className="text-xs font-bold text-rose-700 dark:text-rose-400">Sisa Hutang Saat Ini:</span>
                <span className="text-xl font-black font-mono text-rose-600 dark:text-rose-400">
                  {formatRupiah(selectedDebt.totalDebt)}
                </span>
              </div>

              {/* Nominal Pembayaran */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Nominal Pembayaran / Pelunasan (Rp) *
                </label>
                <input
                  type="number"
                  min={1}
                  max={selectedDebt.totalDebt}
                  required
                  value={payAmount || ''}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border font-mono font-black text-xl bg-zinc-50 dark:bg-zinc-800 border-amber-500 text-amber-500 text-center"
                />
                {/* Tombol Pelunasan Penuh */}
                <div className="flex items-center justify-end gap-2 mt-1.5">
                  <button
                    type="button"
                    onClick={() => setPayAmount(selectedDebt.totalDebt)}
                    className="text-xs text-amber-500 hover:underline font-bold cursor-pointer"
                  >
                    Bayar Lunas Penuh ({formatRupiah(selectedDebt.totalDebt)})
                  </button>
                </div>
              </div>

              {/* Sisa Piutang Setelah Bayar */}
              <div className="p-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-xs flex justify-between font-mono font-bold">
                <span className="text-zinc-500">Sisa Hutang Setelah Bayar:</span>
                <span className={payAmount >= selectedDebt.totalDebt ? 'text-emerald-500' : 'text-rose-500'}>
                  {formatRupiah(Math.max(0, selectedDebt.totalDebt - payAmount))}
                  {payAmount >= selectedDebt.totalDebt ? ' (LUNAS)' : ''}
                </span>
              </div>

              {/* Catatan Pembayaran */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Catatan Pembayaran
                </label>
                <input
                  type="text"
                  value={payNotes}
                  onChange={(e) => setPayNotes(e.target.value)}
                  placeholder="Contoh: Diterima tunai oleh kasir / transfer"
                  className="w-full px-3.5 py-2.5 rounded-xl border text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsPayModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm shadow-md"
                >
                  Konfirmasi Pelunasan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Tambah Catatan Piutang Manual */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div>
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Catat Piutang Servis Manual
                </h3>
                <p className="text-xs text-zinc-400">
                  Catat hutang / tempo servis pelanggan yang belum lunas
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-zinc-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddDebtSubmit} className="space-y-4 text-sm">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                    Plat Nomor Kendaraan
                  </label>
                  <input
                    type="text"
                    value={formData.vehiclePlate}
                    onChange={(e) => setFormData({ ...formData, vehiclePlate: e.target.value.toUpperCase() })}
                    placeholder="Contoh: B 1234 ABC"
                    className="w-full px-3.5 py-2.5 rounded-xl border font-mono font-black text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                    Model / Tipe Kendaraan
                  </label>
                  <input
                    type="text"
                    value={formData.vehicleModel}
                    onChange={(e) => setFormData({ ...formData, vehicleModel: e.target.value })}
                    placeholder="Contoh: Vario 150 / Avanza"
                    className="w-full px-3.5 py-2.5 rounded-xl border text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                    Nama Pelanggan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.customerName}
                    onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                    placeholder="Contoh: Mas Hendra"
                    className="w-full px-3.5 py-2.5 rounded-xl border font-bold text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  />
                </div>
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                    No. WhatsApp (Untuk Pengingat)
                  </label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="Contoh: 08123456789"
                    className="w-full px-3.5 py-2.5 rounded-xl border font-mono text-sm bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                  />
                </div>
              </div>

              {/* Rincian Finansial: Total Biaya, DP, Sisa Hutang */}
              <div className="p-3.5 rounded-2xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                      Total Biaya Servis (Awal)
                    </label>
                    <input
                      type="number"
                      min={1}
                      required
                      value={formData.totalBill}
                      onChange={(e) => setFormData({ ...formData, totalBill: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border font-mono font-bold text-base bg-white dark:bg-zinc-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-black uppercase tracking-wider text-emerald-600 mb-1 font-mono">
                      Uang Muka (DP) Dibayar
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={formData.downPayment}
                      onChange={(e) => setFormData({ ...formData, downPayment: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border font-mono font-bold text-base bg-white dark:bg-zinc-700 text-emerald-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-zinc-200 dark:border-zinc-700">
                  <span className="text-xs font-bold text-zinc-500">Sisa Piutang / Hutang:</span>
                  <span className="text-lg font-black font-mono text-rose-600 dark:text-rose-400">
                    {formatRupiah(Math.max(0, formData.totalBill - formData.downPayment))}
                  </span>
                </div>
              </div>

              {/* Tanggal Jatuh Tempo */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Tanggal Jatuh Tempo
                </label>
                <input
                  type="date"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border text-sm font-mono bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                />
              </div>

              {/* Catatan Servis */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-zinc-500 mb-1 font-mono">
                  Keterangan Pengerjaan
                </label>
                <input
                  type="text"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="Contoh: Ganti ban tubeless & servis karburator"
                  className="w-full px-3.5 py-2 rounded-xl border text-xs bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm shadow-md"
                >
                  Simpan Catatan Piutang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
