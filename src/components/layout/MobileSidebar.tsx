"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
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
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="lg:hidden">
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="p-0 w-64">
        <Sidebar role={role} orgName={orgName} onNavigate={() => setOpen(false)} />
      </SheetContent>
    </Sheet>
  );
}
