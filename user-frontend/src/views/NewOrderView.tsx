"use client";

// src/views/NewOrderView.tsx
// Single-screen order entry for low-literacy operators, mirroring the
// founders' bahi-khata line: phone (autofills the customer via lookup, and
// prefills their usual village/material/grade/rate from the last order),
// name, village, material, grade, trolleys, rate — with the total computed
// as quantity × rate (manually overridable for mixed loads) — plus a
// नगद/उधार/ऑनलाइन mode, an optional note, and the payment-status control.
// amount_received is derived from the chosen status — no free-form field
// unless "Partially Paid" is picked.
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronLeft, CalendarDays } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { formatINR, currentDay, fullDayLabel } from "@/lib/format";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { customersService } from "@/services/customers.service";
import {
  ordersService,
  type CreateOrderPayload,
  type MaterialType,
  type PaymentType
} from "@/services/orders.service";

type FormStatus = "unpaid" | "partial" | "paid";

// "YYYY-MM-DD" <-> Date for the calendar. Noon UTC keeps the calendar day
// stable across timezones (17:30 IST, same date either way).
const dayToDate = (day: string) => {
  const [y, m, d] = day.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};
const dateToDay = (date: Date) => {
  const shifted = new Date(date.getTime() + 12 * 60 * 60 * 1000); // back to UTC noon
  return shifted.toISOString().slice(0, 10);
};

const PHONE_LENGTH = 10; // Indian mobile numbers

// Grade vocabulary comes from the founders' bahi-khata — kept in Devanagari
// in BOTH languages (digits stay Latin). "Other" reveals free text, so this
// list is just quick-taps — anything not here can still be typed.
const GRADE_CHIPS = [
  "सिंगल",
  "डबल",
  "6mm",
  "12mm",
  "20mm",
  "40mm",
];

const MATERIALS: MaterialType[] = ["ret", "gitti", "both"];
const PAYMENT_MODES: PaymentType[] = ["nagad", "udhaar", "online"];

// Selection colors for the payment-mode segmented control
const PAYMENT_MODE_STYLES: Record<PaymentType, string> = {
  nagad: "border-green-600 bg-green-50 text-green-700",
  udhaar: "border-red-600 bg-red-50 text-red-700",
  online: "border-blue-600 bg-blue-50 text-blue-700"
};

