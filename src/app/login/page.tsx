"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Crown,
  Globe2,
  Shield,
  User,
  UtensilsCrossed,
  Loader2,
} from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useUserStore((state) => state.login);

  // 1. LIVE DATABASE STATE
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [loadingEmail, setLoadingEmail] = useState<string | null>(null);
  const [error, setError] = useState("");

  // 2. FETCH REAL USERS FROM DB ON LOAD
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/users");
        if (res.ok) {
          const users = await res.json();

          // Filter active users
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const activeUsers = users.filter((u: any) => u.isActive);

          // SORTING LOGIC: Admin -> Manager -> Member
          const roleOrder: { [key: string]: number } = {
            ADMIN: 1,
            MANAGER: 2,
            MEMBER: 3,
          };

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          activeUsers.sort((a: any, b: any) => {
            return (roleOrder[a.role] || 99) - (roleOrder[b.role] || 99);
          });

          setDbUsers(activeUsers);
        }
      } catch (err) {
        console.error("Failed to fetch users", err);
      } finally {
        setIsLoadingUsers(false);
      }
    };
    fetchUsers();
  }, []);

  // 3. REAL DATABASE LOGIN HANDLER
  const handleLogin = async (email: string) => {
    setLoadingEmail(email);
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Using the default password we set in the seed file
        body: JSON.stringify({ email, password: "password123" }),
      });

      const userData = await res.json();

      if (!res.ok) {
        throw new Error(userData.error || "Login failed");
      }

      // 4. Save REAL database user to Zustand store
      login({
        id: userData.id, // Real UUID from DB
        name: userData.name,
        role: userData.role,
        country: userData.country,
      });

      // 5. Redirect based on REAL database role
      if (userData.role === "ADMIN") {
        router.push("/admin/dashboard");
      } else if (userData.role === "MANAGER") {
        router.push("/manager/dashboard");
      } else {
        router.push("/member/dashboard");
      }
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoadingEmail(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 w-screen h-screen flex items-center justify-center bg-zinc-100 p-4 sm:p-8 backdrop-blur-sm">
      <div className="w-full max-w-7xl h-full max-h-[900px] grid lg:grid-cols-[45%_55%] bg-white rounded-3xl overflow-hidden shadow-2xl ring-1 ring-zinc-200">
        {/* LEFT SIDE: Image */}
        <div className="hidden lg:flex relative h-full w-full bg-zinc-900 text-white flex-col justify-between p-12">
          <div className="absolute inset-0 z-0">
            <div
              className="absolute inset-0 bg-cover bg-center grayscale-[20%]"
              style={{
                backgroundImage:
                  'url("https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?q=80&w=2070&auto=format&fit=crop")',
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
          </div>

          <div className="relative z-10">
            <Link
              href="/"
              className="group inline-flex items-center text-white/90 hover:text-white transition-colors font-medium px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 hover:bg-white/20"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Home
            </Link>
          </div>

          <div className="relative z-10 space-y-6 max-w-md">
            <div className="w-16 h-16 rounded-2xl bg-orange-600 flex items-center justify-center shadow-2xl shadow-orange-900/50">
              <UtensilsCrossed className="w-8 h-8 text-white" />
            </div>
            <blockquote className="space-y-4">
              <p className="text-3xl font-bold leading-tight tracking-tight">
                Workplace dining, <br />
                <span className="text-orange-400">reimagined.</span>
              </p>
              <p className="text-lg text-white/80 font-medium leading-relaxed">
                Experience the seamless flow of Slooze. From order to delivery,
                we handle the complexity so you can focus on work.
              </p>
            </blockquote>
          </div>
        </div>

        {/* RIGHT SIDE: Dynamic Content */}
        <div className="h-full w-full flex flex-col justify-center items-center p-8 lg:p-12 relative bg-white">
          <div className="absolute top-6 left-6 lg:hidden">
            <Link
              href="/"
              className="inline-flex items-center text-zinc-500 hover:text-zinc-900 transition-colors font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Home
            </Link>
          </div>

          <div className="w-full max-w-xl space-y-8">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-3xl font-extrabold tracking-tight text-zinc-900">
                Welcome Back
              </h1>
              <p className="text-base text-zinc-500 font-medium">
                Select your live database account to access the system.
              </p>
            </div>

            {error && (
              <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg text-center font-bold">
                {error}
              </div>
            )}

            {/* DYNAMIC LIST OF USERS FROM DATABASE */}
            {isLoadingUsers ? (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-orange-600" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 pb-2">
                {dbUsers.map((u) => {
                  // Determine Icon and Color based on Role
                  const Icon =
                    u.role === "ADMIN"
                      ? Crown
                      : u.role === "MANAGER"
                        ? Shield
                        : User;
                  const color =
                    u.role === "ADMIN"
                      ? "bg-orange-100 text-orange-700 border-orange-200"
                      : u.role === "MANAGER"
                        ? "bg-blue-100 text-blue-700 border-blue-200"
                        : "bg-emerald-100 text-emerald-700 border-emerald-200";
                  const isLoading = loadingEmail === u.email;

                  return (
                    <button
                      key={u.id}
                      onClick={() => handleLogin(u.email)}
                      disabled={!!loadingEmail}
                      className="relative group flex flex-col items-start p-4 bg-white rounded-2xl border-2 border-zinc-100 hover:border-zinc-900 hover:shadow-xl transition-all text-left duration-300 ease-out disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div
                        className={`p-2.5 rounded-xl mb-3 ${color} group-hover:scale-110 transition-transform duration-300`}
                      >
                        {isLoading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Icon className="w-5 h-5" />
                        )}
                      </div>

                      <div className="space-y-0.5">
                        <h3 className="font-bold text-sm text-zinc-900">
                          {u.name}
                        </h3>
                        <p className="text-xs text-zinc-400 font-medium">
                          {u.role === "ADMIN"
                            ? "Global Admin"
                            : `${u.role} (${u.country})`}
                        </p>
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-[10px] uppercase tracking-wider font-bold">
                        <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 border border-zinc-200">
                          {u.role}
                        </span>
                        {u.role !== "ADMIN" && (
                          <span className="flex items-center gap-1 text-zinc-400 bg-zinc-50 px-1.5 py-0.5 rounded border border-zinc-100">
                            <Globe2 className="w-3 h-3" />
                            {u.country}
                          </span>
                        )}
                      </div>

                      <div className="absolute top-4 right-4 w-1.5 h-1.5 rounded-full bg-zinc-200 group-hover:bg-green-500 transition-colors" />
                    </button>
                  );
                })}
              </div>
            )}

            <p className="text-xs text-zinc-300 font-medium text-center pt-4">
              Slooze Enterprise System v2.4.0 • Secured by Prisma & Next.js
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
