# Explanation API Contract (US-41, US-42)

This document specifies the technical contract between the **ProsteFakty Frontend** and **Backend** for explaining official letters and documents.

---

## 1. Endpoints

### 1.1 `POST /explain`
Explains a plain-text document.

- **Content-Type**: `application/json`
- **Request Body**:
  ```json
  {
    "text": "Tekst pisma urzędowego...",
    "language": "pl"
  }
  ```
- **Field Constraints**:
  - `text` (string, required): 1 to 50,000 characters. Letters longer than 50,000 characters are rejected with HTTP 413.
  - `language` (string, optional): Target explanation language. Supported values: `"pl"` (default), `"en"`, `"uk"`.

### 1.2 `POST /explain/file`
Extracts text from an uploaded document (PDF, DOCX, TXT) and returns an explanation.

- **Content-Type**: `multipart/form-data`
- **Form Fields**:
  - `file` (binary, required): Max 10 MB. Supported extensions: `.pdf`, `.docx`, `.txt`.
  - `language` (string, optional): Target explanation language: `"pl"`, `"en"`, `"uk"`.

---

## 2. Response Schema (`ExplainResponse`)

Status: **`200 OK`**  
Content-Type: **`application/json`**

| Field | Type | Description | Fallback / Default |
|---|---|---|---|
| `document_type` | `string` | Classification of the document: `"upomnienie"` (reminder), `"wezwanie"` (summons), `"decyzja"` (decision), `"informacja"` (information), `"inne"` (other). | `"inne"` / `"other"` |
| `summary` | `string` | 2–3 short sentences summarizing who is writing, why, and whether action is required. | `""` |
| `explanation` | `string` | Plain-language explanation in short sentences (max 10–15 words per sentence) without legal jargon. | *Required* |
| `payment_info` | `string` | How to pay: bank account number, amount, payment method. | `"Brak informacji w piśmie"` |
| `consequences` | `string` | Consequences of inaction (e.g. bailiff, statutory interest, account freeze). **Included ONLY if explicitly mentioned in the original document.** | `"Brak informacji w piśmie"` |
| `action_checklist` | `string[]` | 1–5 concrete, ordered steps the recipient must take. If none: `["Brak wymaganych działań"]`. | `[]` |
| `deadlines` | `string[]` | Relevant deadlines (exact date or relative term). If none: `["Brak terminu w piśmie"]`. | `[]` |
| `amount` | `string` | Total amount with currency (e.g. `"1 308,00 zł"`). If none: `"Brak kwoty w piśmie"`. | `""` |
| `source_passages` | `string[]` | Verbatim text snippets from the original document supporting the explanation. | `[]` |
| `disclaimer` | `string` | Standard legal informational notice. | Standard disclaimer string |

### Translation Invariance Guarantee (US-32 / US-42)
When `language` is `"en"` or `"uk"`, the explanation, checklist, and summaries are translated into plain language, but **amounts and deadlines remain invariant** (identical to the original document — no currency conversions, no alteration of dates).

---

## 3. Error Handling and Status Codes (US-41)

All error responses return a JSON object with a `detail` message:
```json
{
  "detail": "Descriptive error message"
}
```

| HTTP Status | Name | Condition | Example Response |
|---|---|---|---|
| **`413`** | Payload Too Large | Text exceeds 50,000 characters or uploaded file exceeds 10 MB. | `{"detail": "The submitted letter exceeds the maximum allowed length of 50000 characters."}` |
| **`415`** | Unsupported Media Type | Uploaded file is corrupted or not a valid PDF, DOCX, or TXT file. | `{"detail": "The uploaded file is not a supported document type."}` |
| **`422`** | Unprocessable Entity | Missing `text`, empty/whitespace text, unsupported `language` parameter, or blank file. | `{"detail": "Unsupported response language. Allowed values: pl, en, uk."}` |
| **`429`** | Too Many Requests | Rate limit exceeded (> 10 requests per minute per client IP). Includes `Retry-After: 60` header. | `{"detail": "Rate limit exceeded. Maximum 10 requests per minute allowed. Try again later."}` |
| **`502`** | Bad Gateway | AI service (Gemini) timeout, network error after 3 retries, or unreadable response. | `{"detail": "The AI service did not respond. Please try again later."}` |

---

## 4. Example JSON Payloads

### 4.1 Polish (`pl`) — Urząd Skarbowy (Sample 01)
```json
{
  "document_type": "upomnienie",
  "summary": "Urząd Skarbowy wzywa Cię do zapłaty zaległego podatku PIT za 2025 rok. Masz 7 dni na wpłatę pieniędzy. Jeśli nie zapłacisz, sprawę może przejąć komornik.",
  "explanation": "Urząd wykrył zaległość w Twoim podatku dochodowym za 2025 rok. Do kwoty podatku doliczono odsetki i koszty upomnienia. Musisz przelać całą kwotę na swój mikrorachunek podatkowy. Jeśli tego nie zrobisz w terminie, urząd rozpocznie przymusowe ściąganie długu.",
  "payment_info": "Wpłać 1 308,00 zł na indywidualny mikrorachunek podatkowy: PL 12 1010 0000 0000 1234 5678 9012.",
  "consequences": "Wszczęcie postępowania egzekucyjnego (zajęcie konta bankowego lub pensji) oraz dodatkowe koszty egzekucyjne.",
  "action_checklist": [
    "Zrób przelew na kwotę 1 308,00 zł.",
    "Użyj numeru mikrorachunku podatkowego podanego w piśmie.",
    "Wykonaj wpłatę w ciągu 7 dni od odebrania pisma."
  ],
  "deadlines": [
    "7 dni od dnia odebrania upomnienia"
  ],
  "amount": "1 308,00 zł",
  "source_passages": [
    "Naczelnik Pierwszego Urzędu Skarbowego w Krakowie wzywa Pana do uregulowania zaległości podatkowej",
    "Łączna kwota do zapłaty wynosi: 1 308,00 zł",
    "Wskazaną kwotę należy uiścić w terminie 7 dni od dnia doręczenia niniejszego upomnienia"
  ],
  "disclaimer": "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. W razie wątpliwości skontaktuj się z nadawcą pisma."
}
```

