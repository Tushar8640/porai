"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PageHeader } from "@/components/layout/PageHeader";
import { StudentTable } from "@/components/students/StudentTable";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { UserPlus, Search } from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";

interface Batch { id: string; name: string }

export default function StudentsPage() {
  const [students, setStudents] = useState([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const debouncedSearch = useDebounce(search, 300);

  const fetchStudents = async () => {
    setLoading(true);
    const params = new URLSearchParams({ active: "true" });
    if (debouncedSearch) params.set("search", debouncedSearch);
    if (batchFilter) params.set("batchId", batchFilter);
    const res = await fetch(`/api/students?${params}`);
    const json = await res.json();
    setStudents(json.data?.students ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetch("/api/batches?active=true").then(r => r.json()).then(j => setBatches(j.data ?? []));
  }, []);

  useEffect(() => { fetchStudents(); }, [debouncedSearch, batchFilter]);

  return (
    <div>
      <PageHeader title="Students" description="Manage all enrolled students">
        <Link href="/students/new">
          <Button><UserPlus className="mr-2 h-4 w-4" />Add Student</Button>
        </Link>
      </PageHeader>

      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input className="pl-9" placeholder="Search by name..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={batchFilter} onValueChange={setBatchFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All batches" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Batches</SelectItem>
            {batches.map(b => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? <LoadingSpinner /> : <StudentTable students={students} onDelete={fetchStudents} />}
    </div>
  );
}