export function NewOrderView() {
  const { t, lang } = useLanguage();
  const router = useRouter();

  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");
  const [existing, setExisting] = useState(false);
  const [nameAutofilled, setNameAutofilled] = useState(false);

  // Bahi-khata fields
  const [village, setVillage] = useState("");
  const [material, setMaterial] = useState<MaterialType | null>(null);
  const [grade, setGrade] = useState("");
  const [gradeOther, setGradeOther] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [rate, setRate] = useState("");
  const [totalOverride, setTotalOverride] = useState(false);
  const [manualTotal, setManualTotal] = useState("");
  const [paymentType, setPaymentType] = useState<PaymentType>("nagad");
  const [note, setNote] = useState("");

  const [status, setStatus] = useState<FormStatus>("unpaid");
  const [amountReceived, setAmountReceived] = useState("");

  // Optional ledger day — empty means today; past days allowed (back-dating).
  // Prefilled from ?date= when the form is opened from a past day's dashboard.
  const [orderDate, setOrderDate] = useState(() => {
    const date = new URLSearchParams(window.location.search).get("date") ?? "";
    return /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= currentDay() ? date : "";
  });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const savedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (savedTimer.current) clearTimeout(savedTimer.current);
  }, []);

  // Customer lookup: once a full 10-digit number is typed (debounced), fetch
  // the known customer, autofill + LOCK their name, and prefill this order
  // from their last one (village/material/grade/rate — all still editable).
  useEffect(() => {
    const unlock = () => {
      setExisting(false);
      // Only clear a name we autofilled — never staff's own typing
      if (nameAutofilled) {
        setName("");
        setNameAutofilled(false);
      }
    };

    const digits = phone.replace(/\D/g, "");
    if (digits.length !== PHONE_LENGTH) {
      unlock();
      return;
    }
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const customer = await customersService.lookupByPhone(digits);
        if (cancelled) return;
        if (customer?.name) {
          setExisting(true);
          setName(customer.name);
          setNameAutofilled(true);

          const last = customer.last_order;
          if (last) {
            if (last.village) setVillage(last.village);
            if (last.material) setMaterial(last.material);
            if (last.grade) {
              setGrade(last.grade);
              setGradeOther(!GRADE_CHIPS.includes(last.grade));
            }
            if (last.rate != null) setRate(String(last.rate));
          }
        } else {
          unlock();
        }
      } catch {
        if (!cancelled) unlock();
      }
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [phone, nameAutofilled]);

  // Live total: trolleys × rate unless staff overrides it by hand
  const rateNum = Number(rate);
  const computedTotal = rate !== "" && !Number.isNaN(rateNum) && rateNum > 0 ? quantity * rateNum : null;
  const effectiveTotal = totalOverride
    ? manualTotal !== "" && !Number.isNaN(Number(manualTotal))
      ? Number(manualTotal)
      : null
    : computedTotal;

  function validate(): string[] {
    const problems: string[] = [];
    if (phone.replace(/\D/g, "").length !== PHONE_LENGTH) problems.push(t("orderForm.errorPhone"));
    if (!name.trim()) problems.push(t("orderForm.errorName"));
    if (village.trim().length < 2) problems.push(t("orderForm.errorVillage"));
    if (!material) problems.push(t("orderForm.errorMaterial"));
    if (!effectiveTotal || effectiveTotal <= 0) {
      problems.push(totalOverride ? t("orderForm.errorAmount") : t("orderForm.errorRate"));
    }
    if (status === "partial") {
      const received = Number(amountReceived);
      if (!amountReceived || Number.isNaN(received) || received <= 0 || received >= (effectiveTotal ?? Infinity)) {
        problems.push(t("orderForm.errorReceived"));
      }
    }
    return problems;
  }

  function derivedReceived(): number {
    if (status === "paid") return effectiveTotal ?? 0;
    if (status === "partial") return Number(amountReceived) || 0;
    return 0;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (saving) return;
    const problems = validate();
    setErrors(problems);
    if (problems.length > 0) return;
    // Narrow for TypeScript — validate() already rejected a missing material
    if (!material) return;

    const payload: CreateOrderPayload = {
      phone: phone.replace(/\D/g, ""),
      name: name.trim(),
      village: village.trim(),
      material,
      quantity,
      payment_type: paymentType,
      amount_received: derivedReceived()
    };
    if (grade.trim()) payload.grade = grade.trim();
    if (!totalOverride && rate !== "" && !Number.isNaN(rateNum)) payload.rate = rateNum;
    if (totalOverride && effectiveTotal) payload.total_amount = effectiveTotal;
    if (note.trim()) payload.note = note.trim();
    if (orderDate) payload.date = orderDate;

    setSaving(true);
    try {
      await ordersService.create(payload);
      setSaved(true);
      // Reset the form immediately so the next order can be entered, then
      // return to the order list where the new order is now visible.
      setPhone("");
      setName("");
      setExisting(false);
      setNameAutofilled(false);
      setVillage("");
      setMaterial(null);
      setGrade("");
      setGradeOther(false);
      setQuantity(1);
      setRate("");
      setTotalOverride(false);
      setManualTotal("");
      setPaymentType("nagad");
      setNote("");
      setStatus("unpaid");
      setAmountReceived("");
      setOrderDate("");
      // Return to the ledger day the order was recorded on
      savedTimer.current = setTimeout(
        () => router.replace(orderDate ? `/dashboard?date=${orderDate}` : "/dashboard"),
        1500
      );
    } catch (error) {
      // Surface the specific, localized message when the backend rejects a
      // field (e.g. autofill/paste edge cases)
      const code = (error as { code?: string }).code;
      const message = String((error as Error)?.message ?? "").toLowerCase();
      if (code === "INVALID_INPUT") {
        if (message.includes("phone")) setErrors([t("orderForm.errorPhone")]);
        else if (message.includes("village")) setErrors([t("orderForm.errorVillage")]);
        else if (message.includes("material")) setErrors([t("orderForm.errorMaterial")]);
        else if (message.includes("rate")) setErrors([t("orderForm.errorRate")]);
        else if (message.includes("total")) setErrors([t("orderForm.errorAmount")]);
        else setErrors([t("orderForm.errorSave")]);
      } else {
        setErrors([t("orderForm.errorSave")]);
      }
    } finally {
      setSaving(false);
    }
  }

  const statusOptions: { key: FormStatus; label: string; selected: string }[] = [
    { key: "unpaid", label: t("orderForm.unpaid"), selected: "border-red-600 bg-red-50 text-red-700" },
    { key: "partial", label: t("orderForm.partiallyPaid"), selected: "border-amber-500 bg-amber-50 text-amber-700" },
    { key: "paid", label: t("orderForm.paid"), selected: "border-green-600 bg-green-50 text-green-700" },
  ];

  return (
    <main className="mx-auto w-full max-w-2xl px-4 pb-16">
      <div className="mt-4 flex items-center gap-3">
        {/* Back through history so the dashboard (and the form, if reopened)
            restores the browsed day from its ?date= query instead of today */}
        <button
          type="button"
          onClick={() => router.back()}
          aria-label={t("common.back")}
          className="flex size-14 shrink-0 items-center justify-center rounded-xl border-2 border-stone-300 bg-white text-stone-700 hover:bg-stone-50"
        >
          <ChevronLeft className="size-8" />
        </button>
        <h1 className="text-2xl font-extrabold text-stone-900">{t("orderForm.title")}</h1>
      </div>

      {saved ? (
        <div
          role="status"
          className="mt-4 flex items-center gap-3 rounded-xl border-2 border-green-600 bg-green-50 p-4 text-xl font-bold text-green-700"
        >
          <CheckCircle2 className="size-8 shrink-0" />
          {t("orderForm.saved")}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="mt-4 space-y-5 rounded-2xl border-2 border-stone-200 bg-white p-5">
        {/* 0. Ledger date — optional, defaults to today; for recording an
            order that happened on an earlier day. shadcn Calendar in a
            popover, showing the chosen day in Indian dd/mm/yy. */}
        <div>
          <span id="order-date-label" className="mb-1.5 block text-lg font-semibold text-stone-800">
            {t("orderForm.date")}
          </span>
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger
              aria-labelledby="order-date-label"
              className="flex h-12 w-full items-center justify-between rounded-xl border-2 border-stone-300 bg-white px-4 text-lg font-bold text-stone-900 hover:bg-stone-50"
            >
              {orderDate ? fullDayLabel(orderDate, lang) : t("orderForm.dateToday")}
              <CalendarDays className="size-6 text-orange-700" />
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={orderDate ? dayToDate(orderDate) : undefined}
                defaultMonth={orderDate ? dayToDate(orderDate) : undefined}
                // Future days are not selectable
                disabled={{ after: dayToDate(currentDay()) }}
                onSelect={(selected) => {
                  if (selected) {
                    setOrderDate(dateToDay(selected));
                    setCalendarOpen(false);
                  }
                }}
              />
            </PopoverContent>
          </Popover>
          {!orderDate ? (
            <p className="mt-1.5 text-base font-semibold text-stone-500">{t("orderForm.dateHint")}</p>
          ) : null}
        </div>

        {/* 1. Phone — numeric keypad, drives the customer autofill */}
        <div>
          <label htmlFor="phone" className="mb-1.5 block text-lg font-semibold text-stone-800">
            {t("orderForm.phone")}
          </label>
          <div className="flex items-center gap-3">
            <Input
              id="phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              maxLength={PHONE_LENGTH}
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, PHONE_LENGTH))}
              placeholder="98XXXXXXXX"
              className="tracking-widest"
            />
            {existing ? (
              <span className="inline-flex min-h-10 shrink-0 items-center rounded-full border-2 border-blue-300 bg-blue-50 px-3 text-base font-bold text-blue-700">
                {t("orderForm.existingCustomer")}
              </span>
            ) : null}
          </div>
        </div>

        {/* 2. Name — autofilled and LOCKED for existing customers */}
        <div>
          <label htmlFor="name" className="mb-1.5 block text-lg font-semibold text-stone-800">
            {t("orderForm.name")}
          </label>
          <Input
            id="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            readOnly={existing}
            aria-readonly={existing}
            className={existing ? "read-only:cursor-not-allowed read-only:border-stone-200 read-only:bg-stone-100 read-only:text-stone-600" : undefined}
          />
          {existing ? (
            <p className="mt-1.5 text-base font-semibold text-blue-700">🔒 {t("orderForm.nameLocked")}</p>
          ) : null}
        </div>

        {/* 3. Village */}
        <div>
          <label htmlFor="village" className="mb-1.5 block text-lg font-semibold text-stone-800">
            {t("orderForm.village")}
          </label>
          <Input
            id="village"
            type="text"
            value={village}
            onChange={(e) => setVillage(e.target.value)}
            placeholder="जमुनिया"
          />
        </div>

        {/* 4. Material — segmented control, no preselected default */}
        <fieldset>
          <legend className="mb-2 text-lg font-semibold text-stone-800">{t("orderForm.material")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {MATERIALS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setMaterial(option)}
                aria-pressed={material === option}
                className={`min-h-14 rounded-xl border-2 px-2 text-base font-bold transition-colors ${
                  material === option
                    ? "border-orange-600 bg-orange-50 text-orange-700"
                    : "border-stone-300 bg-white text-stone-500 hover:bg-stone-50"
                }`}
              >
                {t(`material.${option}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* 5. Grade — preset chips + free text via "Other" */}
        <fieldset>
          <legend className="mb-2 text-lg font-semibold text-stone-800">{t("orderForm.grade")}</legend>
          <div className="flex flex-wrap gap-2">
            {GRADE_CHIPS.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => {
                  setGrade(chip);
                  setGradeOther(false);
                }}
                aria-pressed={!gradeOther && grade === chip}
                className={`min-h-12 rounded-xl border-2 px-4 text-base font-bold transition-colors ${
                  !gradeOther && grade === chip
                    ? "border-orange-600 bg-orange-50 text-orange-700"
                    : "border-stone-300 bg-white text-stone-500 hover:bg-stone-50"
                }`}
              >
                {chip}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setGradeOther(true)}
              aria-pressed={gradeOther}
              className={`min-h-12 rounded-xl border-2 px-4 text-base font-bold transition-colors ${
                gradeOther
                  ? "border-orange-600 bg-orange-50 text-orange-700"
                  : "border-stone-300 bg-white text-stone-500 hover:bg-stone-50"
              }`}
            >
              {t("orderForm.gradeOther")}
            </button>
          </div>
          {gradeOther ? (
            <Input
              aria-label={t("orderForm.grade")}
              type="text"
              maxLength={50}
              value={grade}
              onChange={(e) => setGrade(e.target.value)}
              className="mt-2"
            />
          ) : null}
        </fieldset>

        {/* 6. Trolleys — big stepper, no keyboard needed */}
        <div>
          <span className="mb-2 block text-lg font-semibold text-stone-800">{t("orderForm.quantity")}</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              aria-label={t("orderForm.decreaseQuantity")}
              className="size-16 shrink-0 rounded-xl border-2 border-stone-300 bg-white text-4xl font-extrabold text-stone-700 hover:bg-stone-50 active:bg-stone-100 disabled:opacity-40"
            >
              −
            </button>
            <div className="flex h-16 flex-1 items-center justify-center rounded-xl border-2 border-stone-200 bg-stone-50 text-3xl font-extrabold text-stone-900">
              {quantity}
            </div>
            <button
              type="button"
              onClick={() => setQuantity((q) => Math.min(999, q + 1))}
              aria-label={t("orderForm.increaseQuantity")}
              className="size-16 shrink-0 rounded-xl border-2 border-stone-300 bg-white text-4xl font-extrabold text-stone-700 hover:bg-stone-50 active:bg-stone-100"
            >
              +
            </button>
          </div>
        </div>

        {/* 7. Rate per trolley */}
        <div>
          <label htmlFor="rate" className="mb-1.5 block text-lg font-semibold text-stone-800">
            {t("orderForm.rate")}
          </label>
          <Input
            id="rate"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            placeholder="0"
          />
        </div>

        {/* 8. Total — live trolleys × rate, with a manual override */}
        <div className="rounded-xl border-2 border-stone-200 bg-stone-50 p-4">
          <div className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-base font-semibold text-stone-500">{t("orderForm.totalComputed")}</p>
              <p className="text-3xl font-extrabold tracking-tight text-stone-900">
                {effectiveTotal ? formatINR(effectiveTotal) : "—"}
              </p>
              {!totalOverride && computedTotal ? (
                <p className="mt-1 text-base font-semibold text-stone-500">
                  {t("orderForm.totalBreakdown", { quantity, rate: formatINR(rateNum) })}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={() => {
                if (!totalOverride) setManualTotal(computedTotal ? String(computedTotal) : "");
                setTotalOverride(!totalOverride);
              }}
              className="min-h-12 shrink-0 rounded-xl border-2 border-orange-600 px-4 text-base font-bold text-orange-700 hover:bg-orange-50 active:bg-orange-100"
            >
              {totalOverride ? t("orderForm.useComputedTotal") : t("orderForm.editTotal")}
            </button>
          </div>
          {totalOverride ? (
            <div className="mt-3">
              <label htmlFor="manual-total" className="mb-1.5 block text-base font-semibold text-stone-800">
                {t("orderForm.totalOverride")}
              </label>
              <Input
                id="manual-total"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={manualTotal}
                onChange={(e) => setManualTotal(e.target.value)}
                placeholder="0"
                className="bg-white"
              />
            </div>
          ) : null}
        </div>

        {/* 9. Payment mode — नगद / उधार / ऑनलाइन */}
        <fieldset>
          <legend className="mb-2 text-lg font-semibold text-stone-800">{t("orderForm.paymentType")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {PAYMENT_MODES.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPaymentType(option)}
                aria-pressed={paymentType === option}
                className={`min-h-14 rounded-xl border-2 px-2 text-base font-bold transition-colors ${
                  paymentType === option
                    ? PAYMENT_MODE_STYLES[option]
                    : "border-stone-300 bg-white text-stone-500 hover:bg-stone-50"
                }`}
              >
                {t(`payment.${option}`)}
              </button>
            ))}
          </div>
        </fieldset>

        {/* 10. Payment status — segmented control, not a dropdown */}
        <fieldset>
          <legend className="mb-2 text-lg font-semibold text-stone-800">{t("orderForm.status")}</legend>
          <div className="grid grid-cols-3 gap-2">
            {statusOptions.map((option) => (
              <button
                key={option.key}
                type="button"
                onClick={() => setStatus(option.key)}
                aria-pressed={status === option.key}
                className={`min-h-14 rounded-xl border-2 px-2 text-base font-bold transition-colors ${
                  status === option.key
                    ? option.selected
                    : "border-stone-300 bg-white text-stone-500 hover:bg-stone-50"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          {/* Only "Partially Paid" reveals the received-amount field */}
          {status === "partial" ? (
            <div className="mt-4">
              <label htmlFor="received" className="mb-1.5 block text-lg font-semibold text-stone-800">
                {t("orderForm.amountReceived")}
              </label>
              <Input
                id="received"
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                value={amountReceived}
                onChange={(e) => setAmountReceived(e.target.value)}
                placeholder="0"
              />
            </div>
          ) : null}
        </fieldset>

        {/* 11. Optional note — delivery time, instructions… */}
        <div>
          <label htmlFor="note" className="mb-1.5 block text-lg font-semibold text-stone-800">
            {t("orderForm.note")}
          </label>
          <Input
            id="note"
            type="text"
            maxLength={500}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t("orderForm.notePlaceholder")}
          />
        </div>

        {errors.length > 0 ? (
          <ul role="alert" className="space-y-1 rounded-xl border-2 border-red-300 bg-red-50 px-4 py-3">
            {errors.map((problem) => (
              <li key={problem} className="text-lg font-semibold text-red-700">
                • {problem}
              </li>
            ))}
          </ul>
        ) : null}

        {/* One big save button */}
        <button
          type="submit"
          disabled={saving}
          className="h-16 w-full rounded-xl bg-orange-600 text-2xl font-extrabold text-white hover:bg-orange-700 active:bg-orange-800 disabled:opacity-60"
        >
          {saving ? t("orderForm.saving") : t("orderForm.saveOrder")}
        </button>
      </form>
    </main>
  );
}
