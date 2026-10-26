import React, { useState, useMemo } from 'react';
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
  Smartphone,
  HelpCircle,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Share2,
  Keyboard,
  Wrench,
  Users,
  Car,
  Wallet,
  LayoutDashboard,
  Building2,
  ArrowRight,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { openAppInNewTab, isIframeEnvironment } from '../services/bluetoothPrinter';

interface GuideViewProps {
  darkMode: boolean;
  onNavigateTab: (tab: any) => void;
  onOpenSettings: () => void;
  onOpenBrochure?: () => void;
}

type GuideCategory =
  | 'all'
  | 'nav-all'
  | 'workflow'
  | 'kasir-group'
  | 'gudang-group'
  | 'kas-group'
  | 'laporan-group'
  | 'printer'
  | 'shortcuts'
  | 'faq';

interface NavMenuGuideItem {
  id: string;
  tabKey: string;
  number: number;
  title: string;
  groupBadge: string;
  groupColor: 'red' | 'blue' | 'emerald' | 'amber' | 'purple';
  category: GuideCategory;
  icon: React.FC<{ className?: string }>;
  summary: string;
  purpose: string;
  steps: string[];
  features: { label: string; desc: string }[];
  actionLabel: string;
  isSettingsModal?: boolean;
}

export const GuideView: React.FC<GuideViewProps> = ({
  darkMode,
  onNavigateTab,
  onOpenSettings,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<GuideCategory>('all');
  const [expandedSection, setExpandedSection] = useState<string | null>('nav-1-dashboard');

  const toggleSection = (id: string) => {
    setExpandedSection(expandedSection === id ? null : id);
  };

  const categories = [
    { id: 'all' as GuideCategory, label: 'Semua Panduan (Lengkap)', icon: BookOpen },
    { id: 'nav-all' as GuideCategory, label: '12 Menu Navigasi A-Z', icon: Layers },
    { id: 'kasir-group' as GuideCategory, label: 'Grup Kasir & Transaksi', icon: Wrench },
    { id: 'gudang-group' as GuideCategory, label: 'Grup Gudang & Mekanik', icon: Package },
    { id: 'kas-group' as GuideCategory, label: 'Grup Kas & Piutang', icon: Wallet },
    { id: 'laporan-group' as GuideCategory, label: 'Grup Laporan & Sistem', icon: BarChart3 },
    { id: 'workflow' as GuideCategory, label: 'SOP Harian Kasir', icon: Clock },
    { id: 'printer' as GuideCategory, label: 'Printer Thermal & WA', icon: Printer },
    { id: 'shortcuts' as GuideCategory, label: 'Tombol Cepat F1-F9', icon: Keyboard },
    { id: 'faq' as GuideCategory, label: 'Tanya Jawab (FAQ)', icon: HelpCircle },
  ];

  // Complete 12 Navigation Menus Guide matching Sidebar & TopHeader Dropdowns
  const navMenuGuides: NavMenuGuideItem[] = useMemo(
    () => [
      {
        id: 'nav-1-dashboard',
        tabKey: 'dashboard',
        number: 1,
        title: 'Menu 1: Ringkasan & Laba (Dashboard Utama)',
        groupBadge: 'MENU UTAMA (BERANDA)',
        groupColor: 'red',
        category: 'laporan-group',
        icon: LayoutDashboard,
        summary:
          'Pusat kendali utama untuk memantau omset kotor, HPP modal sparepart, komisi mekanik, biaya operasional, hingga Laba Bersih Riil bengkel secara real-time.',
        purpose:
          'Digunakan oleh Pemilik Bengkel maupun Kasir untuk melihat performa keuangan harian/bulanan dalam sekali pandang serta mengakses tombol pintas transaksi.',
        steps: [
          'Klik menu "Ringkasan & Laba" di bagian paling atas navigasi samping atau pilih dari dropdown navigasi atas.',
          'Pilih rentang waktu analisis di pojok kanan atas: Hari Ini, 7 Hari Terakhir, 30 Hari Terakhir, atau Semua Waktu.',
          'Pantau 4 Kartu Utama: Total Omset Kotor, HPP Modal Sparepart, Komisi Mekanik + Pengeluaran Operasional, serta Laba Bersih Bengkel.',
          'Gunakan tombol cepat "+ Catat Servis Kendaraan" untuk langsung membuka formulir servis baru, atau "+ Jual Sparepart" untuk masuk ke kasir suku cadang.',
        ],
        features: [
          {
            label: 'Rumus Laba Bersih Otomatis',
            desc: 'Menghitung Omset Kotor dikurangi Modal Beli Sparepart (HPP), dikurangi Komisi Jasa Mekanik, dan dikurangi Kas Keluar Operasional.',
          },
          {
            label: 'Grafik Tren Pendapatan & Servis',
            desc: 'Visualisasi grafik perbandingan pendapatan jasa servis vs penjualan sparepart harian.',
          },
          {
            label: 'Peringatan Stok Menipis & Piutang',
            desc: 'Menampilkan daftar oli/suku cadang yang hampir habis serta ringkasan kasbon pelanggan yang belum lunas.',
          },
        ],
        actionLabel: 'Buka Menu Ringkasan & Laba',
      },
      {
        id: 'nav-2-cashier-service',
        tabKey: 'cashier-service',
        number: 2,
        title: 'Menu 2: Kasir Servis (Pencatatan Servis Kendaraan & Mekanik)',
        groupBadge: 'DROPDOWN 1: KASIR & TRANSAKSI',
        groupColor: 'red',
        category: 'kasir-group',
        icon: Wrench,
        summary:
          'Halaman khusus untuk mencatat pengerjaan servis motor/mobil lengkap dengan Plat Nomor, Tipe Kendaraan, Mekanik, Jasa Servis, serta Grafik & Riwayat Servis.',
        purpose:
          'Digunakan setiap kali ada kendaraan pelanggan masuk untuk servis rutin, tune up, ganti oli + jasa, bongkar CVT, turun mesin, maupun perbaikan kelistrikan.',
        steps: [
          'Buka dropdown "Kasir & Transaksi" lalu pilih "Kasir Servis".',
          'Klik tombol merah/biru "+ Servis Kendaraan Baru (Plat & Mekanik)" atau tekan tombol pintas keyboard [F3].',
          'Isi Nomor Polisi / Plat Kendaraan (contoh: B 1234 XYZ), Tipe Motor/Mobil (contoh: Vario 160 / Avanza), Kilometer Odometer, dan Keluhan Pelanggan.',
          'Pilih Nama Mekanik yang menangani kendaraan tersebut dari daftar mekanik bengkel.',
          'Tambahkan rincian Jasa Servis yang dikerjakan (contoh: Jasa Servis CVT, Tune Up) dan pilih Sparepart/Oli yang ikut diganti jika ada.',
          'Pilih metode pembayaran (Tunai, QRIS, Transfer Bank, atau Tempo/Kasbon), lalu klik Proses & Cetak Struk Servis.',
        ],
        features: [
          {
            label: 'Grafik Jasa Servis Terpopuler',
            desc: 'Menampilkan diagram statistik jenis jasa servis apa saja yang paling sering dikerjakan di bengkel.',
          },
          {
            label: 'Grafik Produktivitas Mekanik',
            desc: 'Memantau siapa mekanik yang paling banyak menangani unit kendaraan beserta kontribusi omset jasanya.',
          },
          {
            label: 'Tabel Riwayat Servis & Filter Mekanik',
            desc: 'Dilengkapi filter per nama mekanik, pencarian plat nomor, tombol Cetak Ulang Nota Servis, dan Kirim Nota WA.',
          },
        ],
        actionLabel: 'Buka Menu Kasir Servis',
      },
      {
        id: 'nav-3-cashier-sparepart',
        tabKey: 'cashier-sparepart',
        number: 3,
        title: 'Menu 3: Kasir Sparepart (Penjualan Langsung Suku Cadang & Oli)',
        groupBadge: 'DROPDOWN 1: KASIR & TRANSAKSI',
        groupColor: 'blue',
        category: 'kasir-group',
        icon: ShoppingCart,
        summary:
          'Mesin kasir Point of Sale (POS) cepat untuk pelanggan yang membeli oli, ban, aki, busi, kampas rem, atau suku cadang eceran tanpa pengerjaan servis.',
        purpose:
          'Melayani pembelian suku cadang secara cepat menggunakan pencarian nama barang, filter kategori, maupun scan barcode kemasan produk.',
        steps: [
          'Buka dropdown "Kasir & Transaksi" lalu pilih "Kasir Sparepart".',
          'Ketik nama barang di kolom pencarian [F2] (misal: Yamalube, Kampas Beat, Aki GTZ5S) atau klik tombol Scan Barcode [F4].',
          'Klik kartu produk untuk memasukkan barang ke Keranjang Belanja di sisi kanan layar.',
          'Atur jumlah (Qty) barang atau berikan potongan diskon nominal jika diperlukan.',
          'Jika pelanggan masih memilih barang lain di rak, klik tombol "Antrian [F8]" untuk menyimpan keranjang sementara.',
          'Klik tombol "Bayar Sekarang [F1]", pilih Tunai / QRIS / Transfer / Tempo, lalu cetak struk belanja.',
        ],
        features: [
          {
            label: 'Jual Kilat 1-Klik (Quick Sell)',
            desc: 'Tombol petir pada kartu produk untuk langsung mencatat penjualan 1 barang tunai lunas tanpa perlu lewat keranjang.',
          },
          {
            label: 'Registrasi Cepat Barcode Baru',
            desc: 'Jika barcode kemasan sparepart belum terdaftar saat di-scan, muncul formulir tambah barang instan.',
          },
          {
            label: 'Tampilan Bersih & Responsif',
            desc: 'Bebas dari header servis sehingga layar fokus penuh pada katalog sparepart dan keranjang kasir.',
          },
        ],
        actionLabel: 'Buka Menu Kasir Sparepart',
      },
      {
        id: 'nav-4-inventory',
        tabKey: 'inventory',
        number: 4,
        title: 'Menu 4: Stok Sparepart & Oli (Manajemen Gudang & Harga)',
        groupBadge: 'DROPDOWN 2: GUDANG & MEKANIK',
        groupColor: 'blue',
        category: 'gudang-group',
        icon: Package,
        summary:
          'Kelola katalog seluruh suku cadang, oli, dan tarif jasa servis bengkel lengkap dengan Harga Modal (HPP), Harga Jual, Stok Minimum, dan Cetak Label Barcode.',
        purpose:
          'Digunakan saat kulakan barang baru datang dari supplier, mengubah harga jual/modal, memeriksa stok kritis yang mau habis, serta mencetak stiker harga rak.',
        steps: [
          'Buka dropdown "Gudang & Mekanik" lalu pilih "Stok Sparepart & Oli".',
          'Gunakan Dropdown Kategori untuk memfilter jenis barang (Oli & Pelumas, Rem & Suspensi, Ban & Velg, Kelistrikan & Aki, Jasa Servis, dll.).',
          'Gunakan Dropdown Kondisi Stok untuk melihat barang yang "Stok Menipis / Kritis" atau "Stok Habis (0)".',
          'Klik tombol "+ Tambah Barang / Jasa" untuk mendaftarkan sparepart baru atau tarif jasa servis baru.',
          'Klik ikon Pensil (Edit) pada baris produk untuk memperbarui jumlah stok kulakan atau menyesuaikan harga.',
          'Centang beberapa produk lalu klik "Cetak Label / Barcode" untuk mencetak stiker harga rak bengkel.',
        ],
        features: [
          {
            label: 'Pemisahan Tipe Fisik vs Jasa',
            desc: 'Item bertipe Jasa Servis otomatis bebas potongan stok, sedangkan Sparepart Fisik otomatis memotong stok gudang saat terjual.',
          },
          {
            label: 'Indikator Warna Stok Kritis',
            desc: 'Memberikan tanda peringatan merah/kuning jika sisa stok di rak berada di bawah batas minimum.',
          },
          {
            label: 'Ekspor & Impor Data Katalog',
            desc: 'Mendukung unduh laporan nilai aset stok ke Excel (.xlsx) dan PDF.',
          },
        ],
        actionLabel: 'Buka Menu Stok Sparepart & Oli',
      },
      {
        id: 'nav-5-mechanics',
        tabKey: 'mechanics',
        number: 5,
        title: 'Menu 5: Komisi Mekanik (Kelola Tim Mekanik & Bagi Hasil)',
        groupBadge: 'DROPDOWN 2: GUDANG & MEKANIK',
        groupColor: 'red',
        category: 'gudang-group',
        icon: Users,
        summary:
          'Manajemen daftar mekanik bengkel (Tambah, Edit, Hapus Mekanik) sekaligus perhitungan otomatis komisi upah bagi hasil dari setiap jasa servis yang dikerjakan.',
        purpose:
          'Memudahkan pemilik bengkel mengatur staf mekanik yang aktif bekerja serta menghitung pembagian komisi harian/mingguan/bulanan secara transparan tanpa hitung manual.',
        steps: [
          'Buka dropdown "Gudang & Mekanik" lalu pilih "Komisi Mekanik".',
          'Untuk menambah mekanik baru, klik tombol "+ Tambah Mekanik", ketik nama lengkap mekanik, lalu simpan.',
          'Untuk mengubah ejaan nama atau menghapus mekanik yang sudah berhenti bekerja, gunakan tombol Edit (Pensil) atau Hapus (Tempat Sampah) pada kartu mekanik.',
          'Atur persentase bagi hasil komisi mekanik (misal: 40%, 50%, atau 60% dari tarif jasa servis) menggunakan pengatur persentase yang tersedia.',
          'Pilih periode tanggal (Hari Ini / Minggu Ini / Bulan Ini) untuk melihat total unit kendaraan yang dikerjakan dan nominal komisi bersih masing-masing mekanik.',
          'Klik "Kirim WA Rekap Komisi" atau unduh PDF/Excel untuk bukti pembayaran gaji/komisi mekanik.',
        ],
        features: [
          {
            label: 'Manajemen Staf Mekanik Dinamis',
            desc: 'Setiap perubahan daftar mekanik langsung tersinkronisasi dengan pilihan mekanik di Kasir Servis.',
          },
          {
            label: 'Persentase Komisi Fleksibel',
            desc: 'Dapat diatur secara global maupun kustom per individu mekanik (senior vs junior).',
          },
          {
            label: 'Rincian Nota per Mekanik',
            desc: 'Menampilkan daftar nomor polisi kendaraan dan jenis servis apa saja yang dikerjakan oleh mekanik tersebut.',
          },
        ],
        actionLabel: 'Buka Menu Komisi Mekanik',
      },
      {
        id: 'nav-6-service-records',
        tabKey: 'service-records',
        number: 6,
        title: 'Menu 6: Riwayat Servis Plat (Rekam Medis Kendaraan Pelanggan)',
        groupBadge: 'DROPDOWN 2: GUDANG & MEKANIK',
        groupColor: 'blue',
        category: 'gudang-group',
        icon: Car,
        summary:
          'Buku rekam medis digital kendaraan berdasarkan Nomor Polisi (Plat Nomor) untuk melacak histori kapan terakhir ganti oli, sparepart apa yang pernah dipasang, dan siapa mekaniknya.',
        purpose:
          'Sangat berguna saat pelanggan datang kembali atau komplain garansi servis; kasir cukup mengetik plat nomor untuk melihat seluruh riwayat perawatan motor/mobil tersebut.',
        steps: [
          'Buka dropdown "Gudang & Mekanik" lalu pilih "Riwayat Servis Plat".',
          'Ketik Nomor Polisi (contoh: B 4567 KLM) atau nama pelanggan/model kendaraan di kolom pencarian.',
          'Klik kartu kendaraan untuk membuka rincian kronologis seluruh kedatangan servis dari awal hingga terbaru.',
          'Periksa catatan odometer (KM) terakhir, keluhan sebelumnya, suku cadang yang diganti, dan nama mekanik yang menangani.',
          'Gunakan tombol WhatsApp untuk mengirimkan pengingat jadwal servis berkala / ganti oli berikutnya kepada pemilik kendaraan.',
        ],
        features: [
          {
            label: 'Pengelompokan Otomatis per Plat Nomor',
            desc: 'Seluruh transaksi servis dengan plat nomor yang sama otomatis tergabung dalam satu profil kendaraan.',
          },
          {
            label: 'Tracking Odometer (KM) & Garansi',
            desc: 'Membantu mekanik mengecek kilometer terakhir saat ganti oli mesin/oli gardan/kampas CVT.',
          },
          {
            label: 'Pesan Pengingat Servis WA',
            desc: 'Kirim pesan ramah ke pelanggan saat sudah waktunya kembali servis rutin ke bengkel.',
          },
        ],
        actionLabel: 'Buka Menu Riwayat Servis Plat',
      },
      {
        id: 'nav-7-debts',
        tabKey: 'debts',
        number: 7,
        title: 'Menu 7: Piutang & Tempo (Buku Kasbon Pelanggan Bengkel)',
        groupBadge: 'DROPDOWN 3: KAS & PIUTANG',
        groupColor: 'amber',
        category: 'kas-group',
        icon: BookMarked,
        summary:
          'Pencatatan tagihan servis kendaraan atau pembelian sparepart yang dibayar Tempo / Kasbon / Kurang Bayar (DP) beserta riwayat cicilan pelunasannya.',
        purpose:
          'Mencegah kebocoran uang bengkel akibat nota bon pelanggan atau rekanan armada yang lupa ditagih.',
        steps: [
          'Buka dropdown "Kas & Piutang" lalu pilih "Piutang & Tempo".',
          'Lihat daftar pelanggan yang masih memiliki sisa tagihan belum lunas beserta tanggal jatuh temponya.',
          'Untuk mencatat kasbon manual baru, klik tombol "+ Catat Piutang / Tempo Baru".',
          'Saat pelanggan datang membayar cicilan atau melunasi bon, klik tombol "Bayar / Cicil" pada baris pelanggan tersebut.',
          'Masukkan nominal pembayaran dan metode bayar (Tunai / Transfer), maka saldo kas bengkel otomatis bertambah dan sisa hutang berkurang.',
          'Klik tombol "Tagih via WhatsApp" untuk mengirimkan rincian nota tagihan resmi secara sopan ke nomor HP pelanggan.',
        ],
        features: [
          {
            label: 'Terhubung Otomatis dari Kasir',
            desc: 'Setiap transaksi Servis atau Sparepart yang memilih metode bayar TEMPO/KASBON otomatis tercatat di menu ini.',
          },
          {
            label: 'Riwayat Cicilan Bertahap',
            desc: 'Mencatat tanggal dan nominal setiap kali pelanggan menyicil pembayaran hingga status berubah menjadi LUNAS.',
          },
          {
            label: 'Template Penagihan WhatsApp',
            desc: 'Format pesan tagihan otomatis berisi rincian nomor nota, total tagihan, jumlah yang sudah dibayar, dan sisa hutang.',
          },
        ],
        actionLabel: 'Buka Menu Piutang & Tempo',
      },
      {
        id: 'nav-8-expenses',
        tabKey: 'expenses',
        number: 8,
        title: 'Menu 8: Kas Keluar / Biaya (Pengeluaran Operasional Bengkel)',
        groupBadge: 'DROPDOWN 3: KAS & PIUTANG',
        groupColor: 'red',
        category: 'kas-group',
        icon: Wallet,
        summary:
          'Buku pencatatan seluruh pengeluaran operasional bengkel di luar HPP barang, seperti biaya listrik kompresor, beli bensin cuci part, konsumsi mekanik, hingga sewa ruko.',
        purpose:
          'Memastikan perhitungan Laba Bersih di Dashboard benar-benar akurat karena sudah dikurangi biaya operasional harian bengkel.',
        steps: [
          'Buka dropdown "Kas & Piutang" lalu pilih "Kas Keluar / Biaya".',
          'Klik tombol "+ Catat Pengeluaran Baru".',
          'Pilih kategori pengeluaran (Listrik & Air, Gaji & Komisi, Peralatan & Kunci Bengkel, Konsumsi, Sewa Tempat, atau Lainnya).',
          'Masukkan nominal uang yang dikeluarkan serta keterangan jelas (contoh: Beli Bensin 2 Liter untuk cuci blok CVT & kain majun).',
          'Simpan catatan; pengeluaran akan otomatis memotong Laba Bersih pada periode tersebut.',
        ],
        features: [
          {
            label: 'Filter Kategori & Tanggal',
            desc: 'Memudahkan pemilik bengkel mengevaluasi pos biaya mana yang paling besar setiap bulannya.',
          },
          {
            label: 'Integrasi Laba Rugi Bersih',
            desc: 'Langsung terhubung ke kartu Laba Bersih di menu Ringkasan & Laba.',
          },
          {
            label: 'Ekspor Laporan Biaya',
            desc: 'Unduh rekap kas keluar ke file Excel atau PDF untuk pembukuan bulanan.',
          },
        ],
        actionLabel: 'Buka Menu Kas Keluar / Biaya',
      },
      {
        id: 'nav-9-branches',
        tabKey: 'branches',
        number: 9,
        title: 'Menu 9: Saldo Kas & Bank (Laci Tunai, Rekening QRIS & Deposit Part)',
        groupBadge: 'DROPDOWN 3: KAS & PIUTANG',
        groupColor: 'emerald',
        category: 'kas-group',
        icon: Building2,
        summary:
          'Pemantauan posisi uang riil bengkel yang terbagi ke dalam Kas Tunai Laci, Saldo Rekening Bank / QRIS, dan Deposit Supplier Sparepart, lengkap dengan dukungan Multi-Cabang.',
        purpose:
          'Memudahkan pemilik bengkel mencocokkan uang fisik di laci kasir dengan saldo di rekening bank serta mencatat perpindahan uang (setor kas ke bank / tambah modal laci).',
        steps: [
          'Buka dropdown "Kas & Piutang" lalu pilih "Saldo Kas & Bank".',
          'Periksa 4 Kartu Likuiditas di bagian atas: Uang Tunai Laci (Cash), Saldo Rekening Bank / QRIS, Deposit Supplier & Part, serta Total Likuiditas Bengkel.',
          'Jika terjadi perpindahan uang (misal menyetor uang tunai laci ke bank, menarik uang bank untuk modal kembalian laci, atau setor deposit ke supplier part), klik tombol "+ Catat Mutasi Kas/Bank".',
          'Khusus Pemilik/Admin: Klik tombol "⚙️ Atur Saldo Riil" jika ingin menyesuaikan angka saldo di aplikasi agar sama persis dengan hasil hitung fisik uang nyata saat ini.',
          'Jika bengkel memiliki lebih dari 1 cabang, klik "+ Tambah Cabang" untuk mengelola saldo kas masing-masing cabang secara terpisah.',
        ],
        features: [
          {
            label: 'Atur Saldo Riil (Khusus Admin)',
            desc: 'Menyesuaikan nominal Kas Tunai, Bank/QRIS, dan Deposit Supplier secara instan dengan catatan audit otomatis.',
          },
          {
            label: 'Buku Mutasi Saldo Lengkap',
            desc: 'Mencatat waktu, nominal sebelum & sesudah, arus masuk/keluar, serta nama petugas kasir/admin.',
          },
          {
            label: 'Isolasi Hak Akses Kasir Cabang',
            desc: 'Akun kasir hanya dapat melihat saldo cabangnya sendiri, sedangkan Admin dapat memantau seluruh cabang.',
          },
        ],
        actionLabel: 'Buka Menu Saldo Kas & Bank',
      },
      {
        id: 'nav-10-reports',
        tabKey: 'reports',
        number: 10,
        title: 'Menu 10: Laporan Penjualan (Riwayat Nota, Cetak Ulang & Retur)',
        groupBadge: 'DROPDOWN 4: LAPORAN & SISTEM',
        groupColor: 'blue',
        category: 'laporan-group',
        icon: BarChart3,
        summary:
          'Arsip lengkap seluruh nota transaksi servis maupun penjualan sparepart dengan fitur filter periode, cetak ulang struk, kirim ulang WA, dan pembatalan/retur transaksi.',
        purpose:
          'Digunakan untuk mengaudit seluruh nota yang masuk, melihat 5 produk/jasa terlaris, membandingkan metode pembayaran (Tunai vs QRIS vs Transfer), serta mencetak laporan pembukuan.',
        steps: [
          'Buka dropdown "Laporan & Sistem" lalu pilih "Laporan Penjualan".',
          'Pilih filter periode di kanan atas: Hari Ini, 7 Hari, 30 Hari, atau Semua.',
          'Gunakan filter "Semua Jenis Transaksi" untuk menyaring khusus nota "🔧 Servis Kendaraan" atau khusus "🔩 Penjualan Sparepart Eceran".',
          'Ketik nomor faktur, plat nomor kendaraan, nama mekanik, atau nama pelanggan di kotak pencarian.',
          'Klik tombol "Struk" pada baris transaksi untuk melihat detail nota, mencetak ulang ke printer thermal, atau mengirim nota ke WhatsApp.',
          'Jika ada kesalahan input transaksi, klik ikon panah merah (Batalkan/Retur) agar transaksi dibatalkan dan stok sparepart otomatis dikembalikan ke gudang.',
        ],
        features: [
          {
            label: '5 Produk & Jasa Terlaris',
            desc: 'Menampilkan peringkat sparepart dan layanan servis yang menghasilkan omset serta laba tertinggi.',
          },
          {
            label: 'Rincian Plat Nomor & Mekanik di Tabel',
            desc: 'Setiap baris transaksi langsung menampilkan nomor polisi kendaraan, nama mekanik, dan metode bayar.',
          },
          {
            label: 'Ekspor Pembukuan Excel & PDF',
            desc: 'Satu klik untuk mengunduh laporan penjualan lengkap siap cetak.',
          },
        ],
        actionLabel: 'Buka Menu Laporan Penjualan',
      },
      {
        id: 'nav-11-settings',
        tabKey: 'settings',
        number: 11,
        title: 'Menu 11: Pengaturan Bengkel (Profil, QRIS, Printer, Backup & Cloud)',
        groupBadge: 'DROPDOWN 4: LAPORAN & SISTEM',
        groupColor: 'purple',
        category: 'laporan-group',
        icon: Settings,
        summary:
          'Pusat konfigurasi identitas bengkel (Nama, Alamat, WA, Catatan Kaki Struk), Upload Gambar QRIS Statis/Dinamis, Koneksi Printer Bluetooth, Manajemen Akun PIN Kasir, Backup Data, & Firebase Cloud.',
        purpose:
          'Mengatur seluruh identitas dan perangkat keras bengkel agar struk nota tampil profesional dengan nama dan logo/QRIS bengkel sendiri.',
        steps: [
          'Buka dropdown "Laporan & Sistem" lalu pilih "Pengaturan Bengkel".',
          'Pada tab Profil Toko: Isi Nama Bengkel, Slogan, Alamat Lengkap, Nomor Telepon/WA, dan pesan catatan kaki struk (contoh: "Garansi servis 7 hari dengan membawa nota ini").',
          'Pada bagian QRIS: Unggah foto kode QRIS resmi bengkel Anda agar muncul otomatis di layar saat pelanggan memilih bayar via QRIS.',
          'Pada bagian Printer Thermal: Pilih ukuran kertas (58mm atau 80mm) dan klik "Hubungkan Printer Bluetooth".',
          'Pada bagian Keamanan & Backup: Unduh file Cadangan Database (.json / enkripsi AES-256) secara berkala atau muat contoh data sparepart & jasa servis.',
          'Pada bagian Cloud Database: Masukkan konfigurasi Firebase milik bengkel Anda sendiri jika ingin sinkronisasi online multi-perangkat.',
        ],
        features: [
          {
            label: 'Kelola PIN Kasir & Admin',
            desc: 'Buat akun login terpisah untuk pemilik bengkel (Admin) dan karyawan jaga (Kasir) dengan PIN keamanan.',
          },
          {
            label: 'Muat Contoh Data Bengkel (Demo)',
            desc: 'Tersedia tombol muat katalog contoh suku cadang, oli, dan tarif jasa servis bengkel untuk simulasi cepat.',
          },
          {
            label: 'Backup & Restore Offline/Cloud',
            desc: 'Menjamin keamanan data bengkel 100% meskipun ganti perangkat HP/Tablet/Laptop.',
          },
        ],
        actionLabel: 'Buka Pengaturan Bengkel',
        isSettingsModal: true,
      },
      {
        id: 'nav-12-guide',
        tabKey: 'guide',
        number: 12,
        title: 'Menu 12: Panduan Kasir (Buku Petunjuk Operasional Lengkap)',
        groupBadge: 'DROPDOWN 4: LAPORAN & SISTEM',
        groupColor: 'amber',
        category: 'laporan-group',
        icon: BookOpen,
        summary:
          'Halaman dokumentasi interaktif yang sedang Anda baca saat ini, memuat panduan seluruh 12 navigasi aplikasi, SOP kerja kasir harian, cara pasang PWA, hingga solusi kendala teknis.',
        purpose:
          'Memudahkan pelatihan kasir baru maupun panduan referensi cepat bagi pemilik bengkel kapan saja dibutuhkan tanpa perlu buku manual cetak.',
        steps: [
          'Gunakan kotak pencarian di bagian atas halaman ini untuk mencari topik spesifik (misal: "komisi", "plat nomor", "tempo", "printer", "backup").',
          'Klik tombol tab kategori untuk menyaring panduan berdasarkan Grup Navigasi (Kasir, Gudang, Kas, Laporan, SOP, Printer, Shortcut).',
          'Klik judul bab mana saja untuk membuka/menutup rincian langkah-langkahnya, lalu klik tombol "Buka Menu..." di bagian bawah bab untuk langsung menuju ke fitur tersebut.',
        ],
        features: [
          {
            label: 'Tombol Pintas Langsung ke Menu',
            desc: 'Setiap bab panduan dilengkapi tombol interaktif untuk langsung membuka menu yang sedang dijelaskan.',
          },
          {
            label: 'Pencarian Instan Kata Kunci',
            desc: 'Menemukan petunjuk fitur dalam hitungan detik.',
          },
          {
            label: 'Panduan Lengkap 12 Navigasi',
            desc: 'Selaras 100% dengan tata letak menu dropdown terbaru BENGKEL-Q.',
          },
        ],
        actionLabel: 'Tetap di Halaman Panduan',
      },
    ],
    []
  );

  // Filter navigation guides by category and search query
  const filteredNavGuides = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return navMenuGuides.filter((item) => {
      const matchCat =
        activeCategory === 'all' ||
        activeCategory === 'nav-all' ||
        item.category === activeCategory;

      if (!q) return matchCat;

      const inText =
        item.title.toLowerCase().includes(q) ||
        item.groupBadge.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q) ||
        item.purpose.toLowerCase().includes(q) ||
        item.steps.some((s) => s.toLowerCase().includes(q)) ||
        item.features.some(
          (f) => f.label.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q)
        );
      return inText;
    });
  }, [navMenuGuides, activeCategory, searchQuery]);

  const badgeStyleMap: Record<NavMenuGuideItem['groupColor'], string> = {
    red: 'bg-red-600/10 text-red-600 dark:text-red-400 border-red-600/25',
    blue: 'bg-blue-600/10 text-blue-600 dark:text-blue-400 border-blue-600/25',
    emerald: 'bg-emerald-600/10 text-emerald-600 dark:text-emerald-400 border-emerald-600/25',
    amber: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30',
    purple: 'bg-purple-600/10 text-purple-600 dark:text-purple-400 border-purple-600/25',
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      {/* Header Banner — Red, White & Blue BENGKEL-Q Theme */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-blue-950 to-red-950 border border-blue-800/60 p-6 sm:p-8 text-white shadow-xl">
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600/20 border border-red-500/40 text-red-300 text-xs font-mono font-bold tracking-wide">
            <Sparkles className="w-3.5 h-3.5 text-red-400" />
            <span>BUKU PANDUAN RESMI BENGKEL-Q • LENGKAP 12 MENU NAVIGASI</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
            Panduan Lengkap Operasional BENGKEL-Q
          </h1>
          <p className="text-blue-100/80 text-xs sm:text-sm md:text-base max-w-3xl leading-relaxed">
            Petunjuk lengkap langkah demi langkah untuk mengoperasikan seluruh <strong>12 Menu Navigasi Dropdown</strong> di aplikasi kasir bengkel motor &amp; mobil: mulai dari <strong>Ringkasan &amp; Laba</strong>, <strong>Kasir Servis</strong>, <strong>Kasir Sparepart</strong>, <strong>Stok Gudang</strong>, <strong>Komisi Mekanik</strong>, <strong>Riwayat Servis Plat</strong>, <strong>Piutang &amp; Tempo</strong>, <strong>Kas Keluar</strong>, <strong>Saldo Kas &amp; Bank</strong>, <strong>Laporan Penjualan</strong>, hingga <strong>Pengaturan Printer Thermal &amp; Cloud</strong>.
          </p>

          {/* Search Box */}
          <div className="pt-2 max-w-2xl">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-blue-300" />
              <input
                type="text"
                placeholder="Cari menu atau panduan... (contoh: kasir servis, plat nomor, komisi mekanik, stok oli, piutang, saldo bank, printer)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-20 py-3 rounded-2xl bg-slate-900/90 border border-blue-700/60 text-white placeholder-blue-300/50 text-sm font-medium focus:outline-none focus:border-red-500 shadow-lg"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2.5 py-1 bg-red-600 text-white rounded-lg hover:bg-red-500 cursor-pointer"
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
                  ? 'bg-red-600 text-white font-black shadow-md shadow-red-600/20'
                  : 'bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:text-blue-700 dark:hover:text-white border border-zinc-200 dark:border-zinc-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{cat.label}</span>
            </button>
          );
        })}
      </div>

      {/* Overview Map of the 4 Dropdown Groups + 1 Main Menu (12 Menus Total) */}
      {(activeCategory === 'all' || activeCategory === 'nav-all') && !searchQuery && (
        <div
          className={`p-5 rounded-2xl border ${
            darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-blue-200/80'
          } shadow-xs space-y-4`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-200 dark:border-zinc-800 pb-3">
            <div>
              <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-red-600" />
                <span>Peta Struktur Navigasi Dropdown BENGKEL-Q (Total 12 Menu)</span>
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Navigasi aplikasi telah dikelompokkan menjadi 1 Menu Utama + 4 Grup Dropdown hemat tempat. Klik salah satu menu di bawah untuk membaca panduannya:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {/* Group 1 */}
            <div className="p-3.5 rounded-xl bg-red-50/60 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 space-y-2">
              <div className="font-black text-red-700 dark:text-red-400 uppercase tracking-wider text-[11px]">
                1. Beranda &amp; Kasir Transaksi
              </div>
              <div className="space-y-1.5">
                {navMenuGuides.slice(0, 3).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setExpandedSection(m.id);
                      document.getElementById(m.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-red-500 font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>{m.number}. {m.title.replace(/^Menu \d+:\s*/, '').split(' (')[0]}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Group 2 */}
            <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <div className="font-black text-blue-700 dark:text-blue-400 uppercase tracking-wider text-[11px]">
                2. Dropdown Gudang &amp; Mekanik
              </div>
              <div className="space-y-1.5">
                {navMenuGuides.slice(3, 6).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setExpandedSection(m.id);
                      document.getElementById(m.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-blue-500 font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>{m.number}. {m.title.replace(/^Menu \d+:\s*/, '').split(' (')[0]}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Group 3 */}
            <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 space-y-2">
              <div className="font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wider text-[11px]">
                3. Dropdown Kas &amp; Piutang
              </div>
              <div className="space-y-1.5">
                {navMenuGuides.slice(6, 9).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setExpandedSection(m.id);
                      document.getElementById(m.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-emerald-500 font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>{m.number}. {m.title.replace(/^Menu \d+:\s*/, '').split(' (')[0]}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>

            {/* Group 4 */}
            <div className="p-3.5 rounded-xl bg-purple-50/60 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50 space-y-2">
              <div className="font-black text-purple-700 dark:text-purple-400 uppercase tracking-wider text-[11px]">
                4. Dropdown Laporan &amp; Sistem
              </div>
              <div className="space-y-1.5">
                {navMenuGuides.slice(9, 12).map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => {
                      setExpandedSection(m.id);
                      document.getElementById(m.id)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }}
                    className="w-full text-left px-2.5 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 hover:border-purple-500 font-bold text-zinc-800 dark:text-zinc-200 flex items-center justify-between cursor-pointer"
                  >
                    <span>{m.number}. {m.title.replace(/^Menu \d+:\s*/, '').split(' (')[0]}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick PWA Install Banner */}
      <div
        className={`p-4 sm:p-5 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-blue-50/80 border-blue-200'
        }`}
      >
        <div className="flex items-start gap-3">
          <div className="p-2.5 bg-blue-700 text-white rounded-xl shadow-xs shrink-0 font-bold">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100">
              Tips Tablet, HP &amp; Komputer: Pasang Aplikasi BENGKEL-Q ke Layar Utama (PWA)
            </h3>
            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-0.5 max-w-2xl">
              Klik tombol <strong>"Pasang Aplikasi"</strong> di bilah atas atau menu browser <em>"Tambahkan ke Layar Utama"</em> agar aplikasi terinstal dengan ikon bengkel resmi bernama <strong>BENGKEL-Q</strong> dan siap berjalan layar penuh meskipun internet sedang lambat/offline.
            </p>
          </div>
        </div>
        {isIframeEnvironment() && (
          <button
            type="button"
            onClick={() => openAppInNewTab()}
            className="w-full sm:w-auto px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs rounded-xl flex items-center justify-center gap-2 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
          >
            <ExternalLink className="w-4 h-4" />
            <span>Buka Layar Penuh (Tab Baru)</span>
          </button>
        )}
      </div>

      {/* ============================================================ */}
      {/* ALL 12 NAVIGATION MENU GUIDES (DYNAMIC ACCORDION CARDS)      */}
      {/* ============================================================ */}
      {filteredNavGuides.length > 0 && (
        <div className="space-y-3.5">
          <div className="flex items-center justify-between px-1">
            <h2 className="text-sm sm:text-base font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-red-600" />
              <span>Panduan Lengkap Penggunaan Setiap Menu Navigasi ({filteredNavGuides.length} Menu)</span>
            </h2>
          </div>

          {filteredNavGuides.map((item) => {
            const Icon = item.icon;
            const isExpanded = expandedSection === item.id || Boolean(searchQuery.trim());
            return (
              <div
                id={item.id}
                key={item.id}
                className={`rounded-2xl border transition-all ${
                  darkMode ? 'bg-zinc-900 border-zinc-800' : 'bg-white border-zinc-200'
                } shadow-xs overflow-hidden`}
              >
                <button
                  type="button"
                  onClick={() => toggleSection(item.id)}
                  className="w-full p-4 sm:p-5 flex items-center justify-between text-left cursor-pointer hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40 transition-colors"
                >
                  <div className="flex items-start sm:items-center gap-3.5 pr-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600/10 dark:bg-blue-500/15 text-blue-700 dark:text-blue-400 flex items-center justify-center font-black shrink-0 border border-blue-500/20">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-[10px] font-mono font-black px-2 py-0.5 rounded-md border ${
                            badgeStyleMap[item.groupColor]
                          }`}
                        >
                          {item.groupBadge}
                        </span>
                      </div>
                      <h3 className="text-sm sm:text-base font-black text-zinc-900 dark:text-zinc-100">
                        {item.title}
                      </h3>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2">
                        {item.summary}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-transform ${
                      isExpanded
                        ? 'rotate-90 bg-red-600 text-white font-black'
                        : 'text-zinc-400 bg-zinc-100 dark:bg-zinc-800'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </button>

                {isExpanded && (
                  <div className="p-5 pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
                    {/* Fungsi Utama */}
                    <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300">
                      <span className="font-black text-blue-700 dark:text-blue-400">🎯 Fungsi Utama Menu Ini: </span>
                      <span>{item.purpose}</span>
                    </div>

                    {/* Langkah-langkah Penggunaan */}
                    <div className="space-y-2">
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        📋 Langkah-Langkah Cara Penggunaan:
                      </h4>
                      <div className="space-y-2 bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                        {item.steps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                            <span className="w-5 h-5 rounded-full bg-red-600 text-white font-mono text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Fitur Unggulan di Dalam Menu Ini */}
                    <div className="space-y-2">
                      <h4 className="text-xs sm:text-sm font-black uppercase tracking-wider text-zinc-800 dark:text-zinc-200">
                        ✨ Fitur Penting di Menu Ini:
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                        {item.features.map((feat, fIdx) => (
                          <div
                            key={fIdx}
                            className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-1"
                          >
                            <div className="font-bold text-xs text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                              <span>{feat.label}</span>
                            </div>
                            <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
                              {feat.desc}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Direct Action Button */}
                    {item.tabKey !== 'guide' && (
                      <div className="pt-1 flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (item.isSettingsModal) {
                              onOpenSettings();
                            } else {
                              onNavigateTab(item.tabKey);
                            }
                          }}
                          className="px-4 py-2 rounded-xl bg-blue-700 hover:bg-blue-600 text-white font-black text-xs flex items-center gap-2 shadow-sm cursor-pointer active:scale-95 transition-all"
                        >
                          <span>{item.actionLabel}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ============================================================ */}
      {/* SOP HARIAN KASIR BENGKEL (PAGI, SIANG, SORE/MALAM)           */}
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
              <div className="w-10 h-10 rounded-xl bg-red-600/15 text-red-600 dark:text-red-400 flex items-center justify-center font-black">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                  SOP Alur Kerja Harian Kasir Bengkel (Pagi, Siang &amp; Tutup Bengkel)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Urutan kerja standar mulai dari buka shift kasir pagi hari hingga tutup buku sore/malam hari
                </p>
              </div>
            </div>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                expandedSection === 'daily-flow'
                  ? 'rotate-90 bg-red-600 text-white font-black'
                  : 'text-zinc-400'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {expandedSection === 'daily-flow' && (
            <div className="p-5 sm:p-6 pt-0 border-t border-zinc-100 dark:border-zinc-800 space-y-5">
              {/* Step 1: Pagi */}
              <div className="space-y-2 pt-3">
                <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 font-extrabold text-sm">
                  <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-mono font-black">
                    1
                  </span>
                  <span>Pagi Hari: Buka Shift Kasir, Cek Modal Laci &amp; Absensi Mekanik</span>
                </div>
                <div className="ml-8 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p>• Klik tombol <strong>"Mulai Shift"</strong> di bilah atas untuk membuka shift kasir hari ini dan masukkan <strong>Modal Kas Awal</strong> di laci.</p>
                  <p>• Buka menu <strong>"Gudang &amp; Mekanik &gt; Komisi Mekanik"</strong> untuk memastikan daftar nama mekanik yang bertugas hari ini sudah terdaftar.</p>
                  <p>• Buka menu <strong>"Gudang &amp; Mekanik &gt; Stok Sparepart &amp; Oli"</strong>, pilih filter <em>"Stok Menipis / Kritis"</em> untuk mengecek oli atau suku cadang yang perlu dipesan ke supplier.</p>
                </div>
              </div>

              {/* Step 2: Siang */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-red-600 dark:text-red-400 font-extrabold text-sm">
                  <span className="w-6 h-6 rounded-full bg-red-500/20 text-red-600 dark:text-red-400 flex items-center justify-center text-xs font-mono font-black">
                    2
                  </span>
                  <span>Jam Operasional: Melayani Servis Kendaraan, Sparepart &amp; Kas Keluar</span>
                </div>
                <div className="ml-8 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-2 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p>• <strong>Kendaraan Masuk Servis:</strong> Buka <strong>"Kasir &amp; Transaksi &gt; Kasir Servis"</strong>, klik <strong>"+ Servis Kendaraan Baru [F3]"</strong>, catat Plat Nomor, Mekanik, Jasa Servis &amp; Sparepart yang dipasang, lalu cetak struk nota servis.</p>
                  <p>• <strong>Pembelian Sparepart Tanpa Servis:</strong> Buka <strong>"Kasir &amp; Transaksi &gt; Kasir Sparepart"</strong>, cari barang [F2] atau scan barcode [F4], masukkan ke keranjang, lalu klik <strong>Bayar [F1]</strong>.</p>
                  <p>• <strong>Pengeluaran Harian Bengkel:</strong> Setiap kali mengeluarkan uang laci untuk beli bensin cuci part, makan mekanik, atau listrik, langsung catat di menu <strong>"Kas &amp; Piutang &gt; Kas Keluar / Biaya"</strong>.</p>
                </div>
              </div>

              {/* Step 3: Sore/Malam */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-sm">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-xs font-mono font-black">
                    3
                  </span>
                  <span>Sore / Malam Hari: Bagi Komisi Mekanik, Rekonsiliasi Kas &amp; Tutup Shift</span>
                </div>
                <div className="ml-8 text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 space-y-1.5 leading-relaxed bg-zinc-50 dark:bg-zinc-950/50 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  <p>• Buka menu <strong>"Komisi Mekanik"</strong> untuk melihat rekap upah bagi hasil masing-masing mekanik hari ini dan kirim slipnya via WhatsApp.</p>
                  <p>• Buka menu <strong>"Saldo Kas &amp; Bank"</strong> untuk mencocokkan uang tunai di laci dan saldo QRIS/Bank.</p>
                  <p>• Klik tombol <strong>"Shift Aktif"</strong> di bilah atas lalu pilih <strong>"Tutup Shift Kasir"</strong>, masukkan jumlah uang fisik aktual di laci, dan cetak struk penutupan shift.</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* PRINTER THERMAL 58MM/80MM & NOTA WHATSAPP                    */}
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
              <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black">
                <Printer className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Panduan Koneksi Printer Thermal Bluetooth (58mm / 80mm) &amp; Nota WhatsApp
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Cara menyambungkan printer struk kasir tanpa kabel dan mengirim nota digital ke WhatsApp pelanggan
                </p>
              </div>
            </div>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                expandedSection === 'printer-guide'
                  ? 'rotate-90 bg-red-600 text-white font-black'
                  : 'text-zinc-400'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {expandedSection === 'printer-guide' && (
            <div className="p-5 sm:p-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-4">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                  🖨️ Cara Menyambungkan Printer Thermal Bluetooth:
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  1. Nyalakan printer thermal Bluetooth Anda dan pastikan kertas thermal sudah terpasang.
                  <br />2. Buka menu <strong>"Laporan &amp; Sistem &gt; Pengaturan Bengkel"</strong>.
                  <br />3. Pilih ukuran lebar kertas printer Anda: <strong>58mm</strong> (standar portable) atau <strong>80mm</strong> (lebar meja kasir).
                  <br />4. Klik tombol <strong>"Hubungkan Printer Bluetooth"</strong>, lalu pilih nama perangkat printer (misal: RPP02N, MPT-II, Eppos, VSC) yang muncul di layar Chrome.
                  <br />5. Aktifkan opsi <strong>"Cetak Struk Otomatis"</strong> bila ingin nota langsung tercetak setiap kali transaksi selesai.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-2">
                <h3 className="font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-emerald-500" />
                  <span>📱 Kirim Nota Servis Resmi via WhatsApp Pelanggan</span>
                </h3>
                <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Jika kertas printer sedang habis atau pelanggan menginginkan bukti nota digital di HP mereka, klik tombol <strong>"Kirim Nota via WhatsApp"</strong> pada layar struk selesai transaksi. Sistem otomatis menyusun pesan berisi Nama Bengkel, Nomor Faktur, Plat Nomor, Nama Mekanik, rincian Jasa Servis &amp; Sparepart, serta Total Pembayaran.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* SHORTCUT KEYBOARD KASIR CEPAT (F1 - F9)                      */}
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
                  Daftar Pintasan Keyboard Kasir Cepat (Shortcut F1 – F9)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Mempercepat pelayanan kasir pada Laptop / PC tanpa harus selalu menggeser mouse
                </p>
              </div>
            </div>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                expandedSection === 'shortcuts-guide'
                  ? 'rotate-90 bg-red-600 text-white font-black'
                  : 'text-zinc-400'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {expandedSection === 'shortcuts-guide' && (
            <div className="p-5 sm:p-6 pt-3 border-t border-zinc-100 dark:border-zinc-800">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {[
                  { key: 'F1', title: 'Proses Bayar Checkout', desc: 'Membuka jendela pembayaran keranjang belanja sparepart.' },
                  { key: 'F2', title: 'Fokus Cari Sparepart', desc: 'Langsung mengarahkan kursor ke kotak pencarian produk.' },
                  { key: 'F3', title: '+ Servis Kendaraan Baru', desc: 'Membuka formulir input servis kendaraan (Plat & Mekanik).' },
                  { key: 'F4', title: 'Buka Kamera Scanner', desc: 'Mengaktifkan pemindai barcode kamera/scanner USB.' },
                  { key: 'F8', title: 'Tahan Keranjang (Antrian)', desc: 'Menyimpan keranjang belanja pelanggan sementara ke antrian.' },
                  { key: 'F9', title: 'Kalkulator Bengkel', desc: 'Membuka kalkulator hitung cepat di layar kasir.' },
                ].map((sc) => (
                  <div
                    key={sc.key}
                    className="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 flex items-start gap-3"
                  >
                    <span className="px-2.5 py-1 rounded-lg bg-red-600 text-white font-mono font-black text-xs shrink-0 shadow-xs">
                      {sc.key}
                    </span>
                    <div>
                      <div className="font-black text-zinc-900 dark:text-zinc-100">{sc.title}</div>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{sc.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================ */}
      {/* FAQ / TANYA JAWAB KENDALA UMUM BENGKEL                       */}
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
              <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center font-black">
                <HelpCircle className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-black text-zinc-900 dark:text-zinc-100">
                  Tanya Jawab &amp; Solusi Masalah Umum (FAQ Bengkel)
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Jawaban cepat untuk pertanyaan yang sering ditanyakan kasir &amp; pemilik bengkel
                </p>
              </div>
            </div>
            <div
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-transform ${
                expandedSection === 'faq-guide'
                  ? 'rotate-90 bg-red-600 text-white font-black'
                  : 'text-zinc-400'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </div>
          </button>

          {expandedSection === 'faq-guide' && (
            <div className="p-5 sm:p-6 pt-3 border-t border-zinc-100 dark:border-zinc-800 space-y-3 text-xs sm:text-sm">
              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                <div className="font-black text-zinc-900 dark:text-zinc-100">
                  1. Bagaimana cara berpindah menu dengan cepat setelah navigasi diubah menjadi Dropdown?
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Anda dapat mengklik salah satu dari 4 grup dropdown di bilah samping kiri (<em>Kasir &amp; Transaksi, Gudang &amp; Mekanik, Kas &amp; Piutang, Laporan &amp; Sistem</em>), atau menggunakan <strong>Dropdown Pilih Cepat Menu</strong> yang selalu tersedia di bilah header atas layar.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                <div className="font-black text-zinc-900 dark:text-zinc-100">
                  2. Bagaimana jika kasir salah input item setelah struk servis dicetak?
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  Buka menu <strong>Laporan &amp; Sistem &gt; Laporan Penjualan</strong>, cari nomor faktur transaksi tersebut, lalu klik tombol ikon <strong>Batalkan / Retur</strong> berwarna merah. Stok sparepart yang terpakai akan otomatis kembali ke gudang, lalu kasir dapat menginput ulang nota yang benar.
                </p>
              </div>

              <div className="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/40 space-y-1">
                <div className="font-black text-zinc-900 dark:text-zinc-100">
                  3. Apakah aplikasi tetap bisa dipakai mencatat servis jika WiFi / Internet bengkel mati?
                </div>
                <p className="text-zinc-600 dark:text-zinc-300 leading-relaxed">
                  <strong>Sangat bisa!</strong> BENGKEL-Q dilengkapi penyimpan database lokal terenkripsi dan teknologi PWA Offline-First. Seluruh pencatatan servis, stok oli, dan cetak struk Bluetooth tetap berjalan 100% normal tanpa internet, dan akan otomatis tersinkronisasi ke Cloud Firebase saat internet menyala kembali.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
