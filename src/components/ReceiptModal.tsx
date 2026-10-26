import React, { useRef, useState, useEffect } from 'react';
import {
  Printer,
  FileDown,
  Share2,
  CheckCircle2,
  X,
  RefreshCw,
  Bluetooth,
  BluetoothConnected,
  Loader2,
  AlertCircle,
  ExternalLink,
  Copy,
  Check,
  Image as ImageIcon,
  MessageCircle,
  Send,
  Download,
} from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { Transaction, StoreSettings } from '../types';
import { formatRupiah, formatDateIndo } from '../services/export';
import { bluetoothPrinter, isIframeEnvironment, openAppInNewTab } from '../services/bluetoothPrinter';
import { sound } from '../services/sound';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  settings: StoreSettings;
  darkMode: boolean;
  onNewTransaction: () => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  settings,
  darkMode,
  onNewTransaction,
}) => {
  const receiptRef = useRef<HTMLDivElement | null>(null);
  const [btStatus, setBtStatus] = useState(bluetoothPrinter.getStatus());
  const [isPrinting, setIsPrinting] = useState(false);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [waPhotoModalData, setWaPhotoModalData] = useState<{
    imageUrl: string;
    phone: string;
    blob: Blob;
    copied: boolean;
  } | null>(null);
  const [customPhoneInput, setCustomPhoneInput] = useState('');
  const [printMessage, setPrintMessage] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const autoPrintedTrxIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (transaction?.customerPhone) {
      setCustomPhoneInput(transaction.customerPhone);
    } else {
      setCustomPhoneInput('');
    }
    setWaPhotoModalData(null);
  }, [transaction?.id, transaction?.customerPhone]);

  const handleCopyText = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    sound.playSuccess();
    setTimeout(() => {
      setCopiedField(null);
    }, 2500);
  };

  useEffect(() => {
    return bluetoothPrinter.subscribe(setBtStatus);
  }, []);

  // Direct Web / USB Print
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      window.print();
      return;
    }

    const receiptHtml = receiptRef.current ? receiptRef.current.innerHTML : '';
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk_${transaction?.invoiceNumber || 'POS'}</title>
          <style>
            body {
              font-family: 'Courier New', Courier, monospace;
              font-size: 12px;
              color: #000;
              margin: 0;
              padding: 10px;
              width: ${settings.paperSize === '80mm' ? '72mm' : '48mm'};
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .font-bold { font-weight: bold; }
            .divider { border-top: 1px dashed #000; margin: 6px 0; }
            .double-divider { border-top: 2px dashed #000; margin: 6px 0; }
            .flex-between { display: flex; justify-content: space-between; }
            .item-row { margin-bottom: 4px; }
            @media print {
              @page { margin: 0; }
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          ${receiptHtml}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  // The 1-Click Smart Universal Print handler (Foolproof for any cashier)
  const handleSmartPrint = async () => {
    if (!transaction) return;
    setIsPrinting(true);
    setPrintMessage({ text: 'Sedang mencetak struk...', type: 'info' });

    // 1. If Bluetooth is already connected and not in restricted iframe, use ESC/POS
    if (btStatus.isConnected && !isIframeEnvironment()) {
      try {
        await bluetoothPrinter.printReceipt(transaction, settings);
        sound.playSuccess();
        setPrintMessage({ text: `Struk sukses dikirim ke ${btStatus.deviceName || 'Printer Bluetooth'}!`, type: 'success' });
        setTimeout(() => setPrintMessage(null), 3000);
        setIsPrinting(false);
        return;
      } catch (err: any) {
        console.warn('Bluetooth print failed, falling back to standard print:', err);
      }
    }

    // 2. Direct seamless print via printer USB / standard print dialog
    try {
      handlePrint();
      sound.playSuccess();
      setPrintMessage({ text: 'Struk siap dicetak.', type: 'success' });
    } catch {
      setPrintMessage({ text: 'Gagal membuka printer.', type: 'error' });
    } finally {
      setIsPrinting(false);
      setTimeout(() => setPrintMessage(null), 3000);
    }
  };

  // Auto-print receipt if enabled in settings
  useEffect(() => {
    if (isOpen && transaction && settings.autoPrintReceipt) {
      if (autoPrintedTrxIdRef.current !== transaction.id) {
        autoPrintedTrxIdRef.current = transaction.id;
        const timer = setTimeout(() => {
          handleSmartPrint();
        }, 350);
        return () => clearTimeout(timer);
      }
    }
  }, [isOpen, transaction?.id, settings.autoPrintReceipt]);

  if (!isOpen || !transaction) return null;

  // Direct Bluetooth connect & print manually
  const handlePrintBluetoothManual = async () => {
    try {
      setIsPrinting(true);
      setPrintMessage({ text: 'Menghubungkan printer Bluetooth...', type: 'info' });
      await bluetoothPrinter.printReceipt(transaction, settings);
      sound.playSuccess();
      setPrintMessage({ text: 'Struk berhasil dicetak via Bluetooth!', type: 'success' });
      setTimeout(() => setPrintMessage(null), 3500);
    } catch (err: any) {
      sound.playError();
      const errMsg = String(err?.message || '');
      if (
        err?.isIframePolicy ||
        errMsg.toLowerCase().includes('permissions policy') ||
        errMsg.toLowerCase().includes('disallowed')
      ) {
        // Cashier friendly fallback: print standard and advise new tab
        setPrintMessage({ text: 'Akses Bluetooth dibatasi di pratinjau. Membuka cetak standar...', type: 'info' });
        handlePrint();
      } else if (!err?.isCancelled) {
        setPrintMessage({ text: errMsg || 'Gagal koneksi Bluetooth.', type: 'error' });
      }
      setTimeout(() => setPrintMessage(null), 4000);
    } finally {
      setIsPrinting(false);
    }
  };

  // RawBT Print handler for Indonesian Android POS
  const handleRawBTPrint = () => {
    if (!transaction) return;
    const ok = bluetoothPrinter.printWithRawBT(transaction, settings);
    if (ok) {
      sound.playSuccess();
      setPrintMessage({ text: 'Meneruskan ke aplikasi RawBT Android...', type: 'success' });
      setTimeout(() => setPrintMessage(null), 3000);
    }
  };

  // Download PDF receipt
  const handleDownloadPDF = () => {
    const is80mm = settings.paperSize === '80mm';
    const docWidth = is80mm ? 80 : 58;
    const itemsCount = transaction.items.length;
    const docHeight = Math.max(120, 90 + itemsCount * 8);

    const doc = new jsPDF({
      unit: 'mm',
      format: [docWidth, docHeight],
    });

    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(settings.storeName.slice(0, 24), docWidth / 2, 8, { align: 'center' });

    doc.setFont('courier', 'normal');
    doc.setFontSize(7.5);
    doc.text(settings.address.slice(0, 32), docWidth / 2, 12, { align: 'center' });
    doc.text(`Telp: ${settings.phone}`, docWidth / 2, 16, { align: 'center' });

    doc.text('-'.repeat(is80mm ? 42 : 30), docWidth / 2, 20, { align: 'center' });

    doc.setFontSize(7);
    doc.text(`No: ${transaction.invoiceNumber}`, 4, 24);
    doc.text(`Tgl: ${formatDateIndo(transaction.date)}`, 4, 28);
    doc.text(`Kasir: ${transaction.cashierName.slice(0, 15)}`, 4, 32);
    if (transaction.customerName) {
      doc.text(`Pelanggan: ${transaction.customerName.slice(0, 15)}`, 4, 36);
    }

    let currentY = transaction.customerName ? 40 : 36;
    doc.text('-'.repeat(is80mm ? 42 : 30), docWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    // Items
    transaction.items.forEach((item) => {
      doc.setFont('courier', 'bold');
      doc.text(item.productName.slice(0, is80mm ? 28 : 20), 4, currentY);
      currentY += 3.5;
      doc.setFont('courier', 'normal');

      const itemDetail = `${item.quantity} ${item.unit || 'pcs'} x @${formatRupiah(item.sellPrice).replace('Rp', '')}`;
      doc.text(itemDetail, 4, currentY);
      doc.text(formatRupiah(item.subtotal), docWidth - 4, currentY, { align: 'right' });
      currentY += 4.5;
    });

    doc.text('-'.repeat(is80mm ? 42 : 30), docWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    doc.text('Subtotal:', 4, currentY);
    doc.text(formatRupiah(transaction.subtotal), docWidth - 4, currentY, { align: 'right' });
    currentY += 4;

    if (transaction.discount > 0) {
      doc.text('Diskon:', 4, currentY);
      doc.text(`-${formatRupiah(transaction.discount)}`, docWidth - 4, currentY, { align: 'right' });
      currentY += 4;
    }

    doc.setFont('courier', 'bold');
    doc.setFontSize(8.5);
    doc.text('TOTAL:', 4, currentY);
    doc.text(formatRupiah(transaction.grandTotal), docWidth - 4, currentY, { align: 'right' });
    currentY += 4.5;

    doc.setFont('courier', 'normal');
    doc.setFontSize(7);
    doc.text(`Metode: ${transaction.paymentMethod}`, 4, currentY);
    currentY += 4;

    if (transaction.paymentMethod === 'TUNAI' && transaction.cashAmount) {
      doc.text('Tunai:', 4, currentY);
      doc.text(formatRupiah(transaction.cashAmount), docWidth - 4, currentY, { align: 'right' });
      currentY += 4;
      doc.text('Kembalian:', 4, currentY);
      doc.text(formatRupiah(transaction.changeAmount || 0), docWidth - 4, currentY, { align: 'right' });
      currentY += 4.5;
    }

    doc.text('='.repeat(is80mm ? 42 : 30), docWidth / 2, currentY, { align: 'center' });
    currentY += 4;

    doc.setFontSize(6.5);
    doc.text(settings.footerMessage.slice(0, 36), docWidth / 2, currentY, { align: 'center' });

    doc.save(`Struk_${transaction.invoiceNumber}.pdf`);
  };

  // Generate high-resolution receipt image blob (3x scale for crystal clear fonts)
  const generateReceiptImageBlob = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!receiptRef.current) return null;
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      return new Promise((resolve) => {
        canvas.toBlob((blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const dataUrl = canvas.toDataURL('image/png');
          resolve({ blob, dataUrl });
        }, 'image/png');
      });
    } catch (err) {
      console.error('Failed to generate receipt image:', err);
      return null;
    }
  };

  // Download receipt as PNG image
  const handleDownloadImage = async () => {
    if (!transaction) return;
    setIsGeneratingImage(true);
    setPrintMessage({ text: 'Sedang membuat foto struk...', type: 'info' });

    try {
      const result = await generateReceiptImageBlob();
      if (!result) throw new Error('Gagal memproses gambar');

      const link = document.createElement('a');
      link.href = result.dataUrl;
      link.download = `Struk_${transaction.invoiceNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      sound.playSuccess();
      setPrintMessage({ text: 'Foto struk berhasil diunduh (.png)!', type: 'success' });
      setTimeout(() => setPrintMessage(null), 3000);
    } catch {
      sound.playError();
      setPrintMessage({ text: 'Gagal mengunduh foto struk.', type: 'error' });
      setTimeout(() => setPrintMessage(null), 3000);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Share receipt as PHOTO to WhatsApp (Bukan teks)
  const handleShareWAPhoto = async () => {
    if (!transaction) return;
    setIsGeneratingImage(true);
    setPrintMessage({ text: 'Menyiapkan foto struk...', type: 'info' });

    try {
      const result = await generateReceiptImageBlob();
      if (!result) throw new Error('Gagal membuat gambar struk');

      const { blob, dataUrl } = result;
      const fileName = `Struk_${transaction.invoiceNumber}.png`;
      const file = new File([blob], fileName, { type: 'image/png' });

      // Clean customer phone number
      const targetPhoneRaw = customPhoneInput || transaction.customerPhone || '';
      let cleanPhone = targetPhoneRaw.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }

      // Check if browser supports Web Share API with Files (Android Chrome, iOS Safari)
      const canShareFiles =
        typeof navigator.share === 'function' &&
        typeof navigator.canShare === 'function' &&
        navigator.canShare({ files: [file] });

      if (canShareFiles) {
        setPrintMessage({ text: 'Membuka menu kirim WhatsApp...', type: 'info' });
        try {
          await navigator.share({
            files: [file],
            title: `Struk ${settings.storeName} #${transaction.invoiceNumber}`,
            text: `Struk Pembayaran Resmi ${settings.storeName}\nFaktur: #${transaction.invoiceNumber}`,
          });
          sound.playSuccess();
          setPrintMessage({ text: 'Foto struk berhasil dibagikan ke WhatsApp!', type: 'success' });
          setTimeout(() => setPrintMessage(null), 3500);
          return;
        } catch (shareErr: any) {
          if (shareErr.name === 'AbortError') {
            setPrintMessage(null);
            return;
          }
          console.warn('Native share failed or dismissed, fallback to clipboard:', shareErr);
        }
      }

      // Desktop WhatsApp Web / Browser Fallback:
      // 1. Copy image to Clipboard so user can immediately press Ctrl+V (Paste) in WhatsApp
      let copied = false;
      try {
        if (navigator.clipboard && window.ClipboardItem) {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          copied = true;
        }
      } catch (clipErr) {
        console.warn('Clipboard write image failed:', clipErr);
      }

      // 2. Also download the image file so it is saved locally
      try {
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {}

      // 3. Open WhatsApp chat
      const waUrl = cleanPhone
        ? `https://wa.me/${cleanPhone}`
        : `https://web.whatsapp.com/`;
      window.open(waUrl, '_blank');

      sound.playSuccess();

      // 4. Show instructional dialog with image preview
      setWaPhotoModalData({
        imageUrl: dataUrl,
        phone: cleanPhone,
        blob,
        copied,
      });

      setPrintMessage({
        text: copied
          ? '📸 Foto struk disalin! Tekan Paste (Ctrl+V) di chat WhatsApp.'
          : '📸 Foto struk diunduh! Silakan lampirkan foto ke chat WhatsApp.',
        type: 'success',
      });
      setTimeout(() => setPrintMessage(null), 6000);
    } catch (err) {
      console.error(err);
      sound.playError();
      setPrintMessage({ text: 'Gagal memproses foto struk WhatsApp.', type: 'error' });
      setTimeout(() => setPrintMessage(null), 3500);
    } finally {
      setIsGeneratingImage(false);
    }
  };

  // Prompt 4: Kirim Nota WhatsApp Otomatis (Teks Rapi via wa.me)
  const handleShareWAText = () => {
    if (!transaction) return;

    const jasas = transaction.items.filter(
      (i) => i.itemType === 'JASA' || (i.buyPrice === 0 && i.itemType !== 'SPAREPART')
    );
    const spareparts = transaction.items.filter(
      (i) => i.itemType === 'SPAREPART' || (i.buyPrice > 0 && i.itemType !== 'JASA')
    );

    const lines: string[] = [
      `*${settings.storeName.toUpperCase()}*`,
      settings.address ? `${settings.address}` : '',
      settings.phone ? `Telp/WA: ${settings.phone}` : '',
      `=============================`,
      `*NOTA RESMI SERVIS KENDARAAN*`,
      `No. Faktur : #${transaction.invoiceNumber}`,
      `Tanggal    : ${formatDateIndo(transaction.date)}`,
      `Kasir      : ${transaction.cashierName}`,
      transaction.vehiclePlate ? `*Plat Nomor* : *${transaction.vehiclePlate}*` : '',
      transaction.vehicleModel ? `Kendaraan  : ${transaction.vehicleModel}` : '',
      transaction.odometerKm ? `Kilometer  : ${transaction.odometerKm.toLocaleString('id-ID')} KM` : '',
      transaction.mechanicName ? `*Mekanik*   : *${transaction.mechanicName}*` : '',
      transaction.customerName ? `Pelanggan  : ${transaction.customerName}` : '',
      `=============================`,
      `*RINCIAN BIAYA PENGERJAAN:*`,
    ];

    if (jasas.length > 0) {
      lines.push(`\n*🛠️ JASA SERVIS:*`);
      jasas.forEach((j) => {
        lines.push(`• ${j.productName} = ${formatRupiah(j.subtotal)}`);
      });
    }

    if (spareparts.length > 0) {
      lines.push(`\n*🔩 SPAREPART & OLI:*`);
      spareparts.forEach((sp) => {
        lines.push(
          `• ${sp.productName} (${sp.quantity} ${sp.unit || 'pcs'}) = ${formatRupiah(sp.subtotal)}`
        );
      });
    }

    lines.push(`-----------------------------`);
    if (transaction.sparepartTotal && transaction.serviceTotal) {
      lines.push(`Subtotal Sparepart : ${formatRupiah(transaction.sparepartTotal)}`);
      lines.push(`Subtotal Jasa      : ${formatRupiah(transaction.serviceTotal)}`);
    }
    if (transaction.discount > 0) {
      lines.push(`Diskon Potongan    : -${formatRupiah(transaction.discount)}`);
    }
    lines.push(`*TOTAL PEMBAYARAN  : ${formatRupiah(transaction.grandTotal)}*`);
    lines.push(`Metode Pembayaran  : ${transaction.paymentMethod}`);

    if (transaction.paymentMethod === 'TUNAI' && transaction.cashAmount) {
      lines.push(`Uang Diterima      : ${formatRupiah(transaction.cashAmount)}`);
      lines.push(`Kembalian          : ${formatRupiah(transaction.changeAmount || 0)}`);
    }

    // Detail Servis Tempo / Kasbon (Prompt 5)
    if (transaction.downPayment !== undefined && transaction.remainingDebt !== undefined) {
      lines.push(`Uang Muka (DP)     : ${formatRupiah(transaction.downPayment)}`);
      lines.push(`*Sisa Hutang (Tempo)* : *${formatRupiah(transaction.remainingDebt)}*`);
      if (transaction.dueDate) {
        lines.push(`Jatuh Tempo        : ${formatDateIndo(transaction.dueDate)}`);
      }
    }

    lines.push(`=============================`);
    lines.push(`_${settings.footerMessage}_`);
    lines.push(`_Terima kasih telah mempercayakan kendaraan Anda pada bengkel kami._ 🔧`);

    const finalMsg = lines.filter((l) => l !== '').join('\n');
    const targetPhoneRaw = customPhoneInput || transaction.customerPhone || '';
    let cleanPhone = targetPhoneRaw.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(finalMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(finalMsg)}`;

    window.open(url, '_blank');
    sound.playSuccess();
  };

  return (
    <div
      id="receipt-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md"
    >
      <div
        id="receipt-modal-card"
        className={`w-full max-w-lg max-h-[92vh] rounded-2xl shadow-2xl overflow-hidden border flex flex-col ${
          darkMode
            ? 'bg-slate-900 border-slate-800 text-slate-100'
            : 'bg-white border-slate-200 text-slate-800'
        }`}
      >
        {/* Pinned Top Header Banner */}
        <div className="shrink-0 bg-gradient-to-r from-slate-950 via-blue-950 to-red-950 px-4 sm:px-5 py-3.5 text-white flex items-center justify-between border-b border-blue-800/50 shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 flex items-center justify-center font-bold shrink-0">
              <CheckCircle2 className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-black text-sm tracking-tight text-white flex items-center gap-2">
                Transaksi Berhasil &amp; Tercatat
              </h3>
              <p className="text-xs text-amber-300 font-mono font-bold">
                Faktur #{transaction.invoiceNumber} • {transaction.branchName || 'Bengkel Pusat'}
              </p>
            </div>
          </div>
          <button
            id="btn-close-receipt"
            type="button"
            onClick={onClose}
            title="Tutup Struk"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-red-600 text-white transition-colors cursor-pointer shrink-0"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Scrollable Middle Area: Full Printable Thermal Receipt + Options */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-slate-100 dark:bg-slate-950">
          {/* Printable Thermal Receipt Paper */}
          <div className="flex justify-center">
            <div
              ref={receiptRef}
              id="thermal-receipt-paper"
              className="bg-white text-slate-900 p-4 sm:p-5 rounded-xl shadow-lg font-mono text-xs w-full max-w-[340px] border border-slate-200 select-all"
            >
              {/* Store Header */}
              <div className="text-center pb-2 text-black space-y-0.5">
                <div className="font-black text-sm sm:text-base tracking-tight text-black uppercase">
                  {settings.storeName || 'BENGKEL-Q MOTOR & MOBIL'}
                </div>
                {settings.tagline && (
                  <div className="text-[10px] font-bold text-zinc-700">{settings.tagline}</div>
                )}
                {transaction.branchName && (
                  <div className="text-[11px] font-black text-zinc-900">{transaction.branchName}</div>
                )}
                <div className="text-[11px] text-zinc-900 font-bold">{settings.address}</div>
                <div className="text-[11px] text-zinc-900 font-bold">Telp/WA: {settings.phone}</div>
              </div>

              <div className="border-t border-dashed border-zinc-400 my-2.5" />

              {/* Metadata */}
              <div className="space-y-0.5 text-[11px] text-black font-medium">
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-900 font-bold shrink-0">No. Faktur:</span>
                  <span className="font-black text-black text-right">#{transaction.invoiceNumber}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-900 font-bold shrink-0">Tanggal:</span>
                  <span className="font-bold text-black text-right">{formatDateIndo(transaction.date)}</span>
                </div>
                <div className="flex justify-between gap-2">
                  <span className="text-zinc-900 font-bold shrink-0">Kasir:</span>
                  <span className="font-bold text-black text-right">{transaction.cashierName}</span>
                </div>
                {(transaction.vehiclePlate || transaction.licensePlate) && (
                  <div className="flex justify-between bg-zinc-100 px-1.5 py-1 rounded font-black text-black my-0.5">
                    <span>Plat Nomor:</span>
                    <span className="font-mono tracking-widest">
                      {transaction.vehiclePlate || transaction.licensePlate}
                    </span>
                  </div>
                )}
                {transaction.vehicleModel && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-900 font-bold shrink-0">Kendaraan:</span>
                    <span className="font-bold text-black text-right">{transaction.vehicleModel}</span>
                  </div>
                )}
                {transaction.odometerKm && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-900 font-bold shrink-0">Kilometer:</span>
                    <span className="font-bold text-black text-right">
                      {transaction.odometerKm.toLocaleString('id-ID')} KM
                    </span>
                  </div>
                )}
                {transaction.mechanicName && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-900 font-bold shrink-0">Mekanik:</span>
                    <span className="font-black text-black text-right">{transaction.mechanicName}</span>
                  </div>
                )}
                {transaction.customerName && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-900 font-bold shrink-0">Pelanggan:</span>
                    <span className="font-black text-black text-right">{transaction.customerName}</span>
                  </div>
                )}
                {transaction.customerPhone && (
                  <div className="flex justify-between gap-2">
                    <span className="text-zinc-900 font-bold shrink-0">No. HP/WA:</span>
                    <span className="font-bold text-black text-right">{transaction.customerPhone}</span>
                  </div>
                )}
                {transaction.complaint && (
                  <div className="pt-0.5 text-[10px] text-zinc-800">
                    <span className="font-bold">Keluhan/Catatan: </span>
                    <span>{transaction.complaint}</span>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-zinc-400 my-2.5" />

              {/* Items Table */}
              <div className="space-y-2 py-1 text-[11px] text-black">
                {transaction.items.map((item, idx) => (
                  <div key={idx} className="space-y-0.5">
                    <div className="flex items-start justify-between font-black text-black">
                      <span className="flex items-start gap-1.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-mono shrink-0 mt-0.5 ${
                            item.itemType === 'JASA'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-zinc-200 text-zinc-800'
                          }`}
                        >
                          {item.itemType === 'JASA' ? 'JASA' : 'PART'}
                        </span>
                        <span className="leading-snug">{item.productName}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-zinc-900 font-bold pl-1">
                      <span>
                        {item.quantity} {item.unit || (item.itemType === 'JASA' ? 'jasa' : 'pcs')} x{' '}
                        {formatRupiah(item.sellPrice)}
                      </span>
                      <span className="font-black text-black">{formatRupiah(item.subtotal)}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dashed border-zinc-400 my-2.5" />

              {/* Totals & Breakdown */}
              <div className="space-y-1 text-[11px] text-black">
                {typeof transaction.sparepartTotal === 'number' &&
                  typeof transaction.serviceTotal === 'number' && (
                    <>
                      <div className="flex justify-between text-zinc-700">
                        <span>Total Sparepart:</span>
                        <span className="font-bold">{formatRupiah(transaction.sparepartTotal)}</span>
                      </div>
                      <div className="flex justify-between text-zinc-700">
                        <span>Total Jasa Servis:</span>
                        <span className="font-bold">{formatRupiah(transaction.serviceTotal)}</span>
                      </div>
                    </>
                  )}
                <div className="flex justify-between font-bold">
                  <span className="text-zinc-900">Subtotal:</span>
                  <span className="font-black text-black">{formatRupiah(transaction.subtotal)}</span>
                </div>
                {transaction.discount > 0 && (
                  <div className="flex justify-between font-black text-rose-700">
                    <span>Diskon:</span>
                    <span>-{formatRupiah(transaction.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm pt-1.5 border-t border-zinc-300">
                  <span>TOTAL:</span>
                  <span className="text-black font-black">{formatRupiah(transaction.grandTotal)}</span>
                </div>
                <div className="flex justify-between pt-1 font-bold">
                  <span className="text-zinc-900">Metode:</span>
                  <span className="font-black uppercase text-black">{transaction.paymentMethod}</span>
                </div>
                {transaction.paymentMethod === 'TUNAI' && transaction.cashAmount !== undefined && (
                  <>
                    <div className="flex justify-between font-bold">
                      <span className="text-zinc-900">Tunai:</span>
                      <span className="font-black text-black">{formatRupiah(transaction.cashAmount)}</span>
                    </div>
                    <div className="flex justify-between font-black text-black">
                      <span className="text-zinc-900">Kembalian:</span>
                      <span className="font-black text-black">{formatRupiah(transaction.changeAmount || 0)}</span>
                    </div>
                  </>
                )}
                {transaction.downPayment !== undefined && transaction.remainingDebt !== undefined && (
                  <>
                    <div className="flex justify-between font-bold text-amber-800">
                      <span>Uang Muka (DP):</span>
                      <span className="font-black">{formatRupiah(transaction.downPayment)}</span>
                    </div>
                    <div className="flex justify-between font-black text-rose-700">
                      <span>Sisa Tempo/Kasbon:</span>
                      <span>{formatRupiah(transaction.remainingDebt)}</span>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-dashed border-zinc-400 my-3" />

              {/* Footer Thank You Note */}
              <div className="text-center text-[10px] text-zinc-900 font-bold space-y-1">
                <p>{settings.footerMessage}</p>
                <p className="font-black text-black">~ Terima Kasih Atas Kunjungan Anda ~</p>
              </div>
            </div>
          </div>

          {/* Paper Size & WhatsApp Settings inside Scrollable Area */}
          <div className="max-w-[340px] mx-auto space-y-2.5">
            {/* Pilihan Ukuran Kertas Thermal 58mm / 80mm */}
            <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs shadow-2xs">
              <span className="font-bold text-zinc-600 dark:text-zinc-400 font-mono text-[11px]">
                Kertas Printer:
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    settings.paperSize = '58mm';
                    setPrintMessage({ text: 'Ukuran kertas diatur ke 58mm', type: 'info' });
                    setTimeout(() => setPrintMessage(null), 2000);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] cursor-pointer transition-all ${
                    settings.paperSize !== '80mm'
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  58mm
                </button>
                <button
                  type="button"
                  onClick={() => {
                    settings.paperSize = '80mm';
                    setPrintMessage({ text: 'Ukuran kertas diatur ke 80mm', type: 'info' });
                    setTimeout(() => setPrintMessage(null), 2000);
                  }}
                  className={`px-2.5 py-1 rounded-lg font-mono font-bold text-[11px] cursor-pointer transition-all ${
                    settings.paperSize === '80mm'
                      ? 'bg-blue-600 text-white font-black shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  80mm
                </button>
              </div>
            </div>

            {/* Input WhatsApp Number Tujuan */}
            <div className="flex items-center gap-2 p-2 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-xs shadow-2xs">
              <span className="font-bold text-zinc-600 dark:text-zinc-400 shrink-0 font-mono text-[11px]">
                WA Pelanggan:
              </span>
              <input
                type="tel"
                placeholder="Contoh: 08123456789"
                value={customPhoneInput}
                onChange={(e) => setCustomPhoneInput(e.target.value)}
                className="flex-1 bg-transparent text-zinc-950 dark:text-zinc-100 font-mono font-bold outline-hidden px-1 placeholder:text-zinc-400 placeholder:font-normal text-xs"
              />
              {customPhoneInput && (
                <button
                  type="button"
                  onClick={() => setCustomPhoneInput('')}
                  className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-bold px-1"
                  title="Hapus nomor"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Secondary Quick Options: Kirim Foto Struk & Unduh PDF */}
            <div className="grid grid-cols-2 gap-2">
              <button
                id="btn-receipt-wa-photo"
                type="button"
                onClick={handleShareWAPhoto}
                disabled={isGeneratingImage}
                className="py-2 px-2.5 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-800 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer shadow-2xs"
                title="Kirim gambar struk format PNG ke WhatsApp"
              >
                <ImageIcon className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Foto Struk (.PNG)</span>
              </button>
              <button
                id="btn-receipt-pdf"
                type="button"
                onClick={handleDownloadPDF}
                className="py-2 px-2.5 border border-zinc-300 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-[11px] rounded-xl flex items-center justify-center gap-1.5 transition-colors active:scale-95 cursor-pointer text-zinc-800 dark:text-zinc-200 shadow-2xs"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>Unduh PDF</span>
              </button>
            </div>

            {/* Toggle for Advanced Options (Bluetooth connect, RawBT, Tab Baru) */}
            <div>
              <button
                type="button"
                onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                className="text-[11px] text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 font-medium underline text-center w-full cursor-pointer py-1"
              >
                {showAdvancedOptions
                  ? '▲ Sembunyikan Opsi Printer Lainnya'
                  : '▼ Opsi Printer Lainnya (Bluetooth Manual / RawBT)'}
              </button>

              {showAdvancedOptions && (
                <div className="mt-1.5 p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 space-y-2 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={handlePrintBluetoothManual}
                      className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Bluetooth className="w-3.5 h-3.5 text-blue-500" />
                      <span>Pindai Bluetooth</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleRawBTPrint}
                      className="p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-200 dark:hover:bg-zinc-700"
                    >
                      <Printer className="w-3.5 h-3.5 text-amber-500" />
                      <span>Cetak via RawBT</span>
                    </button>
                  </div>
                  {isIframeEnvironment() && (
                    <button
                      type="button"
                      onClick={() => openAppInNewTab()}
                      className="w-full p-2 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 font-medium flex items-center justify-center gap-1.5 cursor-pointer hover:bg-zinc-200"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Buka Kasir di Tab Baru (Layar Penuh)</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Pinned Bottom Action Bar — Always Visible Without Scrolling */}
        <div className="shrink-0 p-3 sm:p-4 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 space-y-2">
          {/* Status Message Notification */}
          {printMessage && (
            <div
              className={`p-2 rounded-xl text-xs font-bold flex items-center gap-2 ${
                printMessage.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20'
                  : printMessage.type === 'error'
                  ? 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border border-rose-500/20'
                  : 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20'
              }`}
            >
              {printMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 shrink-0" />
              ) : printMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <Loader2 className="w-4 h-4 animate-spin shrink-0" />
              )}
              <span className="flex-1">{printMessage.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1-CLICK UNIVERSAL PRINT BUTTON */}
            <button
              id="btn-receipt-smart-print"
              type="button"
              onClick={handleSmartPrint}
              disabled={isPrinting}
              className="w-full py-2.5 px-3 bg-blue-700 hover:bg-blue-600 active:bg-blue-800 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-blue-700/20 active:scale-98 transition-all cursor-pointer"
            >
              {isPrinting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                  <span>Mencetak...</span>
                </>
              ) : (
                <>
                  <Printer className="w-4 h-4 shrink-0" />
                  <span>Cetak Struk ({settings.paperSize || '58mm'})</span>
                </>
              )}
            </button>

            {/* TOMBOL KIRIM NOTA WHATSAPP */}
            <button
              id="btn-receipt-wa-text"
              type="button"
              onClick={handleShareWAText}
              className="w-full py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-600/20 active:scale-98 transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Kirim Nota WhatsApp</span>
            </button>
          </div>

          {/* Selesai & Transaksi Baru */}
          <button
            id="btn-receipt-new-transaction"
            type="button"
            onClick={() => {
              onClose();
              onNewTransaction();
            }}
            className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 transition-all shadow-md shadow-red-600/20 active:scale-98 tracking-wide cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Selesai &amp; Transaksi Baru</span>
          </button>
        </div>
      </div>

      {/* WhatsApp Photo Instruction Modal */}
      {waPhotoModalData && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 p-5 shadow-2xl flex flex-col space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 flex items-center justify-center font-bold">
                  <MessageCircle className="w-5 h-5 text-emerald-500" />
                </div>
                <div>
                  <h4 className="font-black text-sm text-zinc-950 dark:text-zinc-50">
                    Foto Struk Siap Dikirim!
                  </h4>
                  <p className="text-xs text-zinc-500 font-mono">
                    {waPhotoModalData.phone ? `Tujuan: +${waPhotoModalData.phone}` : 'Chat WhatsApp'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setWaPhotoModalData(null)}
                className="p-1 rounded-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Receipt Image Thumbnail */}
            <div className="p-3 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200 dark:border-zinc-800 flex justify-center max-h-56 overflow-y-auto">
              <img
                src={waPhotoModalData.imageUrl}
                alt="Pratinjau Foto Struk"
                className="max-w-[240px] rounded shadow-md border border-zinc-300"
              />
            </div>

            {/* Instructions */}
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 dark:text-emerald-300 text-xs space-y-1.5">
              <div className="flex items-center gap-1.5 font-black text-emerald-900 dark:text-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>
                  {waPhotoModalData.copied
                    ? 'Foto Struk Berhasil Disalin ke Clipboard!'
                    : 'Foto Struk Berhasil Dibuat & Diunduh!'}
                </span>
              </div>
              <p className="leading-relaxed text-[11px] text-zinc-700 dark:text-zinc-300">
                {waPhotoModalData.copied ? (
                  <>
                    Jendela WhatsApp sudah terbuka. Cukup klik pada kolom ketik chat WhatsApp lalu tekan{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-black">
                      Tempel / Paste (Ctrl+V)
                    </strong>{' '}
                    untuk langsung mengirim foto struk ke pelanggan.
                  </>
                ) : (
                  <>
                    Jendela WhatsApp sudah terbuka. Silakan lampirkan (attach) file foto struk yang baru diunduh ke chat WhatsApp pelanggan.
                  </>
                )}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  const waUrl = waPhotoModalData.phone
                    ? `https://wa.me/${waPhotoModalData.phone}`
                    : `https://web.whatsapp.com/`;
                  window.open(waUrl, '_blank');
                }}
                className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-95 transition-all"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Chat WA Lagi</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    if (navigator.clipboard && window.ClipboardItem) {
                      await navigator.clipboard.write([
                        new ClipboardItem({ 'image/png': waPhotoModalData.blob }),
                      ]);
                      sound.playSuccess();
                      setPrintMessage({ text: 'Foto struk disalin ulang ke Clipboard!', type: 'success' });
                      setTimeout(() => setPrintMessage(null), 3000);
                    }
                  } catch {}
                }}
                className="py-2.5 px-3 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 border border-zinc-300 dark:border-zinc-700 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 transition-all"
              >
                <Copy className="w-3.5 h-3.5 text-zinc-500" />
                <span>Salin Ulang Foto</span>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setWaPhotoModalData(null)}
              className="w-full py-2 bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 text-zinc-800 dark:text-zinc-200 font-bold text-xs rounded-xl cursor-pointer"
            >
              Tutup Panduan
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
