import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("ruby");

export default function RubyPage() {
  return <LanguageLanding language="ruby" />;
}
