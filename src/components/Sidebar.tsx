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

  // Compact Dropdown group state (single open group at a time to save vertical space)
  const [openDropdown, setOpenDropdown] = useState<'kasir' | 'bengkel' | 'keuangan' | 'sistem' | null>('kasir');

  const toggleDropdown = (group: 'kasir' | 'bengkel' | 'keuangan' | 'sistem') => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setOpenDropdown(group);
      return;
    }
    setOpenDropdown((prev) => (prev === group ? null : group));
  };

  // Auto-open the dropdown group matching the activeTab
  useEffect(() => {
    if (['cashier', 'cashier-service', 'cashier-sparepart'].includes(activeTab)) {
      setOpenDropdown('kasir');
    } else if (['inventory', 'mechanics', 'service-records'].includes(activeTab)) {
      setOpenDropdown('bengkel');
    } else if (['debts', 'expenses', 'branches'].includes(activeTab)) {
      setOpenDropdown('keuangan');
    } else if (['reports', 'settings', 'guide'].includes(activeTab)) {
      setOpenDropdown('sistem');
    }
  }, [activeTab]);

  // Close mobile drawer on navigation
  const handleSelectTab = (tab: TabType) => {
    setActiveTab(tab);
    setIsMobileDrawerOpen(false);
  };

  const isKasirGroupActive = ['cashier', 'cashier-service', 'cashier-sparepart'].includes(activeTab);
  const isBengkelGroupActive = ['inventory', 'mechanics', 'service-records'].includes(activeTab);
  const isKeuanganGroupActive = ['debts', 'expenses', 'branches'].includes(activeTab);
  const isSistemGroupActive = ['reports', 'settings', 'guide'].includes(activeTab);

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
        } bg-zinc-950 border-zinc-800 text-white`}
      >
        {/* Red - White - Blue Automotive Racing Stripe */}
        <div className="h-1.5 w-full flex shrink-0">
          <div className="w-1/3 bg-red-600" />
          <div className="w-1/3 bg-white" />
          <div className="w-1/3 bg-blue-600" />
        </div>

        {/* Top Header: Brand & Logo */}
        <div className="p-3.5 border-b border-zinc-800 shrink-0 flex items-center justify-between bg-gradient-to-r from-blue-950 via-blue-900 to-red-900/40">
          <div className="flex items-center gap-3 overflow-hidden">
            <img
              src="/icon.svg"
              alt="BENGKEL-Q"
              className="w-9 h-9 rounded-xl shadow-md border border-white/30 shrink-0 object-cover"
            />
            {!isCollapsed && (
              <div className="truncate">
                <h1 className="font-black text-sm tracking-tight text-white uppercase truncate">
                  {settings.storeName || 'BENGKEL-Q MOTOR & MOBIL'}
                </h1>
                <div className="flex items-center gap-1.5 text-[10px] text-blue-200 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
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
              className="hidden lg:flex p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
              title={isCollapsed ? 'Perluas Menu' : 'Persempit Menu'}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMobileDrawerOpen(false)}
              className="lg:hidden p-1.5 rounded-lg text-zinc-300 hover:text-white hover:bg-zinc-900 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Shift Quick Status Bar inside Sidebar */}
        <div className="px-3 pt-2.5 pb-1 shrink-0">
          <button
            type="button"
            onClick={onOpenShiftModal}
            className={`w-full px-3 py-2 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
              activeShift
                ? 'bg-zinc-900 border-zinc-700 text-white hover:border-zinc-500'
                : 'bg-zinc-900/50 border-dashed border-zinc-800 text-zinc-300 hover:bg-zinc-900 hover:text-white'
            }`}
            title="Kelola Shift & Kas Fisik"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <Clock className={`w-4 h-4 shrink-0 ${activeShift ? 'text-emerald-400' : 'text-red-400'}`} />
              {!isCollapsed && (
                <div className="text-left truncate">
                  <div className="text-[11px] font-bold leading-none">
                    {activeShift ? 'Shift Kasir Aktif' : 'Shift Belum Buka'}
                  </div>
                  <div className="text-[9px] text-blue-200 font-mono mt-0.5 truncate">
                    {activeShift ? 'Klik untuk Rekap/Tutup' : 'Klik untuk Buka Shift'}
                  </div>
                </div>
              )}
            </div>
            {!isCollapsed && (
              <span
                className={`w-2 h-2 rounded-full ${
                  activeShift ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'
                }`}
              />
            )}
          </button>
        </div>

        {/* Middle: Space-Saving Dropdown Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1.5 scrollbar-thin">
          {/* 0. Direct Dashboard Button */}
          <button
            id="sidebar-tab-dashboard"
            type="button"
            onClick={() => handleSelectTab('dashboard')}
            title="Ringkasan & Laba Bersih Bengkel"
            className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all cursor-pointer group ${
              activeTab === 'dashboard'
                ? 'bg-amber-500 text-white shadow-md shadow-red-600/25 border border-white/20'
                : 'text-blue-100 hover:text-white hover:bg-zinc-900'
            }`}
          >
            <div className="flex items-center gap-2.5 overflow-hidden">
              <LayoutDashboard
                className={`w-4 h-4 shrink-0 transition-transform group-hover:scale-110 ${
                  activeTab === 'dashboard' ? 'text-white stroke-[2.5]' : 'text-red-400'
                }`}
              />
              {!isCollapsed && <span className="truncate">Ringkasan &amp; Laba</span>}
            </div>
          </button>

          {/* ============================================================ */}
          {/* DROPDOWN 1: MENU KASIR (Servis & Sparepart) */}
          {/* ============================================================ */}
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleDropdown('kasir')}
              title="Menu Kasir Servis & Sparepart"
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                isKasirGroupActive && openDropdown !== 'kasir'
                  ? 'bg-red-600/20 text-white border-l-4 border-red-500'
                  : 'text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Wrench className="w-4 h-4 shrink-0 text-red-400" />
                {!isCollapsed && <span className="truncate">Kasir &amp; Transaksi</span>}
              </div>
              {!isCollapsed && (
                <div className="flex items-center gap-1.5">
                  {cartItemCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-red-600 text-white">
                      {cartItemCount}
                    </span>
                  )}
                  <ChevronDown
                    className={`w-4 h-4 text-blue-300 transition-transform duration-200 ${
                      openDropdown === 'kasir' ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </div>
              )}
            </button>

            {(!isCollapsed && openDropdown === 'kasir') && (
              <div className="p-1.5 pt-1 space-y-1 bg-zinc-950/60 border-t border-zinc-800/80">
                {/* Kasir Servis */}
                <button
                  id="sidebar-tab-cashier-service"
                  type="button"
                  onClick={() => handleSelectTab('cashier-service')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'cashier-service' || activeTab === 'cashier'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Wrench className="w-3.5 h-3.5 shrink-0" />
                    <div className="text-left truncate">
                      <div className="leading-tight truncate">Kasir Servis</div>
                      <div className="text-[10px] opacity-80 font-mono font-normal truncate">
                        Plat, Mekanik &amp; Jasa
                      </div>
                    </div>
                  </div>
                </button>

                {/* Kasir Sparepart */}
                <button
                  id="sidebar-tab-cashier-sparepart"
                  type="button"
                  onClick={() => handleSelectTab('cashier-sparepart')}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'cashier-sparepart'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
                    <div className="text-left truncate">
                      <div className="leading-tight truncate">Kasir Sparepart</div>
                      <div className="text-[10px] opacity-80 font-mono font-normal truncate">
                        Penjualan Oli &amp; Part
                      </div>
                    </div>
                  </div>
                  {cartItemCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-black font-mono bg-white text-red-600 shrink-0">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* DROPDOWN 2: BENGKEL & GUDANG (Stok, Mekanik, Riwayat Plat) */}
          {/* ============================================================ */}
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleDropdown('bengkel')}
              title="Gudang Stok, Komisi Mekanik & Riwayat Plat"
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                isBengkelGroupActive && openDropdown !== 'bengkel'
                  ? 'bg-red-600/20 text-white border-l-4 border-red-500'
                  : 'text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Package className="w-4 h-4 shrink-0 text-sky-300" />
                {!isCollapsed && <span className="truncate">Gudang &amp; Mekanik</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-blue-300 transition-transform duration-200 ${
                    openDropdown === 'bengkel' ? 'rotate-180 text-white' : ''
                  }`}
                />
              )}
            </button>

            {(!isCollapsed && openDropdown === 'bengkel') && (
              <div className="p-1.5 pt-1 space-y-1 bg-zinc-950/60 border-t border-zinc-800/80">
                <button
                  id="sidebar-tab-inventory"
                  type="button"
                  onClick={() => handleSelectTab('inventory')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'inventory'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Stok Sparepart &amp; Oli</span>
                </button>

                <button
                  id="sidebar-tab-mechanics"
                  type="button"
                  onClick={() => handleSelectTab('mechanics')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'mechanics'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Komisi Mekanik</span>
                </button>

                <button
                  id="sidebar-tab-service-records"
                  type="button"
                  onClick={() => handleSelectTab('service-records')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'service-records'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Car className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Riwayat Servis Plat</span>
                </button>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* DROPDOWN 3: KEUANGAN & KAS (Piutang, Kas Keluar, Saldo Bank) */}
          {/* ============================================================ */}
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleDropdown('keuangan')}
              title="Piutang Tempo, Biaya Operasional & Saldo Kas"
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                isKeuanganGroupActive && openDropdown !== 'keuangan'
                  ? 'bg-red-600/20 text-white border-l-4 border-red-500'
                  : 'text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <Wallet className="w-4 h-4 shrink-0 text-emerald-400" />
                {!isCollapsed && <span className="truncate">Kas &amp; Piutang</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-blue-300 transition-transform duration-200 ${
                    openDropdown === 'keuangan' ? 'rotate-180 text-white' : ''
                  }`}
                />
              )}
            </button>

            {(!isCollapsed && openDropdown === 'keuangan') && (
              <div className="p-1.5 pt-1 space-y-1 bg-zinc-950/60 border-t border-zinc-800/80">
                <button
                  id="sidebar-tab-debts"
                  type="button"
                  onClick={() => handleSelectTab('debts')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'debts'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Piutang &amp; Tempo</span>
                </button>

                <button
                  id="sidebar-tab-expenses"
                  type="button"
                  onClick={() => handleSelectTab('expenses')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'expenses'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Wallet className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Kas Keluar / Biaya</span>
                </button>

                <button
                  id="sidebar-tab-branches"
                  type="button"
                  onClick={() => handleSelectTab('branches')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'branches'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Saldo Kas &amp; Bank</span>
                </button>
              </div>
            )}
          </div>

          {/* ============================================================ */}
          {/* DROPDOWN 4: LAPORAN & SISTEM (Laporan, Pengaturan, Panduan) */}
          {/* ============================================================ */}
          <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/40 overflow-hidden">
            <button
              type="button"
              onClick={() => toggleDropdown('sistem')}
              title="Laporan Penjualan, Pengaturan & Panduan"
              className={`w-full flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm font-extrabold transition-all cursor-pointer ${
                isSistemGroupActive && openDropdown !== 'sistem'
                  ? 'bg-red-600/20 text-white border-l-4 border-red-500'
                  : 'text-white hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <BarChart3 className="w-4 h-4 shrink-0 text-amber-300" />
                {!isCollapsed && <span className="truncate">Laporan &amp; Sistem</span>}
              </div>
              {!isCollapsed && (
                <ChevronDown
                  className={`w-4 h-4 text-blue-300 transition-transform duration-200 ${
                    openDropdown === 'sistem' ? 'rotate-180 text-white' : ''
                  }`}
                />
              )}
            </button>

            {(!isCollapsed && openDropdown === 'sistem') && (
              <div className="p-1.5 pt-1 space-y-1 bg-zinc-950/60 border-t border-zinc-800/80">
                <button
                  id="sidebar-tab-reports"
                  type="button"
                  onClick={() => handleSelectTab('reports')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'reports'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Laporan Penjualan</span>
                </button>

                <button
                  id="sidebar-tab-settings"
                  type="button"
                  onClick={() => handleSelectTab('settings')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'settings'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Settings className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Pengaturan Bengkel</span>
                </button>

                <button
                  id="sidebar-tab-guide"
                  type="button"
                  onClick={() => handleSelectTab('guide')}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                    activeTab === 'guide'
                      ? 'bg-amber-500 text-white shadow-sm'
                      : 'text-blue-100 hover:text-white hover:bg-zinc-900'
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Panduan Kasir</span>
                </button>
              </div>
            )}
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
