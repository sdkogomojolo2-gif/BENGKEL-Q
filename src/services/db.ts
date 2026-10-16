import CryptoJS from 'crypto-js';
import {
  Product,
  Transaction,
  CustomerDebt,
  CashierUser,
  CashierShift,
  StoreSettings,
  StockLog,
  HeldCart,
  StoreBranch,
  BalanceMutation,
  OperationalExpense,
  ExpenseCategory,
  ItemType,
} from '../types';

const STORAGE_KEY = 'kasir_bengkel_vault_v1';
const LEGACY_STORAGE_KEY_V3 = 'miniatm_konter_vault_v1';
const LEGACY_STORAGE_KEY_V2 = 'kelontong_pos_vault_v2';
const LEGACY_STORAGE_KEY_V1 = 'kelontong_pos_vault_v1';
const MASTER_KEY_STORAGE = 'bengkel_vault_secret_key';
const DEFAULT_KEY = 'KASIR_BENGKEL_AES256_SECURE_VAULT_KEY_2026';

const IDB_NAME = 'bengkel_pos_idb';
const IDB_STORE = 'vault';
const IDB_KEY = 'primary_data';

function openIDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(IDB_NAME, 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function saveToIDB(dataStr: string): Promise<void> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put(dataStr, IDB_KEY);
  } catch (err) {
    console.warn('Could not save to IndexedDB mirror:', err);
  }
}

