"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { formatTaka, formatDate, formatMonth } from "@/lib/utils";
import { Printer } from "lucide-react";

interface InvoiceData {
  record: {
    id: string; invoiceNumber: string; feeMonth: string;
    amount: string; discount: string; paid: string; status: string;
    dueDate: string; paidAt: string | null; paymentMethod: string | null; transactionRef: string | null;
    student: { name: string; nameBn: string | null; studentId: string; guardianName: string | null; guardianPhone: string | null; address: string | null };
    batch: { name: string } | null;
  };
  org: { name: string; phone: string | null; address: string | null; district: string | null };
}

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();
  const [data, setData] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/fees/invoices/${id}`)
      .then(r => r.json())
      .then(j => { setData(j.data); setLoading(false); });
  }, [id]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <p className="text-center py-12 text-red-500">Invoice not found.</p>;

  const { record, org } = data;
  const net = parseFloat(record.amount) - parseFloat(record.discount);
  const balance = net - parseFloat(record.paid);

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h1 className="text-xl font-bold">Invoice</h1>
        <Button onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" />Print</Button>
      </div>

      <div id="invoice" className="bg-white border border-gray-200 rounded-lg p-8 print:border-none print:shadow-none">
        {/* Header */}
        <div className="border-b border-gray-200 pb-6 mb-6 text-center">
          <h1 className="text-2xl font-bold text-indigo-700">{org.name}</h1>
          {org.address && <p className="text-sm text-gray-500">{org.address}, {org.district}</p>}
          {org.phone && <p className="text-sm text-gray-500">Phone: {org.phone}</p>}
          <div className="mt-3">
            <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1 rounded-full">PAYMENT RECEIPT</span>
          </div>
        </div>

        {/* Invoice info */}
        <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
          <div>
            <p className="text-gray-500">Invoice No.</p>
            <p className="font-bold font-mono">{record.invoiceNumber}</p>
          </div>
          <div className="text-right">
            <p className="text-gray-500">Date</p>
            <p className="font-bold">{record.paidAt ? formatDate(record.paidAt) : formatDate(record.dueDate)}</p>
          </div>
        </div>

        {/* Student info */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
          <p className="text-gray-500 text-xs uppercase font-semibold mb-2">Student Information</p>
          <p className="font-bold">{record.student.name} {record.student.nameBn && `(${record.student.nameBn})`}</p>
          <p className="text-gray-600">ID: {record.student.studentId}</p>
          {record.student.guardianName && <p className="text-gray-600">Guardian: {record.student.guardianName}</p>}
          {record.student.address && <p className="text-gray-600">{record.student.address}</p>}
          {record.batch && <p className="text-gray-600 mt-1">Batch: <span className="font-medium">{record.batch.name}</span></p>}
          <p className="text-gray-600">Fee Month: <span className="font-medium">{formatMonth(record.feeMonth)}</span></p>
        </div>

        {/* Fee breakdown */}
        <table className="w-full text-sm mb-6">
          <thead>
            <tr className="border-b-2 border-gray-200">
              <th className="text-left py-2 font-semibold text-gray-700">Description</th>
              <th className="text-right py-2 font-semibold text-gray-700">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b border-gray-100">
              <td className="py-2 text-gray-700">Tuition Fee — {formatMonth(record.feeMonth)}</td>
              <td className="py-2 text-right">{formatTaka(record.amount)}</td>
            </tr>
            {parseFloat(record.discount) > 0 && (
              <tr className="border-b border-gray-100 text-green-700">
                <td className="py-2">Discount</td>
                <td className="py-2 text-right">- {formatTaka(record.discount)}</td>
              </tr>
            )}
            <tr className="border-b border-gray-200 font-semibold">
              <td className="py-2">Net Payable</td>
              <td className="py-2 text-right">{formatTaka(net)}</td>
            </tr>
            <tr className="text-green-700">
              <td className="py-2">Amount Paid {record.paymentMethod && `(${record.paymentMethod})`}</td>
              <td className="py-2 text-right font-bold">{formatTaka(record.paid)}</td>
            </tr>
            {balance > 0 && (
              <tr className="text-red-600 font-bold">
                <td className="py-2">Balance Due</td>
                <td className="py-2 text-right">{formatTaka(balance)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {record.transactionRef && (
          <p className="text-xs text-gray-400 mb-4">Transaction Ref: {record.transactionRef}</p>
        )}

        {/* Status */}
        <div className="text-center">
          <span className={`inline-block px-4 py-1 rounded-full text-sm font-bold ${record.status === "PAID" ? "bg-green-100 text-green-700" : record.status === "PARTIAL" ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-700"}`}>
            {record.status}
          </span>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-between text-xs text-gray-400">
          <span>Issued by: {org.name}</span>
          <span>CoachingHub BD</span>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          body * { visibility: hidden; }
          #invoice, #invoice * { visibility: visible; }
          #invoice { position: fixed; left: 0; top: 0; width: 100%; }
        }
      `}</style>
    </div>
  );
}
