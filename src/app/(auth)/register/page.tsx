"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/validations/organization";
import { BANGLADESH_DISTRICTS } from "@/lib/constants";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, setValue, watch, formState: { errors }, trigger } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { district: "" },
  });

  const nextStep = async () => {
    const valid = await trigger(["orgName", "district", "phone"]);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: RegisterFormData) => {
    setLoading(true);
    try {
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        toast.error(json.error || "Registration failed");
        return;
      }

      toast.success("Registration successful! Please sign in.");
      router.push("/login");
    } catch {
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Register Your Coaching Center</CardTitle>
        <CardDescription>
          Step {step} of 2 — {step === 1 ? "Center Details" : "Admin Account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)}>
          {step === 1 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Coaching Center Name *</Label>
                <Input id="orgName" placeholder="Dhaka Model Coaching" {...register("orgName")} />
                {errors.orgName && <p className="text-sm text-red-500">{errors.orgName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label>District *</Label>
                <Select onValueChange={(val) => setValue("district", val)} defaultValue={watch("district")}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select district" />
                  </SelectTrigger>
                  <SelectContent>
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <SelectItem key={d} value={d}>{d}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.district && <p className="text-sm text-red-500">{errors.district.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" placeholder="01XXXXXXXXX" {...register("phone")} />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone.message}</p>}
              </div>

              <Button type="button" className="w-full" onClick={nextStep}>
                Next <ChevronRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="adminName">Your Full Name *</Label>
                <Input id="adminName" placeholder="Mohammad Rahman" {...register("adminName")} />
                {errors.adminName && <p className="text-sm text-red-500">{errors.adminName.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input id="email" type="email" placeholder="admin@example.com" {...register("email")} />
                {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password *</Label>
                <Input id="password" type="password" placeholder="Min. 8 characters" {...register("password")} />
                {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password *</Label>
                <Input id="confirmPassword" type="password" placeholder="Repeat password" {...register("confirmPassword")} />
                {errors.confirmPassword && <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>}
              </div>

              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                  <ChevronLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Registering...</> : "Register"}
                </Button>
              </div>
            </div>
          )}
        </form>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already registered?{" "}
          <Link href="/login" className="text-indigo-600 hover:underline font-medium">
            Sign in here
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
