"use client";

import { useState } from "react";
import { Phone } from "lucide-react";
import { useLanguage } from "@/lib/i18n";
import { PLANT_PHONE, PHONE_DISPLAY, waLink } from "@/lib/site";
import { WhatsAppIcon } from "@/components/home/WhatsAppIcon";

// Painted Board contact page: the number painted enormous, and an
// enquiry ledger — four ruled lines that become one WhatsApp message.
// No backend, no fake "submitted" screen: the button opens WhatsApp
// with the message built and ready, and says so.
export function ContactView() {
  const { t, lang } = useLanguage();
  const [material, setMaterial] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("");
  const [location, setLocation] = useState("");
  const [name, setName] = useState("");
  const [more, setMore] = useState("");
  const [error, setError] = useState(false);

  const materialOptions = [
    { value: "agg", label: t("site.aggTitle") },
    { value: "msand", label: t("site.msandTitle") },
    { value: "dust", label: t("site.dustTitle") },
    { value: "gsb", label: t("site.gsbTitle") },
  ];
  const unitOptions = [
    { value: "tonne", label: t("site.unitTonne") },
    { value: "brass", label: t("site.unitBrass") },
    { value: "trolley", label: t("site.unitTrolley") },
    { value: "cft", label: t("site.unitCft") },
  ];

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!material || !quantity.trim()) {
      setError(true);
      return;
    }
    setError(false);
    const matLabel = materialOptions.find((o) => o.value === material)?.label ?? material;
    const unitLabel = unit ? ` ${unitOptions.find((o) => o.value === unit)?.label ?? unit}` : "";
    const lines = [
      t("site.waPrefix"),
      `${t("site.formMaterial")}: ${matLabel}`,
      `${t("site.formQuantity")}: ${quantity.trim()}${unitLabel}`,
    ];
    if (location.trim()) lines.push(`${t("site.formLocation")}: ${location.trim()}`);
    if (name.trim()) lines.push(`${t("site.formName")}: ${name.trim()}`);
    if (more.trim()) lines.push(`${t("site.formMore")}: ${more.trim()}`);
    window.open(waLink(lines.join("\n")), "_blank", "noopener,noreferrer");
  }

  const inputCls =
    "min-h-12 w-full border-2 border-ink bg-paper px-4 text-lg font-medium text-ink placeholder:text-ink/40 focus:outline-none focus:ring-4 focus:ring-ochre";

  return (
    <>
      <section className="bg-paper pt-10 pb-6">
        <div className="mx-auto w-full max-w-6xl px-4">
          <h1 className="mt-3 font-paint text-5xl leading-none text-ink sm:text-7xl">
            {t("site.contactTitle")}
          </h1>
          <p className="mt-5 max-w-2xl text-xl font-semibold leading-relaxed text-ink/80 sm:text-2xl">
            {t("site.contactSub")}
          </p>
          <a
            href={`tel:${PLANT_PHONE}`}
            className="mt-6 block font-poster text-4xl tracking-wide tabular-nums text-ember underline decoration-ember/30 underline-offset-8 hover:decoration-ember sm:text-6xl"
          >
            {PHONE_DISPLAY}
          </a>
          <p className="mt-4 text-base font-semibold text-ink/60">{t("site.contactHoursNote")}</p>
        </div>
      </section>

      <section className="bg-paper py-10 sm:py-14">
        <div className="mx-auto w-full max-w-2xl px-4">
          <form onSubmit={handleSubmit} noValidate className="space-y-6">
            <div>
              <label htmlFor="enquiry-material" className="block text-lg font-extrabold text-ink">
                {t("site.formMaterial")} *
              </label>
              <select
                id="enquiry-material"
                value={material}
                onChange={(e) => setMaterial(e.target.value)}
                className={`mt-2 ${inputCls}`}
              >
                <option value="">{t("site.formMaterialPlaceholder")}</option>
                {materialOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid gap-6 sm:grid-cols-[1fr_auto]">
              <div>
                <label htmlFor="enquiry-quantity" className="block text-lg font-extrabold text-ink">
                  {t("site.formQuantity")} *
                </label>
                <input
                  id="enquiry-quantity"
                  type="text"
                  inputMode="text"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className={`mt-2 ${inputCls}`}
                  placeholder={lang === "hi" ? "जैसे: 100" : "e.g. 100"}
                />
              </div>
              <div>
                <label htmlFor="enquiry-unit" className="block text-lg font-extrabold text-ink">
                  {t("site.formUnit")}
                </label>
                <select
                  id="enquiry-unit"
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className={`mt-2 ${inputCls} sm:w-48`}
                >
                  <option value="">{t("site.unitPlaceholder")}</option>
                  {unitOptions.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="enquiry-location" className="block text-lg font-extrabold text-ink">
                {t("site.formLocation")}
              </label>
              <input
                id="enquiry-location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className={`mt-2 ${inputCls}`}
                placeholder={lang === "hi" ? "गाँव / कस्बा" : "village / town"}
              />
            </div>

            <div>
              <label htmlFor="enquiry-name" className="block text-lg font-extrabold text-ink">
                {t("site.formName")}
              </label>
              <input
                id="enquiry-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>

            <div>
              <label htmlFor="enquiry-more" className="block text-lg font-extrabold text-ink">
                {t("site.formMore")}
              </label>
              <textarea
                id="enquiry-more"
                rows={3}
                value={more}
                onChange={(e) => setMore(e.target.value)}
                className={`mt-2 ${inputCls}`}
              />
            </div>

            {error ? (
              <p role="alert" className="text-base font-bold text-ember">
                {t("site.formError")}
              </p>
            ) : null}

            <button
              type="submit"
              className="flex min-h-14 w-full items-center justify-center gap-3 bg-ink px-8 text-xl font-extrabold text-paper hover:bg-ember sm:w-auto"
            >
              <WhatsAppIcon className="size-6" />
              {t("site.formSubmit")}
            </button>
            <p className="text-base font-semibold text-ink/60">{t("site.formNote")}</p>
          </form>

          <div className="mt-10 border-t-2 border-ink/15 pt-8">
            <a
              href={`tel:${PLANT_PHONE}`}
              className="inline-flex min-h-14 items-center justify-center gap-3 border-2 border-ink px-8 text-xl font-extrabold text-ink hover:bg-ink hover:text-paper"
            >
              <Phone className="size-6" aria-hidden />
              {t("home.call")}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
