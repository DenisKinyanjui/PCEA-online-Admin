import { useEffect, useState, type FormEvent } from 'react';
import { Archive, BookOpenCheck, CalendarDays, Check, Edit2, Plus, RefreshCw, Trophy, Upload } from 'lucide-react';
import PageHeader from '../components/ui/PageHeader';
import BulkQuestionImport from '../components/admin/BulkQuestionImport';
import axiosInstance from '../api/axiosInstance';

interface ManagedQuestion {
  _id: string;
  prompt: string;
  category: 'Bible' | 'Moral';
  difficulty: 'easy' | 'medium' | 'hard';
  options: string[];
  correctIndex: number;
  explanation: string;
  scriptureReference: string;
  publishAt: string;
  archivedAt: string | null;
  attempts: number;
}

interface Winner { user: string; name: string; points: number; place: number; reward: string }
interface Season {
  _id: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status: 'scheduled' | 'active' | 'review' | 'finalized';
  rewards: { place: number; description: string }[];
  winners: Winner[];
  leaderboard: { userId: string; name: string; points: number; correctAnswers: number }[];
}

type QuestionForm = Omit<ManagedQuestion, '_id' | 'archivedAt' | 'attempts'>;
const blankQuestion: QuestionForm = { prompt: '', category: 'Bible', difficulty: 'easy', options: ['', '', '', ''], correctIndex: 0, explanation: '', scriptureReference: '', publishAt: new Date().toISOString().slice(0, 16) };
const dateInput = (value?: string) => value ? new Date(new Date(value).getTime() - new Date(value).getTimezoneOffset() * 60000).toISOString().slice(0, 16) : '';

