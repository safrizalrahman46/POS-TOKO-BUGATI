import { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import { promoService } from '../services/promoService';
import { getImageUrl } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import type { Promo } from '../types/promo';

function formatPrice(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

type CartData = {
  items: { product_id: number; product_name: string; price: number; quantity: number; image: string }[];
  subtotal: number;
  voucher_discount: number;
  grand_total: number;
};

const SUCCESS_DISPLAY_MS = 7000;

export default function MirrorDisplayPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const [cartData, setCartData] = useState<CartData | null>(null);
  const [promos, setPromos] = useState<Promo[]>([]);
  const [activePromoIndex, setActivePromoIndex] = useState(0);
  const [time, setTime] = useState(new Date());
  const [successAmount, setSuccessAmount] = useState<number | null>(null);
  const hadItemsRef = useRef(false);
  const lastGrandTotalRef = useRef(0);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useWebSocket('/ws/cart', (msg) => {
    if (msg.type === 'cart_update') {
      const items = (msg.items || []) as CartData['items'];
      const grand_total = (msg.grand_total || 0) as number;

      if (hadItemsRef.current && items.length === 0) {
        hadItemsRef.current = false;
        const amount = grand_total > 0 ? grand_total : lastGrandTotalRef.current;
        if (amount > 0) {
          setSuccessAmount(amount);
          if (successTimerRef.current) clearTimeout(successTimerRef.current);
          successTimerRef.current = setTimeout(() => {
            setSuccessAmount(null);
          }, SUCCESS_DISPLAY_MS);
          setCartData(null);
          return;
        }
        setCartData(null);
        setSuccessAmount(null);
        return;
      }

      if (items.length > 0) {
        hadItemsRef.current = true;
        lastGrandTotalRef.current = grand_total || lastGrandTotalRef.current;
        setCartData({ items, subtotal: (msg.subtotal || 0) as number, voucher_discount: (msg.voucher_discount || 0) as number, grand_total });
        setSuccessAmount(null);
      } else {
        hadItemsRef.current = false;
        setCartData(null);
        setSuccessAmount(null);
      }
    }
  });

  useEffect(() => {
    promoService.getActivePromos().then(res => {
      if (res.success) setPromos(res.data || []);
    }).catch(() => {});
    return () => { if (successTimerRef.current) clearTimeout(successTimerRef.current); };
  }, []);

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (promos.length <= 1) return;
    const id = setInterval(() => {
      setActivePromoIndex(prev => (prev + 1) % promos.length);
    }, 5000);
    return () => clearInterval(id);
  }, [promos.length]);

  const activePromo = promos[activePromoIndex];

  const taxTotal = cartData ? Math.round((cartData.subtotal - cartData.voucher_discount) * 11 / 100) : 0;
  const finalTotal = cartData ? (cartData.subtotal - cartData.voucher_discount) + taxTotal : 0;

  const bg = isDark
    ? 'bg-gradient-to-br from-gray-950 via-gray-900 to-black text-white'
    : 'bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900';
  const cardBg = isDark ? 'bg-white/5 backdrop-blur-xl border-white/10' : 'bg-white/80 backdrop-blur-xl border-gray-200/60 shadow-sm';
  const cardItemBg = isDark ? 'bg-white/5' : 'bg-gray-50';
  const textMuted = isDark ? 'text-gray-400' : 'text-gray-500';
  const textMuted2 = isDark ? 'text-gray-500' : 'text-gray-400';
  const textDim = isDark ? 'text-gray-300' : 'text-gray-700';
  const borderClr = isDark ? 'border-white/10' : 'border-gray-200';
  const dotActive = isDark ? 'bg-white w-4' : 'bg-gray-800 w-4';
  const dotInactive = isDark ? 'bg-white/40' : 'bg-gray-400/40';
  const promoFallbackBg = isDark ? 'from-amber-900/30 to-orange-900/30' : 'from-amber-100 to-orange-100';
  const promoFallbackText = isDark ? 'text-amber-400/80' : 'text-amber-700';
  const promoOverlay = isDark ? 'bg-gradient-to-t from-black/60 via-transparent to-transparent' : '';
  const promoTitleClr = isDark ? 'text-white' : 'text-gray-900';
  const promoDescClr = isDark ? 'text-gray-300' : 'text-gray-600';
  const totalClr = isDark ? 'from-green-400 to-emerald-500' : 'from-green-600 to-emerald-700';
  const successBg = isDark ? 'from-green-500/20 to-emerald-500/20' : 'from-green-100 to-emerald-100';
  const successIconClr = isDark ? 'text-green-400' : 'text-green-600';
  const idleCartBg = isDark ? 'from-amber-500/20 to-orange-500/20' : 'from-amber-100 to-orange-100';
  const idleCartIcon = isDark ? 'text-amber-400/60' : 'text-amber-600/60';
  const liveDot = 'bg-green-400';
  const greenText = isDark ? 'text-green-400' : 'text-green-600';

  return (
    <div className={`min-h-screen ${bg} flex flex-col overflow-hidden`}>
      <div className="flex-1 flex flex-col p-6 lg:p-10 max-w-7xl mx-auto w-full">
        <header className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-4xl lg:text-5xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                TOKO BUGATI
              </span>
            </h1>
            <p className={`${textMuted} text-lg mt-1`}>Selamat Berbelanja</p>
          </div>
          <div className="flex items-start gap-4">
            <button
              onClick={toggleTheme}
              className={`p-3 rounded-2xl transition-all ${isDark ? 'bg-white/10 hover:bg-white/20 text-yellow-400' : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-600'} backdrop-blur`}
              title={isDark ? 'Mode Terang' : 'Mode Gelap'}
            >
              {isDark ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <div className="text-right">
              <p className={`text-3xl lg:text-4xl font-light tabular-nums ${textDim}`}>
                {time.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
              </p>
              <p className={`text-sm ${textMuted2}`}>
                {time.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
          {successAmount !== null ? (
            <div className="lg:col-span-5 flex items-center justify-center">
              <div className="text-center">
                <div className={`w-24 h-24 bg-gradient-to-br ${successBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <svg className={`w-12 h-12 ${successIconClr}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                </div>
                <h2 className={`text-3xl font-bold ${greenText} mb-2`}>Pembayaran Berhasil!</h2>
                <p className={`text-xl ${textMuted}`}>{formatPrice(successAmount)}</p>
                <p className={`${textMuted2} mt-4`}>Terima kasih telah berbelanja</p>
              </div>
            </div>
          ) : cartData && cartData.items.length > 0 ? (
            <>
              <div className={`lg:col-span-3 ${cardBg} rounded-3xl border p-6 flex flex-col overflow-hidden`}>
                <h2 className={`text-xl font-semibold ${textMuted} mb-4 flex items-center gap-2`}>
                  <span className={`w-2 h-2 ${liveDot} rounded-full animate-pulse`} />
                  Pesanan Baru
                </h2>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {cartData.items.map((item, i) => (
                    <div key={i} className={`flex items-center gap-4 ${cardItemBg} rounded-2xl p-4`}>
                      {item.image ? (
                        <img src={getImageUrl(item.image)} alt={item.product_name} className="w-14 h-14 rounded-xl object-cover bg-gray-800" />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                          <span className="text-2xl">📦</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-lg truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.product_name}</p>
                        <p className={textMuted}>{formatPrice(item.price)}</p>
                      </div>
                      <div className="text-right">
                        <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>x{item.quantity}</p>
                        <p className={`text-sm ${textMuted}`}>{formatPrice(item.price * item.quantity)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-4">
                {activePromo && (
                  <div className={`relative rounded-3xl overflow-hidden aspect-[16/9] ${cardBg} border group`}>
                    {activePromo.image ? (
                      <img src={getImageUrl(activePromo.image)} alt={activePromo.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${promoFallbackBg}`}>
                        <p className={`text-2xl font-bold ${promoFallbackText}`}>{activePromo.title}</p>
                      </div>
                    )}
                    <div className={`absolute inset-0 ${promoOverlay}`} />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className={`font-bold text-lg ${promoTitleClr}`}>{activePromo.title}</p>
                      {activePromo.description && (
                        <p className={`text-sm ${promoDescClr}`}>{activePromo.description}</p>
                      )}
                    </div>
                    {promos.length > 1 && (
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        {promos.map((_, i) => (
                          <button key={i} onClick={() => setActivePromoIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === activePromoIndex ? dotActive : dotInactive}`} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className={`flex-1 ${cardBg} rounded-3xl border p-6 flex flex-col justify-center`}>
                  <div className="space-y-3">
                    {cartData.voucher_discount > 0 && (
                      <div className="flex justify-between text-lg">
                        <span className={textMuted}>Diskon</span>
                        <span className={greenText}>-{formatPrice(cartData.voucher_discount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-lg">
                      <span className={textMuted}>Subtotal</span>
                      <span>{formatPrice(cartData.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-lg">
                      <span className={textMuted}>PPN 11%</span>
                      <span>{formatPrice(taxTotal)}</span>
                    </div>
                  </div>
                  <div className={`mt-4 pt-4 border-t ${borderClr}`}>
                    <div className="flex justify-between items-baseline">
                      <span className={`text-2xl font-semibold ${textMuted}`}>TOTAL</span>
                      <span className={`text-4xl lg:text-5xl font-bold bg-gradient-to-r ${totalClr} bg-clip-text text-transparent`}>
                        {formatPrice(finalTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="lg:col-span-3 flex items-center justify-center">
                <div className="text-center">
                  <div className="relative mb-8">
                    <div className={`w-32 h-32 mx-auto rounded-full bg-gradient-to-br ${idleCartBg} flex items-center justify-center`}>
                      <svg className={`w-16 h-16 ${idleCartIcon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-amber-400 rounded-full flex items-center justify-center animate-bounce">
                      <span className="text-black font-bold text-sm">!</span>
                    </div>
                  </div>
                  <h2 className={`text-3xl font-light ${textDim} mb-2`}>Menunggu Pesanan...</h2>
                  <p className={textMuted2}>Silakan melakukan pemesanan di kasir</p>
                </div>
              </div>

              <div className="lg:col-span-2 flex flex-col gap-4">
                {activePromo && (
                  <div className={`relative rounded-3xl overflow-hidden aspect-[16/9] ${cardBg} border flex-1`}>
                    {activePromo.image ? (
                      <img src={getImageUrl(activePromo.image)} alt={activePromo.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br ${promoFallbackBg}`}>
                        <p className={`text-2xl font-bold ${promoFallbackText}`}>{activePromo.title}</p>
                      </div>
                    )}
                    <div className={`absolute inset-0 ${promoOverlay}`} />
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <p className={`font-bold text-lg ${promoTitleClr}`}>{activePromo.title}</p>
                      {activePromo.description && (
                        <p className={`text-sm ${promoDescClr}`}>{activePromo.description}</p>
                      )}
                    </div>
                    {promos.length > 1 && (
                      <div className="absolute top-3 right-3 flex gap-1.5">
                        {promos.map((_, i) => (
                          <button key={i} onClick={() => setActivePromoIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all ${i === activePromoIndex ? dotActive : dotInactive}`} />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <div className={`${cardBg} rounded-3xl border p-5 text-center`}>
                  <p className={`text-5xl font-light ${textMuted2}`}>🛒</p>
                  <p className={`${isDark ? 'text-gray-600' : 'text-gray-400'} mt-2`}>Scan atau cari produk</p>
                </div>
              </div>
            </>
          )}
        </div>

        <footer className={`mt-6 text-center text-sm ${textMuted2}`}>
          Terima kasih telah berbelanja di Toko Kami
        </footer>
      </div>
    </div>
  );
}
