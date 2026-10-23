import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("c");

export default function CPage() {
  return <LanguageLanding language="c" />;
}
