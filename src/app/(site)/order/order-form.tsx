"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type ReactNode } from "react";
import { checkPincode, type PincodeResult } from "@/app/actions/check-pincode";
import { placeOrder } from "@/app/actions/place-order";
import { CartLineRow } from "@/components/cart/cart-lines";
import { ArrowRightIcon, CheckIcon, PlusIcon } from "@/components/icons";
import { buttonStyles } from "@/components/ui";
import { itemCount, subtotalPaise } from "@/lib/cart/logic";
import { useCart, useCartHydrated } from "@/lib/cart/store";
import { formatPaise } from "@/lib/money";
import {
  DELIVERY_SLOTS,
  INDIAN_STATES,
  fieldErrors,
  orderRequestSchema,
  type FieldErrors,
  type OrderField,
  type OrderRequestInput,
} from "@/lib/order/schema";
import { isValidPincode } from "@/lib/pincode";

type Values = Omit<OrderRequestInput, "items">;

const INITIAL: Values = {
  customerName: "",
  phone: "",
  whatsappOk: true,
  email: "",
  addressLine1: "",
  addressLine2: "",
  landmark: "",
  pincode: "",
  city: "",
  state: "Maharashtra",
  slot: "morning",
  note: "",
  consent: false as unknown as true,
  website: "",
};

/** Field order for focusing the first error. */
const FIELD_ORDER: OrderField[] = [
  "items",
  "customerName",
  "phone",
  "email",
  "addressLine1",
  "addressLine2",
  "landmark",
  "pincode",
  "city",
  "state",
  "slot",
  "note",
  "consent",
];

const inputClass =
  "h-[52px] w-full rounded-xl border border-line bg-ground px-4 text-base text-ink placeholder:text-muted/80 aria-[invalid=true]:border-2 aria-[invalid=true]:border-primary";

function Field({
  id,
  label,
  optional,
  error,
  hint,
  className = "",
  children,
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      <label htmlFor={id} className="text-sm font-semibold">
        {label} {optional && <span className="font-normal text-muted">(optional)</span>}
      </label>
      {children}
      {error && (
        <p
          id={`${id}-error`}
          className="flex items-start gap-1.5 text-sm font-semibold text-primary"
        >
          <span aria-hidden>!</span> {error}
        </p>
      )}
      {!error && hint}
    </div>
  );
}

