// src/app/(admin)/system/audit-logs/page.tsx
import { AuditLogs } from "@/views/AuditLogs";

export default async function AuditLogsPage({
  searchParams
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  // ?actorId=<uuid> deep-links the trail to one user (from the Users page)
  const resolved = await searchParams;
  const actorId = typeof resolved.actorId === "string" ? resolved.actorId : undefined;

  return <AuditLogs actorId={actorId} />;
}