async function loadFromIDB(): Promise<string | null> {
  try {
    const db = await openIDB();
    const tx = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get(IDB_KEY);
    return new Promise((resolve, reject) => {
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}

export interface DatabaseSchema {
  version: number;
  products: Product[];
  transactions: Transaction[];
  debts: CustomerDebt[];
  users: CashierUser[];
  activeShift: CashierShift | null;
  shiftHistory: CashierShift[];
  branches: StoreBranch[];
  mutations: BalanceMutation[];
  settings: StoreSettings;
  stockLogs: StockLog[];
  heldCarts: HeldCart[];
  expenses: OperationalExpense[];
  mechanics: string[];
  lastBackupDate?: string;
}

export const INITIAL_MECHANICS: string[] = [
  'Agus Santoso',
  'Joko Susilo',
  'Rudi Haryanto',
  'Pak Anto (Kepala Mekanik)',
  'Bambang Wijaya',
];

export const INITIAL_EXPENSES: OperationalExpense[] = [
  {
    id: 'exp-1',
    date: new Date().toISOString(),
    category: 'Makan Mekanik',
    amount: 65000,
    notes: 'Makan siang 3 mekanik (Nasi bungkus + Es Teh)',
    cashierName: 'Admin Bengkel',
    branchId: 'branch-pusat',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    date: new Date().toISOString(),
    category: 'Bensin/Solar',
    amount: 35000,
    notes: 'Beli Bensin 3 Liter untuk cuci karburator & bersihkan part CVT',
    cashierName: 'Admin Bengkel',
    branchId: 'branch-pusat',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    category: 'Listrik',
    amount: 150000,
    notes: 'Beli Token Listrik PLN operasional kompresor & lampu bengkel',
    cashierName: 'Admin Bengkel',
    branchId: 'branch-pusat',
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp-4',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Beli Alat',
    amount: 85000,
    notes: 'Beli Kunci T8, T10, dan obeng ketok cadangan di toko perkakas',
    cashierName: 'Admin Bengkel',
    branchId: 'branch-pusat',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'exp-5',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'Lain-lain',
    amount: 25000,
    notes: 'Beli sabun cuci tangan mekanik dan lap kain majun 1 kg',
    cashierName: 'Admin Bengkel',
    branchId: 'branch-pusat',
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

export const INITIAL_BRANCHES: StoreBranch[] = [
  {
    id: 'branch-pusat',
    code: 'BENGKEL-01',
    name: 'Bengkel Pusat - Motor & Mobil Utama',
    address: 'Jl. Raya Otomotif No. 88 (Ruko Depan SPBU)',
    phone: '0812-3456-7890',
    cashDrawerBalance: 2500000, // Rp 2.500.000 Kas Laci Fisik
    bankBalance: 8500000,       // Rp 8.500.000 Saldo Rekening Bank / QRIS
    digiposBalance: 0,
    isMain: true,
    notes: 'Bengkel Pusat Servis Berkala & Suku Cadang',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'branch-cabang-2',
    code: 'BENGKEL-02',
    name: 'Bengkel Cabang 2 - Simpang Pasar',
    address: 'Jl. Pasar Baru No. 12B',
    phone: '0813-8899-7711',
    cashDrawerBalance: 1500000,
    bankBalance: 4000000,
    digiposBalance: 0,
    isMain: false,
    notes: 'Cabang Cepat Ganti Oli & Servis Ringan',
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_USERS: CashierUser[] = [
  {
    id: 'user-owner-1',
    name: 'Pemilik Bengkel',
    username: 'owner',
    pin: '1234',
    role: 'OWNER',
    branchId: 'branch-pusat',
    isActive: true,
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_SETTINGS: StoreSettings = {
  storeId: 'bengkel_motor_mobil_pusat',
  activeBranchId: 'branch-pusat',
  storeName: 'BENGKEL MOTOR & MOBIL BERKAH',
  ownerName: 'Pemilik Bengkel',
  tagline: 'Servis Ringan, Ganti Oli, Sparepart Asli & Jasa Bergaransi',
  address: 'Jl. Raya Otomotif No. 88 (Ruko Depan SPBU)',
  phone: '0812-3456-7890',
  footerMessage: 'Garansi Servis 7 Hari. Harap simpan struk ini sebagai bukti pengerjaan. Terima kasih!',
  taxPercentage: 0,
  enableTax: false,
  paperSize: '58mm',
  qrisMerchantName: 'BENGKEL BERKAH MOTOR',
  qrisNmid: 'ID1020038920192',
  qrisCity: 'JAKARTA',
  qrisMode: 'CUSTOM_IMAGE',
  autoPrintReceipt: false,
  playAudioFeedback: true,
  encryptionEnabled: true,
  enableCloudSync: false,
  showSalesBrochure: false,
  mechanics: INITIAL_MECHANICS,
  serviceWarrantyDays: 7,
  branches: INITIAL_BRANCHES,
};

export const generateSamplePulsaProducts = (): Product[] => {
  const operators = [
    { code: 'TSEL', name: 'Telkomsel', provider: 'Telkomsel' },
    { code: 'ISAT', name: 'Indosat IM3', provider: 'IM3' },
    { code: 'XL', name: 'XL Axiata', provider: 'XL' },
    { code: 'AXIS', name: 'Axis', provider: 'Axis' },
    { code: 'TRI', name: 'Tri (3)', provider: 'Tri' },
    { code: 'SMART', name: 'Smartfren', provider: 'Smartfren' },
  ];

  const nominals = [
    5000, 10000, 15000, 20000, 25000, 30000, 40000,
    50000, 60000, 70000, 75000, 100000, 150000, 200000, 300000, 500000,
  ];

  const list: Product[] = [];
  operators.forEach((op) => {
    nominals.forEach((nom) => {
      // Aturan admin: 5k-49k admin 3.000, 50k-500k admin 5.000
      const fee = nom < 50000 ? 3000 : 5000;
      const nomStr = nom >= 1000 ? `${nom / 1000}k` : `${nom}`;
      const formattedNom = nom.toLocaleString('id-ID');
      list.push({
        id: `pls-${op.code.toLowerCase()}-${nomStr}`,
        barcode: `${op.code}${nomStr.toUpperCase()}`,
        name: `Pulsa ${op.name} ${formattedNom}`,
        category: 'Pulsa & Paket Data',
        serviceType: 'PULSA',
        provider: op.provider,
        nominal: nom,
        adminFee: fee,
        buyPrice: nom,
        sellPrice: nom + fee,
        stock: 999,
        minStock: 10,
        unit: 'nomor',
        isActive: true,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      });
    });
  });

  return list;
};

export const generateSampleKonterAccessories = (): Product[] => {
  const now = '2026-01-01T00:00:00.000Z';
  return [
    // 1. Cas & Charger
    {
      id: 'acc-cas-20w-fast',
      barcode: 'CAS20W',
      name: 'Charger Fast Charging 20W Type-C (Original Quality)',
      category: 'Cas & Charger',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 25000,
      sellPrice: 45000,
      stock: 25,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-cas-vivo-oppo',
      barcode: 'CASVIVO',
      name: 'Charger Flash Charge Original (Vivo / Oppo / Realme)',
      category: 'Cas & Charger',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 30000,
      sellPrice: 55000,
      stock: 20,
      minStock: 4,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-cas-iphone-20w',
      barcode: 'CASIPHONE',
      name: 'Batok Adapter Charger iPhone 20W USB-C PD',
      category: 'Cas & Charger',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 35000,
      sellPrice: 65000,
      stock: 15,
      minStock: 3,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-cas-batok-dual',
      barcode: 'CASDUAL',
      name: 'Kepala Casan Dual USB 3.4A Quick Charge 3.0',
      category: 'Cas & Charger',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 18000,
      sellPrice: 30000,
      stock: 30,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // 2. Voucher Fisik (Kuota Gesek)
    {
      id: 'vcr-tsel-3gb',
      barcode: 'VCRTEL3',
      name: 'Voucher Fisik Telkomsel 3GB (3 Hari)',
      category: 'Voucher Fisik',
      serviceType: 'PRODUK_FISIK',
      provider: 'Telkomsel',
      buyPrice: 10500,
      sellPrice: 13000,
      stock: 50,
      minStock: 10,
      unit: 'voucher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vcr-tsel-7gb',
      barcode: 'VCRTEL7',
      name: 'Voucher Fisik Telkomsel 7GB (7 Hari)',
      category: 'Voucher Fisik',
      provider: 'Telkomsel',
      buyPrice: 21000,
      sellPrice: 25000,
      stock: 40,
      minStock: 10,
      unit: 'voucher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vcr-isat-5gb',
      barcode: 'VCRISAT5',
      name: 'Voucher Fisik Indosat Freedom 5GB (7 Hari)',
      category: 'Voucher Fisik',
      provider: 'Indosat',
      buyPrice: 16000,
      sellPrice: 20000,
      stock: 40,
      minStock: 10,
      unit: 'voucher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vcr-xl-10gb',
      barcode: 'VCRXL10',
      name: 'Voucher Fisik XL Xtra Combo 10GB',
      category: 'Voucher Fisik',
      provider: 'XL',
      buyPrice: 30000,
      sellPrice: 35000,
      stock: 30,
      minStock: 5,
      unit: 'voucher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vcr-axis-2gb',
      barcode: 'VCRAXIS2',
      name: 'Voucher Fisik Axis Aigo 2GB (3 Hari)',
      category: 'Voucher Fisik',
      provider: 'Axis',
      buyPrice: 7500,
      sellPrice: 10000,
      stock: 50,
      minStock: 10,
      unit: 'voucher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vcr-axis-5gb',
      barcode: 'VCRAXIS5',
      name: 'Voucher Fisik Axis Aigo 5GB (7 Hari)',
      category: 'Voucher Fisik',
      provider: 'Axis',
      buyPrice: 15000,
      sellPrice: 18000,
      stock: 40,
      minStock: 10,
      unit: 'voucher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vcr-tri-6gb',
      barcode: 'VCRTRI6',
      name: 'Voucher Fisik Tri Kuota Happy 6GB (5 Hari)',
      category: 'Voucher Fisik',
      provider: 'Tri',
      buyPrice: 18000,
      sellPrice: 22000,
      stock: 35,
      minStock: 5,
      unit: 'voucher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'vcr-smart-unli',
      barcode: 'VCRSMART',
      name: 'Voucher Fisik Smartfren Unlimited Nonstop',
      category: 'Voucher Fisik',
      provider: 'Smartfren',
      buyPrice: 25000,
      sellPrice: 30000,
      stock: 30,
      minStock: 5,
      unit: 'voucher',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // 3. Casing HP & Tempered Glass
    {
      id: 'acc-case-bening',
      barcode: 'CASEBENING',
      name: 'Casing Silikon Bening Anti-Crack All Type',
      category: 'Casing & Tempered Glass',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 6000,
      sellPrice: 15000,
      stock: 50,
      minStock: 10,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-case-macaron',
      barcode: 'CASEMACARON',
      name: 'Casing Macaron Matte Pelindung Lensa Kamera',
      category: 'Casing & Tempered Glass',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 12000,
      sellPrice: 25000,
      stock: 40,
      minStock: 8,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-case-robot',
      barcode: 'CASEROBOT',
      name: 'Casing Robot Armor Kickstand Stand HP',
      category: 'Casing & Tempered Glass',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 15000,
      sellPrice: 35000,
      stock: 20,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-tg-bening-9h',
      barcode: 'TGBENING',
      name: 'Tempered Glass Kaca Bening 9H Full Layar',
      category: 'Casing & Tempered Glass',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 5000,
      sellPrice: 15000,
      stock: 60,
      minStock: 10,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-tg-antispy',
      barcode: 'TGANTISPY',
      name: 'Tempered Glass Anti-Spy Privasi Layar Gelap',
      category: 'Casing & Tempered Glass',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 10000,
      sellPrice: 25000,
      stock: 40,
      minStock: 8,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-tg-camera',
      barcode: 'TGCAMERA',
      name: 'Pelindung Lensa Kamera Tempered Glass Ring',
      category: 'Casing & Tempered Glass',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 4000,
      sellPrice: 10000,
      stock: 30,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // 4. Kabel Data
    {
      id: 'acc-kabel-typec-fast',
      barcode: 'KBLTYPEC',
      name: 'Kabel Data Fast Charging Type-C 65W Braided 1M',
      category: 'Kabel Data',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 8000,
      sellPrice: 20000,
      stock: 40,
      minStock: 8,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-kabel-microusb',
      barcode: 'KBLMICRO',
      name: 'Kabel Data Micro USB 2.4A Fast Charge 1M',
      category: 'Kabel Data',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 6000,
      sellPrice: 15000,
      stock: 40,
      minStock: 8,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-kabel-lightning',
      barcode: 'KBLLIGHT',
      name: 'Kabel Data iPhone Lightning Fast Charge 1M',
      category: 'Kabel Data',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 10000,
      sellPrice: 25000,
      stock: 35,
      minStock: 6,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-kabel-3in1',
      barcode: 'KBL3IN1',
      name: 'Kabel Data 3-in-1 (Type-C, Micro, Lightning)',
      category: 'Kabel Data',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 15000,
      sellPrice: 30000,
      stock: 25,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-kabel-2m',
      barcode: 'KBL2M',
      name: 'Kabel Data Type-C Panjang 2 Meter Tebal',
      category: 'Kabel Data',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 12000,
      sellPrice: 25000,
      stock: 20,
      minStock: 4,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // 5. Flashdisk & Memori
    {
      id: 'acc-fd-16gb',
      barcode: 'FD16GB',
      name: 'Flashdisk SanDisk Cruzer Blade 16GB USB 2.0',
      category: 'Flashdisk & Memori',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 42000,
      sellPrice: 55000,
      stock: 20,
      minStock: 4,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-fd-32gb',
      barcode: 'FD32GB',
      name: 'Flashdisk SanDisk Cruzer Blade 32GB USB 2.0',
      category: 'Flashdisk & Memori',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 52000,
      sellPrice: 68000,
      stock: 20,
      minStock: 4,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-fd-otg-64gb',
      barcode: 'FDOTG64',
      name: 'Flashdisk OTG Dual Drive Type-C 64GB',
      category: 'Flashdisk & Memori',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 75000,
      sellPrice: 95000,
      stock: 15,
      minStock: 3,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-microsd-32gb',
      barcode: 'MSD32GB',
      name: 'Memori MicroSD SanDisk Ultra 32GB Class 10',
      category: 'Flashdisk & Memori',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 48000,
      sellPrice: 65000,
      stock: 25,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-microsd-64gb',
      barcode: 'MSD64GB',
      name: 'Memori MicroSD SanDisk Ultra 64GB 100MB/s',
      category: 'Flashdisk & Memori',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 70000,
      sellPrice: 90000,
      stock: 15,
      minStock: 3,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-otg-adapter',
      barcode: 'OTGADP',
      name: 'Adapter OTG Mini USB ke Type-C All Metal',
      category: 'Flashdisk & Memori',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 4000,
      sellPrice: 10000,
      stock: 35,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // 6. Handphone & Audio / TWS
    {
      id: 'acc-hp-android-baru',
      barcode: 'HPANDROID',
      name: 'Handphone Android Baru Layar 6.5" RAM 4/64GB',
      category: 'Handphone & Audio',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 1150000,
      sellPrice: 1299000,
      stock: 5,
      minStock: 1,
      unit: 'unit',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-hp-senter-nokia',
      barcode: 'HPFEATURE',
      name: 'Handphone Feature Phone Senter Baterai Awet',
      category: 'Handphone & Audio',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 135000,
      sellPrice: 185000,
      stock: 10,
      minStock: 2,
      unit: 'unit',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-tws-wireless',
      barcode: 'TWSBLUETOOTH',
      name: 'TWS Earphone Bluetooth 5.3 Wireless Stereo Bass',
      category: 'Handphone & Audio',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 45000,
      sellPrice: 75000,
      stock: 20,
      minStock: 4,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-earphone-bass',
      barcode: 'EARJACK',
      name: 'Earphone / Headset Kabel Bass Jack 3.5mm',
      category: 'Handphone & Audio',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 10000,
      sellPrice: 25000,
      stock: 35,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-earphone-typec',
      barcode: 'EARTYPEC',
      name: 'Earphone Kabel Port Type-C Digital Audio HD',
      category: 'Handphone & Audio',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 18000,
      sellPrice: 35000,
      stock: 20,
      minStock: 4,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-speaker-bluetooth',
      barcode: 'SPKMINI',
      name: 'Speaker Bluetooth Mini Portable Super Bass',
      category: 'Handphone & Audio',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 35000,
      sellPrice: 60000,
      stock: 15,
      minStock: 3,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // 7. Kartu Perdana
    {
      id: 'pda-tsel-10gb',
      barcode: 'PDATSEL10',
      name: 'Kartu Perdana Telkomsel Kuota 10GB Segel',
      category: 'Kartu Perdana',
      serviceType: 'PRODUK_FISIK',
      provider: 'Telkomsel',
      buyPrice: 28000,
      sellPrice: 35000,
      stock: 30,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pda-isat-6gb',
      barcode: 'PDAISAT6',
      name: 'Kartu Perdana Indosat IM3 Kuota 6GB',
      category: 'Kartu Perdana',
      serviceType: 'PRODUK_FISIK',
      provider: 'Indosat',
      buyPrice: 20000,
      sellPrice: 25000,
      stock: 30,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pda-xl-15gb',
      barcode: 'PDAXL15',
      name: 'Kartu Perdana XL Axiata Kuota 15GB',
      category: 'Kartu Perdana',
      serviceType: 'PRODUK_FISIK',
      provider: 'XL',
      buyPrice: 38000,
      sellPrice: 45000,
      stock: 25,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pda-axis-ready',
      barcode: 'PDAAXIS',
      name: 'Kartu Perdana Axis Siap Pakai',
      category: 'Kartu Perdana',
      serviceType: 'PRODUK_FISIK',
      provider: 'Axis',
      buyPrice: 8000,
      sellPrice: 12000,
      stock: 40,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pda-tri-9gb',
      barcode: 'PDATRI9',
      name: 'Kartu Perdana Tri Happy 9GB 30 Hari',
      category: 'Kartu Perdana',
      serviceType: 'PRODUK_FISIK',
      provider: 'Tri',
      buyPrice: 25000,
      sellPrice: 30000,
      stock: 25,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'pda-smartfren-10gb',
      barcode: 'PDASMART',
      name: 'Kartu Perdana Smartfren Kuota 10GB',
      category: 'Kartu Perdana',
      serviceType: 'PRODUK_FISIK',
      provider: 'Smartfren',
      buyPrice: 24000,
      sellPrice: 30000,
      stock: 25,
      minStock: 5,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },

    // 8. Aksesoris Tambahan
    {
      id: 'acc-holder-motor',
      barcode: 'HLDMTR',
      name: 'Bracket Holder HP Motor Stang Waterproof',
      category: 'Aksesoris Handphone',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 25000,
      sellPrice: 45000,
      stock: 20,
      minStock: 4,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'acc-ring-stand',
      barcode: 'RINGHP',
      name: 'Ring Stand Holder HP Gantungan Jari Logam',
      category: 'Aksesoris Handphone',
      serviceType: 'PRODUK_FISIK',
      buyPrice: 3000,
      sellPrice: 8000,
      stock: 50,
      minStock: 10,
      unit: 'pcs',
      isActive: true,
      createdAt: now,
      updatedAt: now,
    },
  ];
};

export const SAMPLE_MINI_ATM_PRODUCTS: Product[] = [
  // 1. Layanan Mini ATM (Tarik Tunai, Setor Tunai, Transfer)
  {
    id: 'atm-tarik-100k',
    barcode: 'ATM100K',
    name: 'Tarik Tunai Rp 100.000',
    category: 'Layanan Mini ATM',
    serviceType: 'TARIK_TUNAI',
    nominal: 100000,
    adminFee: 5000,
    buyPrice: 100000,
    sellPrice: 105000,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'atm-tarik-200k',
    barcode: 'ATM200K',
    name: 'Tarik Tunai Rp 200.000',
    category: 'Layanan Mini ATM',
    serviceType: 'TARIK_TUNAI',
    nominal: 200000,
    adminFee: 5000,
    buyPrice: 200000,
    sellPrice: 205000,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'atm-tarik-500k',
    barcode: 'ATM500K',
    name: 'Tarik Tunai Rp 500.000',
    category: 'Layanan Mini ATM',
    serviceType: 'TARIK_TUNAI',
    nominal: 500000,
    adminFee: 7000,
    buyPrice: 500000,
    sellPrice: 507000,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'atm-tarik-1jt',
    barcode: 'ATM1JT',
    name: 'Tarik Tunai Rp 1.000.000',
    category: 'Layanan Mini ATM',
    serviceType: 'TARIK_TUNAI',
    nominal: 1000000,
    adminFee: 10000,
    buyPrice: 1000000,
    sellPrice: 1010000,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'atm-tarik-2jt',
    barcode: 'ATM2JT',
    name: 'Tarik Tunai Rp 2.000.000',
    category: 'Layanan Mini ATM',
    serviceType: 'TARIK_TUNAI',
    nominal: 2000000,
    adminFee: 15000,
    buyPrice: 2000000,
    sellPrice: 2015000,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'atm-setor-tunai',
    barcode: 'ATMSETOR',
    name: 'Setor Tunai Rekening Bank (BRI/BCA/Mandiri)',
    category: 'Layanan Mini ATM',
    serviceType: 'SETOR_TUNAI',
    nominal: 0,
    adminFee: 5000,
    buyPrice: 0,
    sellPrice: 5000,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'atm-transfer-bank',
    barcode: 'ATMTRF',
    name: 'Transfer Antar Bank (Semua Bank)',
    category: 'Layanan Mini ATM',
    serviceType: 'TRANSFER_BANK',
    nominal: 0,
    adminFee: 6500,
    buyPrice: 0,
    sellPrice: 6500,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 2. Pulsa & Paket Data (Semua Operator: Telkomsel, IM3, XL, Axis, Tri, Smartfren)
  ...generateSamplePulsaProducts(),
  {
    id: 'data-tsel-10gb',
    barcode: 'DATATSEL10',
    name: 'Paket Data Telkomsel 10GB 30 Hari',
    category: 'Pulsa & Paket Data',
    serviceType: 'PAKET_DATA',
    provider: 'Telkomsel',
    nominal: 35000,
    adminFee: 3000,
    buyPrice: 35000,
    sellPrice: 38000,
    stock: 999,
    minStock: 10,
    unit: 'nomor',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
  {
    id: 'data-tsel-25gb',
    barcode: 'DATATSEL25',
    name: 'Paket Data Telkomsel 25GB Bulanan',
    category: 'Pulsa & Paket Data',
    serviceType: 'PAKET_DATA',
    provider: 'Telkomsel',
    nominal: 70000,
    adminFee: 5000,
    buyPrice: 70000,
    sellPrice: 75000,
    stock: 999,
    minStock: 10,
    unit: 'nomor',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },

  // 3. Top Up E-Wallet
  {
    id: 'ewallet-dana-50k',
    barcode: 'DANA50',
    name: 'Top Up Saldo DANA 50.000',
    category: 'Top Up E-Wallet',
    serviceType: 'TOPUP_EWALLET',
    provider: 'DANA',
    nominal: 50000,
    adminFee: 2500,
    buyPrice: 50500,
    sellPrice: 53000,
    stock: 999,
    minStock: 10,
    unit: 'nomor',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ewallet-dana-100k',
    barcode: 'DANA100',
    name: 'Top Up Saldo DANA 100.000',
    category: 'Top Up E-Wallet',
    serviceType: 'TOPUP_EWALLET',
    provider: 'DANA',
    nominal: 100000,
    adminFee: 3000,
    buyPrice: 100500,
    sellPrice: 103500,
    stock: 999,
    minStock: 10,
    unit: 'nomor',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ewallet-dana-200k',
    barcode: 'DANA200',
    name: 'Top Up Saldo DANA 200.000',
    category: 'Top Up E-Wallet',
    serviceType: 'TOPUP_EWALLET',
    provider: 'DANA',
    nominal: 200000,
    adminFee: 3500,
    buyPrice: 200500,
    sellPrice: 204000,
    stock: 999,
    minStock: 10,
    unit: 'nomor',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ewallet-shopee-50k',
    barcode: 'SHOPEE50',
    name: 'Top Up ShopeePay 50.000',
    category: 'Top Up E-Wallet',
    serviceType: 'TOPUP_EWALLET',
    provider: 'ShopeePay',
    nominal: 50000,
    adminFee: 2500,
    buyPrice: 50500,
    sellPrice: 53000,
    stock: 999,
    minStock: 10,
    unit: 'nomor',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ewallet-gopay-50k',
    barcode: 'GOPAY50',
    name: 'Top Up GoPay Customer 50.000',
    category: 'Top Up E-Wallet',
    serviceType: 'TOPUP_EWALLET',
    provider: 'GoPay',
    nominal: 50000,
    adminFee: 2500,
    buyPrice: 50500,
    sellPrice: 53000,
    stock: 999,
    minStock: 10,
    unit: 'nomor',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ewallet-ovo-50k',
    barcode: 'OVO50',
    name: 'Top Up OVO 50.000',
    category: 'Top Up E-Wallet',
    serviceType: 'TOPUP_EWALLET',
    provider: 'OVO',
    nominal: 50000,
    adminFee: 2500,
    buyPrice: 50500,
    sellPrice: 53000,
    stock: 999,
    minStock: 10,
    unit: 'nomor',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 4. Token & Listrik PLN
  {
    id: 'pln-token-20k',
    barcode: 'PLN20',
    name: 'Token Listrik PLN 20.000',
    category: 'Token & Listrik PLN',
    serviceType: 'TOKEN_PLN',
    provider: 'PLN',
    nominal: 20000,
    adminFee: 3000,
    buyPrice: 20500,
    sellPrice: 23500,
    stock: 999,
    minStock: 10,
    unit: 'kwh',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pln-token-50k',
    barcode: 'PLN50',
    name: 'Token Listrik PLN 50.000',
    category: 'Token & Listrik PLN',
    serviceType: 'TOKEN_PLN',
    provider: 'PLN',
    nominal: 50000,
    adminFee: 3000,
    buyPrice: 50500,
    sellPrice: 53500,
    stock: 999,
    minStock: 10,
    unit: 'kwh',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pln-token-100k',
    barcode: 'PLN100',
    name: 'Token Listrik PLN 100.000',
    category: 'Token & Listrik PLN',
    serviceType: 'TOKEN_PLN',
    provider: 'PLN',
    nominal: 100000,
    adminFee: 3000,
    buyPrice: 100500,
    sellPrice: 103500,
    stock: 999,
    minStock: 10,
    unit: 'kwh',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pln-tagihan-pasca',
    barcode: 'PLNPASCA',
    name: 'Bayar Tagihan Listrik PLN Pasca',
    category: 'Token & Listrik PLN',
    serviceType: 'TAGIHAN_PPOB',
    provider: 'PLN',
    nominal: 0,
    adminFee: 3500,
    buyPrice: 0,
    sellPrice: 3500,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 5. Tagihan PPOB & BPJS
  {
    id: 'ppob-bpjs-kes',
    barcode: 'BPJSKES',
    name: 'Bayar Iuran BPJS Kesehatan',
    category: 'Tagihan PPOB & BPJS',
    serviceType: 'TAGIHAN_PPOB',
    provider: 'BPJS',
    nominal: 0,
    adminFee: 3000,
    buyPrice: 0,
    sellPrice: 3000,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ppob-pdam-air',
    barcode: 'PDAMAIR',
    name: 'Bayar Tagihan PDAM Air Bersih',
    category: 'Tagihan PPOB & BPJS',
    serviceType: 'TAGIHAN_PPOB',
    provider: 'PDAM',
    nominal: 0,
    adminFee: 3000,
    buyPrice: 0,
    sellPrice: 3000,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'ppob-wifi-indihome',
    barcode: 'INDIHOME',
    name: 'Bayar Tagihan Wifi / Indihome',
    category: 'Tagihan PPOB & BPJS',
    serviceType: 'TAGIHAN_PPOB',
    provider: 'Telkom',
    nominal: 0,
    adminFee: 3500,
    buyPrice: 0,
    sellPrice: 3500,
    stock: 999,
    minStock: 10,
    unit: 'trx',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 6. Aksesoris Konter HP (Cas, Voucher, Casing, Kabel Data, Flashdisk, Handphone, dll)
  ...generateSampleKonterAccessories(),
];

export const SAMPLE_BENGKEL_PRODUCTS: Product[] = [
  // 1. OLI & PELUMAS (SPAREPART)
  {
    id: 'pr-oli-mpx2',
    barcode: 'OLI-MPX2',
    name: 'Oli Mesin AHM MPX2 0.8L (Matic Honda)',
    category: 'Oli & Pelumas',
    itemType: 'SPAREPART',
    buyPrice: 42000,
    sellPrice: 55000,
    stock: 35,
    minStock: 5,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-oli-yamalube-silver',
    barcode: 'OLI-YAMALUBE',
    name: 'Oli Mesin Yamalube Silver 0.8L (Yamaha Bebek/Matic)',
    category: 'Oli & Pelumas',
    itemType: 'SPAREPART',
    buyPrice: 41000,
    sellPrice: 53000,
    stock: 28,
    minStock: 5,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-oli-shell-advance',
    barcode: 'OLI-SHELL-AX7',
    name: 'Oli Mesin Shell Advance AX7 Matic 10W-40 0.8L',
    category: 'Oli & Pelumas',
    itemType: 'SPAREPART',
    buyPrice: 48000,
    sellPrice: 65000,
    stock: 20,
    minStock: 4,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-oli-gardan-honda',
    barcode: 'OLI-GARDAN',
    name: 'Oli Gardan / Gear Oil Matic AHM 120ml',
    category: 'Oli & Pelumas',
    itemType: 'SPAREPART',
    buyPrice: 12000,
    sellPrice: 18000,
    stock: 45,
    minStock: 8,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-radiator-coolant',
    barcode: 'COOLANT-1L',
    name: 'Air Radiator Engine Coolant Hijau 1 Liter',
    category: 'Oli & Pelumas',
    itemType: 'SPAREPART',
    buyPrice: 18000,
    sellPrice: 30000,
    stock: 18,
    minStock: 4,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 2. SPAREPART & SUKU CADANG (SPAREPART)
  {
    id: 'pr-kampas-rem-depan-vario',
    barcode: 'KMP-DEPAN-HND',
    name: 'Kampas Rem Cakram Depan Honda Vario / Beat / Scoopy',
    category: 'Rem & Suspensi',
    itemType: 'SPAREPART',
    buyPrice: 28000,
    sellPrice: 45000,
    stock: 22,
    minStock: 5,
    unit: 'set',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-kampas-rem-belakang-tromol',
    barcode: 'KMP-BLKG-TRM',
    name: 'Kampas Rem Belakang Tromol Universal Matic Honda',
    category: 'Rem & Suspensi',
    itemType: 'SPAREPART',
    buyPrice: 25000,
    sellPrice: 40000,
    stock: 20,
    minStock: 5,
    unit: 'set',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-busi-ngk',
    barcode: 'BUSI-NGK-CR6',
    name: 'Busi Standar NGK CR6HSA (Beat / Mio / Jupiter)',
    category: 'Filter & Busi',
    itemType: 'SPAREPART',
    buyPrice: 15000,
    sellPrice: 25000,
    stock: 50,
    minStock: 10,
    unit: 'pcs',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-vbelt-roller-beat',
    barcode: 'VBLT-ROLLER-BT',
    name: 'V-Belt + Roller Set Honda Beat FI / Scoopy (Original)',
    category: 'Sparepart CVT & Transmisi',
    itemType: 'SPAREPART',
    buyPrice: 115000,
    sellPrice: 165000,
    stock: 12,
    minStock: 3,
    unit: 'set',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-filter-udara-vario',
    barcode: 'FLT-UDARA-VR',
    name: 'Filter Udara / Element Comp Air Vario 125/150 LED',
    category: 'Filter & Busi',
    itemType: 'SPAREPART',
    buyPrice: 35000,
    sellPrice: 55000,
    stock: 15,
    minStock: 4,
    unit: 'pcs',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-ban-tubeless-fdr-90-90',
    barcode: 'BAN-FDR-9090',
    name: 'Ban Luar Tubeless FDR Sport XR 90/90-14 (Belakang)',
    category: 'Ban & Velg',
    itemType: 'SPAREPART',
    buyPrice: 175000,
    sellPrice: 225000,
    stock: 10,
    minStock: 2,
    unit: 'pcs',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-ban-tubeless-irc-80-90',
    barcode: 'BAN-IRC-8090',
    name: 'Ban Luar Tubeless IRC Exato 80/90-14 (Depan)',
    category: 'Ban & Velg',
    itemType: 'SPAREPART',
    buyPrice: 160000,
    sellPrice: 205000,
    stock: 12,
    minStock: 2,
    unit: 'pcs',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-aki-kering-gs-gtz5s',
    barcode: 'AKI-GS-GTZ5S',
    name: 'Aki Kering GS Astra GTZ-5S 12V 3.5Ah (Maintenance Free)',
    category: 'Kelistrikan & Aki',
    itemType: 'SPAREPART',
    buyPrice: 185000,
    sellPrice: 240000,
    stock: 8,
    minStock: 2,
    unit: 'pcs',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-bohlam-led-h6',
    barcode: 'LED-H6-PUTIH',
    name: 'Bohlam Lampu Depan LED H6 AC/DC Putih Super Bright',
    category: 'Kelistrikan & Aki',
    itemType: 'SPAREPART',
    buyPrice: 25000,
    sellPrice: 45000,
    stock: 25,
    minStock: 5,
    unit: 'pcs',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-rantai-gear-supra',
    barcode: 'GEAR-SET-SUPRA',
    name: 'Rantai Roda + Gear Paket Komplit Honda Supra / Karisma',
    category: 'Sparepart Mesin',
    itemType: 'SPAREPART',
    buyPrice: 135000,
    sellPrice: 190000,
    stock: 7,
    minStock: 2,
    unit: 'set',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-minyak-rem-dot3',
    barcode: 'MYK-REM-DOT3',
    name: 'Minyak Rem Jumbo DOT 3 Merah 50ml',
    category: 'Rem & Suspensi',
    itemType: 'SPAREPART',
    buyPrice: 8000,
    sellPrice: 15000,
    stock: 30,
    minStock: 5,
    unit: 'botol',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },

  // 3. JASA SERVIS & PERBAIKAN (JASA - TANPA MODAL & TANPA PENGURANGAN STOK)
  {
    id: 'pr-jasa-servis-ringan',
    barcode: 'JS-TUNEUP',
    name: 'Servis Ringan / Tune Up Mesin & Cek Kelistrikan',
    category: 'Jasa Tune Up',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 45000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-ganti-oli',
    barcode: 'JS-GANTI-OLI',
    name: 'Jasa Ganti Oli Mesin & Oli Gardan',
    category: 'Jasa Ganti Oli',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 10000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-servis-cvt',
    barcode: 'JS-SERVIS-CVT',
    name: 'Servis CVT Lengkap + Pembersihan & Pelumasan Gemuk',
    category: 'Jasa Servis & Perbaikan',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 40000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-injeksi',
    barcode: 'JS-INJEKSI',
    name: 'Servis Injeksi / Throttle Body Cleaner & Kalibrasi',
    category: 'Jasa Servis & Perbaikan',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 50000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-pasang-ban',
    barcode: 'JS-PASANG-BAN',
    name: 'Jasa Pasang Ban Luar Tubeless + Cek Pentil',
    category: 'Jasa Servis & Perbaikan',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 15000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-pasang-kampas-rem',
    barcode: 'JS-PASANG-KMP',
    name: 'Jasa Pasang Kampas Rem Depan / Belakang',
    category: 'Jasa Servis & Perbaikan',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 15000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-kelistrikan',
    barcode: 'JS-LISTRIK',
    name: 'Servis Kelistrikan / Cek Pengisian Aki & Jalur Lampu',
    category: 'Jasa Servis & Perbaikan',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 25000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-skir-klep',
    barcode: 'JS-SKIR-KLEP',
    name: 'Servis Besar / Skir Klep / Setel Kompresi Kepala Silinder',
    category: 'Jasa Servis & Perbaikan',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 120000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-overhaul',
    barcode: 'JS-OVERHAUL',
    name: 'Turun Mesin / Overhaul Total (Ganti Stang Seher / Korter)',
    category: 'Jasa Turun Mesin',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 250000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'pr-jasa-cuci-motor',
    barcode: 'JS-CUCI-MOTOR',
    name: 'Jasa Cuci Motor Salju Bersih & Semir Ban',
    category: 'Jasa Cuci Kendaraan',
    itemType: 'JASA',
    buyPrice: 0,
    sellPrice: 20000,
    stock: 999999,
    minStock: 0,
    unit: 'jasa',
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'trx-sample-1',
    invoiceNumber: 'INV-20261014-001',
    date: new Date().toISOString(),
    cashierId: 'user-owner-1',
    cashierName: 'Kepala Bengkel',
    branchId: 'branch-pusat',
    branchName: 'Bengkel Pusat',
    vehiclePlate: 'B 3829 KLG',
    mechanicName: 'Agus Santoso',
    vehicleModel: 'Honda Vario 150',
    customerName: 'Pak Hendra',
    customerPhone: '081299887766',
    items: [
      {
        productId: 'pr-oli-mpx2',
        productName: 'Oli Mesin AHM MPX2 0.8L (Matic Honda)',
        barcode: 'OLI-MPX2',
        category: 'Oli & Pelumas',
        itemType: 'SPAREPART',
        buyPrice: 42000,
        sellPrice: 55000,
        quantity: 1,
        unit: 'botol',
        discount: 0,
        subtotal: 55000,
        profit: 13000,
      },
      {
        productId: 'pr-jasa-servis-cvt',
        productName: 'Servis CVT Lengkap + Pembersihan & Pelumasan Gemuk',
        barcode: 'JS-SERVIS-CVT',
        category: 'Jasa Servis & Perbaikan',
        itemType: 'JASA',
        buyPrice: 0,
        sellPrice: 40000,
        quantity: 1,
        unit: 'jasa',
        discount: 0,
        subtotal: 40000,
        profit: 40000,
        mechanicName: 'Agus Santoso',
      },
    ],
    totalQuantity: 2,
    subtotal: 95000,
    discount: 0,
    grandTotal: 95000,
    totalCost: 42000,
    totalProfit: 53000,
    sparepartTotal: 55000,
    serviceTotal: 40000,
    paymentMethod: 'TUNAI',
    cashAmount: 100000,
    changeAmount: 5000,
    notes: 'Tarikan CVT sudah dibersihkan, getar hilang',
    status: 'COMPLETED',
  },
  {
    id: 'trx-sample-2',
    invoiceNumber: 'INV-20261014-002',
    date: new Date().toISOString(),
    cashierId: 'user-owner-1',
    cashierName: 'Kepala Bengkel',
    branchId: 'branch-pusat',
    branchName: 'Bengkel Pusat',
    vehiclePlate: 'B 4712 SZR',
    mechanicName: 'Joko Susilo',
    vehicleModel: 'Honda Beat ESP 2021',
    customerName: 'Mas Dimas',
    customerPhone: '085712345678',
    items: [
      {
        productId: 'pr-kampas-rem-depan-vario',
        productName: 'Kampas Rem Cakram Depan Honda Vario / Beat / Scoopy',
        barcode: 'KMP-DEPAN-HND',
        category: 'Rem & Suspensi',
        itemType: 'SPAREPART',
        buyPrice: 28000,
        sellPrice: 45000,
        quantity: 1,
        unit: 'set',
        discount: 0,
        subtotal: 45000,
        profit: 17000,
      },
      {
        productId: 'pr-jasa-pasang-kampas-rem',
        productName: 'Jasa Pasang Kampas Rem Depan / Belakang',
        barcode: 'JS-PASANG-KMP',
        category: 'Jasa Servis & Perbaikan',
        itemType: 'JASA',
        buyPrice: 0,
        sellPrice: 15000,
        quantity: 1,
        unit: 'jasa',
        discount: 0,
        subtotal: 15000,
        profit: 15000,
        mechanicName: 'Joko Susilo',
      },
      {
        productId: 'pr-oli-gardan-honda',
        productName: 'Oli Gardan / Gear Oil Matic AHM 120ml',
        barcode: 'OLI-GARDAN',
        category: 'Oli & Pelumas',
        itemType: 'SPAREPART',
        buyPrice: 12000,
        sellPrice: 18000,
        quantity: 1,
        unit: 'botol',
        discount: 0,
        subtotal: 18000,
        profit: 6000,
      },
      {
        productId: 'pr-jasa-ganti-oli',
        productName: 'Jasa Ganti Oli Mesin & Oli Gardan',
        barcode: 'JS-GANTI-OLI',
        category: 'Jasa Ganti Oli',
        itemType: 'JASA',
        buyPrice: 0,
        sellPrice: 10000,
        quantity: 1,
        unit: 'jasa',
        discount: 0,
        subtotal: 10000,
        profit: 10000,
        mechanicName: 'Joko Susilo',
      },
    ],
    totalQuantity: 4,
    subtotal: 88000,
    discount: 0,
    grandTotal: 88000,
    totalCost: 40000,
    totalProfit: 48000,
    sparepartTotal: 63000,
    serviceTotal: 25000,
    paymentMethod: 'QRIS',
    notes: 'Rem depan pakem kembali',
    status: 'COMPLETED',
  },
  {
    id: 'trx-sample-3',
    invoiceNumber: 'INV-20261013-003',
    date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    cashierId: 'user-owner-1',
    cashierName: 'Kepala Bengkel',
    branchId: 'branch-pusat',
    branchName: 'Bengkel Pusat',
    vehiclePlate: 'D 1902 AB',
    mechanicName: 'Rudi Haryanto',
    vehicleModel: 'Yamaha NMAX 155',
    customerName: 'Pak Rahmat',
    customerPhone: '081388776655',
    items: [
      {
        productId: 'pr-oli-yamalube-silver',
        productName: 'Oli Mesin Yamalube Silver 0.8L (Yamaha Bebek/Matic)',
        barcode: 'OLI-YAMALUBE',
        category: 'Oli & Pelumas',
        itemType: 'SPAREPART',
        buyPrice: 41000,
        sellPrice: 53000,
        quantity: 1,
        unit: 'botol',
        discount: 0,
        subtotal: 53000,
        profit: 12000,
      },
      {
        productId: 'pr-busi-ngk',
        productName: 'Busi Standar NGK CR6HSA (Beat / Mio / Jupiter)',
        barcode: 'BUSI-NGK-CR6',
        category: 'Filter & Busi',
        itemType: 'SPAREPART',
        buyPrice: 15000,
        sellPrice: 25000,
        quantity: 1,
        unit: 'pcs',
        discount: 0,
        subtotal: 25000,
        profit: 10000,
      },
      {
        productId: 'pr-jasa-servis-ringan',
        productName: 'Servis Ringan / Tune Up Mesin & Cek Kelistrikan',
        barcode: 'JS-TUNEUP',
        category: 'Jasa Tune Up',
        itemType: 'JASA',
        buyPrice: 0,
        sellPrice: 45000,
        quantity: 1,
        unit: 'jasa',
        discount: 0,
        subtotal: 45000,
        profit: 45000,
        mechanicName: 'Rudi Haryanto',
      },
    ],
    totalQuantity: 3,
    subtotal: 123000,
    discount: 0,
    grandTotal: 123000,
    totalCost: 56000,
    totalProfit: 67000,
    sparepartTotal: 78000,
    serviceTotal: 45000,
    paymentMethod: 'TUNAI',
    cashAmount: 150000,
    changeAmount: 27000,
    notes: 'Servis rutin 5000 km',
    status: 'COMPLETED',
  },
  {
    id: 'trx-sample-4',
    invoiceNumber: 'INV-20261012-004',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    cashierId: 'user-owner-1',
    cashierName: 'Kepala Bengkel',
    branchId: 'branch-pusat',
    branchName: 'Bengkel Pusat',
    vehiclePlate: 'B 5581 PKM',
    mechanicName: 'Agus Santoso',
    vehicleModel: 'Honda Scoopy FI',
    customerName: 'Ibu Ratna',
    customerPhone: '081912345678',
    items: [
      {
        productId: 'pr-vbelt-roller-beat',
        productName: 'V-Belt + Roller Set Honda Beat FI / Scoopy (Original)',
        barcode: 'VBLT-ROLLER-BT',
        category: 'Sparepart CVT & Transmisi',
        itemType: 'SPAREPART',
        buyPrice: 115000,
        sellPrice: 165000,
        quantity: 1,
        unit: 'set',
        discount: 0,
        subtotal: 165000,
        profit: 50000,
      },
      {
        productId: 'pr-jasa-servis-cvt',
        productName: 'Servis CVT Lengkap + Pembersihan & Pelumasan Gemuk',
        barcode: 'JS-SERVIS-CVT',
        category: 'Jasa Servis & Perbaikan',
        itemType: 'JASA',
        buyPrice: 0,
        sellPrice: 40000,
        quantity: 1,
        unit: 'jasa',
        discount: 0,
        subtotal: 40000,
        profit: 40000,
        mechanicName: 'Agus Santoso',
      },
    ],
    totalQuantity: 2,
    subtotal: 205000,
    discount: 0,
    grandTotal: 205000,
    totalCost: 115000,
    totalProfit: 90000,
    sparepartTotal: 165000,
    serviceTotal: 40000,
    paymentMethod: 'TRANSFER_BANK',
    notes: 'Penggantian V-Belt karena sudah retak rambut',
    status: 'COMPLETED',
  },
];

// AES-256 Vault Manager for local data persistence
class LocalEncryptedDatabase {
  private memoryCache: DatabaseSchema | null = null;
  private listeners: Set<() => void> = new Set();

  private getVaultKey(): string {
    if (typeof window === 'undefined') return DEFAULT_KEY;
    const stored = localStorage.getItem(MASTER_KEY_STORAGE);
    return stored || DEFAULT_KEY;
  }

  public setVaultKey(newKey: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem(MASTER_KEY_STORAGE, newKey);
    // Re-save existing data with new key
    if (this.memoryCache) {
      this.save(this.memoryCache);
    }
  }

  // Encrypt string with AES-256
  private encrypt(data: string, secretKey: string): string {
    return CryptoJS.AES.encrypt(data, secretKey).toString();
  }

  // Decrypt string with AES-256
  private decrypt(ciphertext: string, secretKey: string): string {
    const bytes = CryptoJS.AES.decrypt(ciphertext, secretKey);
    return bytes.toString(CryptoJS.enc.Utf8);
  }

  // Initialize and load data
  public load(): DatabaseSchema {
    if (this.memoryCache) return this.memoryCache;

    if (typeof window === 'undefined') {
      return this.getInitialSchema();
    }

    try {
      // Purge legacy storage from previous grocery builds
      try {
        if (localStorage.getItem(LEGACY_STORAGE_KEY_V1)) localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
        if (localStorage.getItem(LEGACY_STORAGE_KEY_V2)) localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
      } catch {}

      const encrypted = localStorage.getItem(STORAGE_KEY);
      if (!encrypted) {
        const initial = this.getInitialSchema();
        this.save(initial);
        this.memoryCache = initial;
        return initial;
      }

      const key = this.getVaultKey();
      let decryptedStr = '';
      try {
        decryptedStr = this.decrypt(encrypted, key);
      } catch {
        // Fallback to default key if custom key failed
        decryptedStr = this.decrypt(encrypted, DEFAULT_KEY);
      }

      if (!decryptedStr) {
        // Fallback or plain text migration
        try {
          const plainObj = JSON.parse(encrypted);
          this.memoryCache = plainObj;
          this.save(plainObj);
          return plainObj;
        } catch {
          const initial = this.getInitialSchema();
          this.save(initial);
          this.memoryCache = initial;
          return initial;
        }
      }

      const data: DatabaseSchema = JSON.parse(decryptedStr);

      // Ensure branches exist
      if (!data.branches || data.branches.length === 0) {
        data.branches = INITIAL_BRANCHES;
      }
      if (!data.mutations) {
        data.mutations = [];
      }

      // Ensure settings & active branch exist
      if (!data.settings) {
        data.settings = INITIAL_SETTINGS;
      } else {
        if (!data.settings.activeBranchId) {
          data.settings.activeBranchId = 'branch-pusat';
        }
        if (!data.settings.branches || data.settings.branches.length === 0) {
          data.settings.branches = data.branches;
        }
        // Pastikan cetak struk otomatis nonaktif (struk hanya dicetak manual bila diminta)
        if (data.settings.autoPrintReceipt !== false) {
          data.settings.autoPrintReceipt = false;
        }
      }

      // Ensure products exist and include workshop spareparts & services
      if (!data.products || data.products.length === 0 || !data.products.some((p) => p.itemType === 'SPAREPART' || p.itemType === 'JASA')) {
        data.products = SAMPLE_BENGKEL_PRODUCTS;
      } else {
        // Ensure any new sample workshop items are present
        const existingIds = new Set(data.products.map((p) => p.id));
        const missingSamples = SAMPLE_BENGKEL_PRODUCTS.filter((p) => !existingIds.has(p.id));
        if (missingSamples.length > 0) {
          data.products = [...data.products, ...missingSamples];
        }
      }

      // Ensure expenses exist
      if (!data.expenses || data.expenses.length === 0) {
        data.expenses = INITIAL_EXPENSES;
      }

      // Ensure mechanics list exists
      if (!data.mechanics || data.mechanics.length === 0) {
        data.mechanics = INITIAL_MECHANICS;
      }
      if (data.settings && (!data.settings.mechanics || data.settings.mechanics.length === 0)) {
        data.settings.mechanics = INITIAL_MECHANICS;
      }

      // Ensure 1 Single Account for Workshop Owner (Prompt 2 & Single Account requirement)
      if (!data.users || data.users.length === 0) {
        data.users = INITIAL_USERS;
      } else {
        const ownerUser = data.users.find((u) => u.role === 'OWNER') || data.users[0] || INITIAL_USERS[0];
        data.users = [
          {
            ...ownerUser,
            name: ownerUser.name || 'Pemilik Bengkel',
            role: 'OWNER',
            branchId: 'branch-pusat',
            isActive: true,
          },
        ];
      }

      if (!data.debts) data.debts = [];
      if (!data.transactions || data.transactions.length === 0) {
        data.transactions = INITIAL_TRANSACTIONS;
      }
      if (!data.stockLogs) data.stockLogs = [];
      if (!data.heldCarts) data.heldCarts = [];
      if (!data.shiftHistory) data.shiftHistory = [];

      this.memoryCache = data;
      return data;
    } catch {
      const initial = this.getInitialSchema();
      this.save(initial);
      this.memoryCache = initial;
      return initial;
    }
  }

  public save(data: DatabaseSchema): void {
    this.memoryCache = data;
    if (typeof window === 'undefined') return;

    try {
      const jsonStr = JSON.stringify(data);
      const key = this.getVaultKey();
      const encrypted = this.encrypt(jsonStr, key);
      localStorage.setItem(STORAGE_KEY, encrypted);
      saveToIDB(jsonStr); // Mirror into browser IndexedDB
      this.notifyListeners();
    } catch {
      // LocalStorage full or private browsing exception
    }
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notifyListeners() {
    this.listeners.forEach((fn) => fn());
  }

  private getInitialSchema(): DatabaseSchema {
    return {
      version: 2,
      products: SAMPLE_BENGKEL_PRODUCTS,
      transactions: INITIAL_TRANSACTIONS,
      debts: [],
      users: INITIAL_USERS,
      activeShift: null,
      shiftHistory: [],
      branches: INITIAL_BRANCHES,
      mutations: [],
      settings: INITIAL_SETTINGS,
      stockLogs: [],
      heldCarts: [],
      expenses: INITIAL_EXPENSES,
      mechanics: INITIAL_MECHANICS,
      lastBackupDate: new Date().toISOString(),
    };
  }

  // Check if browser has granted persistent storage permission
  public async isStoragePersisted(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persisted) {
      try {
        return await navigator.storage.persisted();
      } catch {
        return false;
      }
    }
    return false;
  }

  // Request persistent storage so browser never purges app data
  public async requestPersistentStorage(): Promise<boolean> {
    if (typeof navigator !== 'undefined' && navigator.storage && navigator.storage.persist) {
      try {
        return await navigator.storage.persist();
      } catch {
        return false;
      }
    }
    return false;
  }

  // Asynchronous recovery check from IndexedDB if LocalStorage was cleared
  public async checkAndRecoverFromIndexedDB(): Promise<boolean> {
    try {
      const idbData = await loadFromIDB();
      if (!idbData) return false;
      const parsed: DatabaseSchema = JSON.parse(idbData);
      if (parsed.products && parsed.products.length > 0) {
        this.save(parsed);
        return true;
      }
    } catch {
      // Ignore
    }
    return false;
  }

  // Export full human-readable JSON backup
  public exportJsonBackup(): string {
    const data = this.load();
    const backupObj = {
      app: 'KasirKelontong POS Modern',
      version: data.version || 1,
      exportedAt: new Date().toISOString(),
      storeName: data.settings?.storeName || 'Toko Kelontong',
      summary: {
        totalProducts: data.products?.length || 0,
        totalTransactions: data.transactions?.length || 0,
        totalDebts: data.debts?.length || 0,
      },
      data,
    };
    return JSON.stringify(backupObj, null, 2);
  }

  // Restore from JSON backup
  public restoreJsonBackup(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      const schema: DatabaseSchema = parsed.data || parsed.schema || parsed;
      if (!schema.products || !schema.users) return false;
      this.save(schema);
      return true;
    } catch {
      return false;
    }
  }

  // Raw encrypted backup export (with AES-256)
  public exportEncryptedBackup(customPassword?: string): string {
    const data = this.load();
    const payload = JSON.stringify({
      schema: data,
      exportedAt: new Date().toISOString(),
      app: 'KasirKelontong POS',
      encryption: 'AES-256',
    });
    const key = customPassword || this.getVaultKey();
    return CryptoJS.AES.encrypt(payload, key).toString();
  }

  // Restore encrypted backup file
  public restoreEncryptedBackup(encryptedString: string, password?: string): boolean {
    const key = password || this.getVaultKey();
    try {
      let decrypted = '';
      try {
        decrypted = this.decrypt(encryptedString, key);
      } catch {
        decrypted = this.decrypt(encryptedString, DEFAULT_KEY);
      }

      if (!decrypted) return false;
      const parsed = JSON.parse(decrypted);
      const schema: DatabaseSchema = parsed.schema || parsed;
      if (!schema.products || !schema.users) return false;

      this.save(schema);
      return true;
    } catch {
      return false;
    }
  }

  // Branch management (Multi-Cabang & Kelola Mandiri)
  public getBranches(): StoreBranch[] {
    const data = this.load();
    return data.branches && data.branches.length > 0 ? data.branches : INITIAL_BRANCHES;
  }

  public saveBranches(branches: StoreBranch[]): void {
    const data = this.load();
    data.branches = branches;
    if (data.settings) {
      data.settings.branches = branches;
    }
    this.save(data);
  }

  public getActiveBranch(): StoreBranch {
    const data = this.load();
    const activeId = data.settings?.activeBranchId || 'branch-pusat';
    const branches = data.branches && data.branches.length > 0 ? data.branches : INITIAL_BRANCHES;
    const found = branches.find((b) => b.id === activeId);
    return found || branches[0];
  }

  public setActiveBranchId(branchId: string): void {
    const data = this.load();
    if (!data.settings) data.settings = INITIAL_SETTINGS;
    data.settings.activeBranchId = branchId;
    this.save(data);
  }

  // Balance mutations (Kas Laci vs Saldo Bank vs Saldo Pulsa Digipos)
  public getMutations(branchId?: string): BalanceMutation[] {
    const data = this.load();
    const muts = data.mutations || [];
    if (branchId) {
      return muts.filter((m) => m.branchId === branchId);
    }
    return muts;
  }

  public adjustBranchBalances(
    branchId: string,
    changes: {
      cashChange?: number;
      bankChange?: number;
      digiposChange?: number;
    },
    meta: {
      category: 'TRANSAKSI' | 'TARIK_BANK' | 'SETOR_BANK' | 'TOPUP_SERVER' | 'MODAL_AWAL' | 'PENGELUARAN' | 'LAINNYA';
      description: string;
      referenceId?: string;
      cashierName: string;
    }
  ): { branch: StoreBranch; newMutations: BalanceMutation[] } {
    const data = this.load();
    const branches = data.branches && data.branches.length > 0 ? [...data.branches] : [...INITIAL_BRANCHES];
    const bIndex = branches.findIndex((b) => b.id === branchId);
    const targetIndex = bIndex !== -1 ? bIndex : 0;
    const branch = { ...branches[targetIndex] };
    const newMutations: BalanceMutation[] = [];
    const now = new Date().toISOString();

    // 1. Kas Laci Tunai Fisik
    if (changes.cashChange && changes.cashChange !== 0) {
      const before = branch.cashDrawerBalance || 0;
      const after = before + changes.cashChange;
      branch.cashDrawerBalance = Math.max(0, after);
      newMutations.push({
        id: `mut-cash-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        branchId: branch.id,
        branchName: branch.name,
        date: now,
        type: 'CASH',
        flow: changes.cashChange > 0 ? 'IN' : 'OUT',
        amount: Math.abs(changes.cashChange),
        balanceBefore: before,
        balanceAfter: branch.cashDrawerBalance,
        category: meta.category,
        description: meta.description,
        referenceId: meta.referenceId,
        cashierName: meta.cashierName,
      });
    }

    // 2. Saldo Rekening Bank / EDC Agen
    if (changes.bankChange && changes.bankChange !== 0) {
      const before = branch.bankBalance || 0;
      const after = before + changes.bankChange;
      branch.bankBalance = Math.max(0, after);
      newMutations.push({
        id: `mut-bank-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        branchId: branch.id,
        branchName: branch.name,
        date: now,
        type: 'BANK',
        flow: changes.bankChange > 0 ? 'IN' : 'OUT',
        amount: Math.abs(changes.bankChange),
        balanceBefore: before,
        balanceAfter: branch.bankBalance,
        category: meta.category,
        description: meta.description,
        referenceId: meta.referenceId,
        cashierName: meta.cashierName,
      });
    }

    // 3. Saldo Server Pulsa / Digipos
    if (changes.digiposChange && changes.digiposChange !== 0) {
      const before = branch.digiposBalance || 0;
      const after = before + changes.digiposChange;
      branch.digiposBalance = Math.max(0, after);
      newMutations.push({
        id: `mut-digi-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        branchId: branch.id,
        branchName: branch.name,
        date: now,
        type: 'DIGIPOS',
        flow: changes.digiposChange > 0 ? 'IN' : 'OUT',
        amount: Math.abs(changes.digiposChange),
        balanceBefore: before,
        balanceAfter: branch.digiposBalance,
        category: meta.category,
        description: meta.description,
        referenceId: meta.referenceId,
        cashierName: meta.cashierName,
      });
    }

    branches[targetIndex] = branch;
    data.branches = branches;
    data.mutations = [...newMutations, ...(data.mutations || [])].slice(0, 500);
    if (data.settings) {
      data.settings.branches = branches;
    }
    this.save(data);
    return { branch, newMutations };
  }

  // Set Saldo Riil Langsung (Khusus Admin / Owner)
  public setBranchRealBalances(
    branchId: string,
    newBalances: {
      cashDrawerBalance: number;
      bankBalance: number;
      digiposBalance: number;
      ewalletBalance?: number;
    },
    meta: {
      reason?: string;
      adminName: string;
    }
  ): { branch: StoreBranch; newMutations: BalanceMutation[] } {
    const data = this.load();
    const branches = data.branches && data.branches.length > 0 ? [...data.branches] : [...INITIAL_BRANCHES];
    const bIndex = branches.findIndex((b) => b.id === branchId);
    const targetIndex = bIndex !== -1 ? bIndex : 0;
    const branch = { ...branches[targetIndex] };
    const newMutations: BalanceMutation[] = [];
    const now = new Date().toISOString();

    const oldCash = branch.cashDrawerBalance || 0;
    const oldBank = branch.bankBalance || 0;
    const oldDigi = branch.digiposBalance || 0;
    const oldEwallet = branch.ewalletBalance || 0;

    const diffCash = newBalances.cashDrawerBalance - oldCash;
    const diffBank = newBalances.bankBalance - oldBank;
    const diffDigi = newBalances.digiposBalance - oldDigi;
    const diffEwallet = (newBalances.ewalletBalance ?? oldEwallet) - oldEwallet;

    branch.cashDrawerBalance = Math.max(0, newBalances.cashDrawerBalance);
    branch.bankBalance = Math.max(0, newBalances.bankBalance);
    branch.digiposBalance = Math.max(0, newBalances.digiposBalance);
    if (newBalances.ewalletBalance !== undefined) {
      branch.ewalletBalance = Math.max(0, newBalances.ewalletBalance);
    }

    if (diffCash !== 0) {
      newMutations.push({
        id: `mut-cash-adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        branchId: branch.id,
        branchName: branch.name,
        date: now,
        type: 'CASH',
        flow: diffCash > 0 ? 'IN' : 'OUT',
        amount: Math.abs(diffCash),
        balanceBefore: oldCash,
        balanceAfter: branch.cashDrawerBalance,
        category: 'LAINNYA',
        description: `Penyesuaian Saldo Riil Tunai oleh Admin (${meta.reason || 'Koreksi Saldo Nyata'})`,
        cashierName: meta.adminName,
      });
    }

    if (diffBank !== 0) {
      newMutations.push({
        id: `mut-bank-adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        branchId: branch.id,
        branchName: branch.name,
        date: now,
        type: 'BANK',
        flow: diffBank > 0 ? 'IN' : 'OUT',
        amount: Math.abs(diffBank),
        balanceBefore: oldBank,
        balanceAfter: branch.bankBalance,
        category: 'LAINNYA',
        description: `Penyesuaian Saldo Riil Bank oleh Admin (${meta.reason || 'Koreksi Saldo Nyata'})`,
        cashierName: meta.adminName,
      });
    }

    if (diffDigi !== 0) {
      newMutations.push({
        id: `mut-digi-adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        branchId: branch.id,
        branchName: branch.name,
        date: now,
        type: 'DIGIPOS',
        flow: diffDigi > 0 ? 'IN' : 'OUT',
        amount: Math.abs(diffDigi),
        balanceBefore: oldDigi,
        balanceAfter: branch.digiposBalance,
        category: 'LAINNYA',
        description: `Penyesuaian Saldo Riil Pulsa oleh Admin (${meta.reason || 'Koreksi Saldo Nyata'})`,
        cashierName: meta.adminName,
      });
    }

    if (diffEwallet !== 0) {
      newMutations.push({
        id: `mut-ewallet-adj-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        branchId: branch.id,
        branchName: branch.name,
        date: now,
        type: 'EWALLET',
        flow: diffEwallet > 0 ? 'IN' : 'OUT',
        amount: Math.abs(diffEwallet),
        balanceBefore: oldEwallet,
        balanceAfter: branch.ewalletBalance || 0,
        category: 'LAINNYA',
        description: `Penyesuaian Saldo Riil E-Wallet oleh Admin (${meta.reason || 'Koreksi Saldo Nyata'})`,
        cashierName: meta.adminName,
      });
    }

    branches[targetIndex] = branch;
    data.branches = branches;
    data.mutations = [...newMutations, ...(data.mutations || [])].slice(0, 500);
    if (data.settings) {
      data.settings.branches = branches;
    }
    this.save(data);
    return { branch, newMutations };
  }

  // Reset database completely to pristine state
  public resetToFactoryDefault(keepSettings = false) {
    const current = this.load();
    const fresh: DatabaseSchema = {
      version: 2,
      products: SAMPLE_MINI_ATM_PRODUCTS,
      transactions: [],
      debts: [],
      users: INITIAL_USERS,
      activeShift: null,
      shiftHistory: [],
      branches: INITIAL_BRANCHES,
      mutations: [],
      settings: keepSettings ? current.settings : INITIAL_SETTINGS,
      stockLogs: [],
      heldCarts: [],
      expenses: INITIAL_EXPENSES,
      mechanics: INITIAL_MECHANICS,
      lastBackupDate: new Date().toISOString(),
    };
    this.save(fresh);
    return fresh;
  }

  // Wipes all data completely from localStorage and IDB so that no old data remains
  public wipeAllData(options?: { resetSettings?: boolean }) {
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(LEGACY_STORAGE_KEY_V1);
        localStorage.removeItem(LEGACY_STORAGE_KEY_V2);
        localStorage.removeItem(STORAGE_KEY);
      } catch {}
    }
    const fresh = this.getInitialSchema();
    if (!options?.resetSettings && this.memoryCache?.settings) {
      fresh.settings = { ...this.memoryCache.settings, showSalesBrochure: false };
    }
    this.save(fresh);
    return fresh;
  }

  // Load sample Bengkel spareparts and service catalog
  public loadSampleBengkelProducts() {
    const current = this.load();
    current.products = [...SAMPLE_BENGKEL_PRODUCTS];
    this.save(current);
    return current;
  }

  // Alias for backward compatibility
  public loadSampleMiniAtmProducts() {
    return this.loadSampleBengkelProducts();
  }

  public loadSampleGroceryProducts() {
    return this.loadSampleBengkelProducts();
  }

  // Clear all products (for empty catalog setup)
  public clearAllProducts() {
    const current = this.load();
    current.products = [];
    current.heldCarts = [];
    this.save(current);
    return current;
  }

  // Clear transactional history only (keeps products and branches)
  public clearTransactionsAndHistory() {
    const current = this.load();
    current.transactions = [];
    current.debts = [];
    current.activeShift = null;
    current.shiftHistory = [];
    current.stockLogs = [];
    current.heldCarts = [];
    current.mutations = [];
    this.save(current);
    return current;
  }

  // Clear transactional history for a new store client
  public clearStoreForNewClient(options?: { keepProducts?: boolean }) {
    const current = this.load();
    const freshSchema: DatabaseSchema = {
      ...current,
      transactions: [],
      debts: [],
      activeShift: null,
      shiftHistory: [],
      stockLogs: [],
      heldCarts: [],
      mutations: [],
      products: options?.keepProducts ? current.products : [],
    };
    this.save(freshSchema);
    return freshSchema;
  }

  public saveSettings(settings: StoreSettings) {
    const current = this.load();
    current.settings = settings;
    if (settings.branches) {
      current.branches = settings.branches;
    }
    if (settings.mechanics) {
      current.mechanics = settings.mechanics;
    }
    this.save(current);
  }

  // --- Operasional & Kas Keluar (Buku Kas Bengkel) ---
  public getExpenses(): OperationalExpense[] {
    const data = this.load();
    return data.expenses || [];
  }

  public saveExpenses(expenses: OperationalExpense[]): void {
    const data = this.load();
    data.expenses = expenses;
    this.save(data);
  }

  public addExpense(expense: OperationalExpense): void {
    const data = this.load();
    data.expenses = [expense, ...(data.expenses || [])];
    this.save(data);
  }

  public deleteExpense(expenseId: string): void {
    const data = this.load();
    data.expenses = (data.expenses || []).filter((e) => e.id !== expenseId);
    this.save(data);
  }

  public updateExpense(updated: OperationalExpense): void {
    const data = this.load();
    data.expenses = (data.expenses || []).map((e) => (e.id === updated.id ? updated : e));
    this.save(data);
  }

  // --- Manajemen Mekanik Bengkel ---
  public getMechanics(): string[] {
    const data = this.load();
    return data.mechanics && data.mechanics.length > 0 ? data.mechanics : INITIAL_MECHANICS;
  }

  public saveMechanics(mechanics: string[]): void {
    const data = this.load();
    data.mechanics = mechanics;
    if (data.settings) {
      data.settings.mechanics = mechanics;
    }
    this.save(data);
  }

  public addMechanic(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const current = this.getMechanics();
    if (!current.includes(trimmed)) {
      this.saveMechanics([...current, trimmed]);
    }
  }

  public editMechanic(oldName: string, newName: string): void {
    const trimmedNew = newName.trim();
    if (!trimmedNew || trimmedNew === oldName) return;
    const current = this.getMechanics();
    const updated = current.map((m) => (m === oldName ? trimmedNew : m));
    this.saveMechanics(updated);

    // Update historical transactions to keep commission links intact
    const data = this.load();
    if (data.transactions && data.transactions.length > 0) {
      data.transactions = data.transactions.map((t) => {
        if (t.mechanicName === oldName) {
          return {
            ...t,
            mechanicName: trimmedNew,
            items: t.items.map((i) => (i.mechanicName === oldName ? { ...i, mechanicName: trimmedNew } : i)),
          };
        }
        return t;
      });
      this.save(data);
    }
  }

  public deleteMechanic(name: string): void {
    const current = this.getMechanics();
    const updated = current.filter((m) => m !== name);
    this.saveMechanics(updated);
  }
}

export const db = new LocalEncryptedDatabase();
