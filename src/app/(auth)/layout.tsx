export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-indigo-700">Porai</h1>
          <p className="text-gray-500 text-sm mt-1">কোচিং সেন্টার ম্যানেজমেন্ট সিস্টেম</p>
        </div>
        {children}
      </div>
    </div>
  );
}
