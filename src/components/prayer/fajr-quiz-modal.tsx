'use client';

import { useState, useEffect, useCallback } from 'react';
import { generateQuizQuestion } from '@/lib/fajr-quiz-verses';
import { cn } from '@/lib/utils';

interface FajrQuizModalProps {
  open: boolean;
  onSolved: () => void;
}

export function FajrQuizModal({ open, onSolved }: FajrQuizModalProps) {
  const [quiz, setQuiz] = useState(() => generateQuizQuestion());
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isWrong, setIsWrong] = useState(false);
  const [isSolved, setIsSolved] = useState(false);

  // Regenerate quiz when modal opens
  useEffect(() => {
    if (open) {
      setQuiz(generateQuizQuestion());
      setSelectedChoice(null);
      setIsWrong(false);
      setIsSolved(false);
    }
  }, [open]);

  const handleChoice = useCallback((word: string) => {
    if (isSolved) return;

    setSelectedChoice(word);

    if (word === quiz.correctWord) {
      // Correct!
      setIsSolved(true);
      // Delay to show success animation
      setTimeout(() => {
        onSolved();
      }, 1200);
    } else {
      // Wrong — shake
      setIsWrong(true);
      setTimeout(() => {
        setIsWrong(false);
        setSelectedChoice(null);
      }, 800);
    }
  }, [quiz.correctWord, isSolved, onSolved]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/95" />

      {/* Content */}
      <div
        className={cn(
          "relative z-10 w-full max-w-md mx-4 flex flex-col items-center gap-8 p-6",
          isWrong && "animate-shake"
        )}
      >
        {/* Header — Islamic geometric accent */}
        <div className="flex flex-col items-center gap-3">
          <div className="text-4xl">🌙</div>
          <h2 className="text-xl font-bold text-amber-400">
            أكمل الآية لإيقاف الأذان
          </h2>
          <p className="text-sm text-white/50">
            اختر الكلمة الناقصة
          </p>
        </div>

        {/* Verse display */}
        <div
          className={cn(
            "w-full rounded-2xl border p-6 transition-all duration-500",
            isSolved
              ? "border-emerald-500/50 bg-emerald-500/10"
              : isWrong
              ? "border-red-500/50 bg-red-500/10"
              : "border-white/10 bg-white/5"
          )}
        >
          <p
            className="text-2xl md:text-3xl leading-[2.2] text-center font-quran text-white"
            dir="rtl"
          >
            {quiz.displayWords.map((word, i) => (
              <span key={i}>
                {word === '______' ? (
                  <span
                    className={cn(
                      "inline-block mx-1 px-3 py-0.5 rounded-lg border-b-2 border-dashed min-w-[60px] text-center transition-all duration-300",
                      isSolved
                        ? "border-emerald-400 text-emerald-400 bg-emerald-500/10"
                        : "border-amber-400/50 text-amber-400/40"
                    )}
                  >
                    {isSolved ? quiz.correctWord : '؟؟؟'}
                  </span>
                ) : (
                  <span className="mx-0.5">{word}</span>
                )}
                {' '}
              </span>
            ))}
          </p>

          {/* Surah reference */}
          <p className="text-center text-xs text-white/30 mt-4">
            سورة {quiz.verse.surahName} — الآية {quiz.verse.ayah}
          </p>
        </div>

        {/* Choices */}
        <div className="w-full grid grid-cols-2 gap-3">
          {quiz.choices.map((choice, i) => {
            const isCorrectChoice = isSolved && choice === quiz.correctWord;
            const isWrongChoice = isWrong && selectedChoice === choice;

            return (
              <button
                key={`${choice}-${i}`}
                onClick={() => handleChoice(choice)}
                disabled={isSolved}
                className={cn(
                  "rounded-xl px-4 py-4 text-lg font-quran transition-all duration-300 border",
                  "active:scale-95",
                  isCorrectChoice
                    ? "bg-emerald-500/20 border-emerald-500 text-emerald-400 scale-105"
                    : isWrongChoice
                    ? "bg-red-500/20 border-red-500 text-red-400"
                    : "bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20"
                )}
              >
                {choice}
              </button>
            );
          })}
        </div>

        {/* Success message */}
        {isSolved && (
          <div className="flex flex-col items-center gap-2 animate-fade-in">
            <p className="text-emerald-400 text-lg font-bold">
              ✅ أحسنت! صح
            </p>
            <p className="text-white/40 text-sm">
              جاري إيقاف الأذان...
            </p>
          </div>
        )}
      </div>

      {/* CSS for shake animation */}
      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 50%, 90% { transform: translateX(-8px); }
          30%, 70% { transform: translateX(8px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </div>
  );
}
