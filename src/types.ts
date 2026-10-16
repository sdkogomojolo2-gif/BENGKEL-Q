export type ItemType = 'SPAREPART' | 'JASA';

export type ProductCategory =
  | 'Oli & Pelumas'
  | 'Sparepart Mesin'
  | 'Sparepart CVT & Transmisi'
  | 'Rem & Suspensi'
  | 'Ban & Velg'
  | 'Kelistrikan & Aki'
  | 'Filter & Busi'
  | 'Baut & Aksesoris'
  | 'Jasa Servis & Perbaikan'
  | 'Jasa Ganti Oli'
  | 'Jasa Tune Up'
  | 'Jasa Turun Mesin'
  | 'Jasa Cuci Kendaraan'
  | string;

export type ServiceType =
  | 'BENGKEL_SERVIS'
  | 'SPAREPART'
  | 'JASA_SERVIS'
  | 'TARIK_TUNAI'
  | 'SETOR_TUNAI'
  | 'TRANSFER_BANK'
  | 'PULSA'
  | 'PAKET_DATA'
  | 'TOPUP_EWALLET'
  | 'TOKEN_PLN'
  | 'TAGIHAN_PPOB'
  | 'PRODUK_FISIK';

export interface Product {
  id: string;
  barcode: string;
  name: string;
  category: ProductCategory;
  itemType?: ItemType; // 'SPAREPART' (ada harga beli, jual, stok berkurang) atau 'JASA' (hanya tarif tanpa stok berkurang)
  buyPrice: number; // Harga modal / harga beli (0 untuk JASA)
  sellPrice: number; // Harga jual / tarif jasa
  stock: number; // Stok unit (unlimited/diabaikan jika JASA)
  minStock: number;
  unit: string; // pcs, set, botol, liter, jasa, paket
  imageUrl?: string;
  serviceType?: ServiceType;
  provider?: string;
  nominal?: number;
  adminFee?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // diskon nominal per item
  subtotal: number;
  itemType?: ItemType; // 'SPAREPART' | 'JASA'
  customCustomerPhone?: string;
  customAccountNumber?: string;
  customAccountName?: string;
  customDestinationBank?: string;
}

export type PaymentMethod =
  | 'TUNAI'
  | 'QRIS'
  | 'DEBIT_EDC'
  | 'TRANSFER_BANK'
  | 'SALDO_BANK'
  | 'GOPAY'
  | 'OVO'
  | 'DANA'
  | 'SHOPEEPAY'
  | 'KASBON'
  | 'TEMPO';

export interface TransactionItem {
  productId: string;
  productName: string;
  barcode: string;
  category: string;
  itemType?: ItemType; // 'SPAREPART' atau 'JASA'
  buyPrice: number; // Modal sparepart (0 untuk jasa)
  sellPrice: number; // Harga jual / tarif jasa
  quantity: number;
  unit?: string;
  discount: number;
  subtotal: number;
  profit: number;
  serviceType?: ServiceType;
  provider?: string;
  mechanicName?: string; // Mekanik yang mengerjakan item jasa ini (jika spesifik)
}

export type ExpenseCategory =
  | 'Bensin/Solar'
  | 'Makan Mekanik'
  | 'Listrik'
  | 'Beli Alat'
  | 'Lain-lain';

export interface OperationalExpense {
  id: string;
  date: string; // ISO string format
  category: ExpenseCategory;
  amount: number;
  notes: string;
  cashierName?: string;
  branchId?: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  invoiceNumber: string;
  referenceNumber?: string;
  date: string; // ISO string
  cashierId: string;
  cashierName: string;
  branchId: string;
  branchName: string;

  // Detail khusus Kasir Bengkel
  vehiclePlate?: string; // Plat Nomor Kendaraan (Contoh: B 1234 ABC)
  mechanicName?: string; // Nama Mekanik (Contoh: Mas Agus)
  vehicleModel?: string; // Model Kendaraan (Contoh: Honda Vario 150)
  odometerKm?: number; // Kilometer Kendaraan saat servis (Contoh: 24500)
  sparepartTotal?: number; // Total nominal belanja sparepart
  serviceTotal?: number; // Total nominal jasa servis

  // Detail Servis Tempo / Kasbon (Prompt 5)
  downPayment?: number; // Uang Muka (DP)
  remainingDebt?: number; // Sisa Hutang (Grand Total - DP)
  dueDate?: string; // Tanggal Jatuh Tempo

  items: TransactionItem[];
  totalQuantity: number;
  subtotal: number;
  discount: number;
  grandTotal: number;
  totalCost: number; // Modal Sparepart Terjual (HPP)
  totalProfit: number; // Laba Kotor (grandTotal - totalCost)
  paymentMethod: PaymentMethod;
  cashAmount?: number;
  changeAmount?: number;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
  status: 'COMPLETED' | 'CANCELLED';
  qrisRef?: string;

  // Detail khusus Mini ATM, Konter Pulsa, Transfer & PPOB
  serviceType?: ServiceType;
  destinationBank?: string;
  sourceBank?: string;
  accountNumber?: string;
  accountName?: string;
  nominalAmount?: number;
  adminFee?: number;
  tokenCode?: string; // Kode Token PLN 20 Digit
  snNumber?: string; // Serial Number pengisian pulsa/data
}

