import { useState, useEffect, useMemo } from 'react';
import Chart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';
import { dashboardService } from '../../services/dashboardService';
import type { Order } from '../../types/order';
import toast from 'react-hot-toast';

interface ReportData {
  total_revenue: number;
  total_orders: number;
  average_order: number;
  orders: Order[];
}

const paymentMethods = [
  { value: '', label: 'Semua Metode' },
  { value: 'cash', label: 'Tunai' },
  { value: 'debit', label: 'Debit' },
  { value: 'qris', label: 'QRIS' },
];

export default function ReportPage() {
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [cashierId, setCashierId] = useState('');
  const [exporting, setExporting] = useState<'excel' | 'pdf' | null>(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await dashboardService.getReports({
        start_date: startDate,
        end_date: endDate,
        payment_method: paymentMethod,
        cashier_id: cashierId,
      });
      if (res.success) {
        setData(res.data);
      }
    } catch {
      toast.error('Gagal memuat laporan');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleExport = async (type: 'excel' | 'pdf') => {
    try {
      setExporting(type);
      const params = { start_date: startDate, end_date: endDate };
      const blob = type === 'excel'
        ? await dashboardService.exportExcel(params)
        : await dashboardService.exportPdf(params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `laporan-${startDate}-${endDate}.${type === 'excel' ? 'xlsx' : 'pdf'}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      toast.success(`Laporan berhasil di-export sebagai ${type.toUpperCase()}`);
    } catch {
      toast.error(`Gagal export ${type.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const dailySales = useMemo(() => {
    if (!data?.orders?.length) return { categories: [], series: [] };
    const daily: Record<string, number> = {};
    data.orders.forEach((o) => {
      const d = o.created_at?.split('T')[0];
      if (d) daily[d] = (daily[d] || 0) + (o.grand_total || 0);
    });
    const sorted = Object.entries(daily).sort(([a], [b]) => a.localeCompare(b));
    return {
      categories: sorted.map(([d]) => {
        const dt = new Date(d + 'T00:00:00');
        return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
      }),
      series: sorted.map(([, v]) => v),
    };
  }, [data]);

  const paymentDist = useMemo(() => {
    if (!data?.orders?.length) return [];
    const counts: Record<string, { label: string; count: number; total: number }> = {};
    data.orders.forEach((o) => {
      const m = o.payment_method || 'unknown';
      if (!counts[m]) counts[m] = { label: m === 'cash' ? 'Tunai' : m === 'debit' ? 'Debit' : 'QRIS', count: 0, total: 0 };
      counts[m].count++;
      counts[m].total += o.grand_total || 0;
    });
    return Object.values(counts);
  }, [data]);

  function formatPrice(n: number) {
    return 'Rp ' + n.toLocaleString('id-ID');
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      paid: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    const labels: Record<string, string> = {
      paid: 'Lunas',
      pending: 'Tertunda',
      cancelled: 'Dibatalkan',
    };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status] || ''}`}>
        {labels[status] || status}
      </span>
    );
  };

  const payMethodLabel: Record<string, string> = {
    cash: 'Tunai',
    debit: 'Debit',
    qris: 'QRIS',
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
        Laporan Penjualan
      </h1>

      <form
        onSubmit={handleFilter}
        className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Mulai
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tanggal Akhir
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Metode Pembayaran
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
            >
              {paymentMethods.map((m) => (
                <option key={m.value} value={m.value}>{m.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Kasir
            </label>
            <input
              type="text"
              value={cashierId}
              onChange={(e) => setCashierId(e.target.value)}
              placeholder="ID Kasir (opsional)"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors text-sm font-medium"
          >
            Terapkan Filter
          </button>
          <button
            type="button"
            onClick={() => handleExport('excel')}
            disabled={exporting !== null}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {exporting === 'excel' ? 'Mengexport...' : 'Export Excel'}
          </button>
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            disabled={exporting !== null}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors text-sm font-medium"
          >
            {exporting === 'pdf' ? 'Mengexport...' : 'Export PDF'}
          </button>
        </div>
      </form>

      {loading ? (
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl" />
        </div>
      ) : data ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Pendapatan</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                Rp {(data.total_revenue || 0).toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Transaksi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {data.total_orders || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400">Rata-rata Transaksi</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                Rp {(data.average_order || 0).toLocaleString()}
              </p>
            </div>
          </div>

          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Analisis Penjualan
          </h2>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Penjualan per Hari
              </h3>
              {dailySales.categories.length > 0 ? (
                <Chart
                  options={{
                    chart: { type: 'bar', foreColor: '#9ca3af', fontFamily: 'inherit', toolbar: { show: false } },
                    plotOptions: { bar: { borderRadius: 4, columnWidth: '60%' } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: dailySales.categories, labels: { style: { fontSize: '11px' } } },
                    yaxis: {
                      labels: { formatter: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v) },
                    },
                    tooltip: { y: { formatter: (v: number) => formatPrice(v) } },
                    colors: ['#6E9235'],
                    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
                  } as ApexOptions}
                  series={[{ name: 'Penjualan', data: dailySales.series }]}
                  type="bar"
                  height={260}
                />
              ) : (
                <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                  Belum ada data
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Metode Pembayaran
              </h3>
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
                    type="donut"
                    height={220}
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
                <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                  Belum ada data
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-5 shadow-sm">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-4 text-sm">
                Tren Penjualan
              </h3>
              {dailySales.categories.length > 0 ? (
                <Chart
                  options={{
                    chart: { type: 'line', foreColor: '#9ca3af', fontFamily: 'inherit', toolbar: { show: false } },
                    stroke: { curve: 'smooth', width: 3, colors: ['#FF9800'] },
                    fill: { type: 'gradient', gradient: { shadeIntensity: 1, opacityFrom: 0.4, opacityTo: 0.1, stops: [0, 100] } },
                    dataLabels: { enabled: false },
                    xaxis: { categories: dailySales.categories, labels: { style: { fontSize: '11px' } } },
                    yaxis: {
                      labels: { formatter: (v: number) => v >= 1000000 ? `${(v / 1000000).toFixed(1)}jt` : v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v) },
                    },
                    tooltip: { y: { formatter: (v: number) => formatPrice(v) } },
                    colors: ['#FF9800'],
                    grid: { borderColor: '#e5e7eb', strokeDashArray: 4 },
                  } as ApexOptions}
                  series={[{ name: 'Tren Penjualan', data: dailySales.series }]}
                  type="line"
                  height={260}
                />
              ) : (
                <div className="flex items-center justify-center h-[260px] text-gray-400 text-sm">
                  Belum ada data
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Invoice</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Kasir</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Pelanggan</th>
                    <th className="text-right px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Total</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Pembayaran</th>
                    <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                    <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Tanggal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {data.orders && data.orders.length > 0 ? (
                    data.orders.map((o) => (
                      <tr key={o.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-4 py-3 font-mono text-sm text-gray-900 dark:text-white">
                          {o.invoice_number}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {o.cashier?.full_name || `#${o.cashier_id}`}
                        </td>
                        <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                          {o.customer_name || '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900 dark:text-white">
                          Rp {o.grand_total.toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-center text-gray-600 dark:text-gray-400">
                          {payMethodLabel[o.payment_method] || o.payment_method}
                        </td>
                        <td className="px-4 py-3 text-center">
                          {statusBadge(o.status)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs whitespace-nowrap">
                          {new Date(o.created_at).toLocaleDateString('id-ID', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                        Tidak ada data penjualan
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="text-center py-12 text-gray-400">
          Terapkan filter untuk melihat laporan
        </div>
      )}
    </div>
  );
}
