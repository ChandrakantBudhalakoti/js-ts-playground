import type { ComponentProps } from "react";

/**
 * A link into the playground. Deliberately a plain `<a>` (full page load)
 * rather than `next/link`: with Cache Components, client-side navigation
 * keeps a page mounted but hidden in `<Activity>`, while the playground's
 * editor, sandbox and URL handling expect a real mount and unmount.
 */
export function PlaygroundLink({
  href = "/playground",
  ...props
}: ComponentProps<"a">) {
  return <a href={href} {...props} />;
}
