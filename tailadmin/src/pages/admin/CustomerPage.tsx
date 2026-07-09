import { useState, useEffect, useCallback } from 'react';
import { customerService } from '../../services/customerService';
import type { Customer, CustomerInput } from '../../types/customer';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const defaultForm: CustomerInput = { name: '', phone: '', email: '', address: '', notes: '', is_active: true };

export default function CustomerPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Customer | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [detailItem, setDetailItem] = useState<Customer | null>(null);

  const [form, setForm] = useState<CustomerInput>(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await customerService.getCustomers(page, limit, search);
      if (res.success) { setCustomers(res.data || []); setTotal(res.total || 0); }
    } catch { toast.error('Gagal memuat pelanggan');
    } finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (c: Customer) => {
    setEditItem(c);
    setForm({ name: c.name, phone: c.phone, email: c.email, address: c.address, notes: c.notes, is_active: c.is_active });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nama pelanggan harus diisi'); return; }
    try {
      setSaving(true);
      if (editItem) { await customerService.updateCustomer(editItem.id, form); toast.success('Pelanggan berhasil diperbarui'); }
      else { await customerService.createCustomer(form); toast.success('Pelanggan berhasil ditambahkan'); }
      setModalOpen(false); load();
    } catch { toast.error('Gagal menyimpan pelanggan');
    } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await customerService.deleteCustomer(deleteId); toast.success('Pelanggan berhasil dihapus'); setDeleteId(null); load(); }
    catch { toast.error('Gagal menghapus pelanggan'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#540F00]">Pelanggan</h1>
          <p className="text-sm text-[#7A6548] mt-1">Kelola data pelanggan toko</p>
        </div>
        <button onClick={openAdd} className="btn-primary">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>
          + Tambah Pelanggan
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7A6548]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Cari nama / no telepon..." value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="input-field pl-10" />
        </div>
      </div>

      <div className="table-wrap">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th>Pelanggan</th>
                <th>No. Telepon</th>
                <th>Email</th>
                <th className="text-center">Poin</th>
                <th className="text-right">Total Transaksi</th>
                <th className="text-center">Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#7A6548]">Memuat...</td></tr>
              ) : customers.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-12 text-center text-[#7A6548]">
                  <div className="flex flex-col items-center gap-2">
                    <svg className="w-12 h-12 text-[#B8A88A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                    <span>Tidak ada pelanggan</span>
                  </div>
                </td></tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#FFE7A3] to-[#F2D98D] flex items-center justify-center flex-shrink-0">
                          <span className="text-sm font-bold text-[#FF9800]">{c.name.charAt(0)}</span>
                        </div>
                        <div>
                          <div className="font-semibold text-[#540F00]">{c.name}</div>
                          {c.address && <div className="text-xs text-[#7A6548] truncate max-w-[180px]">{c.address}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="font-mono text-[#7A6548]">{c.phone || '-'}</td>
                    <td className="text-[#7A6548]">{c.email || '-'}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1 text-sm font-semibold text-[#FF9800]">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" /></svg>
                        {c.poin}
                      </span>
                    </td>
                    <td className="text-right font-semibold">{c.total_transactions}x</td>
                    <td className="text-center">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                        c.is_active ? 'bg-[#F6FEF9] text-[#6E9235]' : 'bg-[#FFF0F0] text-[#E85050]'
                      }`}>{c.is_active ? 'Aktif' : 'Nonaktif'}</span>
                    </td>
                    <td className="text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={() => setDetailItem(c)} className="btn-edit">Detail</button>
                        <button onClick={() => openEdit(c)} className="btn-edit">Edit</button>
                        <button onClick={() => setDeleteId(c.id)} className="btn-delete">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="table-pagination">
            <span className="text-sm text-[#7A6548]">Halaman {page} dari {totalPages} ({total} data)</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-sm border border-[#F2D98D] rounded-lg disabled:opacity-40 text-[#540F00] hover:bg-[#FFF8C8] transition-colors">Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, page - 2);
                const pn = start + i;
                if (pn > totalPages) return null;
                return (
                  <button key={pn} onClick={() => setPage(pn)}
                    className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                      pn === page ? 'bg-[#FF9800] text-white border-[#FF9800]' : 'border-[#F2D98D] text-[#540F00] hover:bg-[#FFF8C8]'
                    }`}>{pn}</button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-sm border border-[#F2D98D] rounded-lg disabled:opacity-40 text-[#540F00] hover:bg-[#FFF8C8] transition-colors">Next</button>
            </div>
          </div>
        )}
      </div>

      <AppModal open={detailItem !== null} onClose={() => setDetailItem(null)} title="Detail Pelanggan" size="md"
        footer={<button onClick={() => setDetailItem(null)} className="btn-secondary">Tutup</button>}>
        {detailItem && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-[#F2D98D]">
              <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFE7A3] to-[#F2D98D] flex items-center justify-center">
                <span className="text-2xl font-bold text-[#FF9800]">{detailItem.name.charAt(0)}</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#540F00]">{detailItem.name}</h3>
                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold mt-1 ${
                  detailItem.is_active ? 'bg-[#F6FEF9] text-[#6E9235]' : 'bg-[#FFF0F0] text-[#E85050]'
                }`}>{detailItem.is_active ? 'Aktif' : 'Nonaktif'}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><p className="text-[#7A6548] text-xs font-semibold uppercase tracking-wider">No. Telepon</p><p className="font-medium text-[#540F00] mt-0.5">{detailItem.phone || '-'}</p></div>
              <div><p className="text-[#7A6548] text-xs font-semibold uppercase tracking-wider">Email</p><p className="font-medium text-[#540F00] mt-0.5">{detailItem.email || '-'}</p></div>
              <div className="col-span-2"><p className="text-[#7A6548] text-xs font-semibold uppercase tracking-wider">Alamat</p><p className="font-medium text-[#540F00] mt-0.5">{detailItem.address || '-'}</p></div>
              <div><p className="text-[#7A6548] text-xs font-semibold uppercase tracking-wider">Poin</p><p className="font-bold text-[#FF9800] mt-0.5 text-lg">{detailItem.poin}</p></div>
              <div><p className="text-[#7A6548] text-xs font-semibold uppercase tracking-wider">Total Transaksi</p><p className="font-bold text-[#540F00] mt-0.5 text-lg">{detailItem.total_transactions}x</p></div>
              <div className="col-span-2"><p className="text-[#7A6548] text-xs font-semibold uppercase tracking-wider">Total Belanja</p><p className="font-bold text-[#540F00] mt-0.5 text-lg">Rp {detailItem.total_spent.toLocaleString()}</p></div>
              {detailItem.notes && <div className="col-span-2"><p className="text-[#7A6548] text-xs font-semibold uppercase tracking-wider">Catatan</p><p className="text-[#7A6548] mt-0.5">{detailItem.notes}</p></div>}
              <div className="col-span-2"><p className="text-[#7A6548] text-xs font-semibold uppercase tracking-wider">Bergabung</p><p className="text-[#7A6548] mt-0.5">{new Date(detailItem.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p></div>
            </div>
          </div>
        )}
      </AppModal>

      <AppModal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Pelanggan' : 'Tambah Pelanggan'} size="lg"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>}>
        <div className="space-y-4">
          <div><label className="input-label">Nama Pelanggan <span className="text-[#E85050]">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="Nama lengkap" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="input-label">No. Telepon</label>
              <input type="text" value={form.phone || ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="08xxx" /></div>
            <div><label className="input-label">Email</label>
              <input type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="email@example.com" /></div>
          </div>
          <div><label className="input-label">Alamat</label>
            <textarea value={form.address || ''} onChange={e => setForm({ ...form, address: e.target.value })} className="input-field resize-none" rows={2} placeholder="Alamat lengkap" /></div>
          <div><label className="input-label">Catatan</label>
            <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} className="input-field resize-none" rows={2} placeholder="Catatan khusus (opsional)" /></div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[#540F00]">Status Aktif</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={form.is_active ?? true} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Pelanggan" message="Apakah Anda yakin ingin menghapus pelanggan ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus" variant="danger" />
    </div>
  );
}
