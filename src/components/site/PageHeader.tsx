import type { ReactNode } from "react";

interface PageHeaderProps {
  heading: string;
  lead: ReactNode;
  /** Breadcrumb or eyebrow shown above the heading. */
  above?: ReactNode;
  /** Calls to action below the lead. */
  actions?: ReactNode;
}

/** The H1 block at the top of a content page. */
export function PageHeader({ heading, lead, above, actions }: PageHeaderProps) {
  return (
    <header className="pt-12 pb-4 sm:pt-16">
      {above}
      <h1 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {heading}
      </h1>
      <div className="mt-4 max-w-2xl space-y-3 text-lg text-pretty text-muted-foreground">
        {lead}
      </div>
      {actions && <div className="mt-8 flex flex-wrap gap-3">{actions}</div>}
    </header>
  );
}
