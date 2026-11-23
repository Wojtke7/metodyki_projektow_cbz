import { apiRequest } from "@/api/axios";

export type DocumentExplanation = {
  summary: string;
  explanation: string;
  source_passages: string[];
  action_checklist: string[];
  deadlines: string[];
  amount: string;
  disclaimer: string;
};

export function explainLetter(text: string) {
  return apiRequest<DocumentExplanation>("POST", "/explain", { text });
}

export function explainDocument(file: File, language?: string) {
  const form = new FormData();
  form.append("file", file);
  if (language) form.append("language", language);
  return apiRequest<DocumentExplanation>("POST", "/explain/file", form);
}
