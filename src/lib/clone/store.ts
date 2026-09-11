// The clone's live data store (Upstash Redis). Filled by the daily sync on Pavan's Mac:
//   clone:index        — companies → role ids/titles, plus recent outreach contacts
//   clone:docs:<id>    — the application's JD / tailored CV / cover letter text, for writing a brief
//   clone:brief:<id>   — the brief, written on first use and cached
// Nothing here lives in the public repo.
import { Redis } from '@upstash/redis';
import { env } from './notify';

export interface IndexRole {
  id: string;
  title: string;
}

export interface IndexCompany {
  name: string;
  keys: string[];
  roles: IndexRole[];
}

export interface Contact {
  name: string;
  company: string;
  context: string;
  date: string;
  channel?: string;
}

export interface CloneIndex {
  updated: string;
  companies: IndexCompany[];
  contacts: Contact[];
}

export interface RoleDocs {
  company: string;
  title: string;
  jd?: string;
  cv?: string;
  cover?: string;
}

const INDEX_TTL_MS = 5 * 60 * 1000;

let redis: Redis | null | undefined;
let cachedIndex: { index: CloneIndex; at: number } | null = null;

function client(): Redis | null {
  if (redis !== undefined) return redis;
  const url = env('KV_REST_API_URL') ?? env('UPSTASH_REDIS_REST_URL');
  const token = env('KV_REST_API_TOKEN') ?? env('UPSTASH_REDIS_REST_TOKEN');
  redis = url && token ? new Redis({ url, token }) : null;
  return redis;
}

export async function getIndex(): Promise<CloneIndex | null> {
  const r = client();
  if (!r) return null;
  if (cachedIndex && Date.now() - cachedIndex.at < INDEX_TTL_MS) return cachedIndex.index;
  try {
    const index = await r.get<CloneIndex>('clone:index');
    if (index) cachedIndex = { index, at: Date.now() };
    return index ?? cachedIndex?.index ?? null;
  } catch (err) {
    console.error('clone index read failed', err);
    return cachedIndex?.index ?? null;
  }
}

export async function getDocs(id: string): Promise<RoleDocs | null> {
  const r = client();
  return r ? r.get<RoleDocs>(`clone:docs:${id}`) : null;
}

export async function getBrief(id: string): Promise<string | null> {
  const r = client();
  return r ? r.get<string>(`clone:brief:${id}`) : null;
}

export async function setBrief(id: string, brief: string): Promise<void> {
  const r = client();
  if (r) await r.set(`clone:brief:${id}`, brief);
}
