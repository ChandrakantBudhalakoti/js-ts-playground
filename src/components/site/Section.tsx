import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface SectionProps {
  id?: string;
  heading: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** A page section with an H2; `id` doubles as an in-page anchor. */
export function Section({
  id,
  heading,
  intro,
  children,
  className,
}: SectionProps) {
  const headingId = id ? `${id}-heading` : undefined;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn("scroll-mt-6 py-12 sm:py-16", className)}
    >
      <h2
        id={headingId}
        className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl"
      >
        {heading}
      </h2>
      {intro && (
        <div className="mt-3 max-w-2xl text-muted-foreground">{intro}</div>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}

export function FaqList({
  faqs,
}: {
  faqs: { question: string; answer: string }[];
}) {
  return (
    <div className="grid gap-x-10 gap-y-8 md:grid-cols-2">
      {faqs.map((faq) => (
        <div key={faq.question}>
          <h3 className="font-medium">{faq.question}</h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {faq.answer}
          </p>
        </div>
      ))}
    </div>
  );
}
