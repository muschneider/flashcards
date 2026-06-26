import Link from 'next/link';
import { ArrowLeft, ArrowRight, Layers, Puzzle, Volume2 } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { oughWords } from '@/data/confusingWords';

type ModuleEntry = {
  href: string;
  title: string;
  description: string;
  badge: string;
  tags: string[];
  icon: LucideIcon;
};

const MODULES: ModuleEntry[] = [
  {
    href: '/modules/ough-words',
    title: 'Palavras "ough" confusas',
    description:
      'tough, though, through, thought, thorough e throughout. Palavras quase iguais na escrita, mas com som e sentido diferentes.',
    badge: `${oughWords.length} palavras`,
    tags: ['Pronúncia', 'Tradução', 'Exemplos', 'Áudio'],
    icon: Volume2,
  },
  {
    href: '/modules/match-pairs',
    title: 'Combine os pares',
    description:
      'Relacione cada palavra em inglês ao seu significado em português. 5 pares aleatórios a cada rodada.',
    badge: 'Jogo',
    tags: ['Vocabulário', 'Tradução', 'Memória'],
    icon: Puzzle,
  },
];

export default function ModulesPage() {
  return (
    <div className="space-y-8">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Início
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Módulos de aprendizado
        </h1>
        <p className="mt-2 text-gray-500 dark:text-gray-400">
          Estudos focados em grupos de palavras difíceis de memorizar.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map((m) => (
          <Link
            key={m.href}
            href={m.href}
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-6 transition-all hover:border-indigo-300 hover:shadow-md dark:border-gray-700 dark:bg-gray-800 dark:hover:border-indigo-700"
          >
            <div className="mb-3 flex items-center justify-between">
              <div className="inline-flex rounded-lg bg-indigo-100 p-2 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                <m.icon className="h-6 w-6" />
              </div>
              <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300">
                {m.badge}
              </span>
            </div>

            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{m.title}</h2>
            <p className="mt-1 flex-1 text-sm text-gray-500 dark:text-gray-400">{m.description}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              {m.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                >
                  {tag}
                </span>
              ))}
            </div>

            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-indigo-600 transition-transform group-hover:translate-x-0.5 dark:text-indigo-400">
              Abrir módulo
              <ArrowRight className="h-4 w-4" />
            </span>
          </Link>
        ))}

        {/* Placeholder hint for future modules */}
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 p-6 text-center dark:border-gray-700">
          <Layers className="mb-2 h-8 w-8 text-gray-300 dark:text-gray-600" />
          <p className="text-sm text-gray-400 dark:text-gray-500">Mais módulos em breve</p>
        </div>
      </div>
    </div>
  );
}
