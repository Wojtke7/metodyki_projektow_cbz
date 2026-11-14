import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import common from "./pl/common.json" with { type: "json" }

void i18n.use(initReactI18next).init({
  lng: "pl",
  fallbackLng: "pl",
  defaultNS: "common",
  ns: ["common"],
  resources: {
    pl: {
      common,
    },
  },
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
})

export default i18n
