import { Link } from 'react-router';

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8">Syarat & Ketentuan</h1>

        <div className="prose prose-gray dark:prose-invert max-w-none space-y-6 text-gray-600 dark:text-gray-400">
          <p>
            Dengan menggunakan aplikasi TOKO BUGATI POS, Anda menyetujui syarat dan ketentuan berikut. Harap baca dengan saksama sebelum menggunakan layanan kami.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">1. Pendaftaran Akun</h2>
          <p>
            Anda bertanggung jawab untuk menjaga kerahasiaan kredensial akun Anda. Setiap aktivitas yang dilakukan melalui akun Anda sepenuhnya menjadi tanggung jawab Anda. Anda harus memberikan informasi yang akurat dan terkini saat mendaftar.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">2. Penggunaan Layanan</h2>
          <p>
            Layanan ini disediakan untuk mengelola operasional toko, termasuk transaksi penjualan, manajemen stok, dan pelaporan. Anda setuju untuk:
          </p>
          <ul className="list-disc pl-6 space-y-2">
            <li>Tidak menggunakan layanan untuk kegiatan ilegal atau tidak sah</li>
            <li>Tidak menyalahgunakan fitur yang tersedia</li>
            <li>Tidak mencoba mengakses data pengguna lain tanpa izin</li>
            <li>Tidak melakukan aktivitas yang dapat merusak atau mengganggu sistem</li>
          </ul>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">3. Data Transaksi</h2>
          <p>
            Semua data transaksi yang diproses melalui sistem kami adalah milik Anda. Kami hanya menyimpan dan memproses data tersebut untuk keperluan operasional layanan. Anda bertanggung jawab atas keakuratan data yang dimasukkan.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">4. Pembatasan Tanggung Jawab</h2>
          <p>
            Kami tidak bertanggung jawab atas kerugian langsung atau tidak langsung yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan ini. Kami juga tidak bertanggung jawab atas kehilangan data akibat kelalaian pengguna atau force majeure.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">5. Pembaruan Layanan</h2>
          <p>
            Kami berhak untuk memperbarui, mengubah, atau menghentikan layanan kapan saja tanpa pemberitahuan sebelumnya. Perubahan pada syarat dan ketentuan akan diinformasikan melalui aplikasi atau email.
          </p>

          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mt-8">6. Penghentian Akun</h2>
          <p>
            Kami berhak menangguhkan atau menghentikan akses Anda ke layanan jika melanggar syarat dan ketentuan ini. Anda dapat menghentikan penggunaan layanan kapan saja dengan menghubungi tim dukungan.
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
