"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface Org {
  id: string;
  name: string;
  subscription: { plan: string; status: string; endDate: Date | null } | null;
}

export function SubscriptionDialog({ org, onClose }: { org: Org; onClose: () => void }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [plan, setPlan] = useState(org.subscription?.plan ?? "FREE");
  const [status, setStatus] = useState(org.subscription?.status ?? "ACTIVE");
  const [endDate, setEndDate] = useState(
    org.subscription?.endDate ? new Date(org.subscription.endDate).toISOString().split("T")[0] : ""
  );

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/organizations/${org.id}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan, status, endDate: endDate || undefined }),
      });
      if (res.ok) {
        toast.success("Subscription updated");
        router.refresh();
        onClose();
      } else {
        const j = await res.json();
        toast.error(j.error ?? "Failed");
      }
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Manage Subscription</DialogTitle>
          <p className="text-sm text-gray-500">{org.name}</p>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Plan</Label>
            <Select value={plan} onValueChange={(v: string | null) => setPlan(v ?? "FREE")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="FREE">FREE</SelectItem>
                <SelectItem value="BASIC">BASIC — ৳500/mo</SelectItem>
                <SelectItem value="PRO">PRO — ৳1200/mo</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: string | null) => setStatus(v ?? "ACTIVE")}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Active</SelectItem>
                <SelectItem value="EXPIRED">Expired</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Valid Until (optional)</Label>
            <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
