import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Edit2, Trash2, Megaphone, CalendarClock, ImageOff } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import AdminEmptyState from '../components/ui/AdminEmptyState';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import { useAnnouncements, useDeleteAnnouncement } from '../hooks/useAnnouncements';
import { announcementImageUrl } from '../api/announcementApi';
import { useToast } from '../context/ToastContext';
import type { ApiAnnouncement } from '../types';

type Filter = 'all' | 'active' | 'expired';

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfDay = (t: number) => { const d = new Date(t); d.setHours(0, 0, 0, 0); return d.getTime(); };

function expiryInfo(expiresAt: string, now: number) {
  const expires = new Date(expiresAt).getTime();
  const formatted = new Date(expiresAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  if (expires <= now) return { expired: true, label: `Expired ${formatted}`, tone: 'text-gray-400 bg-gray-800 border-gray-800' };
  const days = Math.round((startOfDay(expires) - startOfDay(now)) / DAY_MS);
  if (days <= 3) {
    return {
      expired: false,
      label: days === 0 ? 'Last day today' : days === 1 ? 'Ends tomorrow' : `Ends in ${days} days`,
      tone: 'text-amber-300 bg-amber-500/10 border-amber-500/25',
    };
  }
  return { expired: false, label: `Until ${formatted}`, tone: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/25' };
}

export default function AdminAnnouncements() {
  const toast = useToast();
  const { data, isLoading } = useAnnouncements();
  const deleteMutation = useDeleteAnnouncement();
  const [filter, setFilter] = useState<Filter>('all');
  const [deleteTarget, setDeleteTarget] = useState<ApiAnnouncement | null>(null);
  // Captured once so every card agrees on "now"
  const [now] = useState(() => Date.now());

  const all = data?.data ?? [];
  const activeCount = all.filter((a) => new Date(a.expiresAt).getTime() > now).length;
  const visible = all.filter((a) => {
    if (filter === 'all') return true;
    const expired = new Date(a.expiresAt).getTime() <= now;
    return filter === 'expired' ? expired : !expired;
  });

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      toast('Announcement deleted.', 'success');
    } catch {
      toast('Failed to delete announcement.', 'error');
    } finally { setDeleteTarget(null); }
  };

  const tabs: { key: Filter; label: string; count: number }[] = [
    { key: 'all', label: 'All', count: all.length },
    { key: 'active', label: 'Live', count: activeCount },
    { key: 'expired', label: 'Expired', count: all.length - activeCount },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        title="Announcements"
        description="Shown on the website's home page until their expiry date"
        action={<Link to="/admin/announcements/new" className="btn-primary"><Plus className="h-4 w-4" /> New Announcement</Link>}
      />

      <div className="inline-flex p-1 bg-gray-800 rounded-lg gap-1">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setFilter(t.key)}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
              filter === t.key ? 'bg-gray-900 text-gray-100 shadow-sm' : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {t.label} <span className="text-gray-500 ml-1">{t.count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="admin-card overflow-hidden">
              <div className="aspect-[16/9] bg-gray-800" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-800 rounded w-2/3" />
                <div className="h-3 bg-gray-800 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : visible.length === 0 ? (
        <AdminEmptyState
          icon={Megaphone}
          title={filter === 'all' ? 'No announcements yet' : `No ${filter === 'active' ? 'live' : 'expired'} announcements`}
          description="Announcements appear on the home page below Recent Sermons."
          action={filter === 'all' && <Link to="/admin/announcements/new" className="btn-primary mt-2">Add Announcement</Link>}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {visible.map((a) => {
            const info = expiryInfo(a.expiresAt, now);
            const img = announcementImageUrl(a.imagePath);
            return (
              <div key={a._id} className={`admin-card overflow-hidden flex flex-col group ${info.expired ? 'opacity-70' : ''}`}>
                <div className="aspect-[16/9] bg-gray-800 relative overflow-hidden">
                  {img ? (
                    <img src={img} alt="" className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-600">
                      <ImageOff className="h-8 w-8" />
                    </div>
                  )}
                  <span className={`absolute top-3 left-3 inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${info.tone}`}>
                    <CalendarClock className="h-3 w-3" /> {info.label}
                  </span>
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="font-semibold text-gray-100 line-clamp-1">{a.title}</h3>
                  <p className="text-sm text-gray-400 mt-1 line-clamp-2 flex-1">{a.description}</p>
                  <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-800">
                    <span className="text-xs text-gray-500">
                      Posted {new Date(a.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                    <div className="flex items-center gap-1">
                      <Link
                        to={`/admin/announcements/${a._id}/edit`}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors"
                        title={info.expired ? 'Edit / renew' : 'Edit'}
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Link>
                      <button
                        onClick={() => setDeleteTarget(a)}
                        className="p-1.5 rounded-lg text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        title="Delete"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete Announcement"
        message={`"${deleteTarget?.title}" will be permanently deleted, including its poster.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
