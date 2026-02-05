import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Globe2,
  Layout,
  Shield,
  Smartphone,
  Users,
  Zap,
} from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-white">
      <section className="relative pt-12 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="flex flex-wrap items-center -mx-4">
            <div className="w-full lg:w-1/2 px-4 mb-12 lg:mb-0">
              <span className="inline-block py-1 px-3 mb-4 text-xs font-semibold text-orange-500 bg-orange-50 rounded-full">
                OFFICIAL CORPORATE PARTNER
              </span>
              <h1 className="text-5xl lg:text-7xl font-bold font-heading mb-6 tracking-tight text-zinc-900">
                Better food for <br />
                <span className="text-orange-600">working teams.</span>
              </h1>
              <p className="text-xl text-zinc-500 mb-8 leading-relaxed max-w-lg">
                The enterprise standard for ordering lunch. Admins control the
                budget. Managers control the region. Teams get fed on time.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/login"
                  className="inline-flex h-14 items-center justify-center rounded-xl bg-orange-600 px-8 text-lg font-semibold text-white transition-all hover:bg-orange-700 hover:-translate-y-1 shadow-xl shadow-orange-200"
                >
                  Start Ordering
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
                <button className="inline-flex h-14 items-center justify-center rounded-xl border-2 border-zinc-100 px-8 text-lg font-semibold text-zinc-900 transition-colors hover:bg-zinc-50 hover:border-zinc-200">
                  View Demo
                </button>
              </div>

              <div className="mt-10 flex items-center gap-4 text-sm text-zinc-400 font-medium">
                <div className="flex -space-x-3">
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-200" />
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-300" />
                  <div className="w-10 h-10 rounded-full border-2 border-white bg-zinc-400" />
                </div>
                <p>Trusted by 500+ companies in India & USA</p>
              </div>
            </div>

            <div className="w-full lg:w-1/2 px-4">
              <div className="relative mx-auto lg:mr-0 max-w-md">
                <div className="absolute top-0 right-0 -mr-20 -mt-20 w-72 h-72 bg-orange-100 rounded-full blur-3xl opacity-50" />
                <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-72 h-72 bg-blue-100 rounded-full blur-3xl opacity-50" />

                <div className="relative bg-zinc-900 border-8 border-zinc-900 rounded-[3rem] shadow-2xl overflow-hidden rotate-[-3deg] hover:rotate-0 transition-transform duration-500">
                  <div className="bg-white h-[600px] overflow-hidden relative">
                    <div className="h-32 bg-orange-50 p-6 pt-10">
                      <div className="flex justify-between items-center mb-4">
                        <div className="w-8 h-8 rounded-full bg-orange-200" />
                        <div className="w-8 h-8 rounded-full bg-white" />
                      </div>
                      <h3 className="font-bold text-xl text-zinc-900">
                        Good Morning, Nick
                      </h3>
                    </div>
                    <div className="p-6 space-y-4">
                      <div className="p-4 border rounded-2xl shadow-sm flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-xl bg-orange-100 shrink-0" />
                        <div>
                          <div className="h-4 w-32 bg-zinc-800 rounded mb-2" />
                          <div className="h-3 w-20 bg-zinc-200 rounded" />
                        </div>
                      </div>
                      <div className="p-4 border rounded-2xl shadow-sm flex gap-4 items-center">
                        <div className="w-16 h-16 rounded-xl bg-green-100 shrink-0" />
                        <div>
                          <div className="h-4 w-24 bg-zinc-800 rounded mb-2" />
                          <div className="h-3 w-16 bg-zinc-200 rounded" />
                        </div>
                      </div>
                      <div className="p-4 bg-zinc-50 rounded-2xl text-center text-sm text-zinc-400 mt-8">
                        Viewing as Admin (India)
                      </div>
                    </div>
                    <div className="absolute bottom-0 w-full p-6 bg-white border-t">
                      <div className="w-full h-14 bg-zinc-900 rounded-xl flex items-center justify-center text-white font-semibold">
                        Checkout
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-zinc-50 border-y border-zinc-100">
        <div className="container px-4 mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-zinc-900 mb-2">35k+</div>
              <div className="text-zinc-500 font-medium">Daily Orders</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-zinc-900 mb-2">99%</div>
              <div className="text-zinc-500 font-medium">On-Time Delivery</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-zinc-900 mb-2">500+</div>
              <div className="text-zinc-500 font-medium">
                Corporate Partners
              </div>
            </div>
            <div>
              <div className="text-4xl font-bold text-zinc-900 mb-2">24/7</div>
              <div className="text-zinc-500 font-medium">Support</div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 lg:py-32">
        <div className="container px-4 mx-auto">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <span className="text-orange-600 font-semibold tracking-wider text-sm uppercase">
              Features
            </span>
            <h2 className="mt-4 text-4xl font-bold text-zinc-900">
              Designed for every role.
            </h2>
            <p className="mt-4 text-xl text-zinc-500">
              Security and flexibility built right into the core.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white border hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 rounded-2xl bg-red-100 flex items-center justify-center mb-6 text-red-600">
                <Shield className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Admin Control</h3>
              <p className="text-zinc-500 leading-relaxed mb-6">
                Complete oversight of the entire organization. Manage users,
                update global payment methods, and view all order history across
                countries.
              </p>
              <ul className="space-y-3 text-zinc-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-red-500" /> Full Access
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-red-500" /> Payment
                  Config
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-white border hover:shadow-xl transition-shadow duration-300 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-orange-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl">
                POPULAR
              </div>
              <div className="w-14 h-14 rounded-2xl bg-orange-100 flex items-center justify-center mb-6 text-orange-600">
                <Layout className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Manager Access</h3>
              <p className="text-zinc-500 leading-relaxed mb-6">
                Region-locked control. Managers can only see and manage orders
                within their specific country (India or USA).
              </p>
              <ul className="space-y-3 text-zinc-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" /> Country
                  Locked
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-orange-500" /> Team
                  Oversight
                </li>
              </ul>
            </div>

            <div className="p-8 rounded-3xl bg-white border hover:shadow-xl transition-shadow duration-300">
              <div className="w-14 h-14 rounded-2xl bg-green-100 flex items-center justify-center mb-6 text-green-600">
                <Users className="w-7 h-7" />
              </div>
              <h3 className="text-2xl font-bold mb-3">Team Ordering</h3>
              <p className="text-zinc-500 leading-relaxed mb-6">
                Frictionless ordering experience. Employees see menus available
                at their location and can order in seconds.
              </p>
              <ul className="space-y-3 text-zinc-600">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Local
                  Menus
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500" /> Fast
                  Checkout
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-zinc-900 text-white overflow-hidden">
        <div className="container px-4 mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">
                Global Scale, Local Feel.
              </h2>
              <p className="text-zinc-400 text-lg mb-8">
                Whether your team is in Hyderabad or New York, Slooze adapts.
                Our intelligent routing ensures Managers only see data relevant
                to their region.
              </p>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <Globe2 className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">
                      Multi-Region Support
                    </h4>
                    <p className="text-zinc-400">
                      Data isolation between India and USA branches.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <Zap className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">
                      Instant Role Switching
                    </h4>
                    <p className="text-zinc-400">
                      Seamless transitions for Admins managing multiple
                      locations.
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-full bg-zinc-800 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-orange-500" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold mb-1">Real-time Sync</h4>
                    <p className="text-zinc-400">
                      Orders update instantly across all dashboards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-[100px] opacity-20" />
              <div className="relative bg-zinc-800 border border-zinc-700 p-8 rounded-3xl">
                <div className="flex items-center justify-between mb-8 border-b border-zinc-700 pb-4">
                  <span className="font-mono text-sm text-zinc-400">
                    ACCESS_LOG.json
                  </span>
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-red-500" />
                    <div className="w-3 h-3 rounded-full bg-yellow-500" />
                    <div className="w-3 h-3 rounded-full bg-green-500" />
                  </div>
                </div>
                <div className="space-y-4 font-mono text-sm">
                  <div className="flex gap-4">
                    <span className="text-zinc-500">10:42:01</span>
                    <span className="text-purple-400">ADMIN</span>
                    <span className="text-white">
                      Updated Global Payment Gateway
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-500">10:43:15</span>
                    <span className="text-blue-400">MNGR_IN</span>
                    <span className="text-white">
                      Approved Order #2991 (Hyderabad)
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-500">10:43:18</span>
                    <span className="text-red-400">MNGR_US</span>
                    <span className="text-zinc-500 line-through">
                      Access Denied: Order #2991
                    </span>
                  </div>
                  <div className="flex gap-4">
                    <span className="text-zinc-500">10:44:00</span>
                    <span className="text-green-400">MEMBER</span>
                    <span className="text-white">Placed Order (Veg Thali)</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 text-center">
        <div className="container px-4 mx-auto">
          <h2 className="text-4xl font-bold mb-8">
            Ready to streamline your office meals?
          </h2>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-zinc-900 px-8 text-lg font-semibold text-white transition-transform hover:-translate-y-1"
            >
              Login as Admin
            </Link>
            <Link
              href="/login"
              className="inline-flex h-14 items-center justify-center rounded-xl bg-white border-2 border-zinc-200 px-8 text-lg font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
            >
              Login as Manager
            </Link>
          </div>
        </div>
      </section>

      <footer className="border-t py-12 bg-zinc-50">
        <div className="container px-4 mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex gap-4">
            <button className="bg-black text-white px-5 py-3 rounded-xl flex items-center gap-3 hover:opacity-80 transition-opacity">
              <Smartphone className="w-6 h-6" />
              <div className="text-left">
                <div className="text-[10px] uppercase leading-none opacity-80">
                  Download on the
                </div>
                <div className="text-sm font-bold leading-none mt-1">
                  App Store
                </div>
              </div>
            </button>
            <button className="bg-black text-white px-5 py-3 rounded-xl flex items-center gap-3 hover:opacity-80 transition-opacity">
              <div className="text-left">
                <div className="text-[10px] uppercase leading-none opacity-80">
                  Get it on
                </div>
                <div className="text-sm font-bold leading-none mt-1">
                  Google Play
                </div>
              </div>
            </button>
          </div>
          <p className="text-zinc-400 text-sm">
            © 2026 Slooze Technologies Inc.
          </p>
        </div>
      </footer>
    </div>
  );
}
