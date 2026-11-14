# Prompts & AI Schemas (US-14)

Katalog zawiera instrukcje systemowe (system prompts) oraz schematy wyjściowe (JSON Schemas) wykorzystywane przez moduł sztucznej inteligencji aplikacji **ProsteFakty**.

Umieszczenie promptów bezpośrednio w repozytorium gwarantuje, że każda modyfikacja instrukcji podlega procesowi Code Review oraz testom automatycznym (zgodnie z kryteriami akceptacji **US-14**).

---

## Zawartość katalogu

1. **[`system_prompt.txt`](system_prompt.txt)**:
   - Główna instrukcja systemowa dla modelu LLM (Google Gemini Flash).
   - Wymusza krótki, prosty język (Plain Polish standard), brak prawniczego żargonu, zasadę zerowej halucynacji („Brak informacji w piśmie”) oraz podział na sekcje.

2. **[`explanation_schema.json`](explanation_schema.json)**:
   - Ścisły schemat JSON Schema określający format ustrukturyzowanej odpowiedzi zwracanej przez model AI do backendu FastAPI.

3. **[`prompt_loader.py`](prompt_loader.py)**:
   - Pomocniczy moduł Pythona do wczytywania promptu i schematu w backendzie i testach.

---

## Zasady spełniane przez prompt (Kryteria akceptacji US-14)

| Kryterium akceptacji US-14 | Jak jest realizowane w prompcie? | Weryfikacja |
| :--- | :--- | :--- |
| **Krótkie zdania (Short sentences)** | Zasada 1 wymusza zdania o długości maksymalnie 10–15 słów, zakazuje konstrukcji wielokrotnie złożonych i imiesłowów. | Testy automatyczne w `tests/test_prompts.py` mierzą długość zdań. |
| **Brak żargonu prawniczego (No legal jargon)** | Zasada 2 zakazuje słownictwa kancelaryjnego i podaje jednoznaczną tabelę zamienników (np. *uiścić opłatę* -> *zapłacić*, *organ administracji* -> *urząd*). | Czarna lista słów weryfikowana w testach jednostkowych. |
| **Niedodawanie faktów spoza pisma (Anti-hallucination / Grounding)** | Zasada 3 nakazuje wpisanie *„Brak informacji w piśmie”* / *„Brak terminu w piśmie”* / *„Brak kwoty w piśmie”* przy braku danych w tekście pisma. | Test pisma bankowego bez terminu (US-12) oraz asercje w testach. |
| **Prompt zapisany w repozytorium** | Pliki `system_prompt.txt` oraz `explanation_schema.json` są wersjonowane w katalogu `prompts/`. | Obecność plików w gicie. |
| **Instrukcja przetestowana** | Zestaw testów jednostkowych i ewaluacyjnych w `tests/test_prompts.py`. | Uruchomienie `python3 -m unittest tests/test_prompts.py`. |
