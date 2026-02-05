"use client";

import { useState, useEffect } from "react";
import {
  Building2,
  Globe2,
  MoreVertical,
  Plus,
  Search,
  Shield,
  Trash2,
  User,
  UserCog,
  X,
} from "lucide-react";

export default function AdminUsers() {
  // 1. Live Database State
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");

  // 2. Modal States for Adding Employee
  const [isAddModalOpen, setAddModalOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState("MEMBER");
  const [newCountry, setNewCountry] = useState("USA");

  // 3. Fetch Real Employees from Database
  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  // Filter Logic (Search + Role Dropdown)
  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === "ALL" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  // 4. HANDLER: Add New Employee (WITH DEMO PASSWORD FIX)
  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newName,
          email: newEmail,
          password: "password123", // <--- FORCES DEMO PASSWORD FOR LOGIN PAGE
          role: newRole,
          country: newCountry,
        }),
      });

      if (res.ok) {
        setAddModalOpen(false);
        setNewName("");
        setNewEmail("");
        fetchUsers(); // Refresh table instantly
      }
    } catch (error) {
      console.error("Failed to add user:", error);
    }
  };

  // 5. HANDLER: Delete Employee
  const handleDelete = async (id: string) => {
    if (confirm("Are you sure? This will permanently delete this user.")) {
      try {
        const res = await fetch(`/api/users?id=${id}`, { method: "DELETE" });
        if (res.ok) fetchUsers();
      } catch (error) {
        console.error("Failed to delete user:", error);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
            User Management
          </h1>
          <p className="text-zinc-500 mt-2">
            Manage access and roles for all {users.length} employees.
          </p>
        </div>
        <button
          onClick={() => setAddModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 bg-zinc-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors shadow-lg shadow-zinc-200"
        >
          <Plus className="w-4 h-4" /> Add Employee
        </button>
      </div>

      <div className="bg-white border border-zinc-100 rounded-3xl overflow-hidden shadow-sm">
        {/* Toolbar */}
        <div className="p-4 border-b border-zinc-50 bg-zinc-50/50 flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-zinc-200 text-sm focus:outline-none focus:border-zinc-400 bg-white"
            />
          </div>
          <div className="flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
            <span>Filter:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent border-none focus:ring-0 text-zinc-900 font-bold cursor-pointer"
            >
              <option value="ALL">All Roles</option>
              <option value="ADMIN">Admins</option>
              <option value="MANAGER">Managers</option>
              <option value="MEMBER">Members</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-white border-b border-zinc-100">
              <tr>
                <th className="px-6 py-4 font-bold text-zinc-500 text-xs uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-4 font-bold text-zinc-500 text-xs uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-4 font-bold text-zinc-500 text-xs uppercase tracking-wider">
                  Region
                </th>
                <th className="px-6 py-4 font-bold text-zinc-500 text-xs uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-4 font-bold text-zinc-500 text-xs uppercase tracking-wider text-right">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {filteredUsers.map((user) => (
                <tr
                  key={user.id}
                  className="group hover:bg-zinc-50/80 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-500 text-xs uppercase">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900">{user.name}</p>
                        <p className="text-xs text-zinc-400 font-medium">
                          {user.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {user.role === "ADMIN" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-50 text-purple-700 text-[10px] font-black border border-purple-100 uppercase tracking-wide">
                        <Shield className="w-3 h-3" /> Admin
                      </span>
                    )}
                    {user.role === "MANAGER" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 text-[10px] font-black border border-blue-100 uppercase tracking-wide">
                        <UserCog className="w-3 h-3" /> Manager
                      </span>
                    )}
                    {user.role === "MEMBER" && (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-zinc-100 text-zinc-600 text-[10px] font-black border border-zinc-200 uppercase tracking-wide">
                        <User className="w-3 h-3" /> Member
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-zinc-600 font-medium text-xs">
                      {user.country === "USA" ? (
                        <Globe2 className="w-3.5 h-3.5" />
                      ) : (
                        <Building2 className="w-3.5 h-3.5" />
                      )}
                      {user.country === "USA" ? "USA" : "INDIA"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-block w-2 h-2 rounded-full mr-2 ${
                        user.isActive ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                    <span className="text-xs font-bold text-zinc-600">
                      {user.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 text-zinc-400 hover:text-zinc-900 hover:bg-zinc-200 rounded-lg transition-colors">
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="p-2 text-zinc-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="py-12 text-center">
              <p className="text-zinc-400 text-sm">No users found.</p>
            </div>
          )}
        </div>
      </div>

      {/* MODAL: ADD EMPLOYEE */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-black text-zinc-900">Add Employee</h2>
              <button
                onClick={() => setAddModalOpen(false)}
                className="text-zinc-400 hover:text-zinc-900"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddEmployee} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900"
                  placeholder="John Doe"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                  Work Email
                </label>
                <input
                  type="email"
                  required
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900"
                  placeholder="john@slooze.com"
                />
              </div>

              {/* PASSWORD INPUT HAS BEEN REMOVED FOR DEMO PURPOSES */}
              <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 font-medium">
                <strong>Note:</strong> New users are automatically assigned the
                demo password <code>password123</code> to ensure compatibility
                with the login screen.
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Role
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-white"
                  >
                    <option value="MEMBER">Member</option>
                    <option value="MANAGER">Manager</option>
                    <option value="ADMIN">Admin</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">
                    Country
                  </label>
                  <select
                    value={newCountry}
                    onChange={(e) => setNewCountry(e.target.value)}
                    className="w-full mt-1.5 h-12 px-4 rounded-xl border border-zinc-200 focus:outline-none focus:border-zinc-900 bg-white"
                  >
                    <option value="USA">USA</option>
                    <option value="INDIA">INDIA</option>
                  </select>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-4 bg-zinc-900 text-white font-bold rounded-xl hover:bg-orange-600 transition-colors mt-4"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
