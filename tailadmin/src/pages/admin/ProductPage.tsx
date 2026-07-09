import { useState, useEffect, useCallback } from 'react';
import { productService } from '../../services/productService';
import type { Product, ProductInput, Category, ProductVariant, VariantInput } from '../../types/product';
import { getImageUrl } from '../../services/api';
import toast from 'react-hot-toast';
import AppModal from '../../components/common/AppModal';
import ConfirmDialog from '../../components/common/ConfirmDialog';

export default function ProductPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Product | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [variantModalOpen, setVariantModalOpen] = useState(false);
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [variants, setVariants] = useState<ProductVariant[]>([]);
  const [variantForm, setVariantForm] = useState<VariantInput>({ name: '', barcode: '', price: 0, stock: 0, min_stock: 0 });
  const [editVariantId, setEditVariantId] = useState<number | null>(null);
  const [savingVariant, setSavingVariant] = useState(false);

  const [form, setForm] = useState<ProductInput>({
    name: '',
    barcode: '',
    price: 0,
    cost_price: 0,
    stock: 0,
    min_stock: 0,
    category_id: 0,
    is_active: true,
    image: '',
  });
  const [saving, setSaving] = useState(false);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const loadProducts = useCallback(async () => {
    try {
      setLoading(true);
      const res = await productService.getProducts(page, limit, search, categoryFilter);
      if (res.success) {
        setProducts(res.data || []);
        setTotal(res.total || 0);
      }
    } catch {
      toast.error('Gagal memuat produk');
    } finally {
      setLoading(false);
    }
  }, [page, search, categoryFilter]);

  const loadCategories = async () => {
    try {
      const res = await productService.getCategories(1, 100);
      if (res.success) setCategories(res.data || []);
    } catch {}
  };

  useEffect(() => { loadCategories(); }, []);
  useEffect(() => { loadProducts(); }, [loadProducts]);

  const openAdd = () => {
    setEditItem(null);
    setForm({
      name: '', barcode: '', price: 0, cost_price: 0,
      stock: 0, min_stock: 0, category_id: categories[0]?.id || 0,
      is_active: true, image: '',
    });
    setImageFile(null); setImagePreview(null);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditItem(p);
    setForm({
      name: p.name, barcode: p.barcode, price: p.price,
      cost_price: p.cost_price, stock: p.stock, min_stock: p.min_stock,
      category_id: p.category_id, is_active: p.is_active, image: p.image,
    });
    setImageFile(null); setImagePreview(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.category_id || form.price <= 0) {
      toast.error('Nama, kategori, dan harga harus diisi');
      return;
    }
    try {
      setSaving(true);
      let productId: number;
      if (editItem) {
        await productService.updateProduct(editItem.id, form);
        productId = editItem.id;
        toast.success('Produk berhasil diperbarui');
      } else {
        const res = await productService.createProduct(form);
        productId = res.data?.id || 0;
        toast.success('Produk berhasil ditambahkan');
      }
      if (imageFile && productId) {
        const f = new FormData();
        f.append('image', imageFile);
        await import('../../services/api').then(m =>
          m.default.post(`/products/${productId}/upload`, f, { headers: { 'Content-Type': 'multipart/form-data' } })
        );
      }
      setModalOpen(false);
      loadProducts();
    } catch {
      toast.error('Gagal menyimpan produk');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await productService.deleteProduct(deleteId);
      toast.success('Produk berhasil dihapus');
      setDeleteId(null);
      loadProducts();
    } catch {
      toast.error('Gagal menghapus produk');
    }
  };

  const loadVariants = async (product: Product) => {
    try {
      const res = await productService.getVariants(product.id);
      if (res.success) setVariants(res.data || []);
    } catch {
      setVariants([]);
    }
  };

  const openVariantPanel = async (p: Product) => {
    setVariantProduct(p);
    setVariantForm({ name: '', barcode: '', price: p.price, stock: 0, min_stock: 0 });
    setEditVariantId(null);
    await loadVariants(p);
    setVariantModalOpen(true);
  };

  const openAddVariant = () => {
    if (!variantProduct) return;
    setEditVariantId(null);
    setVariantForm({ name: '', barcode: '', price: variantProduct.price, stock: 0, min_stock: 0 });
  };

  const openEditVariant = (v: ProductVariant) => {
    setEditVariantId(v.id);
    setVariantForm({ name: v.name, barcode: v.barcode, price: v.price, stock: v.stock, min_stock: v.min_stock });
  };

  const handleSaveVariant = async () => {
    if (!variantProduct) return;
    if (!variantForm.name || variantForm.price <= 0) {
      toast.error('Nama varian dan harga harus diisi');
      return;
    }
    try {
      setSavingVariant(true);
      if (editVariantId) {
        await productService.updateVariant(variantProduct.id, editVariantId, variantForm);
        toast.success('Varian berhasil diperbarui');
      } else {
        await productService.createVariant(variantProduct.id, variantForm);
        toast.success('Varian berhasil ditambahkan');
      }
      setVariantForm({ name: '', barcode: '', price: variantProduct?.price || 0, stock: 0, min_stock: 0 });
      setEditVariantId(null);
      await loadVariants(variantProduct);
      loadProducts();
    } catch {
      toast.error('Gagal menyimpan varian');
    } finally {
      setSavingVariant(false);
    }
  };

  const handleDeleteVariant = async (v: ProductVariant) => {
    if (!variantProduct) return;
    if (!confirm(`Hapus varian "${v.name}"?`)) return;
    try {
      await productService.deleteVariant(variantProduct.id, v.id);
      toast.success('Varian berhasil dihapus');
      await loadVariants(variantProduct);
      loadProducts();
    } catch {
      toast.error('Gagal menghapus varian');
    }
  };

  const totalPages = Math.ceil(total / limit);

  const formFooter = (
    <>
      <button onClick={() => setModalOpen(false)} className="btn-secondary">Batal</button>
      <button onClick={handleSave} disabled={saving} className="btn-primary">
        {saving ? 'Menyimpan...' : 'Simpan'}
      </button>
    </>
  );

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-[#540F00]">Produk</h1>
        <button onClick={openAdd} className="btn-primary">
          + Tambah Produk
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Cari produk..."
          value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="input-field flex-1"
        />
        <select
          value={categoryFilter}
          onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
          className="select-field"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      <div className="table-wrap">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="table-header">
              <tr>
                <th className="w-12">Gbr</th>
                <th>Nama</th>
                <th>Barcode</th>
                <th>Kategori</th>
                <th className="text-right">Harga</th>
                <th className="text-right">Stok</th>
                <th className="text-center">Varian</th>
                <th className="text-center">Status</th>
                <th className="text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="table-body">
              {loading ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#7A6548]">Memuat...</td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-4 py-12 text-center text-[#7A6548]">Tidak ada produk</td>
                </tr>
              ) : (
                products.map((p) => {
                  const isLowStock = p.stock <= p.min_stock;
                  return (
                    <tr key={p.id}>
                      <td>
                        {p.image ? (
                          <img src={getImageUrl(p.image)} alt={p.name} className="w-9 h-9 rounded-lg object-cover bg-[#FFF8C8]" />
                        ) : (
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#FFE7A3] to-[#F2D98D] flex items-center justify-center">
                            <span className="text-xs font-bold text-[#FF9800]">{p.name.charAt(0)}</span>
                          </div>
                        )}
                      </td>
                      <td className="font-semibold text-[#540F00]">{p.name}</td>
                      <td className="font-mono text-[#7A6548]">{p.barcode || '-'}</td>
                      <td className="text-[#7A6548]">{p.category?.name || '-'}</td>
                      <td className="text-right font-semibold">Rp {p.price.toLocaleString()}</td>
                      <td className={`text-right font-medium ${isLowStock ? 'text-[#E85050]' : ''}`}>
                        {p.stock}
                        {isLowStock && (
                          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#FFF0F0] text-[#E85050]">minim</span>
                        )}
                      </td>
                      <td className="text-center">
                        {p.has_variants ? (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#FFF8C8] text-[#D76301]">
                            {p.variants?.length || 0} varian
                          </span>
                        ) : (
                          <span className="text-[#B8A88A] text-xs">-</span>
                        )}
                      </td>
                      <td className="text-center">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          p.is_active ? 'bg-[#F6FEF9] text-[#6E9235]' : 'bg-[#FFF0F0] text-[#E85050]'
                        }`}>
                          {p.is_active ? 'Aktif' : 'Nonaktif'}
                        </span>
                      </td>
                      <td className="text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button onClick={() => openVariantPanel(p)} className="btn-edit">Varian</button>
                          <button onClick={() => openEdit(p)} className="btn-edit">Edit</button>
                          <button onClick={() => setDeleteId(p.id)} className="btn-delete">Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="table-pagination">
            <span className="text-sm text-[#7A6548]">Halaman {page} dari {totalPages} ({total} data)</span>
            <div className="flex gap-1">
              <button
                disabled={page <= 1}
                onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1.5 text-sm border border-[#F2D98D] rounded-lg disabled:opacity-40 text-[#540F00] hover:bg-[#FFF8C8] transition-colors"
              >Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, page - 2);
                const pn = start + i;
                if (pn > totalPages) return null;
                return (
                  <button key={pn} onClick={() => setPage(pn)}
                    className={`px-3 py-1.5 text-sm border rounded-lg transition-colors ${
                      pn === page
                        ? 'bg-[#FF9800] text-white border-[#FF9800]'
                        : 'border-[#F2D98D] text-[#540F00] hover:bg-[#FFF8C8]'
                    }`}>
                    {pn}
                  </button>
                );
              })}
              <button
                disabled={page >= totalPages}
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 text-sm border border-[#F2D98D] rounded-lg disabled:opacity-40 text-[#540F00] hover:bg-[#FFF8C8] transition-colors"
              >Next</button>
            </div>
          </div>
        )}
      </div>

      <AppModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editItem ? 'Edit Produk' : 'Tambah Produk'}
        size="lg"
        footer={formFooter}
      >
        <div className="space-y-4">
          <div>
            <label className="input-label">Nama Produk <span className="text-[#E85050]">*</span></label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="input-label">Barcode</label>
            <input type="text" value={form.barcode || ''} onChange={e => setForm({ ...form, barcode: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="input-label">Kategori <span className="text-[#E85050]">*</span></label>
            <select value={form.category_id} onChange={e => setForm({ ...form, category_id: Number(e.target.value) })} className="select-field">
              <option value={0}>Pilih kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Harga Jual <span className="text-[#E85050]">*</span></label>
              <input type="number" value={form.price} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="input-field" min={0} />
            </div>
            <div>
              <label className="input-label">Harga Modal</label>
              <input type="number" value={form.cost_price || 0} onChange={e => setForm({ ...form, cost_price: Number(e.target.value) })} className="input-field" min={0} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="input-label">Stok</label>
              <input type="number" value={form.stock ?? 0} onChange={e => setForm({ ...form, stock: Number(e.target.value) })} className="input-field" min={0} />
            </div>
            <div>
              <label className="input-label">Min. Stok</label>
              <input type="number" value={form.min_stock ?? 0} onChange={e => setForm({ ...form, min_stock: Number(e.target.value) })} className="input-field" min={0} />
            </div>
          </div>
          <div>
            <label className="input-label">Gambar Produk</label>
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-24 h-24 bg-[#FFFDF2] rounded-xl border-2 border-dashed border-[#F2D98D] flex items-center justify-center overflow-hidden">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                ) : form.image ? (
                  <img src={getImageUrl(form.image)} alt="Produk" className="w-full h-full object-cover" />
                ) : (
                  <svg className="w-8 h-8 text-[#B8A88A]" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                )}
              </div>
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-[#FFFDF2] border border-[#F2D98D] rounded-xl text-sm text-[#540F00] hover:bg-[#FFF8C8] transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                  Pilih Gambar
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) { setImageFile(file); setImagePreview(URL.createObjectURL(file)); }
                    }} />
                </label>
                <p className="text-xs text-[#7A6548] mt-1.5">Format: JPG, PNG, WebP. Maks 5MB</p>
                {(imagePreview || form.image) && (
                  <button onClick={() => { setImageFile(null); setImagePreview(null); setForm(f => ({ ...f, image: '' })); }}
                    className="text-xs text-[#E85050] hover:text-[#C93636] mt-1 font-medium">Hapus gambar</button>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 pt-1">
            <label className="text-sm font-medium text-[#540F00]">Status Aktif</label>
            <label className="toggle-switch">
              <input type="checkbox" checked={form.is_active ?? true}
                onChange={e => setForm({ ...form, is_active: e.target.checked })} />
              <div className="toggle-track" />
              <div className="toggle-thumb" />
            </label>
          </div>
        </div>
      </AppModal>

      <AppModal
        open={variantModalOpen}
        onClose={() => setVariantModalOpen(false)}
        title={variantProduct ? `Varian - ${variantProduct.name}` : 'Varian'}
        size="xl"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#540F00]">Daftar Varian</h3>
            <button onClick={openAddVariant} className="btn-primary text-xs px-3 py-1.5">
              + Tambah Varian
            </button>
          </div>
          <div className="border border-[#F2D98D] rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-[#FFF8C8]">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#540F00]">Nama</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[#540F00]">Barcode</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[#540F00]">Harga</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[#540F00]">Stok</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-[#540F00]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F2D98D]">
                {variants.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-[#7A6548] text-sm">Belum ada varian</td>
                  </tr>
                ) : variants.map(v => (
                  <tr key={v.id} className="hover:bg-[rgba(255,241,168,0.4)] transition-colors">
                    <td className="px-3 py-2.5 font-medium text-[#540F00]">{v.name}</td>
                    <td className="px-3 py-2.5 font-mono text-[#7A6548]">{v.barcode || '-'}</td>
                    <td className="px-3 py-2.5 text-right font-semibold">Rp {v.price.toLocaleString()}</td>
                    <td className={`px-3 py-2.5 text-right font-medium ${v.stock <= v.min_stock ? 'text-[#E85050]' : ''}`}>
                      {v.stock}
                    </td>
                    <td className="px-3 py-2.5 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button onClick={() => openEditVariant(v)} className="btn-edit">Edit</button>
                        <button onClick={() => handleDeleteVariant(v)} className="btn-delete">Hapus</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {(editVariantId !== null || variantForm.name || variantForm.barcode) && (
            <div className="border-t border-[#F2D98D] pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-[#540F00]">
                {editVariantId ? 'Edit Varian' : 'Tambah Varian Baru'}
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="input-label">Nama Varian <span className="text-[#E85050]">*</span></label>
                  <input type="text" value={variantForm.name} onChange={e => setVariantForm({ ...variantForm, name: e.target.value })}
                    placeholder="Contoh: Merah, XL" className="input-field" />
                </div>
                <div>
                  <label className="input-label">Barcode</label>
                  <input type="text" value={variantForm.barcode || ''} onChange={e => setVariantForm({ ...variantForm, barcode: e.target.value })}
                    placeholder="Opsional" className="input-field" />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="input-label">Harga <span className="text-[#E85050]">*</span></label>
                  <input type="number" value={variantForm.price} onChange={e => setVariantForm({ ...variantForm, price: Number(e.target.value) })}
                    className="input-field" min={0} />
                </div>
                <div>
                  <label className="input-label">Stok</label>
                  <input type="number" value={variantForm.stock ?? 0} onChange={e => setVariantForm({ ...variantForm, stock: Number(e.target.value) })}
                    className="input-field" min={0} />
                </div>
                <div>
                  <label className="input-label">Min. Stok</label>
                  <input type="number" value={variantForm.min_stock ?? 0} onChange={e => setVariantForm({ ...variantForm, min_stock: Number(e.target.value) })}
                    className="input-field" min={0} />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button onClick={() => { setEditVariantId(null); setVariantForm({ name: '', barcode: '', price: variantProduct?.price || 0, stock: 0, min_stock: 0 }); }}
                  className="btn-secondary text-xs px-3 py-1.5">Batal</button>
                <button onClick={handleSaveVariant} disabled={savingVariant} className="btn-primary text-xs px-3 py-1.5">
                  {savingVariant ? 'Menyimpan...' : editVariantId ? 'Perbarui' : 'Simpan'}
                </button>
              </div>
            </div>
          )}
        </div>
      </AppModal>

      <ConfirmDialog
        open={deleteId !== null}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Hapus Produk"
        message="Apakah Anda yakin ingin menghapus produk ini? Tindakan ini tidak dapat dibatalkan."
        confirmLabel="Ya, Hapus"
        variant="danger"
      />
    </div>
  );
}
