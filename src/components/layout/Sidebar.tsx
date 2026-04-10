"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  BookOpen,
  CalendarCheck,
  Wallet,
  GraduationCap,
  UserCog,
  Settings,
  ChevronRight,
} from "lucide-react";
import type { Role } from "@/generated/prisma";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/students", label: "Students", icon: Users },
  { href: "/batches", label: "Batches", icon: BookOpen },
  { href: "/attendance", label: "Attendance", icon: CalendarCheck },
  { href: "/fees", label: "Fees", icon: Wallet, roles: ["CENTER_ADMIN"] },
  { href: "/exams", label: "Exams & Results", icon: GraduationCap },
  { href: "/teachers", label: "Teachers", icon: UserCog, roles: ["CENTER_ADMIN"] },
  { href: "/settings", label: "Settings", icon: Settings, roles: ["CENTER_ADMIN"] },
];

interface SidebarProps {
  role: Role;
  orgName: string;
  onNavigate?: () => void;
}

export function Sidebar({ role, orgName, onNavigate }: SidebarProps) {
  const pathname = usePathname();

  const filteredItems = NAV_ITEMS.filter(
    (item) => !item.roles || item.roles.includes(role)
  );

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="px-6 py-5 border-b border-gray-200">
        <p className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Porai</p>
        <h2 className="text-sm font-bold text-gray-900 mt-1 truncate">{orgName}</h2>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {filteredItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors group",
                isActive
                  ? "bg-indigo-50 text-indigo-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-indigo-600" : "text-gray-400 group-hover:text-gray-600")} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="h-4 w-4 text-indigo-400" />}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-3 border-t border-gray-200">
        <p className="text-xs text-gray-400 text-center">Porai v1.0</p>
      </div>
    </aside>
  );
}
