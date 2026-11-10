"use client";

// src/app/(admin)/dashboard/page.tsx
// Auth guard + header live in the (admin) layout — this is pure page content.
import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth.store";
import { auditLogsService, type AuditLog } from "@/services/audit-logs.service";

/** Latest audit entries — quick "who did what recently" glance */
function RecentActivity() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [error, setError] = useState(false);

  useEffect(() => {
    auditLogsService.list({ limit: 5 })
      .then((res) => setLogs(res.items))
      .catch(() => setError(true));
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent activity</CardTitle>
        <CardDescription>
          Latest logins and changes —{" "}
          <Link href="/system/audit-logs" className="underline underline-offset-4">
            view full audit trail
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-sm text-muted-foreground">Could not load recent activity.</p>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
        ) : (
          <ul className="space-y-2">
            {logs.map((log) => (
              <li key={log.id} className="flex items-center justify-between gap-3 text-sm">
                <span className="min-w-0 truncate">
                  <span className="font-medium">{log.actorEmail ?? "Unknown"}</span>{" "}
                  <span className="text-muted-foreground">
                    · {log.action.replace("_", " ")} · {log.entity}
                  </span>
                </span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {new Date(log.createdAt).toLocaleTimeString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { admin } = useAuthStore();

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Dashboard</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Signed in{admin ? ` as ${admin.email}` : ""} — overview stats coming next.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Packages</CardTitle>
            <CardDescription>Manage tour packages</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Bookings</CardTitle>
            <CardDescription>Upcoming trips</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Blogs</CardTitle>
            <CardDescription>Published posts</CardDescription>
          </CardHeader>
          <CardContent className="text-3xl font-semibold">—</CardContent>
        </Card>
      </div>

      <RecentActivity />
    </div>
  );
}
