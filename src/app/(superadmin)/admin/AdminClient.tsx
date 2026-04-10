"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDate, formatTaka } from "@/lib/utils";
import { SubscriptionDialog } from "./SubscriptionDialog";

interface Org {
  id: string;
  name: string;
  district: string | null;
  createdAt: Date;
  subscription: { plan: string; status: string; endDate: Date | null } | null;
  _count: { students: number; users: number };
}

export function AdminOrgTable({ orgs }: { orgs: Org[] }) {
  const [editing, setEditing] = useState<Org | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead>Center Name</TableHead>
            <TableHead>District</TableHead>
            <TableHead>Plan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">Students</TableHead>
            <TableHead className="text-center">Users</TableHead>
            <TableHead>Registered</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orgs.map(o => (
            <TableRow key={o.id}>
              <TableCell className="font-medium">{o.name}</TableCell>
              <TableCell className="text-sm text-gray-600">{o.district ?? "—"}</TableCell>
              <TableCell>
                <Badge className="bg-indigo-100 text-indigo-700">{o.subscription?.plan ?? "FREE"}</Badge>
              </TableCell>
              <TableCell>
                <Badge className={o.subscription?.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
                  {o.subscription?.status ?? "ACTIVE"}
                </Badge>
              </TableCell>
              <TableCell className="text-center font-semibold">{o._count.students}</TableCell>
              <TableCell className="text-center">{o._count.users}</TableCell>
              <TableCell className="text-sm text-gray-500">{formatDate(o.createdAt)}</TableCell>
              <TableCell className="text-right">
                <Button variant="outline" size="sm" onClick={() => setEditing(o)}>Manage</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editing && <SubscriptionDialog org={editing} onClose={() => setEditing(null)} />}
    </>
  );
}

export function RevenueStats({ orgs }: { orgs: Org[] }) {
  const PLAN_PRICES = { FREE: 0, BASIC: 500, PRO: 1200 } as const;
  const totalRevenue = orgs.reduce((s, o) =>
    s + (o.subscription?.status === "ACTIVE" ? PLAN_PRICES[o.subscription.plan as keyof typeof PLAN_PRICES] ?? 0 : 0), 0
  );
  return <p className="text-3xl font-bold text-green-600 mt-1">{formatTaka(totalRevenue)}</p>;
}
