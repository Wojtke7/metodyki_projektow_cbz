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

export function explainFile(file: File) {
  const body = new FormData();
  body.append("file", file);
  return apiRequest<DocumentExplanation>("POST", "/explain/file", body);
}
