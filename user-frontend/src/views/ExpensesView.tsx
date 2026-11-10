"use client";

// src/views/ExpensesView.tsx
// Daily expense book: day stepper, quick-entry form (category chips + amount),
// and the day's entries with a running total. Styled to match DashboardView.
// The selected day lives in the URL (?date=YYYY-MM-DD) so navigation away and
// back restores the day the user was viewing.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarClock, CalendarDays, ChevronLeft, ChevronRight, Loader2, Trash2 } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { currentDay, formatINR, fullDayLabel, shiftDay } from "@/lib/format";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  expensesService,
  type DayExpenses,
  type ExpenseCategory,
} from "@/services/expenses.service";

const CATEGORIES: ExpenseCategory[] = ["diesel", "operation", "maintenance", "wages", "other"];

// "YYYY-MM-DD" <-> Date for the calendar, anchored at noon UTC so the
// calendar day never shifts across timezones.
const dayToDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};
const dateToDay = (date: Date) => {
  const shifted = new Date(date.getTime() + 12 * 60 * 60 * 1000);
  return shifted.toISOString().slice(0, 10);
};

export function ExpensesView() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  // Restore the browsed day from the URL when returning via back/forward
  const dayFromUrl = () => {
    const date = new URLSearchParams(window.location.search).get("date") ?? "";
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= currentDay() ? date : currentDay();
  };

  const [day, setDayState] = useState(dayFromUrl);

  // Keep the URL in sync (replace — stepper taps are not history entries)
  const setDay = (next: string) => {
    setDayState(next);
    router.replace(next === currentDay() ? "/expenses" : `/expenses?date=${next}`, { scroll: false });
  };
  const [data, setData] = useState<DayExpenses | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  // Quick-entry form state
  const [category, setCategory] = useState<ExpenseCategory>("diesel");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isToday = day === currentDay();

  const load = useCallback(async (targetDay: string) => {
    setLoading(true);
    setFailed(false);
    try {
      setData(await expensesService.listByDay(targetDay));
    } catch {
      setData(null);
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(day);
  }, [day, load]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = Number(amount);
    if (!(parsedAmount > 0)) {
      setFormError(t("expenses.errorAmount"));
      return;
    }
    setFormError(null);
    setSaving(true);
    try {
      await expensesService.create({
        category,
        amount: parsedAmount,
        note: note.trim() || undefined,
        // The page is already on the selected day — record it there
        date: day,
      });
      setAmount("");
      setNote("");
      await load(day);
    } catch {
      setFormError(t("expenses.errorSave"));
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    setDeletingId(id);
    try {
      await expensesService.remove(id);
      await load(day);
    } catch {
      setFormError(t("expenses.errorDelete"));
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl px-4 pb-16">
      {/* Day stepper — same control as the orders dashboard */}
      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setDay(shiftDay(day, -1))}
          aria-label="Previous day"
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-stone-300 bg-white text-stone-700 hover:bg-stone-50 active:bg-stone-100"
        >
          <ChevronLeft className="size-8" />
        </button>
        <div className="flex h-14 min-w-0 flex-1 items-center justify-center gap-2 rounded-xl border-2 border-stone-200 bg-white px-2 text-xl font-extrabold text-stone-900">
          {fullDayLabel(day, lang)}
          {!isToday && (
            <button
              type="button"
              onClick={() => setDay(currentDay())}
              className="flex min-h-11 shrink-0 items-center gap-1 rounded-lg border-2 border-orange-600 px-2 text-base font-bold text-orange-700 hover:bg-orange-50 active:bg-orange-100"
            >
              <CalendarClock className="size-5" />
              {t("dashboard.today")}
            </button>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDay(shiftDay(day, 1))}
          disabled={isToday}
          aria-label="Next day"
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-stone-300 bg-white text-stone-700 hover:bg-stone-50 active:bg-stone-100 disabled:cursor-not-allowed disabled:border-stone-200 disabled:text-stone-300 disabled:hover:bg-white"
        >
          <ChevronRight className="size-8" />
        </button>
      </div>

      {/* Quick-entry form — the whole card is one tap-after-tap flow */}
      <form
        onSubmit={submit}
        className="mt-4 rounded-xl border-2 border-stone-200 bg-white p-4"
      >
        <h2 className="text-xl font-bold text-stone-800">{t("expenses.addTitle")}</h2>

        {/* Ledger day — read-only display, changed only via the calendar
            (no manual typing); picking a day switches the whole page to it */}
        <div className="mt-3">
          <span id="expense-date-label" className="mb-1.5 block text-lg font-semibold text-stone-800">
            {t("orderForm.date")}
          </span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              aria-labelledby="expense-date-label"
              className="flex h-12 w-full items-center justify-between rounded-xl border-2 border-stone-300 bg-white px-4 text-lg font-bold text-stone-900 hover:bg-stone-50"
            >
              {fullDayLabel(day, lang)}
              <CalendarDays className="size-6 text-orange-700" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dayToDate(day)}
                defaultMonth={dayToDate(day)}
                // Future days are not selectable
                disabled={{ after: dayToDate(currentDay()) }}
                onSelect={(selected) => {
                  if (selected) {
                    setDay(dateToDay(selected));
                    setCalendarOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Category chips — big taps, no default-free friction (diesel first) */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`min-h-12 rounded-xl border-2 text-lg font-bold ${
                category === c
                  ? "border-orange-600 bg-orange-50 text-orange-700"
                  : "border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
              }`}
            >
              {t(`expenseCategory.${c}`)}
            </button>
          ))}
        </div>

        <input
          type="tel"
          inputMode="numeric"
          value={amount}
          onChange={(e) => setAmount(e.target.value.replace(/[^0-9]/g, ""))}
          placeholder={t("expenses.amount")}
          aria-label={t("expenses.amount")}
          className="mt-3 h-14 w-full rounded-xl border-2 border-stone-300 px-4 text-2xl font-extrabold text-stone-900 focus:border-orange-600 focus:outline-none"
        />

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("expenses.notePlaceholder")}
          aria-label={t("expenses.note")}
          maxLength={500}
          className="mt-3 h-12 w-full rounded-xl border-2 border-stone-300 px-4 text-lg text-stone-900 focus:border-orange-600 focus:outline-none"
        />

        {formError ? <p className="mt-2 text-base font-semibold text-red-600">{formError}</p> : null}

        <button
          type="submit"
          disabled={saving}
          className="mt-3 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-orange-600 text-xl font-extrabold text-white hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60"
        >
          {saving ? <Loader2 className="size-6 animate-spin" /> : null}
          {saving ? t("expenses.saving") : t("expenses.save")}
        </button>
      </form>

      {/* Day total */}
      {data && data.expenses.length > 0 ? (
        <div className="mt-4 rounded-xl border-2 border-stone-200 bg-white p-4">
          <p className="text-base font-semibold text-stone-500">{t("expenses.dayTotal")}</p>
          <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900">
            {formatINR(data.total)}
          </p>
        </div>
      ) : null}

      {/* Entry list */}
      <div className="mt-6">
        <h2 className="mb-2 text-xl font-bold text-stone-800">{t("expenses.title")}</h2>

        {loading ? (
          <div className="flex min-h-40 items-center justify-center rounded-xl border-2 border-stone-200 bg-white">
            <Loader2 className="size-10 animate-spin text-stone-400" />
          </div>
        ) : failed ? (
          <div className="rounded-xl border-2 border-stone-200 bg-white p-6 text-center">
            <p className="text-lg font-semibold text-stone-700">{t("expenses.loadFailed")}</p>
            <button
              type="button"
              onClick={() => load(day)}
              className="mt-4 min-h-12 rounded-xl border-2 border-orange-600 px-6 text-lg font-bold text-orange-700 hover:bg-orange-50"
            >
              {t("common.retry")}
            </button>
          </div>
        ) : data && data.expenses.length > 0 ? (
          <ul className="space-y-3">
            {data.expenses.map((expense) => (
              <li
                key={expense.id}
                className="flex items-center gap-3 rounded-xl border-2 border-stone-200 bg-white p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-bold text-stone-900">
                    {t(`expenseCategory.${expense.category}`)}
                  </p>
                  {expense.note ? (
                    <p className="truncate text-base text-stone-500">{expense.note}</p>
                  ) : null}
                  <p className="mt-1 text-2xl font-extrabold text-stone-900">
                    {formatINR(expense.amount)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => remove(expense.id)}
                  disabled={deletingId === expense.id}
                  aria-label={t("expenses.delete")}
                  title={t("expenses.delete")}
                  className="flex size-12 shrink-0 items-center justify-center rounded-xl border-2 border-stone-300 text-stone-500 hover:border-red-300 hover:bg-red-50 hover:text-red-600 active:bg-red-100 disabled:opacity-50"
                >
                  {deletingId === expense.id ? (
                    <Loader2 className="size-6 animate-spin" />
                  ) : (
                    <Trash2 className="size-6" />
                  )}
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="rounded-xl border-2 border-dashed border-stone-300 bg-white p-8 text-center">
            <p className="text-xl font-bold text-stone-700">{t("expenses.noExpenses")}</p>
            <p className="mt-1 text-lg text-stone-500">{t("expenses.noExpensesHint")}</p>
          </div>
        )}
      </div>
    </main>
  );
}
