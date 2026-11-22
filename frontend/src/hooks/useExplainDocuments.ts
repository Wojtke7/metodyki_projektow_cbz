import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import {
  explainDocument,
  type DocumentExplanation,
} from "@/api/explain";
import i18n from "@/translations";

async function explainFiles(files: File[]) {
  const explanations: DocumentExplanation[] = [];

  for (const file of files) {
    explanations.push(await explainDocument(file, i18n.resolvedLanguage));
  }

  return explanations;
}

export function useExplainDocuments() {
  return useMutation({ mutationFn: explainFiles });
}

export function explainErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (!error.response) return i18n.t("errors.offline");
  }
  if (error instanceof Error && error.message) return error.message;
  return i18n.t("errors.explainFailed");
}
