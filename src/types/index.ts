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
  series: string;
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
  series: string;
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
  page: number;
  pages: number;
  data: ApiSermonSummary[];
}

export interface SermonFilters {
  search?: string;
  preacher?: string;
  church?: string;
  year?: string;
  series?: string;
  page?: number;
  limit?: number;
}

export interface SermonMetaData {
  preachers: string[];
  churches: string[];
  series: string[];
}

export interface CreateSermonInput {
  title: string;
  preacher: string;
  date: string;
  series?: string;
  scriptureReferences?: string[];
  summary?: string;
  audioUrl?: string;
  video?: SermonVideo | null;
  content?: SermonContent;
  church?: string;
}

// ─── Series ─────────────────────────────────────────────────────────────────

export interface ApiSeries {
  _id: string;
  name: string;
  description: string;
  church: string;
  createdAt: string;
  updatedAt: string;
}

export interface SeriesListResponse {
  success: boolean;
  total: number;
  data: ApiSeries[];
}

export interface CreateSeriesInput {
  name: string;
  description?: string;
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

// ─── Toast ───────────────────────────────────────────────────────────────────

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}
