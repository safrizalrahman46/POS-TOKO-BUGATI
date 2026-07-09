import { useState, useEffect, useCallback } from 'react';
import { voucherService } from '../../services/voucherService';
import type { Voucher } from '../../types/voucher';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

const defaultForm = {
  code: '', type: 'percent' as 'percent' | 'fixed', value: 0, min_purchase: 0,
  max_discount: null as number | null, valid_from: '', valid_until: '',
  usage_limit: 0, is_active: true,
};

export default function VoucherPage() {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Voucher | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try { setLoading(true); const res = await voucherService.getVouchers(1, 100); if (res.success) setVouchers(res.data || []); }
    catch { toast.error('Gagal memuat voucher'); } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => { setEditItem(null); setForm(defaultForm); setModalOpen(true); };
  const openEdit = (v: Voucher) => {
    setEditItem(v);
    setForm({
      code: v.code, type: v.type, value: v.value, min_purchase: v.min_purchase,
      max_discount: v.max_discount, valid_from: v.valid_from?.split('T')[0] || '',
      valid_until: v.valid_until?.split('T')[0] || '', usage_limit: v.usage_limit, is_active: v.is_active,
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.code.trim() || form.value <= 0) { toast.error('Kode dan nilai voucher harus diisi'); return; }
    try {
      setSaving(true);
      if (editItem) { await voucherService.updateVoucher(editItem.id, form); toast.success('Voucher berhasil diperbarui'); }
      else { await voucherService.createVoucher(form); toast.success('Voucher berhasil ditambahkan'); }
      setModalOpen(false); load();
    } catch { toast.error('Gagal menyimpan voucher'); } finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try { await voucherService.deleteVoucher(deleteId); toast.success('Voucher berhasil dihapus'); setDeleteId(null); load(); }
    catch { toast.error('Gagal menghapus voucher'); }
  };

  const formatDate = (d: string) => d ? new Date(d).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' }) : '-';

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#540F00]">Voucher</h1>
        <button onClick={openAdd} className="btn-primary">+ Tambah Voucher</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#FFFDF2] rounded-2xl border border-[#F2D98D] p-5 animate-pulse">
              <div className="h-5 bg-[#FFE7A3] rounded w-1/2 mb-3" />
              <div className="h-4 bg-[#FFE7A3] rounded w-full mb-2" />
              <div className="h-4 bg-[#FFE7A3] rounded w-2/3" />
            </div>
          ))}
        </div>
      ) : vouchers.length === 0 ? (
        <div className="text-center py-12 text-[#7A6548]">Belum ada voucher. Tambahkan voucher pertama.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vouchers.map(v => {
            const expired = v.valid_until && new Date(v.valid_until) < new Date();
            return (
              <div key={v.id} className="bg-[#FFFDF2] rounded-2xl border border-[#F2D98D] p-5 hover:shadow-[0_8px_24px_-6px_rgba(84,15,0,0.1)] transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-lg text-[#540F00]">{v.code}</span>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                      v.is_active && !expired ? 'bg-[#F6FEF9] text-[#6E9235]' : 'bg-[#FFF0F0] text-[#E85050]'
                    }`}>{v.is_active && !expired ? 'Aktif' : 'Nonaktif'}</span>
                  </div>
                </div>
                <div className="space-y-1.5 text-sm mb-4">
                  <div className="flex justify-between"><span className="text-[#7A6548]">Nilai</span><span className="font-semibold text-[#540F00]">{v.type === 'percent' ? `${v.value}%` : `Rp ${v.value.toLocaleString()}`}</span></div>
                  <div className="flex justify-between"><span className="text-[#7A6548]">Min. Belanja</span><span className="font-semibold text-[#540F00]">Rp {v.min_purchase.toLocaleString()}</span></div>
                  <div className="flex justify-between"><span className="text-[#7A6548]">Maks. Diskon</span><span className="font-semibold text-[#540F00]">{v.max_discount ? `Rp ${v.max_discount.toLocaleString()}` : 'Tak terbatas'}</span></div>
                  <div className="flex justify-between"><span className="text-[#7A6548]">Pemakaian</span><span className="font-semibold text-[#540F00]">{v.used_count} / {v.usage_limit || '∞'}</span></div>
                  <div className="flex justify-between"><span className="text-[#7A6548]">Periode</span><span className="font-semibold text-[#540F00] text-xs">{formatDate(v.valid_from)} - {formatDate(v.valid_until)}</span></div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#F2D98D]">
                  <button onClick={() => openEdit(v)} className="btn-edit">Edit</button>
                  <button onClick={() => setDeleteId(v.id)} className="btn-delete">Hapus</button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <AppModal open={modalOpen} onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Voucher' : 'Tambah Voucher'} size="lg"
        footer={<>
          <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan'}</button>
        </>}>
        <div className="space-y-4">
          <div><label className="input-label">Kode Voucher <span className="text-[#E85050]">*</span></label>
            <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="input-field uppercase" placeholder="CONTOH50" /></div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="input-label">Tipe</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })} className="select-field">
                <option value="percent">Persen (%)</option>
                <option value="fixed">Nominal (Rp)</option>
              </select></div>
            <div><label className="input-label">Nilai <span className="text-[#E85050]">*</span></label>
              <input type="number" value={form.value} onChange={e => setForm({ ...form, value: Number(e.target.value) })} className="input-field" min={0} /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="input-label">Min. Belanja</label>
              <input type="number" value={form.min_purchase} onChange={e => setForm({ ...form, min_purchase: Number(e.target.value) })} className="input-field" min={0} /></div>
            <div><label className="input-label">Maks. Diskon</label>
              <input type="number" value={form.max_discount ?? ''} onChange={e => setForm({ ...form, max_discount: e.target.value ? Number(e.target.value) : null })} className="input-field" min={0} placeholder="Kosongkan = tak terbatas" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="input-label">Berlaku Dari</label>
              <input type="date" value={form.valid_from} onChange={e => setForm({ ...form, valid_from: e.target.value })} className="input-field" /></div>
            <div><label className="input-label">Berlaku Sampai</label>
              <input type="date" value={form.valid_until} onChange={e => setForm({ ...form, valid_until: e.target.value })} className="input-field" /></div>
          </div>
          <div><label className="input-label">Batas Pemakaian (0 = tak terbatas)</label>
            <input type="number" value={form.usage_limit} onChange={e => setForm({ ...form, usage_limit: Number(e.target.value) })} className="input-field" min={0} /></div>
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-[#540F00]">Status Aktif</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={form.is_active} onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <div className="toggle-track" /><div className="toggle-thumb" />
            </label>
          </div>
        </div>
      </AppModal>

      <ConfirmDialog open={deleteId !== null} onClose={() => setDeleteId(null)} onConfirm={handleDelete}
        title="Hapus Voucher" message="Apakah Anda yakin ingin menghapus voucher ini?"
        confirmLabel="Ya, Hapus" variant="danger" />
    </div>
  );
}
