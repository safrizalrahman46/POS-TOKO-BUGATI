import { useState, useEffect, useCallback, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { useCartStore } from '../store/cartStore';
import { useDebounce } from '../hooks/useDebounce';
import { productService } from '../services/productService';
import { orderService } from '../services/orderService';
import { voucherService } from '../services/voucherService';
import { getImageUrl } from '../services/api';
import { useWebSocket } from '../hooks/useWebSocket';
import type { Product, Category, ProductVariant } from '../types/product';
import toast from 'react-hot-toast';

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Tunai', icon: '💵', color: 'from-emerald-500 to-green-600' },
  { id: 'debit', label: 'Debit', icon: '💳', color: 'from-brand-500 to-brand-600' },
  { id: 'qris', label: 'QRIS', icon: '📱', color: 'from-purple-500 to-violet-600' },
] as const;

const QUICK_AMOUNTS = [5000, 10000, 20000, 50000, 100000];

function formatPrice(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }

function ScannerModal({ onScan, onClose }: { onScan: (code: string) => void; onClose: () => void }) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = async () => {
      if (!containerRef.current) return;
      const scanner = new Html5Qrcode('scanner-container');
      scannerRef.current = scanner;
      try {
        await scanner.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 150 } },
          (decodedText) => {
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {},
        );
      } catch {
        // camera not available
      }
    };
    start();
    return () => { scannerRef.current?.stop().catch(() => {}); };
  }, [onScan]);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 z-[90] bg-black/80" />
      <div className="relative z-[100] bg-white dark:bg-gray-800 rounded-3xl p-5 w-full max-w-sm mx-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="text-center mb-4">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Scan Barcode</h2>
          <p className="text-sm text-gray-500 mt-1">Arahkan kamera ke barcode produk</p>
        </div>
        <div ref={containerRef} id="scanner-container" className="w-full aspect-square bg-black rounded-2xl overflow-hidden mb-4" />
        <button onClick={onClose}
          className="w-full py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
          Tutup
        </button>
      </div>
    </div>
  );
}

