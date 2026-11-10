"use client";

// src/views/AuditLogs/index.tsx
// Audit trail viewer: filters + table from the common components; this view
// only owns the detail dialog (before/after diff).
import { useCallback, useState } from "react";
import { DataTable } from "@/common/components/DataTable";
import { FilterBar } from "@/common/components/FilterBar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import type { AuditLog } from "@/services/audit-logs.service";
import { AUDIT_FILTERS, useAuditLogColumns, useAuditLogs } from "@/views/AuditLogs/hooks/useAuditLogs";

/** Render a JSON value compactly for the diff table */
const JsonValue = ({ value }: { value: unknown }) => {
  if (value === null || value === undefined) return <span className="text-muted-foreground">—</span>;
  const text = typeof value === "object" ? JSON.stringify(value) : String(value);
  return <span className="break-all text-sm">{text}</span>;
};

function AuditDetailDialog({
  log,
  onClose
}: {
  log: AuditLog | null;
  onClose: () => void;
}) {
  const changedFields = log?.changedFields ?? {};
  const changedKeys = Object.keys(changedFields);

  return (
    <Dialog open={!!log} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {log?.action && <Badge variant="outline" className="capitalize">{log.action}</Badge>}
            {log?.entity}
          </DialogTitle>
          <DialogDescription>
            {log?.actorEmail ?? "Unknown actor"} · {log?.createdAt ? new Date(log.createdAt).toLocaleString() : ""}
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
          <dt className="text-muted-foreground">Entity ID</dt>
          <dd className="break-all">{log?.entityId ?? "—"}</dd>
          <dt className="text-muted-foreground">Trace ID</dt>
          <dd className="break-all">{log?.traceId ?? "—"}</dd>
          <dt className="text-muted-foreground">IP</dt>
          <dd>{log?.ip ?? "—"}</dd>
          <dt className="text-muted-foreground">Source</dt>
          <dd>{log?.source ?? "—"}</dd>
          <dt className="text-muted-foreground">User agent</dt>
          <dd className="col-span-2 break-all">{log?.userAgent ?? "—"}</dd>
        </dl>

        {changedKeys.length > 0 && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold">Changed fields</h3>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-left">
                  <tr>
                    <th className="px-3 py-2 font-medium">Field</th>
                    <th className="px-3 py-2 font-medium">Before</th>
                    <th className="px-3 py-2 font-medium">After</th>
                  </tr>
                </thead>
                <tbody>
                  {changedKeys.map((key) => (
                    <tr key={key} className="border-t">
                      <td className="px-3 py-2 font-medium">{key}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        <JsonValue value={changedFields[key]?.before} />
                      </td>
                      <td className="px-3 py-2">
                        <JsonValue value={changedFields[key]?.after} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(log?.before || log?.after) && changedKeys.length === 0 && (
          <div className="grid gap-4 sm:grid-cols-2">
            {log?.before && (
              <div>
                <h3 className="mb-1 text-sm font-semibold">Before</h3>
                <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs">
                  {JSON.stringify(log.before, null, 2)}
                </pre>
              </div>
            )}
            {log?.after && (
              <div>
                <h3 className="mb-1 text-sm font-semibold">After</h3>
                <pre className="max-h-48 overflow-auto rounded-lg bg-muted/50 p-3 text-xs">
                  {JSON.stringify(log.after, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function AuditLogs({ actorId }: { actorId?: string }) {
  const { items, pagination, loading, error, filters, setFilter, setPage, refresh } = useAuditLogs(actorId);

  const [viewing, setViewing] = useState<AuditLog | null>(null);
  const openView = useCallback((log: AuditLog) => setViewing(log), []);
  const columns = useAuditLogColumns({ onView: openView });

  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <div>
        <h1 className="font-heading text-2xl font-semibold">Audit Logs</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Who did what, when — every login and write operation across both backends.
        </p>
      </div>

      <FilterBar config={AUDIT_FILTERS} values={filters} onChange={setFilter} />

      <DataTable
        columns={columns}
        data={items}
        rowKey={(log) => log.id}
        loading={loading}
        error={error}
        onRetry={refresh}
        emptyMessage="No audit entries match these filters."
        pagination={pagination}
        onPageChange={setPage}
        skeletonRows={15}
      />

      <AuditDetailDialog log={viewing} onClose={() => setViewing(null)} />
    </div>
  );
}
