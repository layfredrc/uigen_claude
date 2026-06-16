"use client";

import { ChangeEvent, FormEvent, KeyboardEvent } from "react";
import { Send } from "lucide-react";

interface MessageInputProps {
  input: string;
  handleInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
}

export function MessageInput({
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
}: MessageInputProps) {
  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const form = e.currentTarget.form;
      if (form) {
        form.requestSubmit();
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="relative p-4 bg-white dark:bg-[#101018] border-t border-neutral-200/60 dark:border-white/[0.07]">
      <div className="relative max-w-4xl mx-auto">
        <textarea
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Describe the React component you want to create..."
          disabled={isLoading}
          className="w-full min-h-[80px] max-h-[200px] pl-4 pr-14 py-3.5 rounded-xl border border-neutral-200 dark:border-white/[0.08] bg-neutral-50/50 dark:bg-white/[0.04] text-neutral-900 dark:text-neutral-100 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/10 dark:focus:ring-violet-500/20 focus:border-blue-500/50 dark:focus:border-violet-500/40 focus:bg-white dark:focus:bg-white/[0.06] transition-all placeholder:text-neutral-400 dark:placeholder:text-neutral-600 text-[15px] font-normal shadow-sm"
          rows={3}
        />
        <button
          type="submit"
          disabled={isLoading || !input?.trim()}
          className="absolute right-3 bottom-3 p-2.5 rounded-lg transition-all hover:bg-blue-50 dark:hover:bg-violet-500/10 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent group"
        >
          <Send className={`h-4 w-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${isLoading || !input?.trim() ? 'text-neutral-300 dark:text-neutral-600' : 'text-blue-600 dark:text-violet-400'}`} />
        </button>
      </div>
    </form>
  );
}