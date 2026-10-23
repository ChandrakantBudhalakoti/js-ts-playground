import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("r");

export default function RPage() {
  return <LanguageLanding language="r" />;
}
