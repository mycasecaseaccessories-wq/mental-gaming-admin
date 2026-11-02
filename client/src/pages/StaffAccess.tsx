import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, RefreshCw, Save, ShieldCheck, Users } from "lucide-react";

type Staff = { email: string; display_name: string | null; is_active: boolean; access_state: string; created_at: string; role_key: string; role_name: string };
type Role = { role_key: string; display_name: string; description: string | null; is_system: boolean; permissions: string[] };
type Permission = { permission_key: string; description: string | null };
type Audit = { id: number; actor_email: string; action: string; resource_type: string | null; resource_id: string | null; metadata: Record<string, unknown>; ip_address: string | null; user_agent: string | null; created_at: string };

async function readJson<T>(path: string): Promise<T> {
  const response = await fetch(path, { credentials: "include", headers: { Accept: "application/json" }, cache: "no-store" });
  const body = await response.json().catch(() => ({})) as { error?: string } & T;
  if (!response.ok) throw new Error(body.error || "အချက်အလက် ဖတ်ရှု၍ မရပါ။");
  return body;
}

const panel = "rounded-2xl border border-white/[0.07] bg-[#101827]/75";
const field = "h-10 w-full rounded-lg border border-white/10 bg-[#0b111d] px-3 text-sm text-slate-200 outline-none focus:border-cyan-200/40";
const button = "inline-flex h-10 items-center gap-2 rounded-lg bg-cyan-200 px-4 text-xs font-semibold text-slate-950 disabled:opacity-50";

