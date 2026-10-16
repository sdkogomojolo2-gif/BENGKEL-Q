import React, { useState } from 'react';
import { Lock, ShieldCheck, Delete, ArrowRight, Wrench, KeyRound } from 'lucide-react';
import { CashierUser, StoreBranch } from '../types';
import { sound } from '../services/sound';

interface LoginModalProps {
  users: CashierUser[];
  onLoginSuccess: (user: CashierUser) => void;
  onAddUser?: (name: string, pin: string, role: 'OWNER' | 'KASIR', branchId?: string) => void;
  branches?: StoreBranch[];
  darkMode: boolean;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  users,
  onLoginSuccess,
}) => {
  // Mode 1 Akun Tunggal: Selalu menggunakan akun Pemilik Bengkel (Owner)
  const ownerUser: CashierUser =
    users.find((u) => u.role === 'OWNER') ||
    users[0] || {
      id: 'user-owner-1',
      name: 'Pemilik Bengkel',
      username: 'owner',
      pin: '1234',
      role: 'OWNER',
      branchId: 'branch-pusat',
      isActive: true,
      createdAt: new Date().toISOString(),
    };

  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleDigit = (digit: string) => {
    if (pin.length < 6) {
      sound.playBeep(600, 0.05);
      const newPin = pin + digit;
      setPin(newPin);
      setErrorMsg('');

      // Auto-submit saat PIN cocok (4 digit atau panjang PIN tersimpan)
      if (newPin === ownerUser.pin) {
        sound.playSuccess();
        setTimeout(() => {
          onLoginSuccess(ownerUser);
        }, 120);
      }
    }
  };

  const handleDelete = () => {
    sound.playBeep(400, 0.04);
    setPin((prev) => prev.slice(0, -1));
    setErrorMsg('');
  };

  const handleClear = () => {
    setPin('');
    setErrorMsg('');
  };

  const handleManualSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!pin) {
      setErrorMsg('Masukkan PIN kasir Anda.');
      return;
    }
    if (pin === ownerUser.pin) {
      sound.playSuccess();
      onLoginSuccess(ownerUser);
    } else {
      sound.playError();
      setErrorMsg('PIN salah! Silakan coba lagi (Default: 1234)');
      setPin('');
    }
  };

  return (
    <div
      id="login-screen-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div
        id="login-card"
        className="w-full max-w-md rounded-3xl shadow-2xl overflow-hidden border border-zinc-800 bg-zinc-900 text-zinc-100 flex flex-col"
      >
        {/* Header Bersih & Tegas */}
        <div className="bg-zinc-950 border-b border-zinc-800 px-6 py-6 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-amber-500 text-zinc-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20">
            <Wrench className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight uppercase">
            Kasir Bengkel
          </h2>
          <p className="text-sm text-zinc-400 mt-1 font-medium">
            Buka Kunci Layar Aplikasi Bengkel
          </p>
        </div>

        {/* Profil Akun Tunggal Pemilik Bengkel */}
        <div className="p-6 sm:p-7 space-y-6">
          <div className="flex items-center gap-4 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
            <div className="w-13 h-13 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 text-amber-400 flex items-center justify-center text-2xl font-black shrink-0 shadow-inner">
              👑
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-base sm:text-lg font-black text-white truncate">
                {ownerUser.name || 'Pemilik Bengkel'}
              </div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-amber-500 text-zinc-950 text-xs font-black uppercase tracking-wider mt-1 font-mono">
                Akun Tunggal Pemilik
              </div>
            </div>
          </div>

          {/* Indikator PIN Besar & Terang */}
          <div className="text-center space-y-3">
            <div className="text-xs sm:text-sm font-bold text-zinc-400 uppercase tracking-wider font-mono">
              Masukkan 4-6 Digit PIN:
            </div>
            <div className="flex justify-center items-center gap-3.5 my-2">
              {[0, 1, 2, 3].map((idx) => {
                const isFilled = pin.length > idx;
                return (
                  <div
                    key={idx}
                    className={`w-5 h-5 rounded-full border-2 transition-all ${
                      isFilled
                        ? 'bg-amber-400 border-amber-400 scale-125 shadow-md shadow-amber-400/40'
                        : 'border-zinc-700 bg-zinc-950'
                    }`}
                  />
                );
              })}
            </div>

            {errorMsg && (
              <p className="text-center text-xs sm:text-sm font-bold text-rose-400 mt-2 font-mono bg-rose-500/10 border border-rose-500/30 py-2 px-3 rounded-xl animate-in fade-in">
                {errorMsg}
              </p>
            )}
          </div>

          {/* Numeric Keypad Besar & Ergonomis */}
          <div className="grid grid-cols-3 gap-2.5">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
              <button
                key={digit}
                type="button"
                id={`btn-pin-${digit}`}
                onClick={() => handleDigit(digit)}
                className="h-14 sm:h-16 text-2xl sm:text-3xl font-black font-mono rounded-2xl border bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:border-amber-500/50 text-white transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
              >
                {digit}
              </button>
            ))}
            <button
              type="button"
              id="btn-pin-clear"
              onClick={handleClear}
              className="h-14 sm:h-16 text-xs sm:text-sm font-black font-mono rounded-2xl border bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-all active:scale-95 cursor-pointer flex items-center justify-center uppercase"
            >
              Hapus
            </button>
            <button
              type="button"
              id="btn-pin-0"
              onClick={() => handleDigit('0')}
              className="h-14 sm:h-16 text-2xl sm:text-3xl font-black font-mono rounded-2xl border bg-zinc-950 border-zinc-800 hover:bg-zinc-800 hover:border-amber-500/50 text-white transition-all active:scale-95 cursor-pointer shadow-sm flex items-center justify-center"
            >
              0
            </button>
            <button
              type="button"
              id="btn-pin-backspace"
              onClick={handleDelete}
              className="h-14 sm:h-16 flex items-center justify-center rounded-2xl border bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:text-rose-400 transition-all active:scale-95 cursor-pointer"
              title="Hapus digit terakhir"
            >
              <Delete className="w-6 h-6" />
            </button>
          </div>

          {/* Tombol Masuk Besar */}
          <button
            type="button"
            id="btn-login-submit"
            onClick={() => handleManualSubmit()}
            disabled={!pin}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-zinc-950 text-base sm:text-lg font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all active:scale-98 tracking-wide cursor-pointer uppercase font-mono"
          >
            <KeyRound className="w-5 h-5 stroke-[2.5]" />
            <span>Buka Kasir Bengkel</span>
            <ArrowRight className="w-5 h-5 stroke-[2.5]" />
          </button>

          {/* Keterangan Bawah Bersih */}
          <div className="text-center pt-1 border-t border-zinc-800/80">
            <p className="text-xs text-zinc-400 font-medium">
              PIN Bawaan Pabrik: <strong className="text-amber-400 font-mono">1234</strong>
            </p>
            <p className="text-xs text-zinc-400 mt-0.5">
              Dapat diubah kapan saja di menu Pengaturan Bengkel
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
