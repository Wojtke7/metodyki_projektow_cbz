import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { explainLetter, type DocumentExplanation } from "@/api/explain";
import { readDocumentText, TranslatedError } from "@/lib/documents";
import i18n from "@/translations";

async function explainFiles(files: File[]) {
  const explanations: DocumentExplanation[] = [];

  for (const file of files) {
    const text = (await readDocumentText(file)).trim();
    if (!text) {
      throw new TranslatedError("errors.noText", { name: file.name });
    }
    explanations.push(await explainLetter(text));
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
  if (error instanceof TranslatedError) return i18n.t(error.key, error.values);
  if (error instanceof Error && error.message) return error.message;
  return i18n.t("errors.explainFailed");
}
