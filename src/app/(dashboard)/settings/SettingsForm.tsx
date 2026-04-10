"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

interface OrgData { id: string; name: string; phone: string; address: string; district: string }

export function SettingsForm({ org, districts }: { org: OrgData; districts: string[] }) {
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, setValue } = useForm({ defaultValues: org });

  const onSubmit = async (data: OrgData) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/organizations/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) toast.success("Settings saved!");
      else toast.error("Failed to save settings");
    } catch { toast.error("Something went wrong."); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>Center Information</CardTitle></CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label>Center Name</Label>
            <Input {...register("name")} />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input placeholder="01XXXXXXXXX" {...register("phone")} />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input placeholder="Full address" {...register("address")} />
          </div>
          <div className="space-y-2">
            <Label>District</Label>
            <Select onValueChange={v => setValue("district", v)} defaultValue={org.district}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{districts.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
