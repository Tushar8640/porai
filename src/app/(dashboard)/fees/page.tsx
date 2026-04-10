"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatTaka, formatDate, getCurrentMonth } from "@/lib/utils";
import { Wallet, Plus, Printer, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface FeeRecord {
  id: string; invoiceNumber: string; feeMonth: string; amount: string;
  discount: string; paid: string; status: string; dueDate: string;
  paymentMethod: string | null; paidAt: string | null;
  student: { id: string; name: string; studentId: string };
  batch: { id: string; name: string } | null;
}

interface Batch { id: string; name: string; monthlyFee: number }

export default function FeesPage() {
  const router = useRouter();
  const [records, setRecords] = useState<FeeRecord[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState(getCurrentMonth());
  const [batchFilter, setBatchFilter] = useState("");
  const [showGenerate, setShowGenerate] = useState(false);
  const [genBatch, setGenBatch] = useState("");
  const [genMonth, setGenMonth] = useState(getCurrentMonth());
  const [genDue, setGenDue] = useState("");
  const [generating, setGenerating] = useState(false);
  const [collectId, setCollectId] = useState<string | null>(null);
  const [collectAmount, setCollectAmount] = useState("");
  const [collectMethod, setCollectMethod] = useState("CASH");
  const [collectRef, setCollectRef] = useState("");
  const [collecting, setCollecting] = useState(false);

  const fetchFees = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (monthFilter) params.set("month", monthFilter);
    if (batchFilter) params.set("batchId", batchFilter);
    const res = await fetch(`/api/fees?${params}`);
    const json = await res.json();
    setRecords(json.data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/batches?active=true").then(r => r.json()).then(j => setBatches(j.data ?? []));
    fetchFees();
  }, []);

  useEffect(() => { fetchFees(); }, [statusFilter, monthFilter, batchFilter]);

  const handleGenerate = async () => {
    if (!genBatch || !genMonth) return;
    const batch = batches.find(b => b.id === genBatch);
    setGenerating(true);
    const res = await fetch("/api/fees", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: genBatch, feeMonth: genMonth, amount: batch?.monthlyFee ?? 0, dueDate: genDue || new Date().toISOString() }),
    });
    const json = await res.json();
    setGenerating(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success(`Generated ${json.data.created} records (${json.data.skipped} skipped)`);
    setShowGenerate(false);
    fetchFees();
  };

  const handleCollect = async () => {
    if (!collectId || !collectAmount) return;
    setCollecting(true);
    const res = await fetch(`/api/fees/${collectId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paid: parseFloat(collectAmount), paymentMethod: collectMethod, transactionRef: collectRef }),
    });
    const json = await res.json();
    setCollecting(false);
    if (!res.ok) { toast.error(json.error); return; }
    toast.success("Payment collected!");
    setCollectId(null);
    setCollectAmount(""); setCollectRef("");
    fetchFees();
  };

  const totalCollected = records.filter(r => r.status === "PAID" || r.status === "PARTIAL")
    .reduce((s, r) => s + parseFloat(r.paid), 0);
  const totalDue = records.filter(r => r.status === "DUE" || r.status === "PARTIAL")
    .reduce((s, r) => s + (parseFloat(r.amount) - parseFloat(r.discount) - parseFloat(r.paid)), 0);

  const statusColor = (s: string) => s === "PAID" ? "bg-green-100 text-green-700" : s === "PARTIAL" ? "bg-yellow-100 text-yellow-700" : s === "DUE" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600";

  return (
    <div>
      <PageHeader title="Fee Management" description="Track and collect student fees">
        <Button onClick={() => setShowGenerate(true)}><Plus className="mr-2 h-4 w-4" />Generate Fees</Button>
      </PageHeader>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <Card><CardContent className="pt-6">
          <p className="text-sm text-gray-500">Collected ({monthFilter})</p>
          <p className="text-2xl font-bold text-green-600 mt-1">{formatTaka(totalCollected)}</p>
        </CardContent></Card>
        <Card><CardContent className="pt-6">
          <p className="text-sm text-gray-500">Outstanding Dues</p>
          <p className="text-2xl font-bold text-red-600 mt-1">{formatTaka(totalDue)}</p>
        </CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-3 mb-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-36"><SelectValue placeholder="All Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Status</SelectItem>
            <SelectItem value="DUE">Due</SelectItem>
            <SelectItem value="PARTIAL">Partial</SelectItem>
            <SelectItem value="PAID">Paid</SelectItem>
            <SelectItem value="WAIVED">Waived</SelectItem>
          </SelectContent>
        </Select>
        <input type="month" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}
          className="border border-gray-200 rounded-md px-3 py-2 text-sm" />
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="All Batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Batches</SelectItem>
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingSpinner /> : (
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead>Student</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Month</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Paid</TableHead>
                  <TableHead>Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {records.map(r => {
                  const balance = parseFloat(r.amount) - parseFloat(r.discount) - parseFloat(r.paid);
                  return (
                    <TableRow key={r.id}>
                      <TableCell>
                        <p className="font-medium text-sm">{r.student.name}</p>
                        <p className="text-xs text-gray-400">{r.student.studentId}</p>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">{r.batch?.name ?? "—"}</TableCell>
                      <TableCell className="text-sm">{r.feeMonth}</TableCell>
                      <TableCell className="text-sm font-medium">{formatTaka(r.amount)}</TableCell>
                      <TableCell className="text-sm text-green-700">{formatTaka(r.paid)}</TableCell>
                      <TableCell className="text-sm font-semibold text-red-600">{formatTaka(balance)}</TableCell>
                      <TableCell><Badge className={statusColor(r.status)}>{r.status}</Badge></TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {r.status !== "PAID" && r.status !== "WAIVED" && (
                            <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => { setCollectId(r.id); setCollectAmount(String(balance)); }}>
                              <CreditCard className="mr-1 h-3 w-3" />Collect
                            </Button>
                          )}
                          <Link href={`/fees/invoices/${r.id}`}>
                            <Button size="sm" variant="ghost" className="h-7 text-xs">
                              <Printer className="mr-1 h-3 w-3" />Invoice
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            {records.length === 0 && <p className="text-center text-gray-400 py-10">No records found.</p>}
          </CardContent>
        </Card>
      )}

      {/* Generate Fees Dialog */}
      <Dialog open={showGenerate} onOpenChange={setShowGenerate}>
        <DialogContent>
          <DialogHeader><DialogTitle>Generate Fee Records</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Batch</Label>
              <Select value={genBatch} onValueChange={setGenBatch}>
                <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                <SelectContent>{batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name} (৳{b.monthlyFee})</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Fee Month</Label>
              <input type="month" value={genMonth} onChange={e => setGenMonth(e.target.value)} className="w-full border border-gray-200 rounded-md px-3 py-2 text-sm" />
            </div>
            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input type="date" value={genDue} onChange={e => setGenDue(e.target.value)} />
            </div>
            <Button onClick={handleGenerate} disabled={generating || !genBatch} className="w-full">
              {generating ? "Generating..." : "Generate Records"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Collect Payment Dialog */}
      <Dialog open={!!collectId} onOpenChange={() => setCollectId(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Collect Payment</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Amount (৳)</Label>
              <Input type="number" value={collectAmount} onChange={e => setCollectAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <Select value={collectMethod} onValueChange={setCollectMethod}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="BKASH">bKash</SelectItem>
                  <SelectItem value="NAGAD">Nagad</SelectItem>
                  <SelectItem value="ROCKET">Rocket</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Transaction Ref (optional)</Label>
              <Input placeholder="bKash / Nagad txn ID" value={collectRef} onChange={e => setCollectRef(e.target.value)} />
            </div>
            <Button onClick={handleCollect} disabled={collecting || !collectAmount} className="w-full">
              {collecting ? "Processing..." : "Confirm Payment"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
