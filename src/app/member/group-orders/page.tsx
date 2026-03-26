/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import {
  Users,
  Plus,
  Search,
  ShieldCheck,
  Send,
  Trash2,
  Edit3,
  X,
  Check,
  Loader2,
  ChevronRight,
  Crown,
  UserMinus,
  LogOut,
} from "lucide-react";

export default function GroupOrdersPage() {
  const { user } = useUserStore();

  const [regionUsers, setRegionUsers] = useState<any[]>([]);
  const [myGroups, setMyGroups] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<"CREATED" | "JOINED">("CREATED");
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [pendingInvitee, setPendingInvitee] = useState<any>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const fetchData = async () => {
    if (!user) return;
    try {
      // CACHE BUSTING: Added a timestamp so Next.js never serves old ghost data
      const resUsers = await fetch(`/api/users?t=${Date.now()}`, {
        cache: "no-store",
      });
      if (resUsers.ok) {
        const data = await resUsers.json();

        const filtered = data.filter((u: any) => {
          const isSameRegion = u.country === user.country;
          const isNotMe = u.id !== user.id;

          if (user.role === "MANAGER") {
            return (
              isSameRegion &&
              isNotMe &&
              (u.role === "MEMBER" || u.role === "MANAGER")
            );
          }
          return isSameRegion && isNotMe && u.role === "MEMBER";
        });

        setRegionUsers(filtered);
      }

      // CACHE BUSTING
      const resGroups = await fetch(
        `/api/groups?region=${user.country}&t=${Date.now()}`,
        {
          cache: "no-store",
        },
      );
      if (resGroups.ok) {
        const groups = await resGroups.json();
        const filtered = groups.filter(
          (g: any) =>
            g.hostId === user.id ||
            g.members?.some((m: any) => m.id === user.id),
        );
        setMyGroups(filtered);
        if (!selectedGroupId && filtered.length > 0) {
          setSelectedGroupId(filtered[0].id);
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGroupName.trim()) return;
    setIsCreating(true);

    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newGroupName,
          hostId: user?.id,
          region: user?.country,
        }),
      });
      if (res.ok) {
        const actualGroup = await res.json();
        setSelectedGroupId(actualGroup.id);
        setNewGroupName("");
        setActiveTab("CREATED");
        await fetchData(); // Fetch clean data after server confirms
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteGroup = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this group permanently?"))
      return;

    try {
      const res = await fetch(`/api/groups/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error();

      alert("Group deleted successfully!");
      if (selectedGroupId === id) setSelectedGroupId(null);
      await fetchData(); // Fetch clean data after server confirms
    } catch {
      alert("Failed to delete group. Check database connection.");
      await fetchData();
    }
  };

  const handleUpdateName = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!editName.trim()) return;

    try {
      const res = await fetch(`/api/groups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName }),
      });
      if (!res.ok) throw new Error();

      alert("Group name updated successfully!");
      setEditingGroupId(null);
      await fetchData(); // Fetch clean data after server confirms
    } catch {
      alert("Failed to update name.");
      await fetchData();
    }
  };

  const handleRemoveMember = async (
    e: React.MouseEvent,
    groupId: string,
    memberId: string,
    memberName: string,
  ) => {
    e.stopPropagation();
    const isSelf = memberId === user?.id;
    const confirmMsg = isSelf ? "Leave this group?" : `Remove ${memberName}?`;

    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch(`/api/groups/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, memberId }),
      });
      if (res.ok) {
        if (isSelf) setSelectedGroupId(null);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const initiateInvite = (u: any) => {
    setPendingInvitee(u);
    setShowInviteModal(true);
  };

  const confirmInvite = async (groupId: string) => {
    if (!pendingInvitee) return;
    setShowInviteModal(false);
    try {
      await fetch("/api/groups/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "SEND",
          groupId,
          receiverId: pendingInvitee.id,
        }),
      });
      setPendingInvitee(null);
      alert(`Invitation Sent!`);
    } catch {
      alert("Failed to send invite");
    }
  };

  const groupsILead = myGroups.filter((g) => g.hostId === user?.id);
  const groupsIJoined = myGroups.filter((g) => g.hostId !== user?.id);
  const displayGroups = activeTab === "CREATED" ? groupsILead : groupsIJoined;

  if (!user) return null;

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] space-y-8 overflow-hidden">
      {/* 1. TOP SECTION */}
      <div className="bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shrink-0 border border-white/5">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-600/20 blur-[100px]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2 uppercase italic">
              <Plus className="text-orange-500 w-8 h-8" /> Start a Squad
            </h1>
            <p className="text-zinc-400 font-medium text-sm">
              Organize lunch with your team in {user.country}
            </p>
          </div>
          <form
            onSubmit={handleCreateGroup}
            className="flex gap-2 w-full max-w-md bg-white/5 p-1.5 rounded-2xl border border-white/10"
          >
            <input
              type="text"
              placeholder="Squad Name..."
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="flex-1 bg-transparent px-4 outline-none font-bold text-sm"
            />
            <button
              disabled={isCreating}
              className="bg-orange-600 px-6 py-2.5 rounded-xl font-black transition-all flex items-center gap-2 text-sm shadow-lg shadow-orange-900/40"
            >
              {isCreating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Create"
              )}
            </button>
          </form>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1 min-h-0">
        {/* 2. DIRECTORY (LEFT) */}
        <div className="lg:col-span-6 flex flex-col h-full bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm">
          <div className="p-6 border-b border-zinc-50 flex justify-between items-center bg-zinc-50/30">
            <h2 className="text-xl font-black text-zinc-900">Directory</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3 h-3 text-zinc-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-8 pr-4 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs outline-none focus:border-orange-500"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {regionUsers
              .filter((u) =>
                u.name.toLowerCase().includes(searchTerm.toLowerCase()),
              )
              .map((u) => (
                <div
                  key={u.id}
                  className="bg-white border border-zinc-100 p-4 rounded-2xl flex items-center justify-between group hover:shadow-md transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center font-black text-zinc-400 text-sm">
                      {u.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-bold text-zinc-900 text-sm">
                        {u.name}
                      </p>
                      <p className="text-[10px] text-zinc-400 font-black uppercase tracking-widest">
                        {u.role === "MANAGER" ? "Manager" : "Active Member"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => initiateInvite(u)}
                    className="p-2.5 text-zinc-300 hover:text-orange-600 transition-all hover:scale-110 active:scale-95"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              ))}
          </div>
        </div>

        {/* 3. YOUR SQUADS (RIGHT) */}
        <div className="lg:col-span-6 flex flex-col h-full bg-white rounded-[2.5rem] border border-zinc-100 overflow-hidden shadow-sm">
          <div className="p-4 border-b border-zinc-50 bg-zinc-50/30">
            <div className="flex bg-zinc-200/50 p-1 rounded-2xl">
              <button
                onClick={() => setActiveTab("CREATED")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "CREATED" ? "bg-white text-orange-600 shadow-sm" : "text-zinc-500"}`}
              >
                <Crown className="w-3.5 h-3.5" /> Created
              </button>
              <button
                onClick={() => setActiveTab("JOINED")}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === "JOINED" ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500"}`}
              >
                <Users className="w-3.5 h-3.5" /> Joined
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            <div className="space-y-4">
              {displayGroups.map((group) => (
                <div
                  key={group.id}
                  onClick={() => setSelectedGroupId(group.id)}
                  className={`p-5 rounded-3xl border-2 transition-all cursor-pointer relative shadow-sm ${selectedGroupId === group.id ? (activeTab === "CREATED" ? "border-orange-500 bg-orange-50/10" : "border-blue-500 bg-blue-50/10") : "border-zinc-50 bg-zinc-50/30 hover:border-zinc-200"}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 flex flex-col gap-2">
                      {selectedGroupId === group.id && (
                        <div className="mb-4 bg-white/50 p-3 rounded-2xl border border-zinc-100 animate-in fade-in slide-in-from-left-2">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-2 border-b pb-1">
                            Current Members
                          </p>
                          <div className="space-y-2">
                            {group.members?.map((m: any) => (
                              <div
                                key={m.id}
                                className="flex justify-between items-center text-xs font-bold text-zinc-700"
                              >
                                <span className="flex items-center gap-1.5">
                                  {m.id === group.hostId ? (
                                    <Crown className="w-3 h-3 text-orange-500" />
                                  ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-zinc-300" />
                                  )}
                                  {m.name} {m.id === user?.id && "(You)"}
                                </span>
                                {activeTab === "CREATED" &&
                                  m.id !== user?.id && (
                                    <button
                                      onClick={(e) =>
                                        handleRemoveMember(
                                          e,
                                          group.id,
                                          m.id,
                                          m.name,
                                        )
                                      }
                                      className="text-zinc-300 hover:text-red-600"
                                    >
                                      <UserMinus className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex justify-between items-center">
                        {editingGroupId === group.id ? (
                          <div className="flex gap-1 items-center w-full">
                            <input
                              className="bg-white border-2 border-orange-500 px-2 py-1 rounded-lg text-sm font-bold w-full outline-none"
                              value={editName}
                              autoFocus
                              onChange={(e) => setEditName(e.target.value)}
                            />
                            <button
                              onClick={(e) => handleUpdateName(e, group.id)}
                              className="text-green-600 p-1"
                            >
                              <Check className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingGroupId(null)}
                              className="text-red-600 p-1"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <>
                            <h3 className="font-black text-zinc-900 truncate">
                              {group.name}
                            </h3>
                            <div className="flex gap-2">
                              {activeTab === "CREATED" ? (
                                <>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingGroupId(group.id);
                                      setEditName(group.name);
                                    }}
                                    className="p-1.5 text-zinc-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                                  >
                                    <Edit3 className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={(e) =>
                                      handleDeleteGroup(e, group.id)
                                    }
                                    className="p-1.5 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </>
                              ) : (
                                <button
                                  onClick={(e) =>
                                    handleRemoveMember(
                                      e,
                                      group.id,
                                      user?.id as string,
                                      "",
                                    )
                                  }
                                  className="p-1.5 text-zinc-400 hover:text-red-600 flex items-center gap-1 text-[10px] font-bold italic"
                                >
                                  <LogOut className="w-3 h-3" /> Exit
                                </button>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <div className="flex -space-x-2">
                      {group.members?.map((m: any) => (
                        <div
                          key={m.id}
                          className="w-7 h-7 rounded-full border-2 border-white bg-zinc-200 flex items-center justify-center text-[10px] font-black text-white uppercase"
                        >
                          {m.name.charAt(0)}
                        </div>
                      ))}
                    </div>
                    {selectedGroupId === group.id && (
                      <ShieldCheck
                        className={`w-5 h-5 ${activeTab === "CREATED" ? "text-orange-600" : "text-blue-600"}`}
                      />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* INVITE MODAL */}
      {showInviteModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-[2.5rem] max-w-md w-full p-8 shadow-2xl relative">
            <button
              onClick={() => setShowInviteModal(false)}
              className="absolute top-6 right-6 p-2 text-zinc-400 hover:text-zinc-900"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-xl font-black text-zinc-900">
              Invite {pendingInvitee?.name}
            </h3>
            <div className="mt-6 space-y-2 max-h-64 overflow-y-auto custom-scrollbar pr-2">
              {groupsILead.map((group) => (
                <button
                  key={group.id}
                  onClick={() => confirmInvite(group.id)}
                  className="w-full flex justify-between items-center p-4 rounded-2xl border-2 border-zinc-50 hover:border-orange-600 hover:bg-orange-50 transition-all group"
                >
                  <span className="font-bold text-zinc-900">{group.name}</span>
                  <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-orange-600" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #f4f4f5;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}
