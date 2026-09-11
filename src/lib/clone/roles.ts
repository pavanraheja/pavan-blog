// Company -> roles Pavan has applied for, plus people he has reached out to.
// Primary source: the Redis index kept current by the daily sync. Fallback: the legacy CLONE_ROLE_MAP env var
// (gzip+base64 JSON with briefs inline), so the clone keeps working if the store is unreachable.
import { gunzipSync } from 'node:zlib';
import { env } from './notify';
import { getIndex, type Contact } from './store';

export interface AppliedRole {
  /** Application id in the store — present when the role came from the Redis index. */
  id?: string;
  title: string;
  /** Legacy map only: brief or CV pitch carried inline. */
  brief?: string;
  pitch?: string;
}

interface RoleCompany {
  name: string;
  keys: string[];
  roles: AppliedRole[];
}

let legacy: RoleCompany[] | null = null;

function loadLegacy(): RoleCompany[] {
  if (legacy) return legacy;
  const raw = env('CLONE_ROLE_MAP');
  try {
    // 'H4sI' is the base64 of the gzip magic bytes.
    const text = raw?.startsWith('H4sI') ? gunzipSync(Buffer.from(raw, 'base64')).toString('utf8') : raw;
    legacy = text ? (JSON.parse(text).companies ?? []) : [];
  } catch {
    console.error('CLONE_ROLE_MAP could not be decoded');
    legacy = [];
  }
  return legacy!;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

function matchCompany<T extends { keys: string[] }>(all: T[], q: string): T | undefined {
  return (
    all.find((c) => c.keys.includes(q)) ??
    all.find((c) => c.keys.some((k) => k.length >= 4 && q.length >= 4 && (q.startsWith(k) || k.startsWith(q))))
  );
}

async function companyRoles(company: string): Promise<{ name: string; roles: AppliedRole[] } | null> {
  const q = norm(company);
  if (q.length < 2) return null;
  const index = await getIndex();
  const match = index ? matchCompany(index.companies, q) : matchCompany(loadLegacy(), q);
  return match ? { name: match.name, roles: match.roles } : null;
}

export async function findAppliedRoles(
  company: string,
  visitorName?: string,
): Promise<{ company: string; roles: AppliedRole[]; contact?: Contact } | null> {
  const match = await companyRoles(company);
  let contact: Contact | undefined;
  if (visitorName) {
    const index = await getIndex();
    const q = norm(company);
    // Both name and company must match before the clone may mention prior outreach.
    contact = index?.contacts.find((c) => {
      const cc = norm(c.company);
      return norm(c.name) === norm(visitorName) && q.length >= 3 && (cc === q || cc.startsWith(q) || q.startsWith(cc));
    });
  }
  if (!match && !contact) return null;
  return { company: match?.name ?? contact!.company, roles: match?.roles ?? [], contact };
}

export async function findRole(company: string, roleTitle: string): Promise<AppliedRole | null> {
  const match = await companyRoles(company);
  if (!match?.roles.length) return null;
  const want = norm(roleTitle);
  return (
    match.roles.find((r) => norm(r.title) === want) ??
    match.roles.find((r) => norm(r.title).includes(want) || want.includes(norm(r.title))) ??
    (match.roles.length === 1 ? match.roles[0] : null)
  );
}
