import React, { useState, useMemo } from 'react';
import {
  Car,
  Search,
  Calendar,
  Clock,
  Wrench,
  Package,
  User,
  Phone,
  FileText,
  Share2,
  CheckCircle2,
  ArrowRight,
  TrendingUp,
  Gauge,
  Printer,
  History,
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Transaction, StoreSettings } from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';
import { sound } from '../services/sound';

interface ServiceRecordViewProps {
  transactions: Transaction[];
  settings: StoreSettings;
  darkMode: boolean;
  onViewReceipt?: (trx: Transaction) => void;
  initialPlateQuery?: string;
}

export const ServiceRecordView: React.FC<ServiceRecordViewProps> = ({
  transactions,
  settings,
  darkMode,
  onViewReceipt,
  initialPlateQuery = '',
}) => {
  const [searchPlate, setSearchPlate] = useState<string>(initialPlateQuery);

  // Kumpulan seluruh plat nomor unik yang pernah servis
  const registeredPlates = useMemo(() => {
    const map = new Map<string, { plate: string; model?: string; customer?: string; count: number; lastDate: string }>();

    transactions.forEach((t) => {
      if (t.vehiclePlate && t.vehiclePlate.trim()) {
        const clean = t.vehiclePlate.trim().toUpperCase();
        const existing = map.get(clean);
        if (existing) {
          existing.count += 1;
          if (new Date(t.date).getTime() > new Date(existing.lastDate).getTime()) {
            existing.lastDate = t.date;
            existing.model = t.vehicleModel || existing.model;
            existing.customer = t.customerName || existing.customer;
          }
        } else {
          map.set(clean, {
            plate: clean,
            model: t.vehicleModel,
            customer: t.customerName,
            count: 1,
            lastDate: t.date,
          });
        }
      }
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
    );
  }, [transactions]);

  // Normalisasi query plat pencarian
  const normalizedQuery = searchPlate.trim().toUpperCase().replace(/\s+/g, ' ');

  // Temukan riwayat servis untuk plat nomor yang dicari
  const matchedTransactions = useMemo(() => {
    if (!normalizedQuery) {
      // Jika belum ketik, tampilkan riwayat dari plat kendaraan paling sering/terakhir servis
      if (registeredPlates.length > 0) {
        const topPlate = registeredPlates[0].plate;
        return transactions.filter(
          (t) => t.vehiclePlate && t.vehiclePlate.trim().toUpperCase() === topPlate
        );
      }
      return [];
    }

    return transactions
      .filter((t) => {
        if (!t.vehiclePlate) return false;
        const p = t.vehiclePlate.trim().toUpperCase();
        // Cek kecocokan nomor plat atau nomor tanpa spasi
        return p.includes(normalizedQuery) || p.replace(/\s+/g, '').includes(normalizedQuery.replace(/\s+/g, ''));
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, normalizedQuery, registeredPlates]);

  // Ringkasan profil kendaraan yang sedang dilihat
  const vehicleProfile = useMemo(() => {
    if (matchedTransactions.length === 0) return null;

    const latest = matchedTransactions[0];
    const plate = latest.vehiclePlate || normalizedQuery;
    const model = matchedTransactions.find((t) => t.vehicleModel)?.vehicleModel || 'Kendaraan Bermotor';
    const customer = matchedTransactions.find((t) => t.customerName)?.customerName || 'Pelanggan Bengkel';
    const phone = matchedTransactions.find((t) => t.customerPhone)?.customerPhone;

    // KM Terakhir
    const latestWithOdo = matchedTransactions.find((t) => typeof t.odometerKm === 'number' && t.odometerKm > 0);
    const lastKm = latestWithOdo ? latestWithOdo.odometerKm : null;

    // Total akumulasi belanja
    const totalSpent = matchedTransactions.reduce((acc, t) => acc + t.grandTotal, 0);

    return {
      plate,
      model,
      customer,
      phone,
      totalVisits: matchedTransactions.length,
      lastKm,
      totalSpent,
      firstVisit: matchedTransactions[matchedTransactions.length - 1].date,
      lastVisit: latest.date,
    };
  }, [matchedTransactions, normalizedQuery]);

  // Cetak Riwayat Servis ke PDF
  const handlePrintServiceRecord = () => {
    if (!vehicleProfile) return;

    const doc = new jsPDF();
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text(settings.storeName || 'KASIR BENGKEL', 14, 15);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`RIWAYAT SERVIS KENDARAAN (SERVICE RECORD)`, 14, 22);
    doc.text(`Plat Nomor : ${vehicleProfile.plate} - ${vehicleProfile.model}`, 14, 28);
    doc.text(`Pemilik    : ${vehicleProfile.customer} ${vehicleProfile.phone ? `(${vehicleProfile.phone})` : ''}`, 14, 34);
    if (vehicleProfile.lastKm) {
      doc.text(`KM Terakhir: ${vehicleProfile.lastKm.toLocaleString('id-ID')} KM`, 14, 40);
    }

    doc.line(14, 44, 196, 44);

    let y = 52;
    matchedTransactions.forEach((trx, idx) => {
      if (y > 260) {
        doc.addPage();
        y = 20;
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`${idx + 1}. Tanggal: ${formatDateIndo(trx.date)} | Nota: #${trx.invoiceNumber}`, 14, y);
      doc.setFont('helvetica', 'normal');
      doc.text(`Mekanik: ${trx.mechanicName || '-'} | Total: ${formatRupiah(trx.grandTotal)}`, 130, y);
      y += 5;

      if (trx.odometerKm) {
        doc.text(`Kilometer saat servis: ${trx.odometerKm.toLocaleString('id-ID')} KM`, 18, y);
        y += 4.5;
      }

      // Items
      trx.items.forEach((it) => {
        const itemType = it.itemType === 'JASA' ? '[JASA]' : '[PART]';
        doc.text(`• ${itemType} ${it.productName} (${it.quantity} ${it.unit || 'pcs'}) = ${formatRupiah(it.subtotal)}`, 18, y);
        y += 4.5;
      });

      if (trx.notes) {
        doc.setFont('helvetica', 'italic');
        doc.text(`Catatan: ${trx.notes}`, 18, y);
        doc.setFont('helvetica', 'normal');
        y += 4.5;
      }

      y += 3;
      doc.line(14, y, 196, y);
      y += 6;
    });

    doc.save(`Riwayat_Servis_${vehicleProfile.plate.replace(/\s+/g, '_')}.pdf`);
    sound.playSuccess();
  };

  // Kirim Ringkasan Riwayat Servis via WhatsApp ke Pemilik Kendaraan
  const handleShareWAServiceRecord = () => {
    if (!vehicleProfile) return;

    const textLines = [
      `*RIWAYAT SERVIS RESMI KENDARAAN*`,
      `*${settings.storeName}*`,
      `---------------------------------`,
      `Plat Nomor : *${vehicleProfile.plate}*`,
      `Tipe Motor : *${vehicleProfile.model}*`,
      `Pemilik    : *${vehicleProfile.customer}*`,
      vehicleProfile.lastKm ? `KM Terakhir: *${vehicleProfile.lastKm.toLocaleString('id-ID')} KM*` : '',
      `Total Kunjungan : *${vehicleProfile.totalVisits} Kali Servis*`,
      `---------------------------------`,
      `*HISTORI PENGERJAAN TERAKHIR:*`,
      ...matchedTransactions.slice(0, 5).map((t, idx) => {
        const parts = t.items.filter((i) => i.itemType === 'SPAREPART').map((i) => i.productName).join(', ') || '-';
        const jasas = t.items.filter((i) => i.itemType === 'JASA').map((i) => i.productName).join(', ') || '-';
        return `\n${idx + 1}. *${formatDateIndo(t.date)}* (Nota #${t.invoiceNumber})\n   • Mekanik: ${t.mechanicName || '-'}\n   • KM: ${t.odometerKm ? `${t.odometerKm.toLocaleString('id-ID')} KM` : '-'}\n   • Jasa Servis: ${jasas}\n   • Sparepart Ganti: ${parts}\n   • Total Biaya: ${formatRupiah(t.grandTotal)}`;
      }),
      `---------------------------------`,
      `Simpan catatan ini untuk memantau jadwal ganti oli dan servis berkala kendaraan Anda. Terima kasih! 🔧`,
    ].filter(Boolean);

    let cleanPhone = (vehicleProfile.phone || '').replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const text = encodeURIComponent(textLines.join('\n'));
    const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${text}` : `https://wa.me/?text=${text}`;
    window.open(waUrl, '_blank');
    sound.playSuccess();
  };

  return (
    <div id="service-record-container" className="space-y-4 max-w-7xl mx-auto pb-16">
      {/* 1. Header & Kotak Pencarian Plat Nomor (PROMPT 3 REQUIREMENT) */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center text-2xl font-black shrink-0 border border-amber-500/30">
              📋
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black text-zinc-950 dark:text-zinc-50">
                  Riwayat Servis Pelanggan (Service Record)
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Cari Plat Nomor
                </span>
              </div>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
                Cek rekam medis motor/mobil: tanggal servis, kilometer terakhir, sparepart yang pernah diganti, mekanik, dan total biaya.
              </p>
            </div>
          </div>
        </div>

        {/* INPUT PENCARIAN PLAT NOMOR BESAR & MENCOLOK */}
        <div className="relative">
          <Search className="w-6 h-6 absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
          <input
            id="input-search-vehicle-plate"
            type="text"
            value={searchPlate}
            onChange={(e) => setSearchPlate(e.target.value.toUpperCase())}
            placeholder="Ketik Plat Nomor Kendaraan... (Contoh: B 1234 ABC atau B 4712 SZR)"
            className="w-full pl-13 pr-10 py-3.5 sm:py-4 rounded-2xl border-2 font-mono font-black text-base sm:text-xl tracking-wider uppercase bg-zinc-50 dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 text-zinc-900 dark:text-zinc-50 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-inner"
          />
          {searchPlate && (
            <button
              type="button"
              onClick={() => setSearchPlate('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-400 hover:text-zinc-100"
            >
              ✕
            </button>
          )}
        </div>

        {/* Quick Badges: Plat nomor yang terdaftar di database */}
        {registeredPlates.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="text-zinc-400 font-bold font-mono shrink-0 mr-1">Plat Terdaftar:</span>
            {registeredPlates.map((rp) => (
              <button
                key={rp.plate}
                type="button"
                onClick={() => setSearchPlate(rp.plate)}
                className={`px-3 py-1.5 rounded-lg font-mono font-black text-xs shrink-0 transition-all cursor-pointer ${
                  searchPlate.trim().toUpperCase() === rp.plate
                    ? 'bg-amber-500 text-zinc-950 shadow-sm'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                <span>{rp.plate}</span>
                <span className="ml-1.5 text-[10px] font-normal text-zinc-400">({rp.count}x)</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. PROFIL KENDARAAN (Jika ditemukan) */}
      {vehicleProfile ? (
        <>
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-950 text-white border border-zinc-800 shadow-md">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                {/* Plat Nomor Style Box */}
                <div className="px-4 py-2.5 rounded-xl bg-black border-2 border-white/80 text-white font-mono font-black text-lg sm:text-2xl tracking-widest text-center shadow-lg shrink-0">
                  {vehicleProfile.plate}
                </div>
                <div>
                  <h3 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                    <span>{vehicleProfile.model}</span>
                  </h3>
                  <div className="flex flex-wrap items-center gap-3 text-xs text-zinc-300 font-medium mt-1">
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-amber-400" />
                      <span>{vehicleProfile.customer}</span>
                    </span>
                    {vehicleProfile.phone && (
                      <span className="flex items-center gap-1 font-mono">
                        <Phone className="w-3.5 h-3.5 text-emerald-400" />
                        <span>{vehicleProfile.phone}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Stats Highlights */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs pt-3 md:pt-0 border-t md:border-t-0 border-zinc-800">
                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase font-mono">Total Kunjungan</div>
                  <div className="text-lg font-black font-mono text-amber-400 mt-0.5">
                    {vehicleProfile.totalVisits} Kali
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase font-mono flex items-center justify-center gap-1">
                    <Gauge className="w-3 h-3 text-emerald-400" />
                    <span>KM Terakhir</span>
                  </div>
                  <div className="text-lg font-black font-mono text-emerald-400 mt-0.5">
                    {vehicleProfile.lastKm ? `${vehicleProfile.lastKm.toLocaleString('id-ID')} KM` : '-'}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-zinc-800/80 border border-zinc-700">
                  <div className="text-[10px] text-zinc-400 font-bold uppercase font-mono">Total Belanja</div>
                  <div className="text-sm sm:text-base font-black font-mono text-white mt-1">
                    {formatRupiah(vehicleProfile.totalSpent)}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Bar: Cetak Riwayat Servis & Kirim WhatsApp */}
            <div className="flex flex-wrap items-center justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handlePrintServiceRecord}
                className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Printer className="w-4 h-4 text-amber-400" />
                <span>Cetak Service Record (PDF)</span>
              </button>

              <button
                type="button"
                onClick={handleShareWAServiceRecord}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-1.5 cursor-pointer shadow-md shadow-emerald-600/20"
              >
                <Share2 className="w-4 h-4" />
                <span>Kirim Riwayat via WhatsApp</span>
              </button>
            </div>
          </div>

          {/* 3. TIMELINE KRONOLOGIS RIWAYAT SERVIS (PROMPT 3 REQUIREMENTS) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-black uppercase text-zinc-500 font-mono px-1">
              <span>Kronologi Pengerjaan Servis ({matchedTransactions.length} Transaksi)</span>
              <span>Terurut dari yang paling baru</span>
            </div>

            {matchedTransactions.map((trx, idx) => {
              const spareparts = trx.items.filter((i) => i.itemType === 'SPAREPART');
              const jasas = trx.items.filter((i) => i.itemType === 'JASA' || (i.buyPrice === 0 && i.itemType !== 'SPAREPART'));

              return (
                <div
                  key={trx.id}
                  className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-sm space-y-3.5 relative overflow-hidden"
                >
                  {/* Top Bar: Tanggal, Nota, Mekanik, KM */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-3">
                    <div className="flex items-center gap-3">
                      <span className="w-7 h-7 rounded-full bg-amber-500 text-zinc-950 font-black text-xs flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-bold text-sm sm:text-base text-zinc-900 dark:text-zinc-100">
                          {formatDateIndo(trx.date)}
                        </div>
                        <div className="text-xs text-zinc-400 font-mono">
                          Faktur #{trx.invoiceNumber} • Kasir: {trx.cashierName}
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {/* Mekanik */}
                      <span className="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5 text-amber-500" />
                        <span>Mekanik: <strong className="text-zinc-900 dark:text-zinc-100">{trx.mechanicName || 'Mekanik Umum'}</strong></span>
                      </span>

                      {/* Kilometer (KM) Kendaraan */}
                      {trx.odometerKm ? (
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-mono font-black text-xs border border-emerald-500/20 flex items-center gap-1">
                          <Gauge className="w-3.5 h-3.5" />
                          <span>{trx.odometerKm.toLocaleString('id-ID')} KM</span>
                        </span>
                      ) : null}

                      {/* Tombol Lihat Nota */}
                      {onViewReceipt && (
                        <button
                          type="button"
                          onClick={() => onViewReceipt(trx)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500 text-zinc-950 font-black text-xs cursor-pointer hover:bg-amber-400 transition-colors"
                        >
                          Lihat Struk
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Rincian Pengerjaan: Sparepart yang Diganti & Jasa Servis */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    {/* Kolom 1: Jasa Servis yang Dilakukan */}
                    <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/60 space-y-1.5">
                      <div className="font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider font-mono flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" />
                        <span>Jasa Servis &amp; Perbaikan ({jasas.length})</span>
                      </div>
                      {jasas.length === 0 ? (
                        <p className="text-zinc-400 italic">Hanya pembelian sparepart / tidak ada jasa.</p>
                      ) : (
                        <div className="space-y-1">
                          {jasas.map((j, i) => (
                            <div key={i} className="flex items-center justify-between font-medium">
                              <span className="text-zinc-800 dark:text-zinc-200">• {j.productName}</span>
                              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                {formatRupiah(j.subtotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Kolom 2: Sparepart yang Pernah Diganti */}
                    <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200 dark:border-zinc-700/60 space-y-1.5">
                      <div className="font-black text-amber-600 dark:text-amber-400 uppercase tracking-wider font-mono flex items-center gap-1">
                        <Package className="w-3.5 h-3.5" />
                        <span>Sparepart &amp; Oli yang Diganti ({spareparts.length})</span>
                      </div>
                      {spareparts.length === 0 ? (
                        <p className="text-zinc-400 italic">Hanya jasa servis / tanpa penggantian part.</p>
                      ) : (
                        <div className="space-y-1">
                          {spareparts.map((sp, i) => (
                            <div key={i} className="flex items-center justify-between font-medium">
                              <span className="text-zinc-800 dark:text-zinc-200">
                                • {sp.productName} ({sp.quantity} {sp.unit || 'pcs'})
                              </span>
                              <span className="font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                {formatRupiah(sp.subtotal)}
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Catatan Servis jika ada */}
                  {trx.notes && (
                    <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-zinc-800 dark:text-zinc-200 font-medium flex items-start gap-2">
                      <span className="font-bold text-amber-500 shrink-0 font-mono">Catatan Teknisi:</span>
                      <span>{trx.notes}</span>
                    </div>
                  )}

                  {/* Total Pembayaran */}
                  <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs font-mono">
                    <div className="text-zinc-400 font-bold">
                      Metode: <strong className="text-zinc-700 dark:text-zinc-300">{trx.paymentMethod}</strong>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-zinc-500">Total Biaya:</span>
                      <span className="text-base font-black text-zinc-900 dark:text-zinc-100">
                        {formatRupiah(trx.grandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <div className="p-12 text-center bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl text-zinc-400 space-y-2">
          <Car className="w-12 h-12 mx-auto text-zinc-300 dark:text-zinc-700" />
          <h3 className="font-black text-base text-zinc-700 dark:text-zinc-200">
            Plat Nomor "{searchPlate}" Belum Memiliki Riwayat Servis
          </h3>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Pastikan format plat nomor sudah benar, atau buat transaksi servis baru di kasir dengan mencantumkan plat nomor ini.
          </p>
        </div>
      )}
    </div>
  );
};
