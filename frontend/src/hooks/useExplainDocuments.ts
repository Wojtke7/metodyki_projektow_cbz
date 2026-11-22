import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import {
  explainDocument,
  type DocumentExplanation,
} from "@/api/explain";
import i18n from "@/translations";

export type ExplainFilesArgs =
  | File[]
  | {
      files: File[];
      language?: string;
    };

export type ExplainFilesResult = {
  language: string;
  explanations: DocumentExplanation[];
};

async function explainFiles(
  arg: ExplainFilesArgs,
): Promise<ExplainFilesResult> {
  const files = Array.isArray(arg) ? arg : arg.files;
  const targetLanguage =
    (Array.isArray(arg) ? undefined : arg.language) ||
    i18n.resolvedLanguage ||
    "pl";
  const explanations: DocumentExplanation[] = [];

  for (const file of files) {
    explanations.push(await explainDocument(file, targetLanguage));
  }

  return { language: targetLanguage, explanations };
}

export function useExplainDocuments() {
  return useMutation({ mutationFn: explainFiles });
}

export function explainErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0];
      if (typeof first?.msg === "string") return first.msg;
    }
    if (status === 413) return "Dokument jest zbyt duży.";
    if (status === 415) return "Nieobsługiwany format pliku.";
    if (status === 429) return "Zbyt wiele zapytań. Spróbuj ponownie za chwilę.";
    if (status === 502) return "Usługa AI jest chwilowo niedostępna. Spróbuj ponownie później.";
    if (!error.response) return i18n.t("errors.offline");
  }
  if (error instanceof Error && error.message) return error.message;
  return i18n.t("errors.explainFailed");
}