function Section({ n, title, children }: { n: number; title: string; children: ReactNode }) {
  return (
    <section
      aria-labelledby={`step-${n}`}
      className="rounded-3xl border border-line bg-ground p-[clamp(20px,3vw,36px)]"
    >
      <h2
        id={`step-${n}`}
        className="flex items-center gap-3.5 font-display text-[26px] text-primary"
      >
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-primary font-sans text-[15px] font-bold text-on-primary"
        >
          {n}
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

export function OrderForm() {
  const router = useRouter();
  const hydrated = useCartHydrated();
  const lines = useCart((s) => s.lines);
  const clearCart = useCart((s) => s.clear);
  const applyChanges = useCart((s) => s.applyChanges);

  const [values, setValues] = useState<Values>(INITIAL);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [pincodeStatus, setPincodeStatus] = useState<PincodeResult | null>(null);
  const [pending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);
  const noticeRef = useRef<HTMLDivElement>(null);

  const input = (): OrderRequestInput => ({
    ...values,
    items: lines.map((l) => ({
      variantId: l.variantId,
      quantity: l.quantity,
      expectedPricePaise: l.pricePaise,
    })),
  });

  function validate(next: Values = values): FieldErrors {
    const result = orderRequestSchema.safeParse({ ...input(), ...next });
    return result.success ? {} : fieldErrors(result.error);
  }

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    const next = { ...values, [key]: value };
    setValues(next);
    // Once someone has tried to submit, keep errors in step as they type.
    if (submitted || errors[key as OrderField]) {
      const all = validate(next);
      setErrors((prev) => ({ ...prev, [key]: all[key as OrderField] }));
    }
  }

  function blur(key: OrderField) {
    const message = validate()[key];
    setErrors((prev) => ({ ...prev, [key]: message }));
  }

  function focusFirst(errs: FieldErrors) {
    const first = FIELD_ORDER.find((f) => errs[f]);
    if (!first) return;
    const el = formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`);
    if (el) {
      el.focus();
      el.scrollIntoView({ block: "center", behavior: "smooth" });
    } else {
      noticeRef.current?.focus();
    }
  }

  function showNotice(message: string) {
    setNotice(message);
    requestAnimationFrame(() => {
      noticeRef.current?.focus();
      noticeRef.current?.scrollIntoView({ block: "center", behavior: "smooth" });
    });
  }

  async function onPincodeBlur() {
    blur("pincode");
    if (!isValidPincode(values.pincode)) {
      setPincodeStatus(null);
      return;
    }
    setPincodeStatus(await checkPincode(values.pincode));
  }

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    setNotice(null);
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      focusFirst(errs);
      return;
    }
    startTransition(async () => {
      const result = await placeOrder(input());
      switch (result.status) {
        case "ok":
          clearCart();
          router.push(`/order/thank-you/${encodeURIComponent(result.reference)}`);
          return;
        case "invalid":
          setErrors(result.errors);
          focusFirst(result.errors);
          return;
        case "cart_changed": {
          applyChanges(result.changes);
          const removed = result.changes.filter((c) => c.kind === "unavailable").length;
          const repriced = result.changes.length - removed;
          showNotice(
            [
              repriced > 0 &&
                `${repriced === 1 ? "A price has" : "Some prices have"} been updated.`,
              removed > 0 &&
                `${removed === 1 ? "An item is" : `${removed} items are`} no longer available and ${removed === 1 ? "was" : "were"} removed.`,
              "Please check your order and send it again.",
            ]
              .filter(Boolean)
              .join(" "),
          );
          return;
        }
        case "error":
          showNotice(result.message);
      }
    });
  }

  if (!hydrated) {
    return <div aria-hidden className="mt-11 h-96 animate-pulse rounded-3xl bg-surface" />;
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10 max-w-2xl rounded-3xl border border-line bg-surface p-8">
        <p className="text-lg">Your order is empty.</p>
        <Link href="/#shop" className={`${buttonStyles.primary} mt-5`}>
          Browse products
        </Link>
      </div>
    );
  }

  const count = itemCount(lines);
  const total = formatPaise(subtotalPaise(lines));
  const errorList = FIELD_ORDER.filter((f) => errors[f]);
  const describedBy = (f: OrderField) => (errors[f] ? `${f}-error` : undefined);
  const aria = (f: OrderField) => ({
    "aria-invalid": errors[f] ? true : undefined,
    "aria-describedby": describedBy(f),
  });

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate className="mt-11">
      <div ref={noticeRef} tabIndex={-1} role="alert" className="outline-none empty:hidden">
        {notice && (
          <p className="mb-6 rounded-2xl border-2 border-primary bg-surface p-4 font-semibold text-primary">
            {notice}
          </p>
        )}
        {submitted && errorList.length > 0 && !notice && (
          <div className="mb-6 rounded-2xl border-2 border-primary bg-surface p-4">
            <p className="font-semibold text-primary">
              Please fix {errorList.length === 1 ? "this" : `these ${errorList.length} things`}:
            </p>
            <ul className="mt-2 list-disc pl-5 text-sm">
              {errorList.map((f) => (
                <li key={f}>{errors[f]}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-start gap-8">
        <div className="flex min-w-0 flex-[999_1_560px] flex-col gap-6">
          <Section n={1} title="Your products">
            <ul className="mt-4">
              {lines.map((line) => (
                <CartLineRow key={line.variantId} line={line} />
              ))}
            </ul>
            <Link
              href="/#shop"
              className="mt-2 inline-flex min-h-11 items-center gap-2 font-semibold text-primary"
            >
              <PlusIcon size={16} /> Add more products
            </Link>
          </Section>

          <Section n={2} title="Contact details">
            <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-2">
              <Field
                id="customerName"
                label="Full name"
                error={errors.customerName}
                className="sm:col-span-2"
              >
                <input
                  id="customerName"
                  name="customerName"
                  autoComplete="name"
                  value={values.customerName}
                  onChange={(e) => set("customerName", e.target.value)}
                  onBlur={() => blur("customerName")}
                  placeholder="As it should appear on the parcel"
                  className={inputClass}
                  {...aria("customerName")}
                />
              </Field>
              <Field id="phone" label="Mobile number" error={errors.phone}>
                <div className="flex">
                  <span className="flex items-center rounded-l-xl border border-r-0 border-line bg-surface px-3.5 font-semibold">
                    +91
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel-national"
                    value={values.phone}
                    onChange={(e) => set("phone", e.target.value)}
                    onBlur={() => blur("phone")}
                    placeholder="10-digit number"
                    className={`${inputClass} rounded-l-none`}
                    {...aria("phone")}
                  />
                </div>
              </Field>
              <Field id="email" label="Email" optional error={errors.email}>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={values.email}
                  onChange={(e) => set("email", e.target.value)}
                  onBlur={() => blur("email")}
                  placeholder="For your order receipt"
                  className={inputClass}
                  {...aria("email")}
                />
              </Field>
              <label className="flex min-h-11 cursor-pointer items-center gap-3 sm:col-span-2">
                <input
                  type="checkbox"
                  name="whatsappOk"
                  checked={values.whatsappOk}
                  onChange={(e) => set("whatsappOk", e.target.checked)}
                  className="size-5 accent-primary"
                />
                This number is on WhatsApp — confirm my order there
              </label>
            </div>
          </Section>

          <Section n={3} title="Delivery address">
            <div className="mt-6 grid grid-cols-1 gap-[18px] sm:grid-cols-6">
              <Field
                id="addressLine1"
                label="Flat / house no., building"
                error={errors.addressLine1}
                className="sm:col-span-6"
              >
                <input
                  id="addressLine1"
                  name="addressLine1"
                  autoComplete="address-line1"
                  value={values.addressLine1}
                  onChange={(e) => set("addressLine1", e.target.value)}
                  onBlur={() => blur("addressLine1")}
                  placeholder="e.g. B-402, Shanti Residency"
                  className={inputClass}
                  {...aria("addressLine1")}
                />
              </Field>
              <Field
                id="addressLine2"
                label="Street, area, locality"
                error={errors.addressLine2}
                className="sm:col-span-6"
              >
                <input
                  id="addressLine2"
                  name="addressLine2"
                  autoComplete="address-line2"
                  value={values.addressLine2}
                  onChange={(e) => set("addressLine2", e.target.value)}
                  onBlur={() => blur("addressLine2")}
                  placeholder="e.g. Baner Road, Baner"
                  className={inputClass}
                  {...aria("addressLine2")}
                />
              </Field>
              <Field
                id="landmark"
                label="Landmark"
                optional
                error={errors.landmark}
                className="sm:col-span-6"
              >
                <input
                  id="landmark"
                  name="landmark"
                  value={values.landmark}
                  onChange={(e) => set("landmark", e.target.value)}
                  onBlur={() => blur("landmark")}
                  placeholder="Helps our delivery partner find you"
                  className={inputClass}
                  {...aria("landmark")}
                />
              </Field>
              <Field
                id="pincode"
                label="Pincode"
                error={errors.pincode}
                className="sm:col-span-2"
                hint={
                  pincodeStatus && (
                    <p id="pincode-hint" aria-live="polite" className="text-sm">
                      {pincodeStatus.status === "serviceable" ? (
                        <span className="flex items-center gap-1.5 font-semibold text-primary">
                          <CheckIcon size={16} /> We deliver here
                        </span>
                      ) : pincodeStatus.status === "not_serviceable" ? (
                        "Not on our delivery list yet — send the request and we'll confirm."
                      ) : null}
                    </p>
                  )
                }
              >
                <input
                  id="pincode"
                  name="pincode"
                  inputMode="numeric"
                  autoComplete="postal-code"
                  maxLength={7}
                  value={values.pincode}
                  onChange={(e) => {
                    set("pincode", e.target.value);
                    setPincodeStatus(null);
                  }}
                  onBlur={onPincodeBlur}
                  placeholder="6 digits"
                  className={inputClass}
                  {...aria("pincode")}
                />
              </Field>
              <Field id="city" label="City" error={errors.city} className="sm:col-span-2">
                <input
                  id="city"
                  name="city"
                  autoComplete="address-level2"
                  value={values.city}
                  onChange={(e) => set("city", e.target.value)}
                  onBlur={() => blur("city")}
                  className={inputClass}
                  {...aria("city")}
                />
              </Field>
              <Field id="state" label="State" error={errors.state} className="sm:col-span-2">
                <select
                  id="state"
                  name="state"
                  autoComplete="address-level1"
                  value={values.state}
                  onChange={(e) => set("state", e.target.value as Values["state"])}
                  className={inputClass}
                  {...aria("state")}
                >
                  {INDIAN_STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
            </div>
          </Section>

          <Section n={4} title="Delivery preference">
            <fieldset className="mt-6" aria-describedby={describedBy("slot")}>
              <legend className="text-sm font-semibold">Preferred time slot</legend>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                {DELIVERY_SLOTS.map((slot) => {
                  const checked = values.slot === slot.value;
                  return (
                    <label
                      key={slot.value}
                      className={`flex min-h-16 cursor-pointer items-center gap-3 rounded-2xl px-4 py-3 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-primary ${
                        checked ? "border-2 border-primary bg-surface" : "border border-line"
                      }`}
                    >
                      <input
                        type="radio"
                        name="slot"
                        value={slot.value}
                        checked={checked}
                        onChange={() => set("slot", slot.value)}
                        className="size-5 accent-primary"
                      />
                      <span>
                        <span className="block font-semibold text-primary">{slot.label}</span>
                        <span className="block text-[13px] text-muted">{slot.time}</span>
                      </span>
                    </label>
                  );
                })}
              </div>
              {errors.slot && (
                <p id="slot-error" className="mt-2 text-sm font-semibold text-primary">
                  {errors.slot}
                </p>
              )}
            </fieldset>
            <Field
              id="note"
              label="Anything we should know?"
              optional
              error={errors.note}
              className="mt-5"
            >
              <textarea
                id="note"
                name="note"
                rows={3}
                maxLength={500}
                value={values.note}
                onChange={(e) => set("note", e.target.value)}
                onBlur={() => blur("note")}
                placeholder="Gate code, gift note, preferred delivery day…"
                className={`${inputClass} h-auto resize-y py-3.5`}
                {...aria("note")}
              />
            </Field>
          </Section>

          <div className="flex flex-col gap-2">
            <label className="flex cursor-pointer items-start gap-3 text-[15px]">
              <input
                type="checkbox"
                name="consent"
                checked={values.consent === true}
                onChange={(e) => set("consent", e.target.checked as true)}
                className="mt-0.5 size-5 flex-none accent-primary"
                {...aria("consent")}
              />
              <span>
                I agree to be contacted on WhatsApp or by phone about this order, as described in
                the{" "}
                <Link href="/policies/privacy" className="text-primary underline" target="_blank">
                  privacy policy
                </Link>
                .
              </span>
            </label>
            {errors.consent && (
              <p id="consent-error" className="pl-8 text-sm font-semibold text-primary">
                {errors.consent}
              </p>
            )}
          </div>

          {/* Honeypot: hidden from people and screen readers. */}
          <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              tabIndex={-1}
              autoComplete="off"
              value={values.website}
              onChange={(e) => set("website", e.target.value)}
            />
          </div>
        </div>

        <aside
          aria-label="Order summary"
          className="min-w-0 flex-[1_1_320px] rounded-3xl bg-primary p-[clamp(24px,3vw,36px)] text-on-primary lg:sticky lg:top-28"
        >
          <h2 className="font-display text-[26px]">Order summary</h2>
          <ul className="mt-5 flex flex-col gap-3 text-[15px]">
            {lines.map((l) => (
              <li key={l.variantId} className="flex justify-between gap-3">
                <span>
                  {l.productName} {l.variantLabel}{" "}
                  <span className="opacity-75">× {l.quantity}</span>
                </span>
                <span className="font-semibold">{formatPaise(l.pricePaise * l.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex flex-col gap-2.5 border-t border-on-primary/20 pt-4 text-[15px]">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span className="font-semibold">{total}</span>
            </div>
            <div className="flex justify-between gap-3">
              <span>Delivery</span>
              <span className="text-right opacity-75">Confirmed on WhatsApp</span>
            </div>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-on-primary/20 pt-4">
            <span>
              Estimated total
              <span className="sr-only">
                {" "}
                for {count} {count === 1 ? "item" : "items"}
              </span>
            </span>
            <span className="font-display text-[34px]">{total}</span>
          </div>
          <button
            type="submit"
            disabled={pending}
            className={`${buttonStyles.accent} mt-6 min-h-[58px] w-full text-[17px] max-sm:hidden`}
          >
            {pending ? "Sending…" : "Send order request"}
            {!pending && <ArrowRightIcon size={18} />}
          </button>
          <ul className="mt-5 flex flex-col gap-3 text-sm opacity-90">
            {[
              "Nothing is charged now",
              "Pay by UPI or cash on delivery",
              "Change or cancel any time before dispatch",
            ].map((t) => (
              <li key={t} className="flex gap-2.5">
                <CheckIcon size={18} className="flex-none text-accent" /> {t}
              </li>
            ))}
          </ul>
        </aside>
      </div>

      {/* Phone: total and submit pinned to the bottom */}
      <div
        data-mobile-actions
        className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3.5 rounded-t-[22px] bg-primary px-4 pt-3.5 pb-[max(1.5rem,env(safe-area-inset-bottom))] text-on-primary sm:hidden"
      >
        <span className="flex flex-col">
          <span className="text-xs opacity-75">
            {count} {count === 1 ? "item" : "items"} · est. total
          </span>
          <span className="font-display text-2xl">{total}</span>
        </span>
        <button type="submit" disabled={pending} className={`${buttonStyles.accent} flex-1 px-4`}>
          {pending ? "Sending…" : "Send order request"}
        </button>
      </div>
      <div aria-hidden className="h-24 sm:hidden" />
    </form>
  );
}
