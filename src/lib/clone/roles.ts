// Company -> roles Pavan has applied for. The data lives in the CLONE_ROLE_MAP env var
// (built by ~/.claude/scripts/build_clone_role_map.py) and never in this public repo.
import { env } from './notify';

interface RoleCompany {
  name: string;
  keys: string[];
  roles: string[];
}

let companies: RoleCompany[] | null = null;

function load(): RoleCompany[] {
  if (companies) return companies;
  const raw = env('CLONE_ROLE_MAP');
  try {
    companies = raw ? (JSON.parse(raw).companies ?? []) : [];
  } catch {
    console.error('CLONE_ROLE_MAP is not valid JSON');
    companies = [];
  }
  return companies!;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '');

export function findAppliedRoles(company: string): { company: string; roles: string[] } | null {
  const q = norm(company);
  if (q.length < 2) return null;
  const all = load();
  const exact = all.find((c) => c.keys.includes(q));
  const match =
    exact ??
    all.find((c) => c.keys.some((k) => k.length >= 4 && q.length >= 4 && (q.startsWith(k) || k.startsWith(q))));
  return match ? { company: match.name, roles: match.roles } : null;
}
