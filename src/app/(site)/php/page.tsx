import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("php");

export default function PhpPage() {
  return <LanguageLanding language="php" />;
}