export default function POSPage() {
  const cart = useCartStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPayment, setShowPayment] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [showVariantPicker, setShowVariantPicker] = useState<Product | null>(null);
  const [lastOrder, setLastOrder] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [voucherStatus, setVoucherStatus] = useState<'idle' | 'valid' | 'invalid'>('idle');
  const [voucherMsg, setVoucherMsg] = useState('');
  const barcodeInputRef = useRef<HTMLInputElement>(null);
  const debouncedSearch = useDebounce(searchQuery, 300);

  const subtotal = cart.getSubtotal();
  const afterVoucher = subtotal - cart.voucherDiscount;
  const taxTotal = Math.round(afterVoucher * 11 / 100);
  const grandTotal = afterVoucher + taxTotal;

  useWebSocket('/ws/stock', useCallback((msg: any) => {
    if (msg.type === 'stock_update') {
      setProducts(prev => prev.map(p => p.id === msg.product_id ? { ...p, stock: p.stock - (msg.quantity || 0) } : p));
    }
  }, []));

  const cartWsRef = useRef<WebSocket | null>(null);
  const lastGrandTotalRef = useRef(0);
  useEffect(() => {
    const baseUrl = import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:2000';
    const ws = new WebSocket(`${baseUrl}/ws/cart`);
    ws.onopen = () => { cartWsRef.current = ws; };
    ws.onclose = () => { cartWsRef.current = null; };
    ws.onerror = () => {};
    return () => { ws.close(); cartWsRef.current = null; };
  }, []);

  useEffect(() => {
    if (!cartWsRef.current || cartWsRef.current.readyState !== WebSocket.OPEN) return;
    if (grandTotal > 0) lastGrandTotalRef.current = grandTotal;
    const msg = {
      items: cart.items.map(i => ({
        product_id: i.product_id,
        product_name: i.product_name + (i.variant_name ? ` (${i.variant_name})` : ''),
        price: i.price,
        quantity: i.quantity,
        image: i.product_image || '',
      })),
      subtotal: cart.getSubtotal(),
      voucher_discount: cart.voucherDiscount,
      grand_total: cart.items.length === 0 && lastGrandTotalRef.current > 0 ? lastGrandTotalRef.current : grandTotal,
    };
    cartWsRef.current.send(JSON.stringify(msg));
  }, [cart.items, cart.voucherDiscount, subtotal, grandTotal]);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await productService.getProducts(page, 50, debouncedSearch, selectedCategory?.toString() || '');
      setProducts(res.data || []);
      setTotalPages(Math.ceil((res.total || 0) / 50));
    } catch { setProducts([]); }
  }, [page, debouncedSearch, selectedCategory]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await productService.getCategories(1, 100);
      setCategories(res.data || []);
    } catch {}
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);
  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  useEffect(() => {
    const timer = setInterval(() => {
      const clock = document.getElementById('pos-clock');
      const time = document.getElementById('pos-time');
      if (clock) clock.textContent = new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      if (time) time.textContent = new Date().toLocaleTimeString('id-ID');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    setTimeout(() => barcodeInputRef.current?.focus(), 100);
  }, []);

  const scanBarcode = useCallback(async (barcode: string) => {
    if (!barcode) return;
    try {
      const res = await productService.getByBarcode(barcode);
      if (res.success && res.data) {
        const p = res.data;
        if (p.has_variants && p.variants && p.variants.length > 0) {
          setShowVariantPicker(p);
          return;
        }
        cart.addItem({ id: p.id, name: p.name, price: p.price, stock: p.stock, image: p.image });
        toast.success(`${p.name} ditambahkan`);
      } else {
        toast.error('Produk tidak ditemukan');
      }
    } catch { toast.error('Barcode tidak dikenal'); }
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  }, [cart]);

  const handleBarcode = async (e: React.KeyboardEvent) => {
    if (e.key !== 'Enter') return;
    const barcode = (e.target as HTMLInputElement).value.trim();
    (e.target as HTMLInputElement).value = '';
    await scanBarcode(barcode);
  };

  const handleAddToCart = async (product: Product) => {
    if (product.stock <= 0 && !product.has_variants) { toast.error('Stok habis'); return; }
    if (product.has_variants) {
      setShowVariantPicker(product);
      return;
    }
    cart.addItem({ id: product.id, name: product.name, price: product.price, stock: product.stock, image: product.image });
    toast.success(`${product.name} ditambahkan`);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  const handleVariantSelect = (product: Product, variant: ProductVariant) => {
    if (variant.stock <= 0) { toast.error('Stok varian habis'); return; }
    cart.addItem({
      id: product.id,
      name: product.name,
      price: variant.price,
      stock: variant.stock,
      image: product.image,
      variant_id: variant.id,
      variant_name: variant.name,
    });
    toast.success(`${product.name} (${variant.name}) ditambahkan`);
    setShowVariantPicker(null);
    setTimeout(() => barcodeInputRef.current?.focus(), 50);
  };

  const handleVoucher = useCallback(async (code: string) => {
    if (!code) {
      cart.setVoucherDiscount(0);
      setVoucherStatus('idle');
      setVoucherMsg('');
      return;
    }
    try {
      const res = await voucherService.validateVoucher(code, subtotal);
      if (res.success) {
        cart.setVoucherDiscount(res.data?.discount || 0);
        setVoucherStatus('valid');
        setVoucherMsg(`Diskon Rp ${(res.data?.discount || 0).toLocaleString()}`);
      } else {
        cart.setVoucherDiscount(0);
        setVoucherStatus('invalid');
        setVoucherMsg(res.message || 'Voucher tidak valid');
      }
    } catch {
      cart.setVoucherDiscount(0);
      setVoucherStatus('invalid');
      setVoucherMsg('Gagal validasi voucher');
    }
  }, [subtotal, cart]);

  const handleCheckout = async (paymentMethod: string, paymentAmount: number) => {
    if (cart.items.length === 0) { toast.error('Keranjang kosong'); return; }
    if (paymentAmount < grandTotal) { toast.error(`Pembayaran kurang Rp ${(grandTotal - paymentAmount).toLocaleString()}`); return; }
    setLoading(true);
    try {
      const res = await orderService.createOrder({
        items: cart.items.map(i => ({
          product_id: i.product_id,
          variant_id: i.variant_id || undefined,
          quantity: i.quantity,
        })),
        voucher_code: cart.voucherCode || undefined,
        customer_name: cart.customerName || undefined,
        payment_method: paymentMethod,
        payment_amount: paymentAmount,
      });
      if (res.success) {
        setLastOrder(res.data);
        setShowPayment(false);
        setShowReceipt(true);
        cart.clearCart();
        fetchProducts();
        toast.success('Pembayaran berhasil!');
      } else {
        toast.error(res.message || 'Checkout gagal');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Checkout gagal');
    } finally { setLoading(false); }
  };

  return (
    <div className="h-full flex bg-gray-50 dark:bg-gray-900">
      <CategorySidebar
        categories={categories}
        selected={selectedCategory}
        onSelect={(id) => { setSelectedCategory(id); setPage(1); }}
      />
      <ProductGrid
        products={products}
        searchQuery={searchQuery}
        onSearchChange={(v) => { setSearchQuery(v); setPage(1); }}
        onBarcode={handleBarcode}
        barcodeRef={barcodeInputRef}
        onAdd={handleAddToCart}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
        onScannerClick={() => setShowScanner(true)}
      />
      <CartPanel
        cart={cart}
        subtotal={subtotal}
        taxTotal={taxTotal}
        grandTotal={grandTotal}
        loading={loading}
        voucherStatus={voucherStatus}
        voucherMsg={voucherMsg}
        onVoucher={handleVoucher}
        onCheckout={() => setShowPayment(true)}
      />
      {showScanner && (
        <ScannerModal
          onScan={async (code) => { setShowScanner(false); await scanBarcode(code); }}
          onClose={() => setShowScanner(false)}
        />
      )}
      {showVariantPicker && (
        <VariantPickerModal
          product={showVariantPicker}
          onSelect={(variant) => handleVariantSelect(showVariantPicker, variant)}
          onClose={() => { setShowVariantPicker(null); setTimeout(() => barcodeInputRef.current?.focus(), 50); }}
        />
      )}
      {showPayment && (
        <PaymentModal
          total={grandTotal}
          onSubmit={handleCheckout}
          onClose={() => setShowPayment(false)}
          loading={loading}
        />
      )}
      {showReceipt && lastOrder && (
        <ReceiptModal
          order={lastOrder}
          onClose={() => { setShowReceipt(false); setLastOrder(null); }}
        />
      )}
    </div>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  makanan: '🍚', minuman: '🥤', snack: '🍪', cemilan: '🍿',
  elektronik: '🔌', gadget: '📱', komputer: '💻', aksesoris: '⌚',
  fashion: '👕', pakaian: '👚', sepatu: '👟', tas: '👜',
  kesehatan: '💊', kecantikan: '💄', perawatan: '🧴',
  rumah: '🏠', furniture: '🪑', dapur: '🍳', kebersihan: '🧹',
  alat_tulis: '✏️', buku: '📚', sekolah: '🎒',
  olahraga: '⚽', camping: '🏕️', outdoor: '🎣',
  mainan: '🧸', bayi: '🍼', anak: '🧒',
  otomotif: '🚗', sparepart: '🔧', bengkel: '🛠️',
  hewan: '🐾', petshop: '🐶', tanaman: '🌿', taman: '🌱',
};

function getCategoryIcon(name: string): string {
  const key = name.toLowerCase().replace(/[^a-z]/g, '');
  for (const [k, icon] of Object.entries(CATEGORY_ICONS)) {
    if (key.includes(k)) return icon;
  }
  return '📦';
}

const VARIANT_SHORTCUTS = ['🍚 Makanan', '🥤 Minuman', '🍪 Snack', '📱 Elektronik'];

function CategorySidebar({ categories, selected, onSelect }: {
  categories: Category[];
  selected: number | null;
  onSelect: (id: number | null) => void;
}) {
  return (
    <div className="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0">
      <div className="p-3 border-b border-gray-100 dark:border-gray-700">
        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Kategori</h3>
        <div className="flex flex-wrap gap-1.5">
          {VARIANT_SHORTCUTS.map(label => (
            <button key={label} onClick={() => {
              const match = categories.find(c => label.toLowerCase().includes(c.name.toLowerCase()));
              onSelect(match ? match.id : null);
            }}
            className="px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all whitespace-nowrap">
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 custom-scrollbar">
        <button onClick={() => onSelect(null)}
          className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
            !selected
              ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-brand-900/30'
              : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
          }`}>
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>
          <span>Semua Produk</span>
          {!selected && (
            <svg className="w-4 h-4 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
          )}
        </button>
        {categories.map(cat => {
          const isActive = selected === cat.id;
          return (
            <button key={cat.id} onClick={() => onSelect(cat.id)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-semibold transition-all ${
                isActive
                  ? 'bg-gradient-to-r from-brand-500 to-brand-600 text-white shadow-md shadow-brand-200 dark:shadow-brand-900/30'
                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}>
              <span className="text-lg flex-shrink-0">{getCategoryIcon(cat.name)}</span>
              <span className="truncate">{cat.name}</span>
              {isActive && (
                <svg className="w-4 h-4 ml-auto flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function ProductGrid({ products, searchQuery, onSearchChange, onBarcode, barcodeRef, onAdd, page, totalPages, onPageChange, onScannerClick }: {
  products: Product[];
  searchQuery: string;
  onSearchChange: (v: string) => void;
  onBarcode: (e: React.KeyboardEvent) => void;
  barcodeRef: React.RefObject<HTMLInputElement | null>;
  onAdd: (p: Product) => void;
  page: number;
  totalPages: number;
  onPageChange: (p: number) => void;
  onScannerClick: () => void;
}) {
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex gap-3">
          <div className="relative flex-1 flex gap-2">
            <div className="relative flex-1">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>
              <input ref={barcodeRef} type="text" placeholder="Scan / ketik barcode..." onKeyDown={onBarcode}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
            </div>
            <button onClick={onScannerClick} type="button" title="Scan dengan Kamera"
              className="px-3 py-2.5 bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white rounded-xl text-sm font-medium transition-all shadow-sm flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Kamera
            </button>
          </div>
          <div className="relative w-72">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
          </div>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-4">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
            <p className="text-lg font-medium">Produk tidak ditemukan</p>
            <p className="text-sm mt-1">Coba gunakan kata kunci lain</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
              {products.map(product => (
                <button key={product.id} onClick={() => onAdd(product)} disabled={product.stock <= 0}
                  className={`group bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 p-4 text-left transition-all ${
                    product.stock <= 0
                      ? 'opacity-50 cursor-not-allowed'
                      : 'cursor-pointer hover:shadow-xl hover:border-brand-200 dark:hover:border-brand-700 hover:-translate-y-0.5'
                  }`}>
                  <div className="aspect-square bg-gradient-to-br from-brand-50 to-brand-100 dark:from-gray-700 dark:to-gray-600 rounded-xl mb-3 flex items-center justify-center relative overflow-hidden">
                    {product.image ? (
                      <img src={getImageUrl(product.image)} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-brand-400 dark:text-brand-300">{product.name.charAt(0)}</span>
                    )}
                    {product.has_variants && (
                      <span className="absolute top-1 left-1 bg-brand-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">Varian</span>
                    )}
                    {product.stock <= product.min_stock && !product.has_variants && (
                      <span className="absolute top-1 right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-medium">Habis</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-400 dark:text-gray-500 mb-0.5 truncate font-medium">{product.name}</div>
                  <div className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(product.price)}</div>
                  <div className={`text-[11px] mt-1.5 font-medium flex items-center gap-1 ${
                    product.stock <= product.min_stock ? 'text-red-500' : 'text-gray-400'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${product.stock <= product.min_stock ? 'bg-red-500' : 'bg-green-400'}`} />
                    Stok: {product.stock}
                  </div>
                </button>
              ))}
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium transition-all">
                  ← Prev
                </button>
                <span className="text-sm text-gray-500 dark:text-gray-400 font-medium">Halaman {page} dari {totalPages}</span>
                <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages}
                  className="px-4 py-2 text-sm border border-gray-200 dark:border-gray-600 rounded-xl disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium transition-all">
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

function CartPanel({ cart, subtotal, taxTotal, grandTotal, loading, voucherStatus, voucherMsg, onVoucher, onCheckout }: {
  cart: any;
  subtotal: number;
  taxTotal: number;
  grandTotal: number;
  loading: boolean;
  voucherStatus: string;
  voucherMsg: string;
  onVoucher: (code: string) => void;
  onCheckout: () => void;
}) {
  const statusColor = voucherStatus === 'valid' ? 'text-green-600' : voucherStatus === 'invalid' ? 'text-red-500' : 'text-gray-400';
  const statusIcon = voucherStatus === 'valid' ? '✓' : voucherStatus === 'invalid' ? '✕' : '';

  return (
    <div className="w-[380px] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 flex flex-col flex-shrink-0 shadow-2xl shadow-gray-200/50 dark:shadow-black/20">
      <div className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-bold text-gray-800 dark:text-white text-lg">Keranjang</h2>
          <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 text-xs font-bold px-2.5 py-1 rounded-full">
            {cart.items.length} item
          </span>
        </div>
        <div className="relative">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
          <input type="text" placeholder="Nama pelanggan (opsional)" value={cart.customerName} onChange={e => cart.setCustomerName(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 dark:border-gray-600 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent outline-none transition-all" />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {cart.items.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-300 dark:text-gray-600">
            <svg className="w-20 h-20 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
            <p className="text-sm font-medium">Belum ada item</p>
            <p className="text-xs mt-1">Scan barcode atau pilih produk</p>
          </div>
        ) : (
          cart.items.map((item: any) => (
            <div key={item.product_id} className="group flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-700/40 hover:bg-gray-100 dark:hover:bg-gray-700/60 transition-all">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-100 to-brand-200 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center flex-shrink-0 overflow-hidden">
                {item.product_image ? (
                  <img src={getImageUrl(item.product_image)} alt={item.product_name} className="w-full h-full object-cover" />
                ) : (
                      <span className="text-sm font-bold text-brand-500">{item.product_name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-800 dark:text-white truncate">
                  {item.product_name}
                  {item.variant_name && <span className="text-xs text-gray-500 font-normal"> ({item.variant_name})</span>}
                </div>
                <div className="text-xs text-gray-500">{formatPrice(item.price)}</div>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => cart.updateQuantity(item.product_id, item.quantity - 1, item.variant_id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 text-sm font-bold shadow-sm transition-all">−</button>
                <span className="w-9 text-center text-sm font-bold text-gray-900 dark:text-white">{item.quantity}</span>
                <button onClick={() => cart.updateQuantity(item.product_id, item.quantity + 1, item.variant_id)}
                  className="w-8 h-8 flex items-center justify-center rounded-lg bg-white dark:bg-gray-600 text-gray-600 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-500 text-sm font-bold shadow-sm transition-all">+</button>
              </div>
              <div className="text-right min-w-[80px]">
                <div className="text-sm font-bold text-gray-900 dark:text-white">{formatPrice(item.price * item.quantity)}</div>
              </div>
              <button onClick={() => cart.removeItem(item.product_id, item.variant_id)}
                className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 text-sm transition-all">✕</button>
            </div>
          ))
        )}
      </div>
      <div className="px-4 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-3">
        <div className="relative">
          <input type="text" placeholder="Kode voucher" value={cart.voucherCode}
            onChange={e => {
              const val = e.target.value.toUpperCase();
              cart.setVoucherCode(val);
              onVoucher(val);
            }}
            className={`w-full pl-4 pr-10 py-2.5 border-2 rounded-xl text-sm bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none transition-all ${
              voucherStatus === 'valid' ? 'border-green-400 bg-green-50 dark:bg-green-900/20' :
              voucherStatus === 'invalid' ? 'border-red-400 bg-red-50 dark:bg-red-900/20' :
              'border-gray-200 dark:border-gray-600'
            }`} />
          {voucherStatus !== 'idle' && (
            <span className={`absolute right-3 top-1/2 -translate-y-1/2 text-sm font-bold ${statusColor}`}>{statusIcon}</span>
          )}
          {voucherMsg && (
            <p className={`text-xs mt-1 ${statusColor} font-medium`}>{voucherMsg}</p>
          )}
        </div>
      </div>
      <div className="px-4 pt-3 pb-2 border-t border-gray-100 dark:border-gray-700 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">Subtotal</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">{formatPrice(subtotal)}</span>
        </div>
        {cart.voucherDiscount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-600 font-medium">Diskon Voucher</span>
            <span className="text-green-600 font-semibold">−{formatPrice(cart.voucherDiscount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">PPN 11%</span>
          <span className="font-semibold text-gray-700 dark:text-gray-200">{formatPrice(taxTotal)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white pt-2 border-t-2 border-gray-100 dark:border-gray-700">
          <span>Total</span>
          <span className="text-brand-500 dark:text-brand-400">{formatPrice(grandTotal)}</span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <button onClick={onCheckout} disabled={cart.items.length === 0 || loading}
          className="w-full bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-2xl text-base transition-all shadow-lg shadow-brand-200 dark:shadow-brand-900/30 active:scale-[0.98]">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Memproses...
            </span>
          ) : `Bayar ${formatPrice(grandTotal)}`}
        </button>
        {cart.items.length > 0 && (
          <button onClick={cart.clearCart} className="w-full text-center text-sm text-gray-400 hover:text-red-500 dark:hover:text-red-400 py-1.5 transition-colors font-medium">
            Hapus Semua
          </button>
        )}
      </div>
    </div>
  );
}

function VariantPickerModal({ product, onSelect, onClose }: {
  product: Product;
  onSelect: (variant: ProductVariant) => void;
  onClose: () => void;
}) {
  const variants = product.variants?.filter(v => v.is_active) || [];
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
      <div className="relative z-[100] bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md mx-auto shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{product.name}</h2>
          <p className="text-sm text-gray-500 mt-1">Pilih varian produk</p>
        </div>
        <div className="space-y-2 max-h-[400px] overflow-y-auto">
          {variants.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p className="font-medium">Tidak ada varian tersedia</p>
            </div>
          ) : variants.map(v => (
            <button key={v.id} onClick={() => onSelect(v)} disabled={v.stock <= 0}
              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 text-left transition-all ${
                v.stock <= 0
                  ? 'opacity-50 cursor-not-allowed border-gray-100 dark:border-gray-700'
                  : 'border-gray-100 dark:border-gray-700 hover:border-brand-200 dark:hover:border-brand-700 hover:shadow-lg'
              }`}>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-brand-100 to-brand-200 dark:from-gray-600 dark:to-gray-500 flex items-center justify-center text-lg font-bold text-brand-600 dark:text-brand-300">
                {v.name.charAt(0)}
              </div>
              <div className="flex-1">
                <div className="font-bold text-gray-900 dark:text-white">{v.name}</div>
                <div className="text-sm text-gray-500">{v.barcode && `Barcode: ${v.barcode}`}</div>
                <div className="flex items-center gap-3 mt-1">
                  <span className="text-base font-bold text-brand-500 dark:text-brand-400">{formatPrice(v.price)}</span>
                  <span className={`text-xs font-medium ${v.stock <= v.min_stock ? 'text-red-500' : 'text-gray-400'}`}>
                    Stok: {v.stock}
                  </span>
                </div>
              </div>
              {v.stock > 0 && (
                <svg className="w-5 h-5 text-brand-500 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
              )}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
          Batal
        </button>
      </div>
    </div>
  );
}

function PaymentModal({ total, onSubmit, onClose, loading }: {
  total: number;
  onSubmit: (method: string, amount: number) => void;
  onClose: () => void;
  loading: boolean;
}) {
  const [method, setMethod] = useState('cash');
  const [amount, setAmount] = useState(0);
  const [inputValue, setInputValue] = useState('0');

  const change = amount - total;

  const handleNumber = (num: string) => {
    if (method !== 'cash') return;
    const newVal = inputValue === '0' ? num : inputValue + num;
    setInputValue(newVal);
    setAmount(parseInt(newVal) || 0);
  };

  const handleClear = () => { setInputValue('0'); setAmount(0); };
  const handleBackspace = () => {
    const newVal = inputValue.slice(0, -1) || '0';
    setInputValue(newVal);
    setAmount(parseInt(newVal) || 0);
  };

  useEffect(() => {
    if (method === 'debit' || method === 'qris') {
      setAmount(total);
      setInputValue(total.toString());
    } else {
      setAmount(0);
      setInputValue('0');
    }
  }, [method, total]);

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
      <div className="relative z-[100] bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md mx-auto shadow-2xl" onClick={e => e.stopPropagation()} style={{ animation: 'scaleIn 0.2s ease-out' }}>
        <div className="text-center mb-5">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Pembayaran</h2>
          <p className="text-sm text-gray-500 mt-1">Pilih metode & masukkan jumlah uang</p>
        </div>

        <div className="flex gap-3 mb-5">
          {PAYMENT_METHODS.map(m => (
            <button key={m.id} onClick={() => setMethod(m.id)}
              className={`flex-1 py-3.5 rounded-2xl text-center font-medium border-2 transition-all ${
                method === m.id
                  ? `bg-gradient-to-br ${m.color} text-white border-transparent shadow-lg`
                  : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300 dark:hover:border-gray-500 bg-white dark:bg-gray-700'
              }`}>
              <span className="text-2xl block mb-1">{m.icon}</span>
              <span className="text-sm font-semibold">{m.label}</span>
            </button>
          ))}
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-2xl p-5 mb-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500 font-medium">Total Belanja</span>
            <span className="text-xl font-bold text-gray-900 dark:text-white">{formatPrice(total)}</span>
          </div>
          <div className="border-t border-gray-200 dark:border-gray-600 pt-3 flex justify-between items-center">
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Dibayar</span>
            <span className={`text-2xl font-bold ${method === 'cash' && amount >= total ? 'text-emerald-600' : 'text-brand-500 dark:text-brand-400'}`}>
              {formatPrice(method === 'cash' ? amount : total)}
            </span>
          </div>
          {method === 'cash' && (
            <div className={`pt-3 border-t-2 text-center py-3 -mx-5 -mb-5 rounded-b-2xl ${change >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20'}`}>
              <span className={`text-sm font-semibold ${change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {change >= 0 ? 'Kembalian' : 'Kurang'}
              </span>
              <div className={`text-3xl font-extrabold mt-0.5 ${change >= 0 ? 'text-emerald-700 dark:text-emerald-300' : 'text-red-600 dark:text-red-400'}`}>
                {formatPrice(Math.abs(change))}
              </div>
            </div>
          )}
        </div>

        {method === 'cash' && (
          <>
            <div className="grid grid-cols-3 gap-2 mb-3">
              {[1,2,3,4,5,6,7,8,9].map(n => (
                <button key={n} onClick={() => handleNumber(n.toString())}
                  className="py-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-bold text-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95 border border-gray-100 dark:border-gray-600">{n}</button>
              ))}
              <button onClick={handleClear} className="py-3.5 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 font-semibold text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-all border border-red-100 dark:border-red-800/30">Clear</button>
              <button onClick={() => handleNumber('0')} className="py-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-bold text-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95 border border-gray-100 dark:border-gray-600">0</button>
              <button onClick={handleBackspace} className="py-3.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-800 dark:text-white font-medium hover:bg-gray-100 dark:hover:bg-gray-600 transition-all active:scale-95 border border-gray-100 dark:border-gray-600">⌫</button>
            </div>
            <div className="flex gap-2 mb-4">
              {QUICK_AMOUNTS.map(val => (
                <button key={val} onClick={() => { const newAmt = amount + val; setAmount(newAmt); setInputValue(newAmt.toString()); }}
                  className="flex-1 py-2 rounded-xl bg-brand-50 dark:bg-brand-900/20 text-brand-500 dark:text-brand-300 text-[11px] font-semibold hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-all border border-brand-100 dark:border-brand-800/30">
                  +{val.toLocaleString()}
                </button>
              ))}
            </div>
          </>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">Batal</button>
          <button onClick={() => onSubmit(method, amount)} disabled={amount < total || loading}
            className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-gray-300 disabled:to-gray-300 text-white font-bold text-lg transition-all shadow-lg shadow-green-200 dark:shadow-green-900/30 active:scale-[0.98]">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
                Memproses...
              </span>
            ) : 'Bayar'}
          </button>
        </div>
      </div>
      <style>{`@keyframes scaleIn { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }`}</style>
    </div>
  );
}

function ReceiptModal({ order, onClose }: { order: any; onClose: () => void }) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;
    printWindow.document.write(`
      <html><head><title>Struk Pembayaran</title>
      <style>
        @page { width: 80mm; margin: 0; }
        body { font-family: 'Courier New', monospace; font-size: 12px; width: 80mm; padding: 10px; margin: 0; }
        .header { text-align: center; margin-bottom: 10px; }
        .header h2 { margin: 0; font-size: 16px; }
        .header p { margin: 2px 0; font-size: 11px; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .item { display: flex; justify-content: space-between; font-size: 11px; }
        .footer { text-align: center; margin-top: 10px; font-size: 10px; }
        @media print { body { margin: 0; padding: 5mm; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      <script>window.print(); window.close();</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={onClose}>
      <div className="fixed inset-0 z-[90] bg-black/60 backdrop-blur-sm" />
      <div className="relative z-[100] bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-sm mx-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div ref={printRef}>
          <div className="text-center mb-4">
            <h2 className="font-bold text-xl text-gray-900 dark:text-white">TOKO KITA</h2>
            <p className="text-xs text-gray-500">Jl. Contoh No. 123, Kota</p>
            <p className="text-xs text-gray-500">Telp: 0812-3456-7890</p>
          </div>
          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-600 my-3" />
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3 space-y-1">
            <div className="flex justify-between">
              <span>No: {order.invoice_number}</span>
              <span>{new Date(order.created_at).toLocaleDateString('id-ID')}</span>
            </div>
            <div>Kasir: {order.cashier?.full_name || '-'}</div>
            {order.customer_name && <div>Customer: {order.customer_name}</div>}
            <div className="flex justify-between">
              <span>{new Date(order.created_at).toLocaleTimeString('id-ID')}</span>
              <span className="bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 px-2 py-0.5 rounded text-[10px] font-semibold uppercase">{order.payment_method}</span>
            </div>
          </div>
          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-600 my-3" />
          <div className="space-y-2 mb-3">
            {(order.items || []).map((item: any, i: number) => (
              <div key={i}>
                <div className="text-sm font-medium text-gray-800 dark:text-white">{item.product_name}</div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{item.quantity} x {formatPrice(item.price)}</span>
                  <span className="font-medium text-gray-700 dark:text-gray-300">{formatPrice(item.subtotal)}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-600 my-3" />
          <div className="space-y-1.5 text-sm">
            <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatPrice(order.subtotal)}</span></div>
            {order.discount_total > 0 && <div className="flex justify-between"><span className="text-green-600">Diskon</span><span className="text-green-600 font-medium">−{formatPrice(order.discount_total)}</span></div>}
            {order.voucher_discount > 0 && <div className="flex justify-between"><span className="text-green-600">Voucher</span><span className="text-green-600 font-medium">−{formatPrice(order.voucher_discount)}</span></div>}
            <div className="flex justify-between"><span className="text-gray-500">PPN 11%</span><span className="font-medium">{formatPrice(order.tax_total)}</span></div>
            <div className="flex justify-between text-lg font-bold text-gray-900 dark:text-white border-t-2 border-gray-200 dark:border-gray-600 pt-2 mt-2">
              <span>TOTAL</span><span>{formatPrice(order.grand_total)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400"><span>Bayar</span><span>{formatPrice(order.payment_amount)}</span></div>
            <div className="flex justify-between text-green-600 font-semibold"><span>Kembali</span><span>{formatPrice(order.change_amount)}</span></div>
          </div>
          <div className="border-t-2 border-dashed border-gray-200 dark:border-gray-600 my-4" />
          <div className="text-center text-xs text-gray-400 space-y-1">
            <p className="font-medium text-gray-600 dark:text-gray-300">Terima kasih atas kunjungan Anda</p>
            <p>Barang yang sudah dibeli tidak dapat ditukar/kembali</p>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <button onClick={handlePrint} className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 hover:from-brand-600 hover:to-brand-700 text-white font-bold transition-all shadow-lg shadow-brand-200 dark:shadow-brand-900/30 active:scale-[0.98]">
            Cetak Struk
          </button>
          <button onClick={onClose} className="flex-1 py-3.5 rounded-2xl border-2 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-all">
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
