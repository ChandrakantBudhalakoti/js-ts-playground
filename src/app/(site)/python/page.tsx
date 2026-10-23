import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("python");

export default function PythonPage() {
  return <LanguageLanding language="python" />;
}