export interface CustomerDebt {
  id: string;
  customerName: string;
  phone?: string;
  address?: string;
  vehiclePlate?: string; // Plat nomor terkait hutang servis
  vehicleModel?: string; // Model kendaraan
  totalDebt: number; // Sisa hutang berjalan
  originalAmount?: number; // Nilai transaksi awal
  downPayment?: number; // DP awal yang dibayar
  createdAt: string;
  dueDate?: string;
  notes?: string;
  transactions: {
    transactionId: string;
    invoiceNumber: string;
    date: string;
    amount: number;
    description: string;
    vehiclePlate?: string;
  }[];
  payments: {
    id: string;
    date: string;
    amount: number;
    cashierName: string;
    notes?: string;
  }[];
}

export interface MechanicCommissionItem {
  transactionId: string;
  invoiceNumber: string;
  date: string;
  vehiclePlate?: string;
  customerName?: string;
  serviceName: string;
  serviceRevenue: number;
  commissionPercentage: number;
  commissionAmount: number;
}

export interface MechanicPerformance {
  mechanicName: string;
  vehicleCount: number;
  serviceRevenue: number;
  sparepartRevenue: number;
  totalRevenue: number;
  commissionPercentage: number;
  totalCommission: number;
  items: MechanicCommissionItem[];
}

export interface CashierUser {
  id: string;
  name: string;
  username: string;
  pin: string; // 4-6 digit PIN
  role: 'OWNER' | 'KASIR';
  branchId?: string; // Penugasan cabang spesifik
  isActive: boolean;
  createdAt: string;
}

export interface CashierShift {
  id: string;
  cashierId: string;
  cashierName: string;
  branchId?: string;
  startTime: string;
  endTime?: string;
  startingCash: number; // modal uang tunai awal di laci
  expectedCash: number;
  actualCash?: number;
  cashDifference?: number;
  totalTransactions: number;
  totalSales: number;
  totalCashSales: number;
  totalNonCashSales: number;
  totalAdminProfit?: number; // Total laba biaya admin selama shift
  status: 'OPEN' | 'CLOSED';
  notes?: string;
}

export interface StoreBranch {
  id: string;
  code: string; // e.g. KNT-01, ATM-PUSAT
  name: string; // e.g. "Pusat - Konter & Mini ATM Utama"
  address: string;
  phone: string;
  cashDrawerBalance: number; // Uang kas tunai di laci fisik
  bankBalance: number; // Saldo rekening bank / EDC agen
  digiposBalance: number; // Saldo server pulsa / digipos agen
  ewalletBalance?: number; // Saldo e-wallet agen (GoPay, ShopeePay, DANA, OVO)
  isMain: boolean;
  notes?: string;
  createdAt: string;
}

export interface BalanceMutation {
  id: string;
  branchId: string;
  branchName?: string;
  date: string;
  type: 'CASH' | 'BANK' | 'DIGIPOS' | 'EWALLET';
  flow: 'IN' | 'OUT';
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  category: 'TRANSAKSI' | 'TARIK_BANK' | 'SETOR_BANK' | 'TOPUP_SERVER' | 'MODAL_AWAL' | 'PENGELUARAN' | 'LAINNYA';
  description: string;
  referenceId?: string;
  cashierName: string;
}

export interface FirebaseCustomConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId: string;
  firestoreDatabaseId?: string;
}

export interface StoreSettings {
  storeId?: string; // ID Unik Toko / Tenant ID
  activeBranchId?: string; // Cabang yang sedang aktif dikelola
  storeName: string;
  ownerName?: string;
  tagline: string;
  address: string;
  phone: string;
  footerMessage: string;
  taxPercentage: number;
  enableTax: boolean;
  paperSize: '58mm' | '80mm';
  qrisMerchantName: string;
  qrisNmid: string;
  qrisCity?: string;
  qrisMode?: 'DYNAMIC_NMID' | 'CUSTOM_IMAGE' | 'RAW_STRING';
  qrisImageUrl?: string;
  qrisRawString?: string;
  autoPrintReceipt: boolean;
  playAudioFeedback: boolean;
  encryptionEnabled: boolean;
  enableCloudSync?: boolean;
  customFirebaseConfig?: FirebaseCustomConfig;
  cloudSyncMode?: 'LOCAL_OFFLINE' | 'CUSTOM_FIREBASE';
  showSalesBrochure?: boolean;
  vaultKeyHash?: string;

  // Pengaturan Khusus Bengkel
  mechanics?: string[]; // Daftar nama mekanik bengkel (e.g. ['Agus Santoso', 'Joko Susilo', 'Rudi Haryanto'])
  serviceWarrantyDays?: number; // Garansi servis hari default (e.g. 7 hari)
  defaultAdminFee?: number;
  branches?: StoreBranch[]; // Daftar cabang
}

export interface StockLog {
  id: string;
  productId: string;
  productName: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT' | 'SALE';
  quantityChange: number;
  previousStock: number;
  currentStock: number;
  reason: string;
  timestamp: string;
  cashierName: string;
}

export interface HeldCart {
  id: string;
  name: string;
  customerName?: string;
  items: CartItem[];
  savedAt: string;
}
