import { useMutation } from "@tanstack/react-query";
import axios from "axios";

import { explainFile, type DocumentExplanation } from "@/api/explain";
import {
  explainBackendErrorKey,
  MAX_DOCUMENT_SIZE_MB,
  TranslatedError,
} from "@/lib/documents";
import i18n, { languages, type Language } from "@/translations";

function activeLanguage(): Language {
  return (
    languages.find((language) => language === i18n.resolvedLanguage) ?? "pl"
  );
}

async function explainFiles(files: File[]) {
  const explanations: DocumentExplanation[] = [];
  const language = activeLanguage();

  for (const file of files) {
    try {
      explanations.push(await explainFile(file, language));
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const key = explainBackendErrorKey(
          error.response?.status,
          error.response?.data,
        );
        if (key) {
          throw new TranslatedError(key, {
            name: file.name,
            maxSize: MAX_DOCUMENT_SIZE_MB,
          });
        }
      }
      throw error;
    }
  }

  return explanations;
}

export function useExplainDocuments() {
  return useMutation({ mutationFn: explainFiles });
}

export function explainErrorMessage(error: unknown) {
  if (error instanceof TranslatedError) return i18n.t(error.key, error.values);
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === "string" && detail) return detail;
    if (!error.response) return i18n.t("errors.offline");
  }
  if (error instanceof Error && error.message) return error.message;
  return i18n.t("errors.explainFailed");
}
