"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Sidebar } from "./Sidebar";
import type { Role } from "@/generated/prisma";

interface MobileSidebarProps {
  role: Role;
  orgName: string;
}

export function MobileSidebar({ role, orgName }: MobileSidebarProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger className="lg:hidden inline-flex items-center justify-center rounded-md p-2 text-gray-600 hover:bg-gray-100 hover:text-gray-900">
        <Menu className="h-5 w-5" />
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar role={role} orgName={orgName} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
