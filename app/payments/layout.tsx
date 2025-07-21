// app/payments/layout.tsx
"use client";

import { AuthGuard } from "@/components/auth-guard";

export default function PaymentsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto">
          {children}
        </div>
      </div>
    </AuthGuard>
  );
}