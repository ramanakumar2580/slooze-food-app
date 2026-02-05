"use client";

import { useState, useEffect } from "react";
import { useUserStore } from "@/store/useUserStore";
import {
  Building2,
  CreditCard,
  Globe2,
  Mail,
  MapPin,
  ShieldAlert,
  Users,
} from "lucide-react";

export default function ManagerRegion() {
  const { user } = useUserStore();

  // 1. Live State for Database Team
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [team, setTeam] = useState<any[]>([]);

  // Local State for interactive controls (To be connected to DB settings table later)
  const [isOverdraftEnabled, setIsOverdraftEnabled] = useState(false);
  const [isOperationsStopped, setIsOperationsStopped] = useState(false);

  // 2. Fetch Real Regional Team from Database
  useEffect(() => {
    const fetchTeam = async () => {
      if (!user) return;
      try {
        // We fetch ALL users, then filter to show only Members in this Manager's country
        const res = await fetch("/api/users");
        if (res.ok) {
          const allUsers = await res.json();
          const myTeam = allUsers.filter(
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (u: any) => u.country === user.country && u.role === "MEMBER",
          );
          setTeam(myTeam);
        }
      } catch (error) {
        console.error("Failed to fetch team:", error);
      }
    };

    fetchTeam();
  }, [user]);

  if (!user) return null;

  return (
    <div className="space-y-8">
      {/* 1. Region Header */}
      <div className="relative overflow-hidden rounded-3xl bg-white border border-zinc-200 p-8 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-zinc-900 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-zinc-200">
              {user.country === "USA" ? (
                <Globe2 size={40} />
              ) : (
                <Building2 size={40} />
              )}
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-3xl font-black text-zinc-900 tracking-tight">
                  {user.country === "USA"
                    ? "North America HQ"
                    : "India Operations"}
                </h1>
                {/* Dynamic Status Badge */}
                {isOperationsStopped ? (
                  <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full border border-red-200 animate-pulse">
                    Halted
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">
                    Active
                  </span>
                )}
              </div>
              <div className="flex items-center gap-4 text-sm text-zinc-500 font-medium">
                <span className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {user.country === "USA" ? "New York, NY" : "Hyderabad, TG"}
                </span>
                <span className="flex items-center gap-1">
                  <Users className="w-4 h-4" />
                  {team.length} Employees
                </span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end">
            <p className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-1">
              Daily Budget Cap
            </p>
            <p className="text-3xl font-black text-zinc-900">$25.00</p>
            <p className="text-xs text-zinc-500 font-medium mt-1">
              per employee / day
            </p>
          </div>
        </div>

        <div className="absolute top-0 right-0 w-64 h-64 bg-zinc-50 rounded-full blur-3xl -mr-16 -mt-16 -z-0" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 2. LIVE Team List Column */}
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-xl font-bold text-zinc-900">Regional Team</h2>
          <div className="bg-white border border-zinc-100 rounded-2xl overflow-hidden shadow-sm">
            <div className="divide-y divide-zinc-50">
              {team.length === 0 ? (
                <div className="p-6 text-center text-zinc-400 font-medium">
                  No members assigned to {user.country} region yet.
                </div>
              ) : (
                team.map((member) => (
                  <div
                    key={member.id}
                    className="p-4 flex items-center justify-between hover:bg-zinc-50/50 transition-colors group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center font-bold text-zinc-400 text-sm uppercase">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-zinc-900 text-sm">
                          {member.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-zinc-500">
                          <Mail className="w-3 h-3" /> {member.email}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs font-medium text-zinc-400 bg-zinc-50 px-2 py-1 rounded border border-zinc-100">
                        {member.role}
                      </span>
                      <div
                        className={`w-2 h-2 rounded-full ${
                          member.isActive ? "bg-green-500" : "bg-red-500"
                        }`}
                        title={member.isActive ? "Active" : "Inactive"}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* 3. Settings / Policy Column */}
        <div className="space-y-6">
          <h2 className="text-xl font-bold text-zinc-900">Regional Policy</h2>

          <div className="bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm space-y-6">
            {/* OVERDRAFT TOGGLE */}
            <div>
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-4 h-4 text-zinc-900" />
                <h3 className="font-bold text-zinc-900 text-sm">
                  Allow Overdraft?
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                Allow employees to order slightly above $25 if they pay the
                difference.
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsOverdraftEnabled(!isOverdraftEnabled)}
                  className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${
                    isOverdraftEnabled ? "bg-green-500" : "bg-zinc-200"
                  }`}
                >
                  <div
                    className={`absolute top-1 w-3 h-3 bg-white rounded-full shadow-sm transition-all duration-200 ${
                      isOverdraftEnabled ? "left-[22px]" : "left-1"
                    }`}
                  />
                </button>
                <span
                  className={`text-xs font-bold transition-colors ${
                    isOverdraftEnabled ? "text-green-600" : "text-zinc-400"
                  }`}
                >
                  {isOverdraftEnabled ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            {/* OPERATIONS SHUTDOWN TOGGLE */}
            <div className="pt-6 border-t border-zinc-50">
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert
                  className={`w-4 h-4 ${
                    isOperationsStopped ? "text-green-600" : "text-orange-600"
                  }`}
                />
                <h3 className="font-bold text-zinc-900 text-sm">
                  {isOperationsStopped
                    ? "Resume Operations"
                    : "Emergency Shutdown"}
                </h3>
              </div>
              <p className="text-xs text-zinc-500 mb-3">
                {isOperationsStopped
                  ? `Ordering is currently paused for the ${user.country} region.`
                  : `Stop all ordering for ${user.country} immediately.`}
              </p>
              <button
                onClick={() => setIsOperationsStopped(!isOperationsStopped)}
                className={`w-full py-2 border rounded-lg text-xs font-bold transition-all ${
                  isOperationsStopped
                    ? "bg-green-50 text-green-600 border-green-100 hover:bg-green-100"
                    : "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                }`}
              >
                {isOperationsStopped ? "Start Operations" : "Stop Operations"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
