import { cn } from "@/lib/utils";
import { useLanguage } from "@/lib/i18n";
import type { OrderStatus } from "@/services/orders.service";

// Color-coded payment status: red = unpaid, yellow = partially paid, green = paid.
const STATUS_STYLES: Record<OrderStatus, string> = {
  unpaid: "border-red-300 bg-red-100 text-red-700",
  partially_paid: "border-amber-300 bg-amber-100 text-amber-800",
  paid: "border-green-300 bg-green-100 text-green-700",
};

export function StatusBadge({ status, className }: { status: OrderStatus; className?: string }) {
  const { t } = useLanguage();
  return (
    <span
      className={cn(
        "inline-flex min-h-9 items-center justify-center rounded-full border-2 px-3 py-1 text-base font-bold whitespace-nowrap",
        STATUS_STYLES[status],
        className
      )}
    >
      {t(`status.${status}`)}
    </span>
  );
}
