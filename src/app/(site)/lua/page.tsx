import {
  LanguageLanding,
  languagePageMetadata,
} from "@/components/site/LanguageLanding";

export const metadata = languagePageMetadata("lua");

export default function LuaPage() {
  return <LanguageLanding language="lua" />;
}
