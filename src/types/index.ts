// ─── Auth ───────────────────────────────────────────────────────────────────

export type UserRole = 'super_admin' | 'church_admin' | 'transcriptionist';

export interface AuthChurch {
  id: string;
  name: string;
  slug: string;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  church: AuthChurch | null; // null for super_admin
}

// ─── Church ──────────────────────────────────────────────────────────────────

export interface ApiChurch {
  _id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  address: string;
  contactEmail: string;
  contactPhone: string;
  logoUrl: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchListResponse {
  success: boolean;
  total: number;
  data: ApiChurch[];
}

export interface CreateChurchInput {
  name: string;
  slug: string;
  tagline?: string;
  description?: string;
  address?: string;
  contactEmail?: string;
  contactPhone?: string;
  logoUrl?: string;
  isActive?: boolean;
}

// ─── Users ───────────────────────────────────────────────────────────────────

export interface ApiAdminUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  church: { id: string; name: string; slug: string } | null;
  createdAt: string;
}

export interface UserListResponse {
  success: boolean;
  total: number;
  data: ApiAdminUser[];
}

export interface CreateUserInput {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  church?: string; // Church ObjectId
}

export interface UpdateUserInput {
  name?: string;
  email?: string;
  password?: string;
  role?: UserRole;
  church?: string | null;
}

// ─── Sermon ─────────────────────────────────────────────────────────────────

export interface SermonPoint {
  title: string;
  description: string;
  verses: string[];
}

export interface SermonContent {
  introduction: string;
  points: SermonPoint[];
  conclusion: string;
}

export interface SermonVideo {
  type: 'youtube' | 'file';
  url: string;
}

export interface SermonAttachment {
  name: string;
  url: string;
  fileType: string;
}

export interface ApiSermon {
  _id: string;
  title: string;
  preacher: string;
  church: string;
  date: string;
  scriptureReferences: string[];
  summary: string;
  audioUrl: string;
  video: SermonVideo | null;
  content: SermonContent;
  attachments: SermonAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface ApiSermonSummary {
  _id: string;
  title: string;
  preacher: string;
  church: string;
  date: string;
  scriptureReferences: string[];
  summary: string;
  audioUrl: string;
  video: SermonVideo | null;
  createdAt: string;
  updatedAt: string;
}

export interface SermonsResponse {
  success: boolean;
  total: number;
  totalPreachers: number;
  page: number;
  pages: number;
  data: ApiSermonSummary[];
}

export interface SermonFilters {
  search?: string;
  preacher?: string;
  church?: string;
  year?: string;
  page?: number;
  limit?: number;
}

export interface SermonMetaData {
  preachers: string[];
  churches: string[];
}

export interface CreateSermonInput {
  title: string;
  preacher: string;
  date: string;
  scriptureReferences?: string[];
  summary?: string;
  audioUrl?: string;
  video?: SermonVideo | null;
  content?: SermonContent;
  church?: string;
}

// ─── Uploads ────────────────────────────────────────────────────────────────

export interface UploadAudioResponse {
  success: boolean;
  url: string;
  filename: string;
}

export interface UploadAttachmentResponse {
  success: boolean;
  url: string;
  filename: string;
  originalName: string;
  fileType: string;
}

// ─── AI Sermon Pipeline ──────────────────────────────────────────────────────

export type SermonJobStatus = 'uploaded' | 'processing' | 'completed' | 'failed';
export type PipelineStageStatus = 'pending' | 'processing' | 'done' | 'failed';
export type AISectionType = 'introduction' | 'point' | 'conclusion';

export interface PipelineStage {
  status: PipelineStageStatus;
  error: string;
}

export interface AISection {
  type: AISectionType;
  title: string;
  content: string;
  scripture: string[];
}

export interface AIResult {
  titleSuggestions: string[];
  summary: string;
  sections: AISection[];
  keyThemes: string[];
  keyVerses: string[];
}

export interface SermonJob {
  _id: string;
  sourceFileUrl: string;
  sourceFileType: 'audio' | 'video' | 'document';
  originalFileName: string;
  userPrompt: string;
  church: string;
  status: SermonJobStatus;
  stages: {
    transcribing: PipelineStage;
    analyzing: PipelineStage;
    structuring: PipelineStage;
    saving: PipelineStage;
  };
  rawTranscript: string;
  errorMessage: string;
  aiResult: AIResult;
  createdAt: string;
  updatedAt: string;
}

export interface AIUploadResponse {
  success: boolean;
  jobId: string;
  fileUrl: string;
  fileType: 'audio' | 'video' | 'document';
  originalFileName: string;
  filename: string;
}

export interface AIProcessResponse {
  success: boolean;
  message: string;
  jobId: string;
}

export interface AIStatusResponse {
  success: boolean;
  data: SermonJob;
}

export interface CreateSermonFromAIInput {
  jobId: string;
  title: string;
  preacher: string;
  date: string;
  scriptureReferences?: string[];
  summary?: string;
  church?: string;
  audioUrl?: string;
  video?: SermonVideo | null;
}

// ─── Announcements ───────────────────────────────────────────────────────────

export interface ApiAnnouncement {
  _id: string;
  title: string;
  description: string;
  expiresAt: string;
  church: string;
  /** Path relative to the API base URL, or null when there is no poster. */
  imagePath: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnouncementListResponse {
  success: boolean;
  total: number;
  data: ApiAnnouncement[];
}

export interface AnnouncementInput {
  title: string;
  description: string;
  /** ISO timestamp */
  expiresAt: string;
  church?: string;
  image?: File | null;
  removeImage?: boolean;
}

// ─── Message to the Youth ────────────────────────────────────────────────────

export interface ApiYouthMessage {
  _id: string;
  minister: string;
  message: string;
  bibleVerse: string;
  /** Service date, stored at 12:00 UTC — format with timeZone: 'UTC'. */
  date: string;
  church: string;
  createdAt: string;
  updatedAt: string;
}

export interface YouthMessageInput {
  minister: string;
  message: string;
  bibleVerse: string;
  /** YYYY-MM-DD */
  date: string;
  church?: string;
}

// ─── Toast ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
