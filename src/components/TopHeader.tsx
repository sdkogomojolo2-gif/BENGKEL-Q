import React, { useState, useEffect } from 'react';
import {
  Menu,
  ChevronLeft,
  Wifi,
  Moon,
  Sun,
  Clock,
  ShieldCheck,
  ExternalLink,
} from 'lucide-react';
import { CashierShift, StoreSettings, StoreBranch, CashierUser } from '../types';
import { TabType } from './Sidebar';
import { isIframeEnvironment, openAppInNewTab } from '../services/bluetoothPrinter';
import { PWAInstallPrompt } from './PWAInstallPrompt';

interface TopHeaderProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  settings: StoreSettings;
  activeShift: CashierShift | null;
  onOpenShiftModal: () => void;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  cloudSyncStatus?: 'ONLINE' | 'OFFLINE' | 'SYNCED';
  onToggleMobileSidebar: () => void;
  branches?: StoreBranch[];
  activeBranchId?: string;
  onSelectBranch?: (branchId: string) => void;
  currentUser?: CashierUser | null;
}

const TAB_TITLES: Record<TabType, { title: string; subtitle: string }> = {
  dashboard: {
    title: 'Ringkasan & Laba Bengkel',
    subtitle: 'Analisis Omzet, HPP Sparepart, Biaya Operasional & Laba Bersih',
  },
  cashier: {
    title: 'Kasir Servis & Sparepart',
    subtitle: 'Input Plat Nomor, Mekanik, Suku Cadang & Jasa Servis',
  },
  'cashier-service': {
    title: 'Kasir Servis Kendaraan',
    subtitle: 'Pencatatan Jasa Servis Tiap Kendaraan, Riwayat Pengerjaan & Grafik Kinerja Mekanik',
  },
  'cashier-sparepart': {
    title: 'Kasir Penjualan Sparepart & Oli Langsung',
    subtitle: 'Penjualan Langsung Suku Cadang, Oli Mesin, Ban, Aki & Aksesoris Tanpa Servis',
  },
  inventory: {
    title: 'Manajemen Stok Sparepart & Oli',
    subtitle: 'Peringatan Stok Menipis & Ekspor Laporan Excel/PDF',
  },
  mechanics: {
    title: 'Laporan Kinerja & Komisi Mekanik',
    subtitle: 'Perhitungan Bagi Hasil Jasa Servis per Hari & per Minggu',
  },
  'service-records': {
    title: 'Riwayat Servis Kendaraan',
    subtitle: 'Buku Riwayat Servis Berdasarkan Plat Nomor & Odometer KM',
  },
  debts: {
    title: 'Buku Piutang Servis (Tempo / Kasbon)',
    subtitle: 'Catatan Uang Muka (DP), Sisa Hutang, Jatuh Tempo & Pelunasan',
  },
  expenses: {
    title: 'Operasional & Kas Keluar Bengkel',
    subtitle: 'Pencatatan Biaya Listrik, Konsumsi, Sewa & Beban Operasional',
  },
  branches: {
    title: 'Uang Kas Laci & Rekening Bank',
    subtitle: 'Kelola Saldo Kas Fisik Bengkel dan Rekening Pembayaran',
  },
  reports: {
    title: 'Laporan Penjualan & Riwayat Nota',
    subtitle: 'Rekap Transaksi, Cetak Ulang Struk & Ekspor Laporan',
  },
  settings: {
    title: 'Pengaturan Bengkel & Cetak Struk',
    subtitle: 'Nama Bengkel, Alamat, Ukuran Kertas Thermal 58mm/80mm',
  },
  guide: {
    title: 'Panduan Penggunaan Kasir Bengkel',
    subtitle: 'Petunjuk Pengoperasian Cepat & Praktis',
  },
};

