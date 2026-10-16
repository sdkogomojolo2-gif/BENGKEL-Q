import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  ShoppingCart,
  Package,
  BarChart3,
  BookOpen,
  Settings,
  Clock,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  X,
  Edit2,
  CheckCircle2,
  LogOut,
  FileText,
  Building2,
  Smartphone,
  Plug,
  Sparkles,
  Wallet,
  Wrench,
  Users,
  Car,
  History,
  ShoppingBag,
} from 'lucide-react';
import { CashierUser, CashierShift, StoreSettings, StoreBranch } from '../types';

export type TabType =
  | 'dashboard'
  | 'cashier'
  | 'cashier-service'
  | 'cashier-sparepart'
  | 'inventory'
  | 'mechanics'
  | 'service-records'
  | 'debts'
  | 'expenses'
  | 'branches'
  | 'reports'
  | 'settings'
  | 'guide';

interface SidebarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  currentUser: CashierUser | null;
  activeShift: CashierShift | null;
  settings: StoreSettings;
  darkMode: boolean;
  setDarkMode: (val: boolean) => void;
  onOpenShiftModal: () => void;
  onLogout: () => void;
  cartItemCount: number;
  cloudSyncStatus?: 'ONLINE' | 'OFFLINE' | 'SYNCED';
  isMobileDrawerOpen: boolean;
  setIsMobileDrawerOpen: (open: boolean) => void;
  onUpdateOwner?: (newName: string, newPin?: string) => void;
  onOpenBrochure?: () => void;
  branches?: StoreBranch[];
  activeBranchId?: string;
  activeCashierGroup?: 'ALL' | 'DIGITAL' | 'FISIK';
  onSelectCashierGroup?: (group: 'ALL' | 'DIGITAL' | 'FISIK') => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  activeShift,
  settings,
  darkMode,
  setDarkMode,
  onOpenShiftModal,
  onLogout,
  cartItemCount,
  cloudSyncStatus = 'SYNCED',
  isMobileDrawerOpen,
  setIsMobileDrawerOpen,
  onUpdateOwner,
  onOpenBrochure,
  branches = [],
  activeBranchId,
  activeCashierGroup = 'ALL',
  onSelectCashierGroup,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isEditOwnerModalOpen, setIsEditOwnerModalOpen] = useState(false);
  const [editOwnerName, setEditOwnerName] = useState('');
  const [editOwnerPin, setEditOwnerPin] = useState('');

  // Sub-menu accordion toggle state
  const [isOperasionalOpen, setIsOperasionalOpen] = useState(true);
  const [isLaporanOpen, setIsLaporanOpen] = useState(false);
  const [isKasirSubmenuOpen, setIsKasirSubmenuOpen] = useState(true);

  // Auto-expand section if its item is currently active
  useEffect(() => {
    if (['expenses', 'branches', 'inventory', 'debts'].includes(activeTab)) {
      setIsOperasionalOpen(true);
    }
    if (['reports', 'settings', 'guide'].includes(activeTab)) {
      setIsLaporanOpen(true);
    }
  }, [activeTab]);

  // Close mobile drawer on navigation
  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const handleSelectGroup = (group: 'ALL' | 'DIGITAL' | 'FISIK') => {
    if (onSelectCashierGroup) {
      onSelectCashierGroup(group);
    }
    handleSelectTab('cashier');
  };

  return (
    <>
      {/* Mobile & Tablet Backdrop Overlay */}
      {isMobileDrawerOpen && (
        <div
          onClick={() => setIsMobileDrawerOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Vertical Sidebar */}
      <aside
        id="pos-main-sidebar"
        className={`fixed lg:static inset-y-0 left-0 z-50 flex flex-col justify-between transition-all duration-200 select-none shadow-2xl lg:shadow-none border-r ${
          isCollapsed ? 'w-20' : 'w-64 lg:w-72'
        } ${
          isMobileDrawerOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        } bg-zinc-950 border-zinc-800 text-zinc-100`}
      >
        {/* Top Header: Brand & Logo */}
        <div className="p-4 border-b border-zinc-800 shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black text-lg shadow-inner shrink-0">
              🔧
            </div>
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="font-black text-sm tracking-tight text-white uppercase truncate">
                  {settings.storeName || 'KASIR BENGKEL MOTOR / MOBIL'}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                  <span className="truncate">POS Servis &amp; Sparepart</span>
                </div>
              </div>
            )}
          </div>

          {/* Desktop Collapse / Mobile Close Button */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="hidden lg:flex p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title={isCollapsed ? 'Perluas Menu' : 'Persempit Menu'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shift Quick Status Bar inside Sidebar */}
        <div className="px-3 pt-3 pb-1 shrink-0">
          <button
            type="button"
            onClick={onOpenShiftModal}
            className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeShift
                ? 'bg-zinc-900 border-zinc-700 text-zinc-200 hover:bg-zinc-850 hover:border-zinc-600'
                : 'bg-zinc-900/50 border-dashed border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200'
            }`}
            title="Kelola Shift & Kas Fisik"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Clock className={`w-4 h-4 shrink-0 ${activeShift ? 'text-amber-400' : 'text-zinc-500'}`} />
              {!isCollapsed && (
                <div className="text-left truncate">
                  <div className="text-[11px] font-bold leading-none">
                    {activeShift ? 'Shift Aktif' : 'Shift Belum Buka'}
                  </div>
                  <div className="text-[9px] text-zinc-400 font-mono mt-0.5 truncate">
                    {activeShift ? 'Klik untuk Rekap/Tutup' : 'Klik untuk Buka Shift'}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeShift ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
                }`}
              />
            )}
          </button>
        </div>

        {/* Middle: Navigation Links with Organized Sub-Menus */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-3 scrollbar-thin">
          {/* Section 1: MENU UTAMA BENGKEL */}
          <div className="space-y-1.5">
            {!isCollapsed && (
              <div className="px-3 py-1.5 text-xs font-black text-amber-500 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>MENU UTAMA BENGKEL</span>
              </div>
            )}

            {/* Dashboard Button */}
            <button
              id="sidebar-tab-dashboard"
              type="button"
              onClick={() => handleSelectTab('dashboard')}
              title="Ringkasan & Laba Bersih Bengkel"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'dashboard'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <LayoutDashboard
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'dashboard' ? 'text-zinc-950 stroke-[2.5]' : 'text-amber-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Ringkasan &amp; Laba</span>}
              </div>
            </button>

            {/* Navigasi 1: Kasir Servis Kendaraan (Plat Nomor, Mekanik, Keluhan & Jasa) */}
            <button
              id="sidebar-tab-cashier-service"
              type="button"
              onClick={() => handleSelectTab('cashier-service')}
              title="Kasir Servis Motor & Mobil (Input Plat, Mekanik & Jasa)"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'cashier-service' || activeTab === 'cashier'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Wrench
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'cashier-service' || activeTab === 'cashier' ? 'text-zinc-950 stroke-[2.5]' : 'text-amber-400'
                  }`}
                />
                {!isCollapsed && (
                  <div className="text-left truncate">
                    <div className="leading-tight truncate">Kasir Servis</div>
                    <div
                      className={`text-[10px] font-mono truncate ${
                        activeTab === 'cashier-service' || activeTab === 'cashier'
                          ? 'text-zinc-900 font-bold'
                          : 'text-zinc-400 font-normal'
                      }`}
                    >
                      Plat, Mekanik &amp; Jasa
                    </div>
                  </div>
                )}
              </div>
            </button>

            {/* Navigasi 2: Kasir Sparepart & Oli (Penjualan Langsung Eceran) */}
            <button
              id="sidebar-tab-cashier-sparepart"
              type="button"
              onClick={() => handleSelectTab('cashier-sparepart')}
              title="Kasir Sparepart & Oli (Penjualan Langsung Tanpa Servis)"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'cashier-sparepart'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <ShoppingBag
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'cashier-sparepart' ? 'text-zinc-950 stroke-[2.5]' : 'text-emerald-400'
                  }`}
                />
                {!isCollapsed && (
                  <div className="text-left truncate">
                    <div className="leading-tight truncate">Kasir Sparepart</div>
                    <div
                      className={`text-[10px] font-mono truncate ${
                        activeTab === 'cashier-sparepart'
                          ? 'text-zinc-900 font-bold'
                          : 'text-zinc-400 font-normal'
                      }`}
                    >
                      Penjualan Oli &amp; Part
                    </div>
                  </div>
                )}
              </div>

              {!isCollapsed && activeTab === 'cashier-sparepart' && cartItemCount > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-black font-mono bg-zinc-950 text-amber-400 shrink-0">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Prompt 1: Stok Sparepart & Peringatan Stok */}
            <button
              id="sidebar-tab-inventory"
              type="button"
              onClick={() => handleSelectTab('inventory')}
              title="Manajemen Stok Sparepart & Oli"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'inventory'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Package
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'inventory' ? 'text-zinc-950 stroke-[2.5]' : 'text-sky-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Stok Sparepart &amp; Oli</span>}
              </div>
            </button>

            {/* Prompt 2: Kinerja & Komisi Mekanik */}
            <button
              id="sidebar-tab-mechanics"
              type="button"
              onClick={() => handleSelectTab('mechanics')}
              title="Laporan Kinerja & Komisi Bagi Hasil Mekanik"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'mechanics'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Users
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'mechanics' ? 'text-zinc-950 stroke-[2.5]' : 'text-purple-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Komisi Mekanik</span>}
              </div>
            </button>

            {/* Prompt 3: Riwayat Servis Berdasarkan Plat Nomor */}
            <button
              id="sidebar-tab-service-records"
              type="button"
              onClick={() => handleSelectTab('service-records')}
              title="Riwayat Servis Pelanggan Berdasarkan Plat Nomor"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'service-records'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Car
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'service-records' ? 'text-zinc-950 stroke-[2.5]' : 'text-indigo-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Riwayat Servis Plat</span>}
              </div>
            </button>

            {/* Prompt 5: Buku Piutang Servis (Tempo / Kasbon Pelanggan) */}
            <button
              id="sidebar-tab-debts"
              type="button"
              onClick={() => handleSelectTab('debts')}
              title="Buku Piutang Servis & Kasbon Pelanggan"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'debts'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <BookOpen
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'debts' ? 'text-zinc-950 stroke-[2.5]' : 'text-rose-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Piutang &amp; Tempo</span>}
              </div>
            </button>
          </div>

          {/* Section 2: KAS & BIAYA OPERASIONAL */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            {!isCollapsed && (
              <div className="px-3 py-1.5 text-xs font-black text-zinc-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>KAS &amp; BIAYA</span>
              </div>
            )}

            {/* Biaya Operasional */}
            <button
              id="sidebar-tab-expenses"
              type="button"
              onClick={() => handleSelectTab('expenses')}
              title="Catatan Biaya & Kas Keluar Bengkel"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'expenses'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Wallet
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'expenses' ? 'text-zinc-950 stroke-[2.5]' : 'text-rose-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Kas Keluar / Biaya</span>}
              </div>
            </button>

            {/* Kas Laci & Bank */}
            <button
              id="sidebar-tab-branches"
              type="button"
              onClick={() => handleSelectTab('branches')}
              title="Saldo Kas Laci & Rekening Bank Bengkel"
              className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                activeTab === 'branches'
                  ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                  : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3 overflow-hidden">
                <Building2
                  className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                    activeTab === 'branches' ? 'text-zinc-950 stroke-[2.5]' : 'text-emerald-400'
                  }`}
                />
                {!isCollapsed && <span className="truncate">Saldo Kas &amp; Bank</span>}
              </div>
            </button>
          </div>

          {/* Section 3: LAPORAN & PENGATURAN */}
          <div className="space-y-1.5 pt-2 border-t border-zinc-800">
            {!isCollapsed && (
              <div className="px-3 py-1.5 text-xs font-black text-zinc-400 uppercase tracking-wider font-mono flex items-center justify-between">
                <span>LAPORAN &amp; SISTEM</span>
              </div>
            )}

            <div className="space-y-1.5">
              {/* Reports */}
              <button
                id="sidebar-tab-reports"
                type="button"
                onClick={() => handleSelectTab('reports')}
                title="Laporan Penjualan & Transaksi"
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                  activeTab === 'reports'
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <BarChart3
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      activeTab === 'reports' ? 'text-zinc-950 stroke-[2.5]' : 'text-amber-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">Laporan Penjualan</span>}
                </div>
              </button>

              {/* Settings */}
              <button
                id="sidebar-tab-settings"
                type="button"
                onClick={() => handleSelectTab('settings')}
                title="Pengaturan Bengkel & Printer"
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Settings
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      activeTab === 'settings' ? 'text-zinc-950 stroke-[2.5]' : 'text-zinc-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">Pengaturan Bengkel</span>}
                </div>
              </button>

              {/* Guide */}
              <button
                id="sidebar-tab-guide"
                type="button"
                onClick={() => handleSelectTab('guide')}
                title="Panduan Kasir Bengkel"
                className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-extrabold transition-all cursor-pointer group ${
                  activeTab === 'guide'
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-900'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <Sparkles
                    className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-110 ${
                      activeTab === 'guide' ? 'text-zinc-950 stroke-[2.5]' : 'text-amber-400'
                    }`}
                  />
                  {!isCollapsed && <span className="truncate">Panduan Kasir</span>}
                </div>
              </button>
            </div>
          </div>
        </nav>

        {/* Bottom Section: Cashier User Profile + Edit Modal Trigger */}
        <div className="p-3 border-t border-zinc-800 shrink-0 bg-zinc-950">
          <div className="flex items-center justify-between gap-2 p-1.5 rounded-xl hover:bg-zinc-900/60 transition-colors">
            {/* User Profile Info */}
            <button
              id="sidebar-btn-edit-owner"
              type="button"
              onClick={() => {
                setEditOwnerName(currentUser?.name || settings.ownerName || 'Pemilik Bengkel');
                setEditOwnerPin(currentUser?.pin || '1234');
                setIsEditOwnerModalOpen(true);
              }}
              className="flex items-center gap-3 overflow-hidden text-left flex-1 min-w-0 cursor-pointer group"
              title="Klik untuk ubah nama pemilik & PIN"
            >
              {/* User Avatar Circle */}
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center font-black text-base shadow-sm shrink-0 group-hover:border-amber-400 transition-colors">
                👑
              </div>
              {!isCollapsed && (
                <div className="text-left truncate flex-1 min-w-0">
                  <div className="text-sm font-black text-white truncate leading-tight flex items-center gap-1.5">
                    <span className="truncate">{currentUser?.name || 'Pemilik Bengkel'}</span>
                    <Edit2 className="w-3.5 h-3.5 text-zinc-400 group-hover:text-amber-400 shrink-0 transition-colors" />
                  </div>
                  <div className="text-xs text-amber-400 font-mono font-bold tracking-wide truncate mt-0.5">
                    AKUN TUNGGAL PEMILIK
                  </div>
                </div>
              )}
            </button>

            {/* Logout / Lock Button */}
            <button
              id="sidebar-btn-lock"
              type="button"
              onClick={onLogout}
              className="p-2.5 rounded-xl text-zinc-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer shrink-0"
              title="Kunci Layar Kasir Bengkel"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>
      </aside>

      {/* Modal Edit Nama Pemilik Bengkel & PIN */}
      {isEditOwnerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 text-zinc-100 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-zinc-800 bg-zinc-950/80">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/30">
                  <Edit2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-white">
                    Pengaturan Akun Pemilik Bengkel
                  </h3>
                  <p className="text-xs text-zinc-400 font-medium">
                    Ubah Nama Pemilik &amp; PIN Masuk Kasir
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditOwnerModalOpen(false)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editOwnerName.trim()) return;
                onUpdateOwner?.(editOwnerName.trim(), editOwnerPin.trim());
                setIsEditOwnerModalOpen(false);
              }}
              className="p-6 space-y-5 text-sm"
            >
              <div>
                <label className="block font-black text-zinc-200 mb-1.5">
                  Nama Pemilik Bengkel / Kasir Utama:
                </label>
                <input
                  type="text"
                  value={editOwnerName}
                  onChange={(e) => setEditOwnerName(e.target.value)}
                  placeholder="Contoh: Pak Budi Santoso"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-black text-base focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-black text-zinc-200 mb-1.5 font-mono">
                  PIN Masuk Kasir (4-6 Digit Angka):
                </label>
                <input
                  type="password"
                  maxLength={6}
                  value={editOwnerPin}
                  onChange={(e) => setEditOwnerPin(e.target.value.replace(/\D/g, ''))}
                  placeholder="Contoh: 1234"
                  className="w-full px-4 py-3 rounded-xl border border-zinc-700 bg-zinc-800 text-white font-mono font-black text-base tracking-widest focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-amber-500 shadow-sm"
                  required
                />
                <p className="text-xs text-zinc-400 mt-1.5 font-medium">
                  Digunakan untuk membuka kunci layar kasir bengkel.
                </p>
              </div>

              <div className="pt-4 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditOwnerModalOpen(false)}
                  className="px-5 py-2.5 rounded-xl text-zinc-300 bg-zinc-800 hover:bg-zinc-700 font-bold text-sm cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-sm flex items-center gap-2 cursor-pointer shadow-md"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Simpan Akun Pemilik</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
