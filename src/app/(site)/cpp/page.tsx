import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("cpp");

export default function CppPage() {
  return <LanguageLanding language="cpp" />;
}
