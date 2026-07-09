import { Link } from 'react-router';

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <header className="border-b border-gray-100 dark:border-gray-800">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <img className="dark:hidden" src="/images/logo/logo.svg" alt="TOKO BUGATI" width={120} height={32} />
            <img className="hidden dark:block" src="/images/logo/logo-dark.svg" alt="TOKO BUGATI" width={120} height={32} />
          </Link>
          <Link to="/login" className="text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium">Masuk</Link>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Kebijakan Privasi</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
          <p>
            Kebijakan privasi ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi pribadi Anda saat menggunakan aplikasi TOKO BUGATI POS.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">1. Informasi yang Kami Kumpulkan</h2>
          <p>
            Kami mengumpulkan informasi yang Anda berikan secara langsung saat mendaftar dan menggunakan layanan kami, termasuk:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Nama lengkap dan informasi kontak</li>
            <li>Data username dan password akun</li>
            <li>Data transaksi penjualan dan pembelian</li>
            <li>Informasi produk dan stok yang Anda kelola</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">2. Penggunaan Informasi</h2>
          <p>Informasi yang kami kumpulkan digunakan untuk:</p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Menyediakan dan memelihara layanan POS</li>
            <li>Memproses transaksi dan mengelola data toko</li>
            <li>Mengirim notifikasi terkait pembaruan layanan</li>
            <li>Meningkatkan kualitas dan keamanan layanan</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">3. Perlindungan Data</h2>
          <p>
            Kami menerapkan langkah-langkah keamanan teknis dan organisasi yang sesuai untuk melindungi data pribadi Anda dari akses tidak sah, perubahan, pengungkapan, atau penghancuran. Data transaksi Anda dienkripsi dan disimpan secara aman.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">4. Pembagian Data</h2>
          <p>
            Kami tidak menjual, menukar, atau mentransfer informasi pribadi Anda kepada pihak ketiga tanpa persetujuan Anda, kecuali diwajibkan oleh hukum.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">5. Hak Anda</h2>
          <p>
            Anda berhak untuk mengakses, memperbarui, atau menghapus data pribadi Anda setiap saat melalui pengaturan akun. Jika Anda memiliki pertanyaan lebih lanjut, silakan hubungi tim dukungan kami.
          </p>

          <div className="border-t border-gray-200 dark:border-gray-800 pt-6 mt-8">
            <p className="text-sm text-gray-400">Terakhir diperbarui: 1 Januari 2026</p>
          </div>
        </div>
      </div>

      <footer className="border-t border-gray-100 dark:border-gray-800 py-6">
        <div className="max-w-3xl mx-auto px-4 text-center text-sm text-gray-400">
          © 2026 TOKO BUGATI. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
