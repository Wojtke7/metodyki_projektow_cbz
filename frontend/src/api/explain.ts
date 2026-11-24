import { apiRequest } from "@/api/axios";
import type { Language } from "@/translations";

export type DocumentExplanation = {
  summary: string;
  explanation: string;
  source_passages: string[];
  action_checklist: string[];
  deadlines: string[];
  amount: string;
  disclaimer: string;
};

export function explainFile(file: File, language?: Language) {
  const body = new FormData();
  body.append("file", file);
  if (language) body.append("language", language);
  return apiRequest<DocumentExplanation>("POST", "/explain/file", body);
}

export function explainDocument(file: File, language?: string) {
  const form = new FormData();
  form.append("file", file);
  if (language) form.append("language", language);
  return apiRequest<DocumentExplanation>("POST", "/explain/file", form);
}
