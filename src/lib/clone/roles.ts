// Company -> roles Pavan has applied for, each with the pitch its tailored CV led with.
// The data lives in the CLONE_ROLE_MAP env var (built by ~/.claude/scripts/build_clone_role_map.py)
// and never in this public repo. Large maps are stored gzip+base64.
import { gunzipSync } from 'node:zlib';
import { env } from './notify';

export interface AppliedRole {
  title: string;
  /** What the role needs and the angle Pavan's application took (generated from the application folder). */
  brief?: string;
  /** Opening of the tailored CV — fallback when no brief exists. */
  pitch?: string;
}

interface RoleCompany {
  name: string;
  keys: string[];
  roles: AppliedRole[];
}

let companies: RoleCompany[] | null = null;

function decode(raw: string): string {
  // 'H4sI' is the base64 of the gzip magic bytes.
  return raw.startsWith('H4sI') ? gunzipSync(Buffer.from(raw, 'base64')).toString('utf8') : raw;
}

function load(): RoleCompany[] {
  if (companies) return companies;
  const raw = env('CLONE_ROLE_MAP');
  try {
    companies = raw ? (JSON.parse(decode(raw)).companies ?? []) : [];
  } catch {
    console.error('CLONE_ROLE_MAP could not be decoded');
    companies = [];
  }
  return companies!;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function findAppliedRoles(company: string): { company: string; roles: AppliedRole[] } | null {
  const q = norm(company);
  if (q.length < 2) return null;
  const all = load();
  const exact = all.find((c) => c.keys.includes(q));
  const match =
    exact ??
    all.find((c) => c.keys.some((k) => k.length >= 4 && q.length >= 4 && (q.startsWith(k) || k.startsWith(q))));
  return match ? { company: match.name, roles: match.roles } : null;
}
