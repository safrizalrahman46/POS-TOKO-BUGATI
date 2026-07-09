import { useState, useEffect, useRef } from 'react';
import { storeService } from '../../services/storeService';
import type { StoreSettings, StoreSettingsInput } from '../../types/store';
import { getImageUrl } from '../../services/api';
import toast from 'react-hot-toast';

function formatPrice(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID');
}

export default function StoreSettingsPage() {
  const [_settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'store' | 'receipt'>('store');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [footerImageFile, setFooterImageFile] = useState<File | null>(null);
  const [footerImagePreview, setFooterImagePreview] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [form, setForm] = useState<StoreSettingsInput>({
    store_name: 'TOKO BUGATI',
    store_address: '',
    store_phone: '',
    store_email: '',
    store_website: '',
    receipt_header: 'Terima kasih atas kunjungan Anda',
    receipt_footer: 'Barang yang sudah dibeli tidak dapat ditukar/kembali',
    receipt_show_logo: true,
    receipt_show_customer: true,
    receipt_size: '80mm',
    receipt_footer_type: 'text',
    receipt_footer_image: '',
    logo: '',
    tax_label: 'PPN 11%',
    tax_rate: 11,
    currency: 'Rp',
  });

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await storeService.getSettings();
        if (res.success && res.data) {
          setSettings(res.data);
          setForm({
            store_name: res.data.store_name,
            store_address: res.data.store_address || '',
            store_phone: res.data.store_phone || '',
            store_email: res.data.store_email || '',
            store_website: res.data.store_website || '',
            receipt_header: res.data.receipt_header || 'Terima kasih atas kunjungan Anda',
            receipt_footer: res.data.receipt_footer || 'Barang yang sudah dibeli tidak dapat ditukar/kembali',
            receipt_show_logo: res.data.receipt_show_logo ?? true,
            receipt_show_customer: res.data.receipt_show_customer ?? true,
            receipt_size: res.data.receipt_size || '80mm',
            receipt_footer_type: res.data.receipt_footer_type || 'text',
            receipt_footer_image: res.data.receipt_footer_image || '',
            logo: res.data.logo || '',
            tax_label: res.data.tax_label || 'PPN 11%',
            tax_rate: res.data.tax_rate ?? 11,
            currency: res.data.currency || 'Rp',
          });
        } else {
          const defaults = await storeService.getDefaultSettings();
          setSettings(defaults);
        }
      } catch {
        const defaults = await storeService.getDefaultSettings();
        setSettings(defaults);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSave = async () => {
    if (!form.store_name.trim()) {
      toast.error('Nama toko harus diisi');
      return;
    }
    try {
      setSaving(true);
      if (logoFile) {
        const logoRes = await storeService.uploadLogo(logoFile);
        if (logoRes.success) {
          setForm(f => ({ ...f, logo: logoRes.data.logo }));
        }
        setLogoFile(null);
        setLogoPreview(null);
      }
      if (footerImageFile) {
        const fd = new FormData();
        fd.append('footer_image', footerImageFile);
        const imgRes = await import('../../services/api').then(m =>
          m.default.post('/store/settings/footer-image', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        );
        if (imgRes.data.success && imgRes.data.data?.footer_image) {
          setForm(f => ({ ...f, receipt_footer_image: imgRes.data.data.footer_image }));
        }
        setFooterImageFile(null);
        setFooterImagePreview(null);
      }
      const res = await storeService.updateSettings(form);
      if (res.success) {
        toast.success('Pengaturan berhasil disimpan');
      } else {
        toast.error(res.message || 'Gagal menyimpan');
      }
    } catch {
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setSaving(false);
    }
  };

  const handlePrintPreview = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !printRef.current) return;
    const is58mm = form.receipt_size === '58mm';
    printWindow.document.write(`
      <html><head><title>Preview Nota</title>
      <style>
        @page { width: ${is58mm ? '58mm' : '80mm'}; margin: 0; }
        body { font-family: 'Courier New', monospace; font-size: ${is58mm ? '10px' : '12px'}; width: ${is58mm ? '58mm' : '80mm'}; padding: ${is58mm ? '5px' : '10px'}; margin: 0; }
        .header { text-align: center; margin-bottom: 10px; }
        .header h2 { margin: 0; font-size: ${is58mm ? '14px' : '16px'}; }
        .header p { margin: 2px 0; font-size: ${is58mm ? '9px' : '11px'}; }
        .divider { border-top: 1px dashed #000; margin: 8px 0; }
        .item { font-size: ${is58mm ? '9px' : '11px'}; }
        .footer { text-align: center; margin-top: 10px; font-size: ${is58mm ? '8px' : '10px'}; }
        @media print { body { margin: 0; padding: ${is58mm ? '3mm' : '5mm'}; } }
      </style></head><body>
      ${printRef.current.innerHTML}
      </body></html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  const tabs = [
    { id: 'store' as const, label: 'Data Toko', icon: '🏪' },
    { id: 'receipt' as const, label: 'Nota / Struk', icon: '🧾' },
  ];

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pengaturan Toko</h1>
          <p className="text-sm text-gray-500 mt-1">Kelola informasi toko dan kustomisasi nota</p>
        </div>
        <button onClick={handleSave} disabled={saving}
          className="px-5 py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white rounded-xl text-sm font-semibold transition-all shadow-sm flex items-center gap-2">
          {saving ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
              Menyimpan...
            </span>
          ) : 'Simpan Pengaturan'}
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white shadow-md shadow-brand-200 dark:shadow-brand-900/30'
                : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}>
            <span className="flex items-center gap-2">
              <span>{tab.icon}</span>
              {tab.label}
            </span>
          </button>
        ))}
      </div>

      {activeTab === 'store' && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Informasi Toko</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nama Toko <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.store_name} onChange={e => setForm({ ...form, store_name: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Alamat</label>
                <textarea value={form.store_address} onChange={e => setForm({ ...form, store_address: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">No. Telepon</label>
                  <input type="text" value={form.store_phone} onChange={e => setForm({ ...form, store_phone: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                  <input type="email" value={form.store_email} onChange={e => setForm({ ...form, store_email: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Website</label>
                <input type="text" value={form.store_website} onChange={e => setForm({ ...form, store_website: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" placeholder="https://" />
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Logo Toko</label>
                <div className="flex items-start gap-4">
                  <div className="w-24 h-24 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                    ) : form.logo ? (
                      <img src={getImageUrl(form.logo)} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    )}
                  </div>
                  <div>
                    <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                      Pilih Logo
                      <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                        onChange={e => {
                          const file = e.target.files?.[0];
                          if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)); }
                        }} />
                    </label>
                    <p className="text-xs text-gray-400 mt-1.5">Format: PNG, JPG, WebP. Disarankan rasio persegi</p>
                    {(logoPreview || form.logo) && (
                      <button onClick={() => { setLogoFile(null); setLogoPreview(null); setForm(f => ({ ...f, logo: '' })); }}
                        className="text-xs text-red-500 hover:text-red-700 mt-1 font-medium">Hapus logo</button>
                    )}
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Label Pajak</label>
                  <input type="text" value={form.tax_label} onChange={e => setForm({ ...form, tax_label: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tarif Pajak (%)</label>
                  <input type="number" value={form.tax_rate} onChange={e => setForm({ ...form, tax_rate: Number(e.target.value) })}
                    className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" min={0} max={100} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Simbol Mata Uang</label>
                <input type="text" value={form.currency} onChange={e => setForm({ ...form, currency: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" maxLength={5} />
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'receipt' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Kustomisasi Nota</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Ukuran Nota</label>
                <select value={form.receipt_size} onChange={e => setForm({ ...form, receipt_size: e.target.value as '80mm' | '58mm' })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="80mm">80 mm (standar)</option>
                  <option value="58mm">58 mm (mini)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teks Header Nota</label>
                <textarea value={form.receipt_header} onChange={e => setForm({ ...form, receipt_header: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none" rows={2}
                  placeholder="Terima kasih atas kunjungan Anda" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Teks Footer Nota</label>
                <textarea value={form.receipt_footer} onChange={e => setForm({ ...form, receipt_footer: e.target.value })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none resize-none" rows={2}
                  placeholder="Barang yang sudah dibeli tidak dapat ditukar/kembali" />
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan Logo di Nota</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.receipt_show_logo} onChange={e => setForm({ ...form, receipt_show_logo: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-brand-500"></div>
                </label>
              </div>
              <div className="flex items-center gap-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Tampilkan Nama Pelanggan</label>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={form.receipt_show_customer} onChange={e => setForm({ ...form, receipt_show_customer: e.target.checked })} className="sr-only peer" />
                  <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-brand-300 dark:peer-focus:ring-brand-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all dark:border-gray-500 peer-checked:bg-brand-500"></div>
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tipe Footer</label>
                <select value={form.receipt_footer_type} onChange={e => setForm({ ...form, receipt_footer_type: e.target.value as 'text' | 'image' })}
                  className="w-full px-3 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="text">Teks</option>
                  <option value="image">Gambar</option>
                </select>
              </div>
              {form.receipt_footer_type === 'image' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gambar Footer Nota</label>
                  <div className="flex items-start gap-4">
                    <div className="w-28 h-20 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-center overflow-hidden flex-shrink-0">
                      {footerImagePreview ? (
                        <img src={footerImagePreview} alt="Footer" className="w-full h-full object-contain" />
                      ) : form.receipt_footer_image ? (
                        <img src={getImageUrl(form.receipt_footer_image)} alt="Footer" className="w-full h-full object-contain" />
                      ) : (
                        <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                        Pilih Gambar
                        <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                          onChange={e => {
                            const file = e.target.files?.[0];
                            if (file) { setFooterImageFile(file); setFooterImagePreview(URL.createObjectURL(file)); }
                          }} />
                      </label>
                      <p className="text-xs text-gray-400 mt-1.5">Format: PNG, JPG, WebP</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Pratinjau Nota</h2>
              <button onClick={handlePrintPreview}
                className="px-3 py-1.5 text-xs font-semibold bg-brand-50 text-brand-700 dark:bg-brand-900/30 dark:text-brand-300 rounded-lg hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-all flex items-center gap-1.5">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
                Print Preview
              </button>
            </div>
            <div ref={printRef} className={`bg-white mx-auto border-2 border-dashed border-gray-200 dark:border-gray-600 rounded-xl p-4 ${form.receipt_size === '58mm' ? 'max-w-[220px] text-[10px]' : 'max-w-[300px] text-xs'}`}>
              <div className="text-center mb-3">
                {form.receipt_show_logo && (
                  <div className="w-10 h-10 mx-auto mb-1.5 flex items-center justify-center">
                    {logoPreview ? (
                      <img src={logoPreview} alt="Logo" className="w-full h-full object-contain rounded-full" />
                    ) : form.logo ? (
                      <img src={getImageUrl(form.logo)} alt="Logo" className="w-10 h-10 object-contain" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-100 to-brand-200 flex items-center justify-center">
                        <span className="text-base font-bold text-brand-600">B</span>
                      </div>
                    )}
                  </div>
                )}
                <h2 className={`font-bold text-gray-900 ${form.receipt_size === '58mm' ? 'text-sm' : 'text-base'}`}>
                  {form.store_name || 'TOKO BUGATI'}
                </h2>
                {form.store_address && <p className="text-gray-500 leading-tight mt-0.5">{form.store_address}</p>}
                {form.store_phone && <p className="text-gray-500 leading-tight">Telp: {form.store_phone}</p>}
              </div>
              <div className="border-t-2 border-dashed border-gray-200 my-2" />
              <div className="text-gray-500 mb-2">
                <div className="flex justify-between"><span>No: INV-20260101-001</span><span>01/01/2026</span></div>
                <div>Kasir: Admin</div>
                {form.receipt_show_customer && <div>Customer: Budi</div>}
              </div>
              <div className="border-t-2 border-dashed border-gray-200 my-2" />
              <div className="space-y-1.5 mb-2">
                <div><div className="font-medium text-gray-800">Produk Contoh</div><div className="flex justify-between text-gray-500"><span>2 x {formatPrice(15000)}</span><span className="font-medium text-gray-700">{formatPrice(30000)}</span></div></div>
                <div><div className="font-medium text-gray-800">Produk Lain</div><div className="flex justify-between text-gray-500"><span>1 x {formatPrice(25000)}</span><span className="font-medium text-gray-700">{formatPrice(25000)}</span></div></div>
              </div>
              <div className="border-t-2 border-dashed border-gray-200 my-2" />
              <div className="space-y-1">
                <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">{formatPrice(55000)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">{form.tax_label}</span><span className="font-medium">{formatPrice(6050)}</span></div>
                <div className={`flex justify-between font-bold text-gray-900 border-t-2 border-gray-200 pt-1 mt-1 ${form.receipt_size === '58mm' ? 'text-sm' : 'text-base'}`}>
                  <span>TOTAL</span><span>{formatPrice(61050)}</span>
                </div>
              </div>
              <div className="border-t-2 border-dashed border-gray-200 my-3" />
              <div className="text-center text-gray-400 space-y-0.5">
                {form.receipt_header && <p className="font-medium text-gray-600">{form.receipt_header}</p>}
                {form.receipt_footer_type === 'text' && form.receipt_footer && <p>{form.receipt_footer}</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
