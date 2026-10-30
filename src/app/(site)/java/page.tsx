import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("java");

export default function JavaPage() {
  return <LanguageLanding language="java" />;
}