export default function AdminQuiz() {
  const [tab, setTab] = useState<'questions' | 'seasons'>('questions');
  const [questions, setQuestions] = useState<ManagedQuestion[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [form, setForm] = useState<QuestionForm>(blankQuestion);
  const [editingId, setEditingId] = useState('');
  const [seasonForm, setSeasonForm] = useState({ name: '', startsAt: '', endsAt: '', rewards: ['', '', ''] });
  const [editingSeasonId, setEditingSeasonId] = useState('');
  const [reviewSeason, setReviewSeason] = useState<Season | null>(null);
  const [reviewRewards, setReviewRewards] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [bulkImportOpen, setBulkImportOpen] = useState(false);

  const load = async () => {
    const [questionResponse, seasonResponse] = await Promise.all([
      axiosInstance.get('/quiz/manage/questions'),
      axiosInstance.get('/quiz/manage/seasons'),
    ]);
    setQuestions(questionResponse.data.data);
    setSeasons(seasonResponse.data.data);
  };

  useEffect(() => {
    let active = true;
    Promise.all([
      axiosInstance.get('/quiz/manage/questions'),
      axiosInstance.get('/quiz/manage/seasons'),
    ]).then(([questionResponse, seasonResponse]) => {
      if (!active) return;
      setQuestions(questionResponse.data.data);
      setSeasons(seasonResponse.data.data);
    }).catch(() => {
      if (active) setError('Quiz management data could not be loaded.');
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, []);

  const saveQuestion = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true); setError(''); setNotice('');
    try {
      const payload = { ...form, publishAt: new Date(form.publishAt).toISOString(), options: form.options.filter((option) => option.trim()) };
      if (editingId) await axiosInstance.put(`/quiz/manage/questions/${editingId}`, payload);
      else await axiosInstance.post('/quiz/manage/questions', payload);
      setForm(blankQuestion); setEditingId(''); setNotice(editingId ? 'Question updated.' : 'Question saved.');
      await load();
    } catch (err) { setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Question could not be saved.'); }
    finally { setSaving(false); }
  };

  const archiveQuestion = async (question: ManagedQuestion) => {
    if (!window.confirm(`Archive “${question.prompt}”?`)) return;
    try { await axiosInstance.patch(`/quiz/manage/questions/${question._id}/archive`); setNotice('Question archived.'); await load(); }
    catch { setError('Question could not be archived.'); }
  };

  const createSeason = async (event: FormEvent) => {
    event.preventDefault(); setSaving(true); setError('');
    try {
      const payload = { ...seasonForm, startsAt: new Date(seasonForm.startsAt).toISOString(), endsAt: new Date(seasonForm.endsAt).toISOString(), rewards: seasonForm.rewards.map((description) => ({ description })) };
      if (editingSeasonId) await axiosInstance.put(`/quiz/manage/seasons/${editingSeasonId}`, payload);
      else await axiosInstance.post('/quiz/manage/seasons', payload);
      setSeasonForm({ name: '', startsAt: '', endsAt: '', rewards: ['', '', ''] }); setEditingSeasonId(''); setNotice(editingSeasonId ? 'Scheduled competition updated.' : 'Competition season created.'); await load();
    } catch (err) { setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Season could not be saved.'); }
    finally { setSaving(false); }
  };

  const startReview = async (season: Season) => {
    setError('');
    try {
      const { data } = await axiosInstance.post(`/quiz/manage/seasons/${season._id}/review`);
      const refreshed = data.data as Season;
      setReviewSeason(refreshed);
      setReviewRewards(refreshed.winners.map((winner) => winner.reward || ''));
      await load();
    } catch (err) { setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Rankings could not be prepared for review.'); }
  };

  const confirmResults = async () => {
    if (!reviewSeason) return;
    setSaving(true); setError('');
    try {
      await axiosInstance.post(`/quiz/manage/seasons/${reviewSeason._id}/finalize`, { winners: reviewSeason.winners.map((winner, index) => ({ user: winner.user, reward: reviewRewards[index] || '' })) });
      setReviewSeason(null); setNotice('Season results finalized and retained in history.'); await load();
    } catch (err) { setError((err as { response?: { data?: { message?: string } } }).response?.data?.message ?? 'Results could not be confirmed.'); }
    finally { setSaving(false); }
  };

  const beginEdit = (question: ManagedQuestion) => {
    setTab('questions'); setEditingId(question._id);
    setForm({ prompt: question.prompt, category: question.category, difficulty: question.difficulty, options: question.options, correctIndex: question.correctIndex, explanation: question.explanation, scriptureReference: question.scriptureReference, publishAt: dateInput(question.publishAt) });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const beginSeasonEdit = (season: Season) => {
    setEditingSeasonId(season._id);
    setSeasonForm({ name: season.name, startsAt: dateInput(season.startsAt), endsAt: dateInput(season.endsAt), rewards: [0, 1, 2].map((index) => season.rewards.find((reward) => reward.place === index + 1)?.description ?? '') });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="space-y-5">
      <PageHeader title="Bible Quiz" description="Manage questions, quarterly competitions, and confirmed results" />
      <div className="flex gap-2 border-b border-gray-800">
        {(['questions', 'seasons'] as const).map((value) => <button key={value} onClick={() => { setTab(value); setError(''); }} className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${tab === value ? 'border-indigo-400 text-gray-100' : 'border-transparent text-gray-500 hover:text-gray-300'}`}>{value === 'questions' ? 'Questions' : 'Quarterly competitions'}</button>)}
      </div>
      {error && <div role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 text-red-300 text-sm px-4 py-3">{error}</div>}
      {notice && <div role="status" className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-300 text-sm px-4 py-3">{notice}</div>}

      {tab === 'questions' ? <>
        <form onSubmit={saveQuestion} className="admin-card p-5 space-y-4">
          <div className="flex items-center gap-2"><BookOpenCheck className="h-5 w-5 text-indigo-300" /><h2 className="font-semibold text-gray-100">{editingId ? 'Edit question' : 'New question'}</h2></div>
          <div><label className="admin-label">Question *</label><textarea required value={form.prompt} onChange={(event) => setForm({ ...form, prompt: event.target.value })} rows={2} className="admin-textarea" /></div>
          <div className="grid sm:grid-cols-3 gap-3">
            <div><label className="admin-label">Category</label><select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as QuestionForm['category'] })} className="admin-select"><option>Bible</option><option>Moral</option></select></div>
            <div><label className="admin-label">Difficulty</label><select value={form.difficulty} onChange={(event) => setForm({ ...form, difficulty: event.target.value as QuestionForm['difficulty'] })} className="admin-select"><option value="easy">Easy · 10 points</option><option value="medium">Medium · 20 points</option><option value="hard">Hard · 30 points</option></select></div>
            <div><label className="admin-label">Publish at *</label><input type="datetime-local" required value={form.publishAt} onChange={(event) => setForm({ ...form, publishAt: event.target.value })} className="admin-input" /></div>
          </div>
          <fieldset><legend className="admin-label">Answer options · select the correct answer *</legend><div className="grid sm:grid-cols-2 gap-2">{form.options.map((option, index) => <div key={index} className="flex items-center gap-2"><input type="radio" aria-label={`Mark option ${index + 1} correct`} checked={form.correctIndex === index} onChange={() => setForm({ ...form, correctIndex: index })} className="accent-indigo-500" /><input required value={option} onChange={(event) => setForm({ ...form, options: form.options.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} placeholder={`Option ${index + 1}`} className="admin-input" /></div>)}</div></fieldset>
          <div className="grid sm:grid-cols-2 gap-3"><div><label className="admin-label">Explanation *</label><textarea required value={form.explanation} onChange={(event) => setForm({ ...form, explanation: event.target.value })} rows={3} className="admin-textarea" /></div><div><label className="admin-label">Scripture reference</label><input value={form.scriptureReference} onChange={(event) => setForm({ ...form, scriptureReference: event.target.value })} placeholder="e.g. John 3:16" className="admin-input" /></div></div>
          <div className="flex gap-2"><button disabled={saving} className="btn-primary"><Plus className="h-4 w-4" />{saving ? 'Saving…' : editingId ? 'Save changes' : 'Create question'}</button>{editingId && <button type="button" onClick={() => { setEditingId(''); setForm(blankQuestion); }} className="btn-secondary">Cancel edit</button>}</div>
        </form>
        <section className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-semibold text-gray-100">Question bank <span className="text-gray-500 font-normal">({questions.length})</span></h2><button onClick={() => setBulkImportOpen(true)} className="btn-secondary"><Upload className="h-4 w-4" />Bulk Import Questions</button></div>
          {loading ? <div className="admin-card p-6 text-sm text-gray-400">Loading questions…</div> : questions.length === 0 ? <div className="admin-card p-6 text-sm text-gray-400">No questions have been created yet.</div> : questions.map((question) => <article key={question._id} className={`admin-card p-4 flex flex-col sm:flex-row sm:items-center gap-4 ${question.archivedAt ? 'opacity-60' : ''}`}>
            <div className="min-w-0 flex-1"><div className="flex flex-wrap gap-2 text-[11px] uppercase font-semibold"><span className="text-indigo-300">{question.category}</span><span className="text-gray-500">{question.difficulty}</span><span className={new Date(question.publishAt) > new Date() ? 'text-amber-300' : 'text-emerald-300'}>{new Date(question.publishAt) > new Date() ? `Scheduled ${new Date(question.publishAt).toLocaleString()}` : 'Published'}</span>{question.archivedAt && <span className="text-gray-500">Archived</span>}</div><h3 className="text-sm font-medium text-gray-100 mt-1">{question.prompt}</h3><p className="text-xs text-gray-500 mt-1">{question.attempts} submitted answers · {question.scriptureReference || 'No scripture reference'}</p></div>
            {!question.archivedAt && <div className="flex gap-1"><button disabled={question.attempts > 0} onClick={() => beginEdit(question)} title={question.attempts ? 'Question has answer history and cannot be edited' : 'Edit'} className="p-2 text-gray-400 hover:text-indigo-300 disabled:opacity-30"><Edit2 className="h-4 w-4" /></button><button onClick={() => archiveQuestion(question)} title="Archive question" className="p-2 text-gray-400 hover:text-amber-300"><Archive className="h-4 w-4" /></button></div>}
          </article>)}
        </section>
      </> : <>
        <form onSubmit={createSeason} className="admin-card p-5 space-y-4">
          <div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-indigo-300" /><h2 className="font-semibold text-gray-100">{editingSeasonId ? 'Edit scheduled competition' : 'Schedule a competition'}</h2></div>
          <div className="grid sm:grid-cols-3 gap-3"><div className="sm:col-span-1"><label className="admin-label">Season name *</label><input required value={seasonForm.name} onChange={(event) => setSeasonForm({ ...seasonForm, name: event.target.value })} placeholder="2026 · Quarter 4" className="admin-input" /></div><div><label className="admin-label">Starts *</label><input required type="datetime-local" value={seasonForm.startsAt} onChange={(event) => setSeasonForm({ ...seasonForm, startsAt: event.target.value })} className="admin-input" /></div><div><label className="admin-label">Ends *</label><input required type="datetime-local" value={seasonForm.endsAt} onChange={(event) => setSeasonForm({ ...seasonForm, endsAt: event.target.value })} className="admin-input" /></div></div>
          <div className="grid sm:grid-cols-3 gap-3">{seasonForm.rewards.map((reward, index) => <div key={index}><label className="admin-label">Place {index + 1} reward</label><input value={reward} onChange={(event) => setSeasonForm({ ...seasonForm, rewards: seasonForm.rewards.map((item, itemIndex) => itemIndex === index ? event.target.value : item) })} placeholder="Optional reward" className="admin-input" /></div>)}</div>
          <div className="flex gap-2"><button disabled={saving} className="btn-primary"><Plus className="h-4 w-4" />{editingSeasonId ? 'Save season' : 'Create season'}</button>{editingSeasonId && <button type="button" onClick={() => { setEditingSeasonId(''); setSeasonForm({ name: '', startsAt: '', endsAt: '', rewards: ['', '', ''] }); }} className="btn-secondary">Cancel</button>}</div>
        </form>
        <section className="space-y-3"><h2 className="font-semibold text-gray-100">Competition history</h2>
          {loading ? <div className="admin-card p-6 text-sm text-gray-400">Loading seasons…</div> : seasons.length === 0 ? <div className="admin-card p-6 text-sm text-gray-400">No competition seasons scheduled.</div> : seasons.map((season) => <article key={season._id} className="admin-card p-4 flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex-1"><div className="flex items-center gap-2"><h3 className="font-semibold text-gray-100">{season.name}</h3><span className="text-[11px] uppercase tracking-wide px-2 py-0.5 rounded bg-gray-800 text-gray-300">{season.status}</span></div><p className="text-xs text-gray-500 mt-1">{new Date(season.startsAt).toLocaleDateString()} – {new Date(season.endsAt).toLocaleDateString()} · {season.leaderboard.length} ranked members</p>{season.status === 'finalized' && <p className="text-xs text-emerald-300 mt-2">Results confirmed · {season.winners.length} winners recorded</p>}</div>
            {season.status === 'scheduled' && new Date(season.startsAt) > new Date() && <button onClick={() => beginSeasonEdit(season)} className="btn-secondary"><Edit2 className="h-4 w-4" />Edit</button>}
            {season.status !== 'finalized' && new Date(season.endsAt) <= new Date() && <button onClick={() => startReview(season)} className="btn-secondary"><Trophy className="h-4 w-4" />Review results</button>}
          </article>)}
        </section>
      </>}

      {reviewSeason && <div className="fixed inset-0 z-[100] bg-black/70 flex items-center justify-center p-4"><section role="dialog" aria-modal="true" className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl border border-gray-700 bg-gray-900 p-5"><div className="flex justify-between gap-3"><div><h2 className="text-lg font-bold text-gray-100">Review · {reviewSeason.name}</h2><p className="text-sm text-gray-400 mt-1">Confirm the ranking and record rewards. Finalization preserves this season’s history.</p></div><button onClick={() => setReviewSeason(null)} className="text-gray-400">Close</button></div><div className="mt-5 divide-y divide-gray-800">{reviewSeason.winners.map((winner, index) => <div key={winner.user} className="grid grid-cols-[32px_1fr_90px] gap-3 items-center py-3"><span className="text-amber-300 font-bold">{winner.place}</span><div><p className="text-sm font-semibold text-gray-100">{winner.name}</p><p className="text-xs text-gray-500">{winner.points} points</p></div><input aria-label={`Reward for place ${winner.place}`} value={reviewRewards[index] ?? ''} onChange={(event) => setReviewRewards(reviewRewards.map((reward, rewardIndex) => rewardIndex === index ? event.target.value : reward))} placeholder="Reward" className="admin-input" /></div>)}</div>{reviewSeason.winners.length === 0 && <p className="text-sm text-gray-400 mt-4">No ranked members for this season.</p>}<div className="mt-5"><h3 className="text-sm font-semibold text-gray-200">Full rankings</h3><ol className="mt-2 max-h-48 overflow-auto divide-y divide-gray-800">{reviewSeason.leaderboard.map((entry, index) => <li key={entry.userId} className="flex gap-3 py-2 text-sm text-gray-300"><span className="w-6 text-gray-500">{index + 1}</span><span className="flex-1">{entry.name}</span><span>{entry.points}</span></li>)}</ol></div><button disabled={saving} onClick={confirmResults} className="btn-primary mt-5"><Check className="h-4 w-4" />{saving ? 'Confirming…' : 'Confirm and finalize'}</button></section></div>}
      {bulkImportOpen && <BulkQuestionImport onClose={() => setBulkImportOpen(false)} onImported={async () => { await load(); setNotice('Bulk question import completed.'); }} />}
      {loading && <RefreshCw className="hidden" />}
    </div>
  );
}