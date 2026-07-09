import { useState, useEffect, useCallback } from 'react';
import { userService } from '../../services/userService';
import type { UserData } from '../../services/userService';
import { getImageUrl } from '../../services/api';
import toast from 'react-hot-toast';

const ALL_FEATURES = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'products', label: 'Produk' },
  { key: 'categories', label: 'Kategori' },
  { key: 'vouchers', label: 'Voucher' },
  { key: 'auto_discounts', label: 'Auto Diskon' },
  { key: 'reports', label: 'Laporan' },
  { key: 'users', label: 'Users' },
  { key: 'customers', label: 'Pelanggan' },
  { key: 'promos', label: 'Promo' },
  { key: 'pos', label: 'POS Kasir' },
  { key: 'mirror', label: 'Mirror Display' },
];

const ROLE_DEFAULTS: Record<string, string[]> = {
  superadmin: ALL_FEATURES.map(f => f.key),
  admin: ALL_FEATURES.filter(f => f.key !== 'users').map(f => f.key),
  kasir: ['pos', 'mirror'],
};

interface UserForm {
  username: string;
  password: string;
  full_name: string;
  role: 'superadmin' | 'admin' | 'kasir';
}

const emptyForm: UserForm = {
  username: '',
  password: '',
  full_name: '',
  role: 'kasir',
};