export const TopHeader: React.FC<TopHeaderProps> = ({
  activeTab,
  setActiveTab,
  settings,
  activeShift,
  onOpenShiftModal,
  darkMode,
  setDarkMode,
  cloudSyncStatus = 'SYNCED',
  onToggleMobileSidebar,
  branches = [],
  activeBranchId,
  onSelectBranch,
  currentUser,
}) => {
  const [currentTime, setCurrentTime] = useState<string>('');
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('id-ID', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
      setCurrentDate(
        now.toLocaleDateString('id-ID', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })
      );
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const info = TAB_TITLES[activeTab] || TAB_TITLES.dashboard;
  const isCashier = currentUser?.role === 'KASIR';
  const assignedBranchId = isCashier ? (currentUser?.branchId || activeBranchId) : activeBranchId;
  const activeBranch = branches.find((b) => b.id === assignedBranchId) || branches[0];

  return (
    <header
      id="top-header-bar"
      className="h-16 px-3 sm:px-5 lg:px-6 border-b shrink-0 flex items-center justify-between transition-colors sticky top-0 z-20 backdrop-blur-md bg-white/95 dark:bg-zinc-950/95 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100"
    >
      {/* Left: Mobile & Tablet Drawer Toggle + Breadcrumb & Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Mobile & Tablet Hamburger Menu Button */}
        <button
          type="button"
          onClick={onToggleMobileSidebar}
          className="lg:hidden p-2 rounded-xl border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer shrink-0"
          title="Buka Navigasi"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Back Chevron to Dashboard if not on Dashboard */}
        {activeTab !== 'dashboard' && (
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className="hidden sm:flex items-center justify-center w-8 h-8 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-900 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
            title="Kembali ke Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}

        {/* Title (Simpel & Bersih tanpa teks berulang) */}
        <div className="min-w-0">
          <h2 className="text-sm sm:text-base lg:text-lg font-black tracking-tight leading-tight text-zinc-950 dark:text-zinc-50 truncate">
            {info.title}
          </h2>
        </div>
      </div>

      {/* Right Action Bar: Branch Switcher, Clock, Cloud Sync, Shift, Theme Toggle */}
      <div className="flex items-center gap-2 sm:gap-2.5">
        {/* Akun Tunggal Pemilik Bengkel Badge */}
        <div
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-amber-500/40 bg-amber-500/10 text-amber-950 dark:text-amber-200 text-xs sm:text-sm font-black shadow-xs"
          title="Mode 1 Akun Tunggal: Pemilik Bengkel (Akses Penuh Seluruh Modul)"
        >
          <span className="text-base">👑</span>
          <span className="truncate max-w-[140px] sm:max-w-[200px]">
            {currentUser?.name || settings.ownerName || 'Pemilik Bengkel'}
          </span>
          <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500 text-zinc-950 font-black uppercase">
            Owner
          </span>
        </div>

        {/* Jam Real-time Lebih Jelas */}
        <div className="hidden sm:flex flex-col text-right font-mono">
          <span className="text-sm font-black text-zinc-950 dark:text-zinc-100 leading-tight">
            {currentTime} WIB
          </span>
          <span className="text-xs text-zinc-500 dark:text-zinc-400 font-bold">
            {currentDate}
          </span>
        </div>

        {/* Cloud Sync Status Badge */}
        <div
          title={
            cloudSyncStatus === 'SYNCED'
              ? `Database Cloud Aktif${
                  settings.firebaseCustomConfig?.projectId
                    ? ` (Proyek: ${settings.firebaseCustomConfig.projectId})`
                    : ''
                }`
              : 'Mode Offline Mandiri (Data Aman di Penyimpanan Perangkat)'
          }
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 text-xs font-black"
        >
          {cloudSyncStatus === 'SYNCED' ? (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[11px] font-black truncate max-w-[120px]">
                {settings.firebaseCustomConfig?.projectId
                  ? `Cloud: ${settings.firebaseCustomConfig.projectId}`
                  : 'Cloud Aktif'}
              </span>
            </>
          ) : (
            <>
              <span className="w-2 h-2 rounded-full bg-zinc-400" />
              <span className="text-[11px] font-black">Mode Offline</span>
            </>
          )}
        </div>

        {/* Open in new tab button for full hardware access (Bluetooth) */}
        {isIframeEnvironment() && (
          <button
            type="button"
            onClick={() => openAppInNewTab()}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-900 text-zinc-950 dark:text-zinc-100 text-xs font-black hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Buka aplikasi Layar Penuh di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5 text-zinc-950 dark:text-zinc-100" />
            <span className="hidden xl:inline text-[11px]">Layar Penuh</span>
          </button>
        )}

        {/* PWA Install Button (1-Click for cashiers) */}
        <PWAInstallPrompt variant="header-button" darkMode={darkMode} />

        {/* Shift Management Pill */}
        <button
          type="button"
          onClick={onOpenShiftModal}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all cursor-pointer ${
            activeShift
              ? 'bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500'
              : 'bg-amber-500 hover:bg-amber-400 text-zinc-950 border-amber-600'
          }`}
          title="Klik untuk membuka / menutup shift kasir"
        >
          <Clock className={`w-3.5 h-3.5 ${activeShift ? 'text-emerald-400' : 'text-zinc-950'}`} />
          <span className="font-numeric font-black">
            {activeShift ? 'Kasir Aktif' : 'Mulai Kasir'}
          </span>
        </button>

        {/* Dark Mode Switcher */}
        <button
          type="button"
          onClick={() => setDarkMode(!darkMode)}
          className={`p-2 rounded-xl border transition-colors cursor-pointer ${
            darkMode
              ? 'border-zinc-800 bg-zinc-900 text-amber-400 hover:bg-zinc-800'
              : 'border-zinc-200 bg-zinc-100 text-zinc-700 hover:bg-zinc-200'
          }`}
          title={darkMode ? 'Ganti ke Mode Terang' : 'Ganti ke Mode Gelap'}
        >
          {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>
    </header>
  );
};
