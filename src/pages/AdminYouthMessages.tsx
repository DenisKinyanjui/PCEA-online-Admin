import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Plus, PencilLine, Trash2, Sprout, ScrollText } from 'lucide-react';
import ConfirmDeleteModal from '../components/ui/ConfirmDeleteModal';
import { useYouthMessages, useDeleteYouthMessage } from '../hooks/useYouthMessages';
import { useToast } from '../context/ToastContext';
import type { ApiYouthMessage } from '../types';

/** How many of the latest messages the public home page shows. */
const YOUTH_MESSAGES_ON_SITE = 4;

// Service dates are stored at 12:00 UTC, so format in UTC to keep the calendar day
const fmt = (iso: string, opts: Intl.DateTimeFormatOptions) =>
  new Date(iso).toLocaleDateString('en-US', { ...opts, timeZone: 'UTC' });

function MessageRow({ m, onDelete }: { m: ApiYouthMessage; onDelete: () => void }) {
  return (
    <li className="group relative grid grid-cols-[4.5rem_1fr_auto] gap-x-4 px-5 py-4 hover:bg-gray-800/30 transition-colors">
      <div className="pt-0.5">
        <p className="text-sm font-medium text-gray-200 tabular-nums">{fmt(m.date, { month: 'short', day: 'numeric' })}</p>
        <p className="text-xs text-gray-500 tabular-nums mt-0.5">{fmt(m.date, { year: 'numeric' })}</p>
      </div>

      <div className="min-w-0">
        <Link
          to={`/admin/youth-messages/${m._id}/edit`}
          className="block text-sm text-gray-300 leading-relaxed line-clamp-2 hover:text-gray-100 transition-colors
            focus:outline-none focus-visible:underline"
        >
          {m.message}
        </Link>
        <div className="mt-2 flex items-center gap-x-3 gap-y-1 flex-wrap text-xs text-gray-500">
          <span className="text-gray-400">{m.minister}</span>
          {m.bibleVerse && (
            <span className="inline-flex items-center gap-1 min-w-0">
              <ScrollText size={12} strokeWidth={1.75} className="flex-shrink-0 text-gray-600" />
              <span className="truncate">{m.bibleVerse}</span>
            </span>
          )}
        </div>
      </div>

      <div className="flex items-start gap-0.5 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100 transition-opacity">
        <Link
          to={`/admin/youth-messages/${m._id}/edit`}
          className="p-1.5 rounded-md text-gray-500 hover:text-gray-100 hover:bg-gray-800 transition-colors"
          aria-label={`Edit message from ${fmt(m.date, { month: 'long', day: 'numeric' })}`}
        >
          <PencilLine size={15} strokeWidth={1.75} />
        </Link>
        <button
          onClick={onDelete}
          className="p-1.5 rounded-md text-gray-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
          aria-label={`Delete message from ${fmt(m.date, { month: 'long', day: 'numeric' })}`}
        >
          <Trash2 size={15} strokeWidth={1.75} />
        </button>
      </div>
    </li>
  );
}

function Section({ title, note, live, children }: {
  title: string; note: string; live?: boolean; children: ReactNode;
}) {
  return (
    <section>
      <div className="flex items-baseline gap-3 mb-2.5 px-1">
        <h2 className="text-[13px] font-medium text-gray-200 flex items-center gap-2">
          {live && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
          {title}
        </h2>
        <p className="text-xs text-gray-500">{note}</p>
      </div>
      <ul className="admin-card divide-y divide-gray-800 overflow-hidden">{children}</ul>
    </section>
  );
}

export default function AdminYouthMessages() {
  const toast = useToast();
  const { data, isLoading } = useYouthMessages();
  const deleteMutation = useDeleteYouthMessage();
  const [deleteTarget, setDeleteTarget] = useState<ApiYouthMessage | null>(null);

  const messages = data?.data ?? [];
  const onSite = messages.slice(0, YOUTH_MESSAGES_ON_SITE);
  const archive = messages.slice(YOUTH_MESSAGES_ON_SITE);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget._id);
      toast('Message deleted.', 'success');
    } catch {
      toast('Failed to delete message.', 'error');
    } finally { setDeleteTarget(null); }
  };

  return (
    <div className="max-w-4xl">
      <header className="flex items-end justify-between gap-4 pb-6 mb-8 border-b border-gray-800">
        <div>
          <h1 className="text-xl font-semibold text-gray-100 tracking-tight">Message to the Youth</h1>
          <p className="text-sm text-gray-500 mt-1">The word shared with the youth before prayer each Sunday.</p>
        </div>
        <Link to="/admin/youth-messages/new" className="btn-primary flex-shrink-0">
          <Plus size={16} /> <span className="hidden sm:inline">New message</span>
        </Link>
      </header>

      {isLoading ? (
        <div className="admin-card divide-y divide-gray-800 animate-pulse">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="grid grid-cols-[4.5rem_1fr] gap-x-4 px-5 py-4">
              <div className="space-y-1.5">
                <div className="h-3.5 w-12 bg-gray-800 rounded" />
                <div className="h-3 w-8 bg-gray-800 rounded" />
              </div>
              <div className="space-y-2">
                <div className="h-3.5 w-full bg-gray-800 rounded" />
                <div className="h-3.5 w-3/5 bg-gray-800 rounded" />
                <div className="h-3 w-32 bg-gray-800 rounded mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : messages.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-800 px-6 py-16 text-center">
          <Sprout size={28} strokeWidth={1.5} className="mx-auto text-gray-600" />
          <p className="mt-4 text-sm font-medium text-gray-200">Nothing recorded yet</p>
          <p className="mt-1 text-sm text-gray-500 max-w-sm mx-auto">
            Add the message from the next Sunday service. The latest {YOUTH_MESSAGES_ON_SITE} show on the home page.
          </p>
          <Link to="/admin/youth-messages/new" className="btn-secondary mt-6">
            <Plus size={16} /> Add the first message
          </Link>
        </div>
      ) : (
        <div className="space-y-10">
          <Section title="" note={``}>
            {onSite.map((m) => <MessageRow key={m._id} m={m} onDelete={() => setDeleteTarget(m)} />)}
          </Section>

          {archive.length > 0 && (
            <Section title="Archive" note={`${archive.length} earlier ${archive.length === 1 ? 'message' : 'messages'}`}>
              {archive.map((m) => <MessageRow key={m._id} m={m} onDelete={() => setDeleteTarget(m)} />)}
            </Section>
          )}
        </div>
      )}

      <ConfirmDeleteModal
        isOpen={Boolean(deleteTarget)}
        title="Delete message"
        message={`The message by ${deleteTarget?.minister ?? ''} will be permanently deleted.`}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
}
