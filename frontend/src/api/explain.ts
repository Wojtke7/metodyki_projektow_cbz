import { apiRequest } from "@/api/axios";

export type DocumentExplanation = {
  explanation: string;
  source_passages: string[];
  action_checklist: string[];
  deadlines: string[];
};

export function explainLetter(text: string) {
  return apiRequest<DocumentExplanation>("POST", "/explain", { text });
}