export default function StaffAccess({ initialTab = "staff" }: { initialTab?: "staff" | "roles" | "activity" }) {
  const [tab, setTab] = useState<"staff" | "roles" | "activity">(initialTab);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roleDrafts, setRoleDrafts] = useState<Record<string, string[]>>({});
  const [savingRole, setSavingRole] = useState("");
  const [logs, setLogs] = useState<Audit[]>([]);
  const [email, setEmail] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [roleKey, setRoleKey] = useState("viewer");
  const [isActive, setIsActive] = useState(true);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  async function load() {
    setLoading(true); setError(""); setNotice("");
    try {
      if (tab === "staff") {
        const data = await readJson<{ items: Staff[] }>("/api/admin/access/staff");
        setStaff(data.items);
      } else if (tab === "roles") {
        const data = await readJson<{ roles: Role[]; permissions: Permission[] }>("/api/admin/access/roles");
        setRoles(data.roles); setPermissions(data.permissions);
        setRoleDrafts(Object.fromEntries(data.roles.map(role => [role.role_key, role.permissions])));
      } else {
        const data = await readJson<{ items: Audit[] }>("/api/admin/access/activity?limit=150");
        setLogs(data.items);
      }
    } catch (e) { setError(e instanceof Error ? e.message : "Admin data ဖတ်ရှု၍ မရပါ။"); }
    finally { setLoading(false); }
  }

  useEffect(() => { void load(); }, [tab]);

  function edit(item: Staff) {
    setEmail(item.email); setDisplayName(item.display_name ?? "");
    setRoleKey(item.role_key); setIsActive(item.is_active); setNewPassword("");
    setEditing(true); setNotice(""); setError("");
  }

  function resetForm() {
    setEmail(""); setDisplayName(""); setNewPassword(""); setRoleKey("viewer");
    setIsActive(true); setEditing(false);
  }

  function togglePermission(roleKey: string, permissionKey: string, checked: boolean) {
    setRoleDrafts(current => {
      const currentPermissions = current[roleKey] ?? [];
      const next = checked ? [...new Set([...currentPermissions, permissionKey])] : currentPermissions.filter(permission => permission !== permissionKey);
      return { ...current, [roleKey]: next };
    });
  }

  async function saveRole(role: Role) {
    setSavingRole(role.role_key); setError(""); setNotice("");
    try {
      const csrfResponse = await fetch("/api/admin-auth/csrf", { credentials: "include", cache: "no-store" });
      const csrf = await csrfResponse.json() as { csrfToken?: string; error?: string };
      if (!csrfResponse.ok || !csrf.csrfToken) throw new Error(csrf.error || "Security token မရရှိပါ။");
      const response = await fetch("/api/admin/access/roles/" + encodeURIComponent(role.role_key), {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf.csrfToken, Accept: "application/json" },
        body: JSON.stringify({ permissions: roleDrafts[role.role_key] ?? [] }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Permission သိမ်းဆည်း၍ မရပါ။");
      await load();
      setNotice(role.display_name + " Permission များကို သိမ်းဆည်းပြီးပါပြီ။");
    } catch (e) { setError(e instanceof Error ? e.message : "Permission သိမ်းဆည်း၍ မရပါ။"); }
    finally { setSavingRole(""); }
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const csrfResponse = await fetch("/api/admin-auth/csrf", { credentials: "include", cache: "no-store" });
      const csrf = await csrfResponse.json() as { csrfToken?: string; error?: string };
      if (!csrfResponse.ok || !csrf.csrfToken) throw new Error(csrf.error || "Security token မရရှိပါ။");
      const response = await fetch("/api/admin/access/staff", {
        method: "POST", credentials: "include",
        headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf.csrfToken, Accept: "application/json" },
        body: JSON.stringify({ email, displayName, roleKey, isActive }),
      });
      const body = await response.json().catch(() => ({})) as { error?: string };
      if (!response.ok) throw new Error(body.error || "Staff သိမ်းဆည်း၍ မရပါ။");
      if (newPassword) {
        const passwordResponse = await fetch("/api/admin/access/staff/" + encodeURIComponent(email) + "/password", {
          method: "POST", credentials: "include",
          headers: { "Content-Type": "application/json", "X-CSRF-Token": csrf.csrfToken, Accept: "application/json" },
          body: JSON.stringify({ password: newPassword }),
        });
        const passwordBody = await passwordResponse.json().catch(() => ({})) as { error?: string };
        if (!passwordResponse.ok) throw new Error(passwordBody.error || "Staff password သတ်မှတ်၍ မရပါ။");
      }
      const passwordWasSet = Boolean(newPassword);
      resetForm();
      await load();
      setNotice(passwordWasSet ? "Staff အကောင့်နှင့် Login Password ကို သိမ်းဆည်းပြီးပါပြီ။" : "Staff အချက်အလက်ကို သိမ်းဆည်းပြီးပါပြီ။");
    } catch (e) { setError(e instanceof Error ? e.message : "Staff သိမ်းဆည်း၍ မရပါ။"); }
    finally { setSaving(false); }
  }

  return <div>
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div><p className="text-xs font-semibold uppercase tracking-wider text-cyan-200/80">Security · Admin Supabase</p><h2 className="mt-2 text-2xl font-semibold text-white">Staff & Access Control</h2><p className="mt-2 text-sm text-slate-400">ဝန်ထမ်းစာရင်း၊ Role Permission နှင့် Admin လုပ်ဆောင်မှုမှတ်တမ်းများ။</p></div>
      <button type="button" onClick={() => void load()} disabled={loading} className="inline-flex h-10 items-center gap-2 rounded-xl border border-white/10 px-4 text-sm text-slate-200 disabled:opacity-50"><RefreshCw size={15} className={loading ? "animate-spin" : ""}/> Refresh</button>
    </div>
    <div className="mb-4 flex flex-wrap gap-2">
      {([{id:"staff",label:"Staff",icon:Users},{id:"roles",label:"Roles & Permissions",icon:ShieldCheck},{id:"activity",label:"Activity Logs",icon:Activity}] as const).map(item => {
        const Icon=item.icon;
        return <button key={item.id} type="button" onClick={()=>setTab(item.id)} className={`inline-flex h-10 items-center gap-2 rounded-lg border px-3 text-xs ${tab===item.id?"border-cyan-200/20 bg-cyan-200/10 text-cyan-100":"border-white/10 text-slate-400 hover:text-white"}`}><Icon size={15}/>{item.label}</button>;
      })}
    </div>
    {error && <p role="alert" className="mb-4 flex gap-2 rounded-xl border border-rose-300/20 bg-rose-300/[0.07] p-3 text-sm text-rose-200"><AlertCircle size={16}/>{error}</p>}
    {notice && <p role="status" className="mb-4 flex gap-2 rounded-xl border border-lime-300/20 bg-lime-300/[0.06] p-3 text-sm text-lime-100"><CheckCircle2 size={16}/>{notice}</p>}

    {tab==="staff" && <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className={panel+" overflow-hidden"}>
        <div className="border-b border-white/[0.07] px-4 py-4"><h3 className="text-sm font-semibold text-white">Staff Accounts</h3><p className="mt-1 text-xs text-slate-500">{staff.length} records · Admin Supabase</p></div>
        {loading?<p className="p-8 text-center text-sm text-slate-500">ဖတ်ရှုနေသည်…</p>:staff.length===0?<p className="p-8 text-center text-sm text-slate-500">Staff စာရင်း မရှိသေးပါ။</p>:<div className="overflow-x-auto"><table className="w-full min-w-[600px] text-left text-xs"><thead className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><tr><th className="px-4 py-3">Account</th><th className="px-4 py-3">Role</th><th className="px-4 py-3">Login</th><th className="px-4 py-3">Status</th><th className="px-4 py-3">Action</th></tr></thead><tbody className="divide-y divide-white/[0.05]">{staff.map(s=><tr key={s.email} className="text-slate-300"><td className="px-4 py-3"><p>{s.display_name||"—"}</p><p className="mt-1 break-all text-[10px] text-slate-500">{s.email}</p></td><td className="px-4 py-3">{s.role_name}</td><td className="px-4 py-3 text-amber-200">{s.access_state==="pending_auth"?"Pending login setup":s.access_state}</td><td className="px-4 py-3">{s.is_active?"Enabled":"Disabled"}</td><td className="px-4 py-3">{s.role_key==="super_admin"?<span className="text-[10px] text-amber-200">Protected</span>:<button type="button" onClick={()=>edit(s)} className="text-cyan-200 underline underline-offset-2">Edit</button>}</td></tr>)}</tbody></table></div>}
      </section>
      <form onSubmit={save} className={panel+" h-fit p-4"}>
        <h3 className="text-sm font-semibold text-white">{editing?"Staff ပြင်ဆင်ရန်":"Staff အသစ်ထည့်ရန်"}</h3>
        <p className="mt-1 text-xs leading-5 text-slate-500">Email နှင့် Role ကို သတ်မှတ်ပါ။ Password ကို scrypt hash အဖြစ်သာ သိမ်းဆည်းသည်။</p>
        <label className="mt-4 block text-xs text-slate-400">Email<input required type="email" maxLength={320} value={email} onChange={e=>setEmail(e.target.value)} className={field+" mt-2"} placeholder="staff@example.com" /></label>
        <label className="mt-3 block text-xs text-slate-400">Display name<input maxLength={100} value={displayName} onChange={e=>setDisplayName(e.target.value)} className={field+" mt-2"} placeholder="Staff name" /></label>
        <label className="mt-3 block text-xs text-slate-400">{editing?"Password အသစ် (မပြောင်းလိုပါက ချန်ထားပါ)":"Login Password"}<input type="password" autoComplete="new-password" minLength={12} maxLength={128} value={newPassword} onChange={e=>setNewPassword(e.target.value)} className={field+" mt-2"} placeholder="အနည်းဆုံး ၁၂ လုံး" /></label>
        <label className="mt-3 block text-xs text-slate-400">Role<select value={roleKey} onChange={e=>setRoleKey(e.target.value)} className={field+" mt-2"}>{["admin","manager","staff","viewer"].map(v=><option key={v} value={v}>{v}</option>)}</select></label>
        <label className="mt-4 flex items-center gap-2 text-xs text-slate-300"><input type="checkbox" checked={isActive} onChange={e=>setIsActive(e.target.checked)} className="accent-cyan-300"/> Account enabled</label>
        <div className="mt-5 flex gap-2"><button type="submit" disabled={saving} className={button}><Save size={14}/>{saving?"သိမ်းနေသည်…":"သိမ်းဆည်းရန်"}</button>{editing&&<button type="button" onClick={resetForm} className="h-10 rounded-lg border border-white/10 px-3 text-xs text-slate-300">Cancel</button>}</div>
      </form>
    </div>}

    {tab==="roles" && <section className={panel+" overflow-hidden"}>
      <div className="border-b border-white/[0.07] px-4 py-4"><h3 className="text-sm font-semibold text-white">Role Permission Matrix</h3><p className="mt-1 text-xs text-slate-500">Permission များကို ပြင်ဆင်ပြီး Save လုပ်နိုင်သည်။ Super Admin Role ကို အမြဲကာကွယ်ထားသည်။</p></div>
      {loading?<p className="p-8 text-center text-sm text-slate-500">ဖတ်ရှုနေသည်…</p>:<div className="space-y-3 p-4">{roles.map(role=><article key={role.role_key} className="rounded-xl border border-white/[0.07] bg-[#0b111d]/70 p-4"><div className="flex flex-wrap items-center justify-between gap-2"><div><p className="text-sm font-semibold text-white">{role.display_name}</p><p className="mt-1 text-[10px] text-slate-500">{role.role_key} · {role.description||"System role"}</p></div>{role.role_key==="super_admin"?<span className="rounded-md border border-amber-200/10 px-2 py-1 text-[10px] text-amber-200">Protected</span>:<button type="button" onClick={()=>void saveRole(role)} disabled={savingRole!==""} className={button}><Save size={13}/>{savingRole===role.role_key?"သိမ်းနေသည်…":"Permission သိမ်းရန်"}</button>}</div>
      <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{permissions.map(permission=><label key={permission.permission_key} className="flex items-start gap-2 rounded-lg border border-white/[0.05] p-2 text-xs text-slate-300"><input type="checkbox" checked={(roleDrafts[role.role_key]??role.permissions).includes(permission.permission_key)} disabled={role.role_key==="super_admin"||savingRole!==""} onChange={event=>togglePermission(role.role_key,permission.permission_key,event.target.checked)} className="mt-0.5 accent-cyan-300"/><span><span className="block">{permission.permission_key}</span>{permission.description&&<span className="mt-1 block text-[10px] text-slate-500">{permission.description}</span>}</span></label>)}</div></article>)}</div>}
      <div className="border-t border-white/[0.06] px-4 py-3 text-xs text-slate-500">Permission catalog: {permissions.length} · ပြင်ဆင်မှုအားလုံးကို Audit Log ထဲ မှတ်တမ်းတင်သည်။</div>
    </section>}

    {tab==="activity" && <section className={panel+" overflow-hidden"}>
      <div className="border-b border-white/[0.07] px-4 py-4"><h3 className="text-sm font-semibold text-white">Admin Activity Logs</h3><p className="mt-1 text-xs text-slate-500">Admin access control ဆိုင်ရာ လုပ်ဆောင်မှုမှတ်တမ်းများ။</p></div>
      {loading?<p className="p-8 text-center text-sm text-slate-500">ဖတ်ရှုနေသည်…</p>:logs.length===0?<p className="p-8 text-center text-sm text-slate-500">မှတ်တမ်း မရှိသေးပါ။</p>:<div className="overflow-x-auto"><table className="w-full min-w-[700px] text-left text-xs"><thead className="border-b border-white/[0.06] text-[10px] uppercase text-slate-500"><tr><th className="px-4 py-3">Time</th><th className="px-4 py-3">Admin</th><th className="px-4 py-3">Action</th><th className="px-4 py-3">Resource</th><th className="px-4 py-3">Details</th></tr></thead><tbody className="divide-y divide-white/[0.05]">{logs.map(l=><tr key={l.id} className="text-slate-300"><td className="px-4 py-3 text-slate-500">{new Date(l.created_at).toLocaleString("en-GB")}</td><td className="px-4 py-3">{l.actor_email}</td><td className="px-4 py-3">{l.action}</td><td className="px-4 py-3">{l.resource_type||"—"} {l.resource_id||""}</td><td className="px-4 py-3 text-slate-500">{JSON.stringify(l.metadata)}</td></tr>)}</tbody></table></div>}
    </section>}
    <p className="mt-4 text-[11px] leading-5 text-slate-600">သတိပြုရန် — Staff များသည် သတ်မှတ်ထားသော Email နှင့် Password ဖြင့် ဝင်နိုင်သည်။ Permission ပြောင်းလဲခြင်း သို့မဟုတ် Account ပိတ်ခြင်းဖြင့် နောက်တစ်ကြိမ် request မှစ၍ ခွင့်ပြုချက်ကို ပြန်စစ်ဆေးမည်။</p>
  </div>;
}
