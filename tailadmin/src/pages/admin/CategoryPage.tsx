import { useState, useEffect, useCallback } from 'react';
import { productService } from '../../services/productService';
import type { Category } from '../../types/product';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function CategoryPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Category | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState({ name: '', description: '' });
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productService.getCategories(1, 100);
      if (res.success) setCategories(res.data || []);
    } catch {
      toast.error('Gagal memuat kategori');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openAdd = () => {
    setEditItem(null);
    setForm({ name: '', description: '' });
    setModalOpen(true);
  };

  const openEdit = (c: Category) => {
    setEditItem(c);
    setForm({ name: c.name, description: c.description });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('Nama kategori harus diisi');
      return;
    }
    try {
      setSaving(true);
      if (editItem) {
        await productService.updateCategory(editItem.id, form);
        toast.success('Kategori berhasil diperbarui');
      } else {
        await productService.createCategory(form);
        toast.success('Kategori berhasil ditambahkan');
      }
      setModalOpen(false);
      load();
    } catch {
      toast.error('Gagal menyimpan kategori');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await productService.deleteCategory(deleteId);
      toast.success('Kategori berhasil dihapus');
      setDeleteId(null);
      load();
    } catch {
      toast.error('Gagal menghapus kategori');
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#540F00]">Kategori</h1>
        <button onClick={openAdd} className="btn-primary">+ Tambah Kategori</button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[#FFFDF2] rounded-2xl border border-[#F2D98D] p-5 animate-pulse">
              <div className="h-5 bg-[#FFE7A3] rounded w-2/3 mb-3" />
              <div className="h-4 bg-[#FFE7A3] rounded w-full mb-4" />
              <div className="h-4 bg-[#FFE7A3] rounded w-1/3" />
            </div>
          ))}
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-12 text-[#7A6548]">Belum ada kategori. Tambahkan kategori pertama Anda.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories.map(c => (
            <div key={c.id} className="bg-[#FFFDF2] rounded-2xl border border-[#F2D98D] p-5 hover:shadow-[0_8px_24px_-6px_rgba(84,15,0,0.1)] transition-shadow">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-[#540F00]">{c.name}</h3>
                <span className="text-xs text-[#7A6548]">ID: {c.id}</span>
              </div>
              <p className="text-sm text-[#7A6548] mb-4 line-clamp-2">{c.description || 'Tidak ada deskripsi'}</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#7A6548]">{new Date(c.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</span>
                <div className="flex gap-2">
                  <button onClick={() => openEdit(c)} className="btn-edit">Edit</button>
                  <button onClick={() => setDeleteId(c.id)} className="btn-delete">Hapus</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Kategori' : 'Tambah Kategori'}
        size="md"
        footer={(
          <>
            <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
            <button onClick={handleSave} disabled={saving} className="btn-primary">{saving ? 'Menyimpan...' : 'Simpan'}</button>
          </>
        )}
      >
        <div className="space-y-4">
          <div>
            <label className="input-label">Nama Kategori <span className="text-[#E85050]">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="input-label">Deskripsi</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="input-field resize-none" />
          </div>
        </div>
      </AppModal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Kategori"
        message="Apakah Anda yakin ingin menghapus kategori ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
