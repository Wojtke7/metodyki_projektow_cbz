import { apiRequest } from "@/api/axios";

export type DocumentExplanation = {
  document_type?: string;
  summary: string;
  explanation: string;
  payment_info?: string;
  consequences?: string;
  source_passages: string[];
  action_checklist: string[];
  deadlines: string[];
  amount: string;
  disclaimer: string;
};

export function explainLetter(text: string, language?: string) {
  return apiRequest<DocumentExplanation>("POST", "/explain", { text, language });
}

export function explainDocument(file: File, language?: string) {
  const form = new FormData();
  form.append("file", file);
  if (language) form.append("language", language);
  return apiRequest<DocumentExplanation>("POST", "/explain/file", form);
}
