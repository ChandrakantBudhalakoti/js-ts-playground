import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("go");

export default function GoPage() {
  return <LanguageLanding language="go" />;
}