### 4.2 English (`en`) — Translation with Invariant Amounts and Deadlines
```json
{
  "document_type": "reminder",
  "summary": "The Tax Office summons you to pay overdue income tax for 2025. You must pay the full amount within 7 days. Failure to pay will lead to enforcement proceedings.",
  "explanation": "The Tax Office found overdue PIT tax for the year 2025. Interest and reminder costs have been added to the principal tax amount. You need to transfer the total sum to your tax micro-account. If payment is not made on time, bailiff enforcement will begin.",
  "payment_info": "Pay 1 308,00 zł to your individual tax micro-account: PL 12 1010 0000 0000 1234 5678 9012.",
  "consequences": "Commencement of administrative enforcement proceedings, including bank account or wage seizure and additional enforcement fees.",
  "action_checklist": [
    "Transfer the amount of 1 308,00 zł.",
    "Use the tax micro-account number specified in the letter.",
    "Complete payment within 7 days of receiving this letter."
  ],
  "deadlines": [
    "7 dni od dnia odebrania upomnienia"
  ],
  "amount": "1 308,00 zł",
  "source_passages": [
    "Naczelnik Pierwszego Urzędu Skarbowego w Krakowie wzywa Pana do uregulowania zaległości podatkowej",
    "Łączna kwota do zapłaty wynosi: 1 308,00 zł",
    "Wskazaną kwotę należy uiścić w terminie 7 dni od dnia doręczenia niniejszego upomnienia"
  ],
  "disclaimer": "This explanation is for informational purposes only and does not constitute legal advice. In case of doubt, contact the sender of the document."
}
```

### 4.3 Ukrainian (`uk`) — Translation with Invariant Amounts and Deadlines
```json
{
  "document_type": "upomnienie",
  "summary": "Податкова інспекція вимагає сплатити заборгованість з податку за 2025 рік. Ви маєте 7 днів на оплату. У разі несплати справу передадуть до примусового стягнення.",
  "explanation": "Податковий орган виявив недоплату податку PIT за 2025 рік. До суми додано відсотки та вартість нагадування. Необхідно переказати повну суму на ваш податковий мікрорахунок. Якщо не сплатити вчасно, почнеться процедура стягнення боргу.",
  "payment_info": "Сплатіть 1 308,00 zł на індивідуальний податковий мікрорахунок: PL 12 1010 0000 0000 1234 5678 9012.",
  "consequences": "Початок виконавчого провадження (арешт банківського рахунку чи заробітної плати) та додаткові витрати на стягнення.",
  "action_checklist": [
    "Зробіть переказ на суму 1 308,00 zł.",
    "Використайте податковий мікрорахунок, зазначений у листі.",
    "Здійсніть платіж протягом 7 днів від отримання листа."
  ],
  "deadlines": [
    "7 dni od dnia odebrania upomnienia"
  ],
  "amount": "1 308,00 zł",
  "source_passages": [
    "Naczelnik Pierwszego Urzędu Skarbowego w Krakowie wzywa Pana do uregulowania zaległości podatkowej",
    "Łączna kwota do zapłaty wynosi: 1 308,00 zł",
    "Wskazaną kwotę należy uiścić w terminie 7 dni od dnia doręczenia niniejszego upomnienia"
  ],
  "disclaimer": "Це пояснення має виключно допоміжний характер і не є юридичною консультацією. У разі сумнівів зверніться до відправника листа."
}
```

### 4.4 Informational Letter (Bank — Sample 03) — Fallback when No Payment or Consequences
```json
{
  "document_type": "informacja",
  "summary": "Bank informuje o zmianach w regulaminie i tabeli opłat. Zmiany wchodzą w życie automatycznie 1 listopada 2026 r. Nie musisz nic robić, jeśli akceptujesz nowe warunki.",
  "explanation": "Twój bank wprowadza nowy sposób potwierdzania płatności w aplikacji mobilnej. Zwiększono limit darmowych wypłat z bankomatów do 5 razy w miesiącu. Jeśli zgadzasz się na te zasady, nie podejmuj żadnych kroków. Jeśli nie akceptujesz zmian, masz prawo złożyć sprzeciw lub zamknąć konto przed dniem wejścia zmian w życie.",
  "payment_info": "Brak informacji w piśmie",
  "consequences": "Brak informacji w piśmie",
  "action_checklist": [
    "Brak wymaganych działań"
  ],
  "deadlines": [
    "Brak terminu w piśmie"
  ],
  "amount": "Brak kwoty w piśmie",
  "source_passages": [
    "Jeżeli akceptuje Pan proponowane zmiany, nie musi Pan podejmować żadnych czynności",
    "Wprowadzane zmiany nie wymagają podpisania aneksu do umowy"
  ],
  "disclaimer": "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. W razie wątpliwości skontaktuj się z nadawcą pisma."
}
```

