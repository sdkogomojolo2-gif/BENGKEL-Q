import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  ShoppingCart,
  Package,
  BarChart3,
  BookMarked,
  Settings,
  Printer,
  Clock,
  ShieldCheck,
  Smartphone,
  HelpCircle,
  CheckCircle2,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  Laptop,
  ArrowRight,
  Zap,
  Sparkles,
  Layers,
  RotateCcw,
  Share2,
  FileText,
  DollarSign,
  QrCode,
  Sliders,
  Check,
  Keyboard,
  Wrench,
  Users,
  Car,
  UserPlus,
  Edit2,
  Trash2,
  Wallet,
} from 'lucide-react';
import { openAppInNewTab, isIframeEnvironment } from '../services/bluetoothPrinter';

interface GuideViewProps {
  darkMode: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenSettings: () => void;
  onOpenBrochure?: () => void;
}

type GuideCategory = 'all' | 'workflow' | 'service' | 'sparepart' | 'mechanic' | 'printer' | 'shortcuts' | 'faq';

export const GuideView: React.FC<GuideViewProps> = ({
  darkMode,
  onNavigateTab,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<GuideCategory>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>('daily-flow');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const categories = [
    { id: 'all' as GuideCategory, label: 'Semua Panduan', icon: BookOpen },
    { id: 'workflow' as GuideCategory, label: 'Alur Kasir Bengkel Harian', icon: Clock },
    { id: 'service' as GuideCategory, label: 'Kasir Servis Kendaraan', icon: Wrench },
    { id: 'sparepart' as GuideCategory, label: 'Kasir Sparepart & Stok Oli', icon: Package },
    { id: 'mechanic' as GuideCategory, label: 'Data & Komisi Mekanik', icon: Users },
    { id: 'printer' as GuideCategory, label: 'Printer Thermal & Nota WA', icon: Printer },
    { id: 'shortcuts' as GuideCategory, label: 'Tombol & Shortcut F1-F9', icon: Keyboard },
    { id: 'faq' as GuideCategory, label: 'Solusi Masalah (FAQ)', icon: HelpCircle },
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950 border border-zinc-800 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900 border border-zinc-800 text-amber-400 text-xs font-mono font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>PANDUAN RESMI OPERASIONAL KASIR BENGKEL MOTOR / MOBIL</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Buku Panduan Operasional Kasir Bengkel
          </h1>
          <p className="text-zinc-400 text-xs sm:text-sm md:text-base max-w-3xl leading-relaxed">
            Petunjuk lengkap pengoperasian kasir servis kendaraan (plat &amp; mekanik), penjualan sparepart eceran, menu dropdown stok suku cadang &amp; oli, manajemen tim mekanik (tambah, edit, hapus mekanik &amp; hitung komisi), buku kas operasional, hingga cetak struk thermal 58mm/80mm dan kirim nota via WhatsApp.
          </p>

          {/* Search Box */}
          <div className="pt-2 max-w-xl">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" />
              <input
                type="text"
                placeholder="Cari panduan... (contoh: plat nomor, mekanik baru, komisi, ganti oli, f3, thermal, tempo)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 rounded-2xl bg-zinc-900 border border-zinc-800 text-white placeholder-zinc-500 text-sm font-medium focus:outline-none focus:border-amber-500 shadow-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 bg-zinc-800 text-zinc-300 rounded-lg hover:bg-zinc-700 cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id && !searchQuery;
          return (
            <button
              key={cat.id}
              type="button"
              onClick={() => {
                setActiveCategory(cat.id);
                setSearchQuery('');
              }}
              className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl font-bold text-xs sm:text-sm whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-zinc-950 font-black shadow-md'
                  : 'bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-400 hover:text-zinc-950 dark:hover:text-zinc-200 border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Quick PWA & Full Screen Notice */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-amber-500/10 border-amber-500/30'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-amber-500 text-zinc-950 rounded-xl shadow-xs shrink-0 font-bold">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100">
              Tips Tablet &amp; HP: Pasang Aplikasi ke Layar Utama (PWA)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 max-w-2xl">
              Agar kasir bengkel dapat langsung melayani tanpa membuka browser berulang kali, klik tombol <strong>"Pasang Aplikasi"</strong> di bar atas atau gunakan browser menu <em>"Tambahkan ke Layar Utama (Add to Home Screen)"</em>.
            </p>
          </div>
        </div>
        {isIframeEnvironment() && (
          <button
            type="button"
            onClick={() => openAppInNewTab()}
            className="w-full sm:w-auto px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Layar Penuh (Tab Baru)</span>
          </button>
        )}
      </div>

      {/* Main Guide Content Blocks */}
      <div className="space-y-4">
        {/* ============================================================ */}
        {/* SECTION 1: ALUR KERJA HARIAN KASIR BENGKEL (SOP) */}
        {/* ============================================================ */}
        {(activeCategory === 'all' || activeCategory === 'workflow') && (
          <div
            className={`rounded-2xl border transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            } shadow-sm overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => toggleSection('daily-flow')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Bab 1: Alur Kerja Harian Kasir Bengkel (Pagi, Siang &amp; Malam)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Standard Operating Procedure (SOP) harian penjaga kasir bengkel motor &amp; mobil
                  </p>
                </div>
              </div>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                  expandedSection === 'daily-flow'
                    ? 'rotate-90 bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {expandedSection === 'daily-flow' && (
              <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 space-y-5">
                {/* Step 1: Pagi */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-extrabold text-sm">
                    <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center text-xs font-mono font-black">
                      1
                    </span>
                    <span>Pagi Hari: Buka Shift Kasir, Cek Modal Awal &amp; Tim Mekanik</span>
                  </div>
                  <div className="ml-8 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p>
                      • Klik pill <strong>"Mulai Kasir"</strong> di bilah atas untuk membuka shift hari ini.
                    </p>
                    <p>
                      • Masukkan nominal <strong>Modal Kas Awal</strong> (uang receh pecahan Rp2.000, Rp5.000, Rp10.000 yang disiapkan di laci untuk kembalian pelanggan).
                    </p>
                    <p>
                      • Buka menu <strong>"Data Mekanik"</strong> untuk memastikan daftar mekanik yang masuk bekerja hari ini sudah lengkap (gunakan tombol <em>+ Tambah Mekanik</em> jika ada mekanik baru).
                    </p>
                    <p>
                      • Buka menu <strong>"Stok Sparepart &amp; Oli"</strong>, pilih dropdown <em>"Filter Kondisi Stok &gt; Stok Menipis / Kritis"</em> untuk melihat oli atau sparepart yang perlu segera dibeli/kulakan.
                    </p>
                  </div>
                </div>

                {/* Step 2: Siang */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-mono font-black">
                      2
                    </span>
                    <span>Sepanjang Hari: Melayani Servis Kendaraan &amp; Penjualan Sparepart</span>
                  </div>
                  <div className="ml-8 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p>
                      • <strong>Melayani Kendaraan Masuk Servis:</strong> Buka menu <strong>"Kasir Servis"</strong> dan tekan tombol kuning <strong>"+ Servis Kendaraan Baru" (Shortcut F3)</strong>.
                      <br />- Masukkan <strong>Plat Nomor</strong> kendaraan (contoh: B 1234 ABC), <strong>Model Kendaraan</strong> (Beat, Vario, Avanza), <strong>Odometer KM</strong>, dan <strong>Keluhan Pelanggan</strong>.
                      <br />- Pilih <strong>Nama Mekanik</strong> yang ditugaskan mengerjakan kendaraan tersebut.
                      <br />- Masukkan <strong>Jasa Servis</strong> yang dikerjakan (contoh: Servis Rutin, Tune Up, Ganti Oli + Jasa, Servis CVT).
                      <br />- Masukkan <strong>Suku Cadang / Oli</strong> yang dipasang (stok fisik otomatis berkurang di rak bengkel).
                      <br />- Pilih metode bayar (Tunai, QRIS, Transfer, atau <strong>Tempo / Kasbon</strong>).
                      <br />- Cetak struk nota servis ke printer thermal atau klik <strong>"Kirim WA Nota Servis"</strong> ke nomor HP pelanggan.
                    </p>
                    <p>
                      • <strong>Melayani Pembelian Sparepart / Oli Eceran:</strong> Buka menu <strong>"Kasir Sparepart"</strong>.
                      <br />- Tekan <strong>F2</strong> untuk mencari nama sparepart atau <strong>F4</strong> untuk scan barcode kemasan.
                      <br />- Klik barang untuk memasukkan ke keranjang kasir POS, atur diskon jika ada, dan tekan <strong>Bayar [F1]</strong>.
                    </p>
                    <p>
                      • <strong>Mencatat Biaya Kas Operasional:</strong> Buka menu <strong>"Buku Kas Keluar"</strong> saat ada pengeluaran harian bengkel (contoh: bensin operasional, makan mekanik lembur, token listrik, atau beli perkakas kunci).
                    </p>
                  </div>
                </div>

                {/* Step 3: Malam */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400 font-extrabold text-sm">
                    <span className="w-6 h-6 rounded-full bg-purple-500/20 text-purple-600 dark:text-purple-400 flex items-center justify-center text-xs font-mono font-black">
                      3
                    </span>
                    <span>Sore / Malam Hari: Rekap Komisi Mekanik &amp; Tutup Shift Kasir</span>
                  </div>
                  <div className="ml-8 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                    <p>
                      • Buka menu <strong>"Data Mekanik"</strong>, periksa total pengerjaan unit dan komisi upah bagi hasil tiap mekanik.
                    </p>
                    <p>
                      • Klik tombol <strong>"Kirim WA Rekap Komisi"</strong> untuk mengirimkan rincian pendapatan jasa hari ini langsung ke nomor WhatsApp mekanik, atau unduh slip komisi dalam format PDF / Excel.
                    </p>
                    <p>
                      • Klik pill shift di bilah atas, lalu pilih <strong>"Tutup Shift Kasir"</strong>.
                    </p>
                    <p>
                      • Hitung seluruh uang tunai fisik yang ada di laci kasir, lalu ketikkan ke kolom <strong>"Uang Fisik Aktual"</strong>. Sistem otomatis membandingkan dengan uang ekspektasi sistem untuk memastikan tidak ada selisih.
                    </p>
                    <p>
                      • Cetak <strong>Laporan Penutupan Shift</strong> sebagai arsip resmi harian pemilik bengkel.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 2: PANDUAN KASIR SERVIS KENDARAAN */}
        {/* ============================================================ */}
        {(activeCategory === 'all' || activeCategory === 'service') && (
          <div
            className={`rounded-2xl border transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            } shadow-sm overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => toggleSection('service-guide')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Bab 2: Panduan Kasir Servis Kendaraan (Plat Nomor &amp; Mekanik)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Fungsi pencatatan servis kendaraan, grafik statistik servis &amp; logbook riwayat pengerjaan
                  </p>
                </div>
              </div>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                  expandedSection === 'service-guide'
                    ? 'rotate-90 bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {expandedSection === 'service-guide' && (
              <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500 text-zinc-950 font-black">F3</span>
                    <span>Tombol "+ Servis Kendaraan Baru (Plat &amp; Mekanik)"</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Dirancang untuk mencatat alur servis kendaraan secara menyeluruh tanpa membingungkan kasir. Formulir ini mencatat:
                  </p>
                  <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1 list-disc list-inside">
                    <li><strong>Nomor Polisi (Plat Kendaraan):</strong> Wajib diisi (contoh: B 3456 TKL). Plat nomor menjadi kata kunci pencarian utama riwayat kendaraan saat motor/mobil datang kembali di kemudian hari.</li>
                    <li><strong>Penugasan Mekanik:</strong> Pilih nama mekanik yang mengerjakan kendaraan dari daftar dropdown atau ketik nama mekanik baru.</li>
                    <li><strong>Model &amp; Odometer KM:</strong> Mencatat tipe motor/mobil dan jarak tempuh kilometer saat servis (sangat berguna untuk mengingatkan jadwal ganti oli berikutnya).</li>
                    <li><strong>Jasa Servis yang Dilakukan:</strong> Pilih dari katalog jasa atau ketik jasa servis kustom. Jasa servis <em>tidak memotong stok</em> dan <em>tidak memiliki modal HPP</em> (100% margin keuntungan bengkel).</li>
                    <li><strong>Sparepart &amp; Oli Terpasang:</strong> Menambahkan suku cadang yang diganti. Stok fisik otomatis berkurang di gudang/rak, dan harga modal (HPP) otomatis dihitung ke laporan keuangan.</li>
                    <li><strong>Pilihan Pembayaran Tempo (Hutang):</strong> Jika pelanggan langganan ingin bayar tempo atau bayar DP dulu, pilih metode pembayaran <strong>TEMPO</strong>. Sisa saldo otomatis masuk ke Buku Kasbon.</li>
                  </ul>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs sm:text-sm">
                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1.5">
                    <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>📊</span>
                      <span>Grafik Jasa Servis Populer</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      Menampilkan diagram batang visual jenis servis apa saja yang paling sering dilakukan di bengkel (seperti Ganti Oli, Servis CVT, Tune Up, Ganti Kampas Rem) beserta total pendapatan jasa yang dihasilkan.
                    </p>
                  </div>

                  <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1.5">
                    <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span>👨‍🔧</span>
                      <span>Grafik Rekap Kerja Tiap Mekanik</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 text-xs">
                      Memperlihatkan pembagian tugas: siapa saja mekanik yang aktif mengerjakan servis pada periode ini, berapa unit kendaraan yang sudah ditangani, dan total pendapatan jasa dari pengerjaan masing-masing mekanik.
                    </p>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1.5">
                  <div className="font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                    <span>📋</span>
                    <span>Logbook Riwayat Servis Kendaraan</span>
                  </div>
                  <p className="text-zinc-500 dark:text-zinc-400 text-xs leading-relaxed">
                    Tabel riwayat seluruh kendaraan yang pernah diservis. Kasir dapat memfilter berdasarkan nama mekanik tertentu, atau mencari berdasarkan plat nomor, tipe kendaraan, dan nomor nota. Dilengkapi tombol cepat <strong>"Cetak Nota Servis"</strong> dan <strong>"Kirim WA Nota Servis"</strong>.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 3: KASIR SPAREPART & STOK OLI DROPDOWN */}
        {/* ============================================================ */}
        {(activeCategory === 'all' || activeCategory === 'sparepart') && (
          <div
            className={`rounded-2xl border transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            } shadow-sm overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => toggleSection('sparepart-guide')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-black">
                  <Package className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Bab 3: Kasir Sparepart Eceran &amp; Menu Drop Down Stok Suku Cadang
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Penjualan langsung suku cadang, menu dropdown kategori tanpa scroll samping &amp; manajemen stok
                  </p>
                </div>
              </div>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                  expandedSection === 'sparepart-guide'
                    ? 'rotate-90 bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {expandedSection === 'sparepart-guide' && (
              <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="p-1 rounded-md bg-emerald-500 text-zinc-950 font-black">🔩</span>
                    <span>Kasir Sparepart Langsung (Tanpa Gangguan Header Servis)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Khusus untuk pelanggan yang hanya membeli oli, busi, aki, kampas rem, atau ban untuk dibawa pulang tanpa pengerjaan servis mekanik.
                  </p>
                  <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1 list-disc list-inside">
                    <li><strong>Pencarian Cepat [F2]:</strong> Ketik nama sparepart (contoh: <em>MPX2, kampas beat, ban 90/90, aki kering</em>) atau scan barcode kemasan [F4].</li>
                    <li><strong>Keranjang Belanja POS:</strong> Di sisi kanan (pada tablet &amp; laptop), menampilkan daftar barang belanjaan, jumlah barang, subtotal, potongan diskon, dan tombol bayar.</li>
                    <li><strong>Fitur Antrian (Hold Cart) [F8]:</strong> Jika pembeli ingin mengambil barang tambahan di rak, klik <em>Antrian</em> agar kasir dapat melayani pembeli lain terlebih dahulu tanpa kehilangan transaksi sebelumnya.</li>
                    <li><strong>Jual Kilat 1x (Quick Sell):</strong> Tombol petir hijau untuk transaksi cepat 1 barang tunai langsung lunas.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500 text-zinc-950 font-black">🏷️</span>
                    <span>Menu Drop Down Kategori Stok Sparepart &amp; Oli (Tanpa Perlu Scroll Samping)</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Sesuai kebutuhan pemilik toko, navigasi stok suku cadang kini menggunakan <strong>Menu Drop Down Vertikal</strong> yang nyaman diakses di layar tablet, HP, maupun laptop:
                  </p>
                  <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1 list-disc list-inside">
                    <li><strong>Drop Down Kategori Lengkap:</strong> Pilihan rapi mencakup 🛢️ Oli &amp; Pelumas, 🛑 Rem &amp; Suspensi, 🔋 Kelistrikan &amp; Aki, 🛞 Ban &amp; Velg, ⚙️ Mesin &amp; Piston, 🔄 Transmisi &amp; CVT, 💡 Lampu &amp; Aksesoris, 🧰 Baut &amp; Pelengkap, dll.</li>
                    <li><strong>Drop Down Kondisi Stok:</strong> Filter instan untuk memantau <em>"⚠️ Stok Kritis / Menipis"</em> (di bawah batas minimum) dan <em>"🚫 Stok Habis / Kosong"</em> (0 item).</li>
                    <li><strong>Tombol Reset Filter:</strong> Tombol satu klik untuk mengembalikan tampilan ke seluruh katalog barang toko.</li>
                    <li><strong>Ekspor Laporan:</strong> Tombol unduh laporan inventaris stok ke format <strong>Excel (.xlsx)</strong> dan <strong>PDF</strong>.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 4: DATA & KOMISI MEKANIK */}
        {/* ============================================================ */}
        {(activeCategory === 'all' || activeCategory === 'mechanic') && (
          <div
            className={`rounded-2xl border transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            } shadow-sm overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => toggleSection('mechanic-guide')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-500 flex items-center justify-center font-black">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Bab 4: Manajemen Tim Mekanik (Tambah, Edit, Hapus &amp; Hitung Komisi)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pengelolaan karyawan bengkel, penyesuaian tim jika ada yang keluar/masuk &amp; bagi hasil jasa servis
                  </p>
                </div>
              </div>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                  expandedSection === 'mechanic-guide'
                    ? 'rotate-90 bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {expandedSection === 'mechanic-guide' && (
              <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="p-1 rounded-md bg-purple-500 text-white font-black">👨‍🔧</span>
                    <span>Tombol Tambah, Edit, dan Hapus Mekanik</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Sesuai instruksi pemilik bengkel, kini telah disediakan fitur lengkap untuk mengelola staf mekanik:
                  </p>
                  <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5 list-disc list-inside">
                    <li><strong>Tombol + Tambah Mekanik Baru:</strong> Masukkan nama mekanik baru saat ada karyawan baru yang mulai bekerja di bengkel. Mekanik langsung muncul di pilihan kasir servis.</li>
                    <li><strong>Tombol Edit Mekanik:</strong> Mengubah nama atau memperbaiki ejaan nama mekanik. Semua riwayat pengerjaan servis sebelumnya otomatis diperbarui ke nama yang baru.</li>
                    <li><strong>Tombol Hapus Mekanik:</strong> Menghapus mekanik dari daftar aktif jika ada mekanik yang berhenti atau mengundurkan diri, sehingga kasir tidak keliru menugaskan pekerjaan kepada mekanik yang sudah tidak bekerja.</li>
                  </ul>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <span className="p-1 rounded-md bg-amber-500 text-zinc-950 font-black">%</span>
                    <span>Sistem Bagi Hasil &amp; Perhitungan Komisi Jasa</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Bengkel menggunakan sistem persentase bagi hasil dari <strong>Nilai Jasa Servis</strong> yang dikerjakan mekanik:
                  </p>
                  <ul className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1 list-disc list-inside">
                    <li><strong>Slider Persentase Global:</strong> Mengatur persentase standar bengkel (contoh: 50% untuk mekanik, 50% untuk bengkel).</li>
                    <li><strong>Pengaturan Kustom per Mekanik:</strong> Jika ada mekanik senior atau mekanik magang dengan kesepakatan komisi berbeda (misal 60% atau 40%), persentase dapat disetel per individu.</li>
                    <li><strong>Kirim Rekap Komisi ke WhatsApp:</strong> Satu klik tombol WA untuk mengirimkan rincian nota servis, nomor plat kendaraan yang dikerjakan, dan total uang komisi langsung ke nomor mekanik.</li>
                    <li><strong>Ekspor Slip Upah Mekanik:</strong> Simpan laporan rekap ke format PDF atau Excel sebagai bukti pembayaran upah mingguan/bulanan.</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 5: PRINTER THERMAL & NOTA WHATSAPP */}
        {/* ============================================================ */}
        {(activeCategory === 'all' || activeCategory === 'printer') && (
          <div
            className={`rounded-2xl border transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            } shadow-sm overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => toggleSection('printer-guide')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-black">
                  <Printer className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Bab 5: Pengaturan Printer Thermal 58mm/80mm &amp; Nota Digital WhatsApp
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Koneksi Bluetooth printer kasir, format struk bengkel &amp; kirim nota digital ke pelanggan
                  </p>
                </div>
              </div>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                  expandedSection === 'printer-guide'
                    ? 'rotate-90 bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {expandedSection === 'printer-guide' && (
              <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                    Koneksi Printer Thermal Kasir Bengkel:
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    1. Nyalakan printer thermal kasir Anda (ukuran 58mm atau 80mm).
                    <br />2. Buka menu <strong>"Pengaturan Toko &gt; Printer Thermal"</strong>.
                    <br />3. Pilih ukuran kertas struk Anda: <strong>58mm</strong> (printer portable Bluetooth kecil) atau <strong>80mm</strong> (printer kasir meja besar).
                    <br />4. Klik tombol <strong>"Sambungkan Printer Bluetooth"</strong>, pilih nama printer kasir Anda dari daftar perangkat.
                    <br />5. Aktifkan fitur <strong>"Auto Print Struk"</strong> jika Anda ingin struk otomatis keluar seketika setelah kasir menekan tombol selesai transaksi.
                  </p>
                </div>

                <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                  <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-emerald-500" />
                    <span>Kirim Nota Servis Resmi via WhatsApp Pelanggan</span>
                  </h3>
                  <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    Pelanggan bengkel sangat menyukai nota digital yang tersimpan di HP mereka. Pada setiap nota servis, klik tombol <strong>"Kirim WA Nota Servis"</strong>:
                  </p>
                  <div className="p-3 rounded-lg bg-zinc-100 dark:bg-zinc-900 font-mono text-[11px] text-zinc-700 dark:text-zinc-300 space-y-1">
                    <div>*NOTA SERVIS KENDARAAN - BENGKEL JAYA MOTOR*</div>
                    <div>No. Nota: #SRV-1029</div>
                    <div>Plat Nomor : B 1234 ABC | Vario 150 (24.500 KM)</div>
                    <div>Mekanik : Agus Santoso</div>
                    <div>*JASA SERVIS:* • Servis CVT (Rp40.000) • Ganti Oli (Rp10.000)</div>
                    <div>*SPAREPART DIGANTI:* • Oli AHM MPX2 (Rp55.000) • Roller CVT (Rp45.000)</div>
                    <div>*TOTAL BIAYA: Rp150.000 (LUNAS)*</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 6: DAFTAR TOMBOL PENTING & SHORTCUT KEYBOARD */}
        {/* ============================================================ */}
        {(activeCategory === 'all' || activeCategory === 'shortcuts') && (
          <div
            className={`rounded-2xl border transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            } shadow-sm overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => toggleSection('shortcuts-guide')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-black">
                  <Keyboard className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Bab 6: Daftar Shortcut Keyboard &amp; Tombol Pintas Kasir
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Pintasan tombol keyboard cepat (F1 - F9, ESC) untuk melayani pembeli di jam sibuk
                  </p>
                </div>
              </div>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                  expandedSection === 'shortcuts-guide'
                    ? 'rotate-90 bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {expandedSection === 'shortcuts-guide' && (
              <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-mono text-[11px] font-black">F3</span>
                      <span>+ Servis Kendaraan Baru</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Langsung membuka formulir intake servis kendaraan (plat nomor, keluhan, mekanik, jasa &amp; sparepart).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-zinc-900 text-white dark:bg-zinc-800 font-mono text-[11px] font-black">F2</span>
                      <span>Fokus Pencarian Barang</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Mengarahkan kursor seketika ke kolom pencarian nama sparepart atau scan barcode.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-emerald-500 text-zinc-950 font-mono text-[11px] font-black">F4</span>
                      <span>Scan Barcode Kamera</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Membuka scanner kamera HP/tablet untuk scan barcode pada dus sparepart atau botol oli.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-zinc-950 font-mono text-[11px] font-black">F1 / F9</span>
                      <span>Bayar / Checkout Kasir</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Membuka jendela pembayaran di kasir sparepart (pilih tunai, QRIS, transfer, atau tempo).
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-blue-500 text-white font-mono text-[11px] font-black">F8</span>
                      <span>Tahan Keranjang (Hold)</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Menyimpan antrian belanjaan sementara saat pembeli izin mengambil barang lain.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                    <div className="font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-rose-500 text-white font-mono text-[11px] font-black">ESC</span>
                      <span>Tutup / Batal</span>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      Menutup dialog modal yang sedang terbuka tanpa menyimpan perubahan.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ============================================================ */}
        {/* SECTION 7: SOLUSI MASALAH & FAQ BENGKEL */}
        {/* ============================================================ */}
        {(activeCategory === 'all' || activeCategory === 'faq') && (
          <div
            className={`rounded-2xl border transition-all ${
              darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
            } shadow-sm overflow-hidden`}
          >
            <button
              type="button"
              onClick={() => toggleSection('faq-guide')}
              className="w-full p-5 sm:p-6 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30"
            >
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-500/15 text-rose-500 flex items-center justify-center font-black">
                  <HelpCircle className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                    Bab 7: Pertanyaan Sering Ditanyakan (FAQ &amp; Solusi Masalah)
                  </h2>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">
                    Jawaban cepat untuk pertanyaan teknis &amp; operasional bengkel sehari-hari
                  </p>
                </div>
              </div>
              <div
                className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                  expandedSection === 'faq-guide'
                    ? 'rotate-90 bg-amber-500 text-zinc-950 font-black'
                    : 'text-zinc-400'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </div>
            </button>

            {expandedSection === 'faq-guide' && (
              <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 space-y-3 text-xs sm:text-sm">
                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                    Q: Jika ada mekanik yang berhenti atau ada mekanik baru masuk, bagaimana caranya?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                    <strong>Jawab:</strong> Masuk ke menu <strong>"Data Mekanik"</strong>. Di bagian atas terdapat tombol <strong>"+ Tambah Mekanik"</strong> untuk mendaftarkan nama mekanik baru. Jika ada mekanik yang berhenti, cari nama mekanik tersebut lalu klik tombol ikon tempat sampah merah <strong>"Hapus Mekanik"</strong>. Jika hanya ingin memperbaiki nama, klik tombol pensil kuning <strong>"Edit Mekanik"</strong>.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                    Q: Mengapa jasa servis modalnya Rp 0 dan tidak memotong stok?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                    <strong>Jawab:</strong> Jasa servis (seperti tune up, ganti oli, servis CVT, bongkar mesin) adalah bentuk layanan keahlian tenaga kerja, bukan barang fisik. Oleh karena itu, jasa servis tidak memiliki stok dan modal belinya Rp 0 (100% margin keuntungan). Yang memotong stok dan memiliki modal HPP hanyalah suku cadang fisik yang dipasang ke kendaraan.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                    Q: Pelanggan langganan servis motornya tapi bayar tempo / kasbon minggu depan, bagaimana catatnya?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                    <strong>Jawab:</strong> Pada formulir servis kendaraan, pada pilihan metode pembayaran, pilih <strong>"TEMPO / KASBON"</strong>. Masukkan nominal uang muka (DP) jika pelanggan membayar sebagian, atau biarkan 0 jika belum bayar sama sekali. Sisa hutang otomatis tercatat rapi di menu <strong>"Buku Kasbon"</strong> atas nama pelanggan tersebut dan dapat dikirimi nota tagihan sopan via WhatsApp.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                    Q: Bagaimana jika internet bengkel mati atau mati lampu?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                    <strong>Jawab:</strong> Aplikasi kasir bengkel ini beroperasi dengan teknologi <em>Offline First</em>. Seluruh pencatatan transaksi, stok suku cadang, dan data mekanik tetap dapat berjalan normal 100% di perangkat tanpa internet. Begitu koneksi internet menyala kembali, data otomatis tersinkronisasi ke cloud database.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200 dark:border-zinc-800 space-y-1">
                  <h4 className="font-bold text-zinc-900 dark:text-zinc-100">
                    Q: Kasir salah input atau transaksi keliru, bagaimana membatalkannya?
                  </h4>
                  <p className="text-zinc-600 dark:text-zinc-300 text-xs leading-relaxed">
                    <strong>Jawab:</strong> Buka menu <strong>"Laporan &amp; Nota"</strong>, cari transaksi yang bersangkutan, lalu klik tombol merah <strong>"Batalkan Transaksi"</strong>. Uang pendapatan dikoreksi, dan stok sparepart yang tadinya terpakai otomatis dikembalikan ke rak gudang.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Navigation Bar */}
      <div
        className={`p-6 rounded-2xl border text-center space-y-3 ${
          darkMode ? 'bg-zinc-900/60 border-zinc-800' : 'bg-white border-zinc-200'
        }`}
      >
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Sistem POS Bengkel Motor &amp; Mobil dirancang untuk kecepatan kasir bengkel, transparansi kerja mekanik, dan akurasi keuangan pemilik toko di Indonesia.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
          <button
            type="button"
            onClick={() => onNavigateTab('cashier-service')}
            className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs rounded-xl shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Wrench className="w-4 h-4" />
            <span>Buka Kasir Servis Kendaraan</span>
          </button>
          <button
            type="button"
            onClick={() => onNavigateTab('cashier-sparepart')}
            className="px-5 py-2.5 bg-zinc-900 text-amber-400 hover:bg-zinc-800 font-bold text-xs rounded-xl border border-zinc-700 shadow-xs active:scale-95 transition-all cursor-pointer flex items-center gap-2"
          >
            <Package className="w-4 h-4" />
            <span>Buka Kasir Sparepart</span>
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="px-4 py-2.5 border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer flex items-center gap-2"
          >
            <Printer className="w-4 h-4" />
            <span>Cetak / Simpan Buku Panduan ke PDF</span>
          </button>
        </div>
      </div>
    </div>
  );
};