const roleBadge = (role: string) => {
  switch (role) {
    case 'superadmin': return { cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', label: 'Super Admin' };
    case 'admin': return { cls: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400', label: 'Admin' };
    default: return { cls: 'bg-brand-100 text-brand-700 dark:bg-brand-900/30 dark:text-brand-400', label: 'Kasir' };
  }
};

function parsePermissions(perms?: string): string[] {
  if (!perms) return [];
  try { return JSON.parse(perms); } catch { return []; }
}

export default function UserPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 20;

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<UserData | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);

  const [form, setForm] = useState<UserForm>(emptyForm);
  const [permissions, setPermissions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userService.getUsers(page, limit, search);
      if (res.success) {
        setUsers(res.data || []);
        setTotal(res.total || 0);
      }
    } catch { toast.error('Gagal memuat pengguna'); }
    finally { setLoading(false); }
  }, [page, search]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const openAdd = () => {
    setEditItem(null);
    setForm(emptyForm);
    setPermissions([...ROLE_DEFAULTS.kasir]);
    setPhotoPreview(null);
    setPhotoFile(null);
    setModalOpen(true);
  };

  const openEdit = (u: UserData) => {
    setEditItem(u);
    setForm({
      username: u.username,
      password: '',
      full_name: u.full_name,
      role: u.role,
    });
    setPermissions(parsePermissions(u.permissions).length > 0 ? parsePermissions(u.permissions) : [...(ROLE_DEFAULTS[u.role] || [])]);
    setPhotoPreview(u.photo || null);
    setPhotoFile(null);
    setModalOpen(true);
  };

  const handleRoleChange = (role: 'superadmin' | 'admin' | 'kasir') => {
    setForm({ ...form, role });
    if (!editItem || role !== editItem.role) {
      setPermissions([...(ROLE_DEFAULTS[role] || [])]);
    }
  };

  const togglePermission = (key: string) => {
    setPermissions(prev =>
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  };

  const handleSave = async () => {
    if (!form.username || !form.full_name) {
      toast.error('Username dan nama lengkap harus diisi');
      return;
    }
    if (!editItem && !form.password) {
      toast.error('Password harus diisi');
      return;
    }
    try {
      setSaving(true);
      const payload: Record<string, unknown> = {
        username: form.username,
        full_name: form.full_name,
        role: form.role,
        permissions: JSON.stringify(permissions),
      };
      if (form.password) payload.password = form.password;

      if (editItem) {
        await userService.updateUser(editItem.id, payload);
        if (photoFile) await userService.uploadPhoto(editItem.id, photoFile);
        toast.success('Pengguna berhasil diperbarui');
      } else {
        const res = await userService.createUser(payload as any);
        const newId = (res as any)?.data?.id;
        if (photoFile && newId) await userService.uploadPhoto(newId, photoFile);
        toast.success('Pengguna berhasil ditambahkan');
      }
      setModalOpen(false);
      loadUsers();
    } catch { toast.error('Gagal menyimpan pengguna'); }
    finally { setSaving(false); }
  };

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await userService.deleteUser(deleteId);
      toast.success('Pengguna berhasil dihapus');
      setDeleteId(null);
      loadUsers();
    } catch { toast.error('Gagal menghapus pengguna'); }
  };

  const handleToggleActive = async (id: number) => {
    try {
      await userService.toggleActive(id);
      toast.success('Status pengguna berhasil diubah');
      loadUsers();
    } catch { toast.error('Gagal mengubah status pengguna'); }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Pengguna
        </h1>
        <button onClick={openAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors">
          + Tambah Pengguna
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input type="text" placeholder="Cari pengguna..." value={search}
          onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300 w-12">Foto</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Username</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Nama Lengkap</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Role</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Status</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Dibuat</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-300">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Memuat...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Tidak ada pengguna</td></tr>
              ) : (
                users.map((u) => {
                  const badge = roleBadge(u.role);
                  return (
                    <tr key={u.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 text-xs font-semibold text-brand-700 dark:text-brand-300 overflow-hidden">
                          {u.photo ? (
                            <img src={getImageUrl(u.photo)} alt="" className="w-full h-full object-cover" />
                          ) : (
                            u.full_name?.charAt(0)?.toUpperCase() || 'U'
                          )}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{u.username}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{u.full_name}</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${badge.cls}`}>
                          {badge.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                          u.is_active
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                        }`}>{u.is_active ? 'Aktif' : 'Nonaktif'}</span>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                        {new Date(u.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button onClick={() => openEdit(u)}
                            className="px-3 py-1 text-xs font-medium text-brand-500 bg-brand-50 rounded-md hover:bg-brand-100 dark:bg-brand-900/20 dark:text-brand-400 dark:hover:bg-brand-900/30 transition-colors">Edit</button>
                          <button onClick={() => setDeleteId(u.id)}
                            className="px-3 py-1 text-xs font-medium text-red-600 bg-red-50 rounded-md hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30 transition-colors">Hapus</button>
                          <button onClick={() => handleToggleActive(u.id)}
                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                              u.is_active
                                ? 'text-yellow-600 bg-yellow-50 hover:bg-yellow-100 dark:bg-yellow-900/20 dark:text-yellow-400 dark:hover:bg-yellow-900/30'
                                : 'text-green-600 bg-green-50 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30'
                            }`}>{u.is_active ? 'Nonaktifkan' : 'Aktifkan'}</button>
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
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">Halaman {page} dari {totalPages} ({total} data)</span>
            <div className="flex gap-1">
              <button disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Prev</button>
              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(1, page - 2);
                const p = start + i;
                if (p > totalPages) return null;
                return (
                  <button key={p} onClick={() => setPage(p)}
                    className={`px-3 py-1 text-sm border rounded-md ${p === page ? 'bg-brand-500 text-white border-brand-500' : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'}`}>{p}</button>
                );
              })}
              <button disabled={page >= totalPages} onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-40 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Next</button>
            </div>
          </div>
        )}
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 z-[90] bg-black/50" onClick={() => setModalOpen(false)} />
          <div className="relative z-[100] bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editItem ? 'Edit Pengguna' : 'Tambah Pengguna'}
              </h2>
              <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none">&times;</button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex flex-col items-center mb-2">
                <div className="relative w-20 h-20">
                  <label className="cursor-pointer">
                    <input type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
                    <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-brand-500 transition-colors">
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
                <p className="text-xs text-gray-400 mt-2">Klik untuk upload foto</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username <span className="text-red-500">*</span></label>
                <input type="text" value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Password {!editItem && <span className="text-red-500">*</span>}
                </label>
                <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder={editItem ? 'Kosongkan jika tidak diubah' : ''}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nama Lengkap <span className="text-red-500">*</span></label>
                <input type="text" value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Role <span className="text-red-500">*</span></label>
                <select value={form.role} onChange={e => handleRoleChange(e.target.value as 'superadmin' | 'admin' | 'kasir')}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-brand-500 outline-none">
                  <option value="kasir">Kasir</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Super Admin</option>
                </select>
              </div>

              {form.role !== 'superadmin' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Fitur yang Dapat Diakses
                  </label>
                  <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-900/50 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
                    {ALL_FEATURES.map(f => (
                      <label key={f.key} className="flex items-center gap-2 cursor-pointer select-none p-1.5 rounded-lg hover:bg-white dark:hover:bg-gray-800 transition-colors">
                        <input type="checkbox" checked={permissions.includes(f.key)}
                          onChange={() => togglePermission(f.key)}
                          className="w-4 h-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{f.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              {form.role === 'superadmin' && (
                <p className="text-xs text-gray-400 italic">Super Admin memiliki akses ke semua fitur</p>
              )}
            </div>
            <div className="flex justify-end gap-3 px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors">Batal</button>
              <button onClick={handleSave} disabled={saving}
                className="px-4 py-2 text-sm font-medium text-white bg-brand-500 rounded-lg hover:bg-brand-600 disabled:opacity-50 transition-colors">
                {saving ? 'Menyimpan...' : 'Simpan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="fixed inset-0 z-[90] bg-black/50" onClick={() => setDeleteId(null)} />
          <div className="relative z-[100] bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Hapus Pengguna</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">Apakah Anda yakin ingin menghapus pengguna ini? Tindakan ini tidak dapat dibatalkan.</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setDeleteId(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors">Batal</button>
              <button onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors">Hapus</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
