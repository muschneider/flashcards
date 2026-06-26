import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import MatchPairsGame from '@/components/MatchPairsGame';

export default function MatchPairsModulePage() {
  return (
    <div className="space-y-6">
      <Link
        href="/modules"
        className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
      >
        <ArrowLeft className="h-4 w-4" />
        Módulos
      </Link>

      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
          Combine os pares
        </h1>
        <p className="mx-auto mt-2 max-w-xl text-gray-500 dark:text-gray-400">
          Relacione cada palavra em inglês (com a pronúncia) ao seu significado em português.
          Escolha quantos desafios fazer em seguida — as palavras não se repetem até você ver todas,
          e o ciclo recomeça ao terminar.
        </p>
      </div>

      <MatchPairsGame />
    </div>
  );
}
