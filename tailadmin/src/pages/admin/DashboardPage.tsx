import { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { dashboardService } from '../../services/dashboardService';
import { productService } from '../../services/productService';
import { orderService as orderSvc } from '../../services/orderService';
import type { Order } from '../../types/order';
import type { Product } from '../../types/product';
import toast from 'react-hot-toast';

function formatPrice(n: number) { return 'Rp ' + n.toLocaleString('id-ID'); }

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);
  const [dateRange, setDateRange] = useState(() => {
    const end = new Date();
    const start = new Date(); start.setDate(start.getDate() - 30);
    return { start: start.toISOString().split('T')[0], end: end.toISOString().split('T')[0] };
  });

  const loadData = async () => {
    try {
      const [statsRes, ordersRes, prodRes] = await Promise.all([
        dashboardService.getStats(),
        orderSvc.getOrders(1, 5),
        productService.getProducts(1, 100, '', ''),
      ]);
      if (statsRes.success) setStats(statsRes.data);
      if (ordersRes.success) setRecentOrders(ordersRes.data || []);
      if (prodRes.success) {
        setLowStockProducts((prodRes.data || []).filter((p: Product) => p.stock <= p.min_stock));
      }
    } catch { toast.error('Gagal memuat dashboard'); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const [reportData, setReportData] = useState<any>(null);
  useEffect(() => {
    (async () => {
      try {
        const res = await dashboardService.getReports({
          start_date: dateRange.start, end_date: dateRange.end,
        });
        if (res.success) setReportData(res.data);
      } catch {}
    })();
  }, [dateRange]);

  const chartData = useMemo(() => {
    if (!reportData?.orders) return { categories: [], series: [] };
    const daily: Record<string, number> = {};
    reportData.orders.forEach((o: Order) => {
      const d = o.created_at?.split('T')[0];
      if (d) daily[d] = (daily[d] || 0) + (o.grand_total || 0);
    });
    const sorted = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));
    return {
      categories: sorted.map(([d]) => { const dt = new Date(d + 'T00:00:00'); return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }); }),
      series: sorted.map(([, v]) => v),
    };
  }, [reportData]);

  const paymentDist = useMemo(() => {
    if (!reportData?.orders) return [];
    const counts: Record<string, { label: string; count: number; total: number }> = {};
    reportData.orders.forEach((o: Order) => {
      const m = o.payment_method || 'unknown';
      if (!counts[m]) counts[m] = { label: m === 'cash' ? 'Tunai' : m === 'debit' ? 'Debit' : 'QRIS', count: 0, total: 0 };
      counts[m].count++; counts[m].total += o.grand_total || 0;
    });
    return Object.values(counts);
  }, [reportData]);

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      setExporting(type);
      const params = { start_date: dateRange.start, end_date: dateRange.end };
      const blob = type === 'excel' ? await dashboardService.exportExcel(params) : await dashboardService.exportPdf(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a'); a.href = url;
      a.download = `laporan-${dateRange.start}-${dateRange.end}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Laporan berhasil di-export`);
    } catch { toast.error(`Gagal export ${type.toUpperCase()}`); }
    finally { setExporting(null); }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {[1,2,3].map(i => <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  const payMethodLabel: Record<string, string> = { cash: 'Tunai', debit: 'Debit', qris: 'QRIS' };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1">Overview penjualan dan aktivitas toko</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2">
            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))}
              className="text-sm border-none bg-transparent outline-none text-gray-700 dark:text-gray-300 w-32" />
            <span className="text-gray-400">-</span>
            <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))}
              className="text-sm border-none bg-transparent outline-none text-gray-700 dark:text-gray-300 w-32" />
          </div>
          <button onClick={() => handleExport('excel')} disabled={exporting !== null}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            {exporting === 'excel' ? '...' : 'Excel'}
          </button>
          <button onClick={() => handleExport('pdf')} disabled={exporting !== null}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-sm font-medium transition-all flex items-center gap-2 shadow-sm">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
            {exporting === 'pdf' ? '...' : 'PDF'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="💰" label="Pendapatan Hari Ini" value={formatPrice(stats?.today_revenue || 0)} color="from-emerald-500 to-green-600" />
        <StatCard icon="📋" label="Transaksi Hari Ini" value={`${stats?.today_orders || 0}`} color="from-brand-500 to-brand-600" />
        <StatCard icon="📦" label="Total Produk" value={`${stats?.total_products || 0}`} color="from-violet-500 to-purple-600" />
        <StatCard icon="⚠️" label="Stok Menipis" value={`${stats?.low_stock_products || 0}`} color="from-orange-500 to-red-600" />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">Penjualan {dateRange.start} s/d {dateRange.end}</h2>
            <span className="text-sm text-gray-500">Total: <strong className="text-gray-900 dark:text-white">{formatPrice(reportData?.total_revenue || 0)}</strong></span>
          </div>
          {chartData.categories.length > 0 ? (
            <Chart
              options={{
                chart: { type: 'area', zoom: { enabled: false }, toolbar: { show: false }, foreColor: '#9ca3af', fontFamily: 'inherit' },
                dataLabels: { enabled: false },
                stroke: { curve: 'smooth', width: 3, colors: ['#FF9800'] },
                fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 100] } },
                xaxis: { categories: chartData.categories, labels: { style: { fontSize: '11px' } } },
                yaxis: { labels: { formatter: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v) } },
                tooltip: { y: { formatter: (v: number) => formatPrice(v) } },
                grid: { borderColor: '#F2D98D', strokeDashArray: 4 },
                colors: ['#FF9800'],
              } as ApexOptions}
              series={[{ name: 'Penjualan', data: chartData.series }]}
              type="area" height={300}
            />
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">Belum ada data penjualan</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Metode Pembayaran</h2>
          {paymentDist.length > 0 ? (
            <>
              <Chart
                options={{
                  chart: { type: 'donut', foreColor: '#9ca3af', fontFamily: 'inherit' },
                  labels: paymentDist.map(p => p.label),
                  dataLabels: { enabled: false },
                  stroke: { show: false },
                  legend: { show: false },
                  colors: ['#6E9235', '#FF9800', '#D76301'],
                  plotOptions: { pie: { donut: { size: '65%' } } },
                  tooltip: { y: { formatter: (v: number) => formatPrice(v) } },
                } as ApexOptions}
                series={paymentDist.map(p => p.total)}
                type="donut" height={220}
              />
              <div className="space-y-2 mt-4">
                {paymentDist.map((p, i) => {
                  const colors = ['text-emerald-500', 'text-brand-500', 'text-brand-700'];
                  const bars = ['bg-emerald-500', 'bg-brand-500', 'bg-brand-700'];
                  const total = paymentDist.reduce((s, x) => s + x.total, 0);
                  const pct = total > 0 ? ((p.total / total) * 100).toFixed(1) : '0';
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`text-xs font-bold w-12 ${colors[i]}`}>{p.label}</span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${bars[i]} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-16 text-right">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-400">Belum ada data</div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">⚠️ Stok Menipis</h2>
            <span className="text-xs text-gray-400">{lowStockProducts.length} produk</span>
          </div>
          {lowStockProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 font-medium">Produk</th>
                    <th className="pb-3 font-medium">Stok</th>
                    <th className="pb-3 font-medium">Min</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {lowStockProducts.slice(0, 8).map(p => (
                    <tr key={p.id} className="text-gray-700 dark:text-gray-300">
                      <td className="py-2.5 font-medium text-gray-900 dark:text-white">{p.name}</td>
                      <td className="py-2.5">{p.stock}</td>
                      <td className="py-2.5">{p.min_stock}</td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          p.stock === 0 ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {p.stock === 0 ? 'Habis' : 'Menipis'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Semua stok aman ✅</div>
          )}
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900 dark:text-white">🕐 Transaksi Terbaru</h2>
            <a href="/admin/reports" className="text-xs text-brand-500 hover:text-brand-600 font-medium">Lihat semua →</a>
          </div>
          {recentOrders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 uppercase tracking-wider">
                    <th className="pb-3 font-medium">Invoice</th>
                    <th className="pb-3 font-medium">Total</th>
                    <th className="pb-3 font-medium">Bayar</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                  {recentOrders.map(o => (
                    <tr key={o.id} className="text-gray-700 dark:text-gray-300">
                      <td className="py-2.5 font-mono text-xs text-gray-900 dark:text-white">{o.invoice_number}</td>
                      <td className="py-2.5 font-medium">{formatPrice(o.grand_total)}</td>
                      <td className="py-2.5">
                        <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">{payMethodLabel[o.payment_method] || o.payment_method}</span>
                      </td>
                      <td className="py-2.5">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          o.status === 'paid' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                          o.status === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                          'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                        }`}>
                          {o.status === 'paid' ? 'Lunas' : o.status === 'cancelled' ? 'Batal' : 'Pending'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-400 text-sm">Belum ada transaksi</div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">{label}</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1.5">{value}</p>
        </div>
        <div className={`w-14 h-14 bg-gradient-to-br ${color} rounded-2xl flex items-center justify-center text-2xl shadow-lg`}>
          {icon}
        </div>
      </div>
    </div>
  );
}
