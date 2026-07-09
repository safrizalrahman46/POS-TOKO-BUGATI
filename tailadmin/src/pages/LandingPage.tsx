import { Link } from 'react-router';
import { useTheme } from '../context/ThemeContext';

const features = [
  {
    icon: '📦',
    title: 'Manajemen Produk',
    desc: 'Kelola stok, harga, dan kategori produk dengan mudah. Dukungan barcode scanner dan pencarian cepat.',
  },
  {
    icon: '🛒',
    title: 'POS Kasir',
    desc: 'Transaksi cepat dengan antarmuka kasir yang intuitif. Multi-metode pembayaran: Tunai, Debit, QRIS.',
  },
  {
    icon: '📊',
    title: 'Laporan',
    desc: 'Pantau penjualan harian, bulanan, dan tahunan. Lihat tren produk terlaris dan grafik pendapatan.',
  },
  {
    icon: '🏷️',
    title: 'Diskon & Voucher',
    desc: 'Buat promo diskon otomatis dan kode voucher untuk meningkatkan penjualan dan loyalitas pelanggan.',
  },
];

export default function LandingPage() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img className="dark:hidden" src="/images/logo/logo.svg" alt="TOKO BUGATI" width={120} height={32} />
            <img className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="TOKO BUGATI" width={120} height={32} />
          </div>
          <nav className="flex items-center gap-6">
            <a href="#features" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Fitur</a>
            <button onClick={toggleTheme} className="p-2 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all" title={isDark ? 'Mode Terang' : 'Mode Gelap'}>
              {isDark ? (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
              )}
            </button>
            <Link to="/login" className="text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg transition-colors font-medium">Masuk</Link>
          </nav>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-4 pt-24 pb-16 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-4">
          Sistem POS <span className="text-brand-500">Modern & Cepat</span>
        </h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-2xl mx-auto mb-8">
          Kelola toko Anda dengan sistem Point of Sale yang handal. Lengkap dengan manajemen stok, laporan penjualan, dan dukungan multi-metode pembayaran.
        </p>
        <Link to="/login"
          className="inline-block bg-brand-500 hover:bg-brand-600 text-white font-semibold px-8 py-3 rounded-xl text-lg transition-colors shadow-lg shadow-brand-200 dark:shadow-brand-900/30">
          Mulai Sekarang
        </Link>
      </section>

      <section id="features" className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-12">Fitur Unggulan</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => (
            <div key={i} className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-6 border border-gray-100 dark:border-gray-800 hover:border-brand-200 dark:hover:border-brand-800 transition-colors">
              <div className="text-3xl mb-3">{f.icon}</div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{f.title}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-sm text-gray-400">© 2026 TOKO BUGATI. All rights reserved.</div>
          <div className="flex gap-6 text-sm">
            <Link to="/privacy" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Kebijakan Privasi</Link>
            <Link to="/terms" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">Syarat & Ketentuan</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
