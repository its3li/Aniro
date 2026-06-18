'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { generateQuizQuestion } from '@/lib/fajr-quiz-verses';
import { cn } from '@/lib/utils';

interface FajrQuizModalProps {
  open: boolean;
  onSolved: () => void;
}

const COPY = {
  title: '\u0623\u0643\u0645\u0644 \u0627\u0644\u0622\u064a\u0629 \u0644\u0625\u064a\u0642\u0627\u0641 \u0623\u0630\u0627\u0646 \u0627\u0644\u0641\u062c\u0631',
  subtitle: '\u0627\u062e\u062a\u0631 \u0627\u0644\u0643\u0644\u0645\u0629 \u0627\u0644\u0646\u0627\u0642\u0635\u0629',
  surah: '\u0633\u0648\u0631\u0629',
  ayah: '\u0627\u0644\u0622\u064a\u0629',
  success: '\u0623\u062d\u0633\u0646\u062a! \u0625\u062c\u0627\u0628\u0629 \u0635\u062d\u064a\u062d\u0629',
  stopping: '\u062c\u0627\u0631\u064a \u0625\u064a\u0642\u0627\u0641 \u0627\u0644\u0623\u0630\u0627\u0646...',
  placeholder: '\u061f\u061f\u061f',
};

export function FajrQuizModal({ open, onSolved }: FajrQuizModalProps) {
  const [quiz, setQuiz] = useState(() => generateQuizQuestion());
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [isSolved, setIsSolved] = useState(false);
  const solveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resetTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    const timeoutId = window.setTimeout(() => {
      if (solveTimeoutRef.current) clearTimeout(solveTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
      setQuiz(generateQuizQuestion());
      setSelectedChoice(null);
      setIsWrong(false);
      setIsSolved(false);
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, [open]);

  useEffect(() => {
    return () => {
      if (solveTimeoutRef.current) clearTimeout(solveTimeoutRef.current);
      if (resetTimeoutRef.current) clearTimeout(resetTimeoutRef.current);
    };
  }, []);

  const handleChoice = useCallback((word: string) => {
    if (isSolved) return;

    setSelectedChoice(word);

    if (word === quiz.correctWord) {
      setIsSolved(true);
      solveTimeoutRef.current = setTimeout(onSolved, 900);
      return;
    }

    setIsWrong(true);
    resetTimeoutRef.current = setTimeout(() => {
      setIsWrong(false);
      setSelectedChoice(null);
    }, 650);
  }, [isSolved, onSolved, quiz.correctWord]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/95" />

      <div
        className={cn(
          'relative z-10 mx-4 flex w-full max-w-md flex-col items-center gap-8 p-6',
          isWrong && 'animate-fajr-quiz-shake'
        )}
      >
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full border border-amber-300/40 bg-amber-400/10 text-2xl text-amber-300">
            &#9790;
          </div>
          <h2 className="text-xl font-bold text-amber-300" dir="rtl">
            {COPY.title}
          </h2>
          <p className="text-sm text-white/55" dir="rtl">
            {COPY.subtitle}
          </p>
        </div>

        <div
          className={cn(
            'w-full rounded-2xl border p-6 transition-all duration-300',
            isSolved
              ? 'border-amber-400/60 bg-amber-400/10'
              : isWrong
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-white/10 bg-white/5'
          )}
        >
          <p className="font-quran text-center text-2xl leading-[2.2] text-white md:text-3xl" dir="rtl">
            {quiz.displayWords.map((word, index) => (
              <span key={`${word}-${index}`}>
                {word === '______' ? (
                  <span
                    className={cn(
                      'mx-1 inline-block min-w-[72px] rounded-lg border-b-2 border-dashed px-3 py-0.5 text-center transition-all duration-300',
                      isSolved
                        ? 'border-amber-300 bg-amber-400/10 text-amber-200'
                        : 'border-amber-400/60 text-amber-300/50'
                    )}
                  >
                    {isSolved ? quiz.correctWord : COPY.placeholder}
                  </span>
                ) : (
                  <span className="mx-0.5">{word}</span>
                )}
                {' '}
              </span>
            ))}
          </p>

          <p className="mt-4 text-center text-xs text-white/35" dir="rtl">
            {COPY.surah} {quiz.verse.surahName} - {COPY.ayah} {quiz.verse.ayah}
          </p>
        </div>

        <div className="grid w-full grid-cols-2 gap-3">
          {quiz.choices.map((choice, index) => {
            const isCorrectChoice = isSolved && choice === quiz.correctWord;
            const isWrongChoice = isWrong && selectedChoice === choice;

            return (
              <button
                key={`${choice}-${index}`}
                type="button"
                onClick={() => handleChoice(choice)}
                disabled={isSolved}
                className={cn(
                  'rounded-xl border px-4 py-4 font-quran text-lg transition-all duration-200 active:scale-95',
                  isCorrectChoice
                    ? 'scale-105 border-amber-300 bg-amber-400/15 text-amber-200'
                    : isWrongChoice
                      ? 'border-red-500 bg-red-500/20 text-red-300'
                      : 'border-white/10 bg-white/5 text-white hover:border-white/20 hover:bg-white/10'
                )}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {isSolved && (
          <div className="flex flex-col items-center gap-2 text-center">
            <p className="text-lg font-bold text-amber-200" dir="rtl">
              {COPY.success}
            </p>
            <p className="text-sm text-white/45" dir="rtl">
              {COPY.stopping}
            </p>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes fajr-quiz-shake {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-8px); }
          40%, 80% { transform: translateX(8px); }
        }

        .animate-fajr-quiz-shake {
          animation: fajr-quiz-shake 0.45s ease-in-out;
        }
      `}</style>
    </div>
  );
}
