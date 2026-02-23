'use client';

import { useState } from 'react';
import { Plus, Trash2, Type, MessageSquare } from 'lucide-react';
import { useCards } from '@/context/CardContext';

type Tab = 'words' | 'sentences';

export default function ManagePage() {
  const { wordCards, sentenceCards, addWord, addSentence, deleteCard } = useCards();
  const [activeTab, setActiveTab] = useState<Tab>('words');

  // Word form
  const [wordEnglish, setWordEnglish] = useState('');
  const [wordPortuguese, setWordPortuguese] = useState('');

  // Sentence form
  const [sentEnglish, setSentEnglish] = useState('');
  const [sentPortuguese, setSentPortuguese] = useState('');

  const handleAddWord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wordEnglish.trim() || !wordPortuguese.trim()) return;
    addWord(wordEnglish, wordPortuguese);
    setWordEnglish('');
    setWordPortuguese('');
  };

  const handleAddSentence = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sentEnglish.trim() || !sentPortuguese.trim()) return;
    addSentence(sentEnglish, sentPortuguese);
    setSentEnglish('');
    setSentPortuguese('');
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Manage Cards
      </h1>

      {/* Tab switcher */}
      <div className="flex gap-1 rounded-xl border border-gray-200 bg-gray-100 p-1 dark:border-gray-700 dark:bg-gray-800">
        <button
          onClick={() => setActiveTab('words')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'words'
              ? 'bg-white text-indigo-600 shadow-sm dark:bg-gray-700 dark:text-indigo-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <Type className="h-4 w-4" />
          Words ({wordCards.length})
        </button>
        <button
          onClick={() => setActiveTab('sentences')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-all ${
            activeTab === 'sentences'
              ? 'bg-white text-emerald-600 shadow-sm dark:bg-gray-700 dark:text-emerald-400'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Sentences ({sentenceCards.length})
        </button>
      </div>

      {/* Words tab */}
      {activeTab === 'words' && (
        <div className="space-y-4">
          {/* Add word form */}
          <form
            onSubmit={handleAddWord}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Add New Word
            </h3>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="word-english"
                  className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  English Word
                </label>
                <input
                  id="word-english"
                  type="text"
                  value={wordEnglish}
                  onChange={(e) => setWordEnglish(e.target.value)}
                  placeholder="e.g. apple"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="word-portuguese"
                  className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Portuguese Meaning
                </label>
                <input
                  id="word-portuguese"
                  type="text"
                  value={wordPortuguese}
                  onChange={(e) => setWordPortuguese(e.target.value)}
                  placeholder="e.g. maçã"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Add Word
            </button>
          </form>

          {/* Word list */}
          <div className="space-y-2">
            {wordCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-gray-900 dark:text-white">
                    {card.english}
                  </span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">
                    {card.portuguese}
                  </span>
                  {card.status.mastered && (
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Mastered
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteCard(card.id)}
                  className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label={`Delete ${card.english}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {wordCards.length === 0 && (
              <p className="py-8 text-center text-gray-400 dark:text-gray-500">
                No word cards yet. Add your first one above!
              </p>
            )}
          </div>
        </div>
      )}

      {/* Sentences tab */}
      {activeTab === 'sentences' && (
        <div className="space-y-4">
          {/* Add sentence form */}
          <form
            onSubmit={handleAddSentence}
            className="rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800"
          >
            <h3 className="mb-4 font-semibold text-gray-900 dark:text-white">
              Add New Sentence
            </h3>
            <div className="space-y-3">
              <div>
                <label
                  htmlFor="sent-english"
                  className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  English Sentence
                </label>
                <input
                  id="sent-english"
                  type="text"
                  value={sentEnglish}
                  onChange={(e) => setSentEnglish(e.target.value)}
                  placeholder="e.g. The cat is on the table"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  required
                />
              </div>
              <div>
                <label
                  htmlFor="sent-portuguese"
                  className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Portuguese Translation
                </label>
                <input
                  id="sent-portuguese"
                  type="text"
                  value={sentPortuguese}
                  onChange={(e) => setSentPortuguese(e.target.value)}
                  placeholder="e.g. O gato está na mesa"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-500"
                  required
                />
              </div>
            </div>
            <button
              type="submit"
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700"
            >
              <Plus className="h-4 w-4" />
              Add Sentence
            </button>
          </form>

          {/* Sentence list */}
          <div className="space-y-2">
            {sentenceCards.map((card) => (
              <div
                key={card.id}
                className="flex items-center justify-between rounded-lg border border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-gray-900 dark:text-white">
                    {card.english}
                  </p>
                  <p className="truncate text-sm text-gray-500 dark:text-gray-400">
                    {card.portuguese}
                  </p>
                  {card.status.mastered && (
                    <span className="mt-1 inline-block rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Mastered
                    </span>
                  )}
                </div>
                <button
                  onClick={() => deleteCard(card.id)}
                  className="ml-3 shrink-0 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
                  aria-label={`Delete sentence: ${card.english}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            {sentenceCards.length === 0 && (
              <p className="py-8 text-center text-gray-400 dark:text-gray-500">
                No sentence cards yet. Add your first one above!
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
