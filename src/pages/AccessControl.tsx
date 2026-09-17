import { useState, useEffect, useMemo } from "react";
import { 
  Users, UserPlus, Shield, ShieldAlert, Mail, Search, Filter, 
  CheckCircle2, XCircle, Lock, Unlock, ArrowRight,
  ShieldCheck, ArrowLeft, RefreshCw, Eye, Loader2, Trash2,
} from "lucide-react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";

type Role = "USER" | "SELLER" | "ADMIN" | "STAFF";

type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
  isDisabled: boolean;
  clerkId: string;
  createdAt: string;
  loginType: "CLERK" | "CUSTOM" | "STAFF";
};

const roleStyles: Record<Role, { bg: string; text: string; icon: any }> = {
  ADMIN: { bg: "bg-indigo-500/20 border border-indigo-500/30", text: "text-indigo-400", icon: <ShieldAlert size={14} /> },
  SELLER: { bg: "bg-white/10 border border-white/20", text: "text-white", icon: <ShieldCheck size={14} /> },
  USER: { bg: "bg-white/5 border border-white/10", text: "text-slate-300", icon: <Users size={14} /> },
  STAFF: { bg: "bg-white/5 border border-white/10", text: "text-slate-300", icon: <ShieldCheck size={14} /> },
};

export default function AccessControl() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<"ALL" | Role>("ALL");
  const [loginTypeFilter, setLoginTypeFilter] = useState<"ALL" | "CLERK" | "CUSTOM">("ALL");
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const navigate = useNavigate();

  // Invite/Add state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newRole, setNewRole] = useState<Role>("USER");
  const [adding, setAdding] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = () => {
    setLoading(true);
    fetch("http://localhost:15432/api/admin/users")
      .then(async (res) => {
        if (!res.ok) throw new Error("Forbidden");
        return res.json();
      })
      .then(setUsers)
      .catch((err) => alert(err.message || "Access denied"))
      .finally(() => setLoading(false));
  };

  const directAddUser = async () => {
    if (!email || !name || !password) {
      alert("Name, Email and Password are required");
      return;
    }
    setAdding(true);
    try {
      const res = await fetch("http://localhost:15432/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role: newRole }),
      });
      if (res.ok) {
        alert("User added successfully");
        setName("");
        setEmail("");
        setPassword("");
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data?.error || "Creation failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setAdding(false);
    }
  };



  const changeRole = async (userId: string, role: Role) => {
    setActionUserId(userId);
    try {
      const res = await fetch("http://localhost:15432/api/admin/users/role", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetUserId: userId, role }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role } : u));
      } else {
        alert("Failed to update role");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionUserId(null);
    }
  };

  const toggleUserStatus = async (user: User) => {
    setActionUserId(user.id);
    try {
      const res = await fetch("http://localhost:15432/api/admin/users/disable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetUserId: user.id,
          disable: !user.isDisabled
        }),
      });
      if (res.ok) {
        setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isDisabled: !u.isDisabled } : u));
      } else {
        alert("Status update failed");
      }
    } catch {
      alert("Network error");
    } finally {
      setActionUserId(null);
    }
  };

  const deleteUser = async (user: User) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "${user.name || user.email}"? This action cannot be undone.`)) {
      return;
    }
    setDeletingId(user.id);
    try {
      const res = await fetch(`http://localhost:15432/api/admin/users?userId=${user.id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== user.id));
      } else {
        const data = await res.json();
        alert(data?.error || "Failed to delete user");
      }
    } catch {
      alert("Network error");
    } finally {
      setDeletingId(null);
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch = u.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           u.email.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
      const matchesLoginType = loginTypeFilter === "ALL" || 
                              (loginTypeFilter === "CUSTOM" && u.loginType === "CUSTOM") ||
                              (loginTypeFilter === "CLERK" && u.loginType === "CLERK") ||
                              (loginTypeFilter === "CUSTOM" && u.loginType === "STAFF"); 
      return matchesSearch && matchesRole && matchesLoginType;
    });
  }, [users, searchQuery, roleFilter, loginTypeFilter]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0B0B1A] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <RefreshCw className="animate-spin text-slate-200" size={32} />
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Synchronizing users...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-[#0B0B1A] p-4 md:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* TOP HEADER */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-slate-200">
               <Shield size={20} />
               <span className="text-[10px] font-black uppercase tracking-[0.2em]">Administrative Control</span>
            </div>
            <h1 className="text-4xl font-black text-slate-200 tracking-tight">Access Management</h1>
            <p className="text-slate-500 max-w-lg font-medium">Configure team roles, permissions, and system-wide visibility controls for your staff.</p>
          </div>

          <div className="flex flex-wrap gap-3">
             <Link to="/dashboard/auto-apply" className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-transparent border border-white/10 text-slate-300 hover:bg-white/5 transition-all font-bold text-sm shadow-sm">
                <ArrowLeft size={16} /> Exit to Dashboard
             </Link>
          </div>
        </div>

        <div className="space-y-6">
          


          <div className="w-full space-y-6">
            
            {/* SEARCH & FILTER BAR */}
            <div className="bg-transparent p-4 rounded-3xl border border-white/10 shadow-sm flex flex-col md:flex-row gap-4">
               <div className="relative flex-1">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search by name or email..."
                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-transparent rounded-2xl outline-none focus:bg-transparent focus:border-white/10 text-slate-200 font-medium transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
               </div>
               <div className="flex gap-2">
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-2xl border border-white/5">
                     <Lock size={14} className="text-slate-400" />
                     <select 
                       className="bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-300 py-2 pr-4"
                       value={loginTypeFilter}
                       onChange={(e) => setLoginTypeFilter(e.target.value as any)}
                     >
                        <option value="ALL">All Logins</option>
                        <option value="CLERK">Clerk (External)</option>
                        <option value="CUSTOM">Custom (Local)</option>
                     </select>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/5 px-3 py-1 rounded-2xl border border-white/5">
                     <Filter size={14} className="text-slate-400" />
                     <select 
                       className="bg-transparent border-none outline-none font-black text-[11px] uppercase tracking-widest text-slate-300 py-2 pr-4"
                       value={roleFilter}
                       onChange={(e) => setRoleFilter(e.target.value as any)}
                     >
                        <option value="ALL">All Roles</option>
                        <option value="ADMIN">Admin</option>
                        <option value="SELLER">Seller</option>
                        <option value="USER">User</option>
                     </select>
                  </div>
               </div>
            </div>

            {/* USERS TABLE */}
            <div className="bg-transparent rounded-[32px] border border-white/10 shadow-xl overflow-hidden">
               <div className="overflow-x-auto">
                  <table className="w-full">
                     <thead>
                        <tr className="bg-white/5 border-b border-white/5">
                           <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">User Profile</th>
                           <th className="px-8 py-5 text-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Status / Role</th>
                           <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Administrative Actions</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-slate-50">
                        {filteredUsers.map((u) => (
                           <motion.tr 
                             key={u.id}
                             initial={{ opacity: 0 }}
                             animate={{ opacity: 1 }}
                             className="hover:bg-white/10 transition-colors group cursor-pointer"
                             onClick={() => {
                               navigate(`/dashboard/staff/${u.id}`);
                             }}
                           >
                              <td className="px-8 py-6">
                                 <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg border border-white/10 shadow-lg ${roleStyles[u.role]?.bg} ${roleStyles[u.role]?.text}`}>
                                       {u.name?.[0] || 'U'}
                                    </div>
                                    <div>
                                        <div className="font-black text-slate-200 group-hover:text-indigo-400 transition-colors block text-sm">
                                           {u.name || "Pending Account"}
                                        </div>
                                       <div className="text-xs text-slate-400 font-medium flex items-center gap-2">
                                          {u.email}
                                          <span className={`text-[8px] font-black px-1.5 py-0.5 rounded uppercase ${
                                            u.loginType === 'STAFF' ? 'bg-amber-500/10 text-amber-400' : 
                                            u.loginType === 'CUSTOM' ? 'bg-orange-500/10 text-orange-400' : 
                                            'bg-blue-500/10 text-blue-400'
                                          }`}>
                                             {u.loginType || 'UNKNOWN'}
                                          </span>
                                       </div>
                                    </div>
                                 </div>
                              </td>

                              <td className="px-8 py-6 text-center">
                                 <div className="flex flex-col items-center gap-2">
                                    <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full ${roleStyles[u.role]?.bg} ${roleStyles[u.role]?.text} text-[10px] font-black uppercase tracking-widest`}>
                                       {roleStyles[u.role]?.icon}
                                       {u.role}
                                    </div>
                                    <div className="flex items-center gap-1">
                                       <div className={`w-1.5 h-1.5 rounded-full ${u.isDisabled ? 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]' : 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]'}`} />
                                       <span className={`text-[9px] font-black uppercase tracking-tighter ${u.isDisabled ? 'text-rose-400' : 'text-emerald-400'}`}>
                                          {u.isDisabled ? "Access Revoked" : "Live Session"}
                                       </span>
                                    </div>
                                 </div>
                              </td>

                              <td className="px-8 py-6">
                                 <div className="flex items-center justify-end gap-3">
                                    <select 
                                      className="bg-transparent border border-white/10 rounded-xl px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-slate-500 hover:bg-white/5 transition-all cursor-pointer disabled:opacity-50"
                                      value={u.role}
                                      disabled={u.isDisabled || actionUserId === u.id}
                                      onChange={(e) => changeRole(u.id, e.target.value as Role)}
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                       <option value="USER">User</option>
                                       <option value="SELLER">Seller</option>
                                       <option value="ADMIN">Admin</option>
                                    </select>

                                    <div className="w-[1px] h-6 bg-white/5" />

                                     <button 
                                       disabled={actionUserId === u.id || deletingId === u.id}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         toggleUserStatus(u);
                                       }}
                                       className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${u.isDisabled ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-600 hover:text-slate-200' : 'bg-amber-500/10 text-amber-400 hover:bg-amber-600 hover:text-slate-200'} shadow-sm active:scale-90`}
                                       title={u.isDisabled ? "Grant Access" : "Revoke Access"}
                                     >
                                        {actionUserId === u.id ? <RefreshCw className="animate-spin" size={16} /> : (
                                           u.isDisabled ? <Unlock size={18} /> : <Lock size={18} />
                                        )}
                                     </button>

                                     <button 
                                       disabled={deletingId === u.id || actionUserId === u.id}
                                       onClick={(e) => {
                                         e.stopPropagation();
                                         deleteUser(u);
                                       }}
                                       className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-400 hover:bg-rose-600 hover:text-slate-200 flex items-center justify-center transition-all shadow-sm active:scale-90"
                                       title="Delete User Permanently"
                                     >
                                        {deletingId === u.id ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={18} />}
                                     </button>
                                 </div>
                              </td>
                           </motion.tr>
                        ))}
                     </tbody>
                  </table>
                  {filteredUsers.length === 0 && (
                     <div className="p-12 text-center space-y-2">
                        <Users className="mx-auto text-slate-200" size={48} />
                        <p className="text-slate-400 font-bold">No matching users found in your scope.</p>
                     </div>
                  )}
               </div>
            </div>

          </div>
        </div>

      </div>
      </div>
    </>
  );
}
