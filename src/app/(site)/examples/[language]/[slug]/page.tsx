import { notFound } from "next/navigation";
import {
  ProgramArticle,
  programMetadata,
} from "@/components/site/ProgramArticle";
import {
  findProgram,
  languageForSegment,
  languageSegment,
  programCode,
  PROGRAMS,
  runnableLanguages,
} from "@/lib/programs";

/** One page per beginner program per language: /examples/c/prime-number. */
export function generateStaticParams() {
  return runnableLanguages().flatMap((language) =>
    PROGRAMS.filter((program) => programCode(program, language)).map(
      (program) => ({
        language: languageSegment(language),
        slug: program.slug,
      }),
    ),
  );
}

function resolve({ language, slug }: { language: string; slug: string }) {
  const id = languageForSegment(language);
  const program = findProgram(slug);
  if (!id || !program || !programCode(program, id)) notFound();
  return { language: id, program };
}

export async function generateMetadata({
  params,
}: PageProps<"/examples/[language]/[slug]">) {
  const { language, program } = resolve(await params);
  return programMetadata(language, program);
}

export default async function ProgramPage({
  params,
}: PageProps<"/examples/[language]/[slug]">) {
  const { language, program } = resolve(await params);
  return <ProgramArticle language={language} program={program} />;
}
