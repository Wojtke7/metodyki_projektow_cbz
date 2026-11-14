# Przykładowe pisma testowe (US-12)

Katalog zawiera zestaw 3 przykładowych pism urzędowych i bankowych służących do weryfikacji działania modułu sztucznej inteligencji aplikacji **ProsteFakty** oraz przeprowadzenia demonstracji (demo) dla Product Ownera podczas Sprint Review.

---

## Zestawienie pism testowych

| Plik | Instytucja (Nadawca) | Temat pisma | Kwota do zapłaty | Termin (Deadline) | Status danych osobowych |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **[`01_urzad_skarbowy_upomnienie.txt`](01_urzad_skarbowy_upomnienie.txt)** | Urząd Skarbowy (I US Kraków) | Upomnienie przedegzekucyjne w podatku PIT-37 | **1 308,00 zł** | **7 dni** od dnia doręczenia | 100% fikcyjne / zanonimizowane |
| **[`02_zus_zawiadomienie_o_niedoplacie.txt`](02_zus_zawiadomienie_o_niedoplacie.txt)** | ZUS (I Oddział Warszawa) | Zawiadomienie o niedopłacie składki zdrowotnej | **430,50 zł** | **Do 30 listopada 2026 r.** | 100% fikcyjne / zanonimizowane |
| **[`03_bank_zmiana_regulaminu.txt`](03_bank_zmiana_regulaminu.txt)** | Bank (Fikcyjny Bank Polski S.A.) | Informacja o zmianie regulaminu i tabeli opłat | *Brak kwoty do zapłaty* | **BRAK TERMINU** (pismo wyłącznie informacyjne) | 100% fikcyjne / zanonimizowane |

---

## Spełnienie kryteriów akceptacji US-12

1. **3 różne pisma instytucjonalne:** Urząd Skarbowy, ZUS, Bank.
2. **Brak prawdziwych danych osobowych:** Wszystkie dane (imiona, nazwiska, adresy, PESEL, NIP, numery kont i sygnatury) są całkowicie fikcyjne i bezpieczne.
3. **Warunek terminów i kwot:**
   - Co najmniej 2 pisma posiadają kwotę i termin: pismo z Urzędu Skarbowego (1 308,00 zł, 7 dni) oraz pismo z ZUS (430,50 zł, do 30.11.2026).
   - Dokładnie 1 pismo **nie posiada terminu** na wykonanie akcji (pismo informacyjne z banku), co służy testowaniu odporności AI na zmyślanie terminów (zasada „nie ma w piśmie”).
4. **Zapisane w formacie tekstowym:** Pliki `.txt` umieszczone w folderze `samples/`.
5. **Przetestowane w aplikacji:** Wyniki testów i wykryte uwagi zapisano w [TESTING_REPORT.md](TESTING_REPORT.md).
6. **Scenariusz demo:** Gotowy przewodnik do akceptacji przez Product Ownera znajduje się w [DEMO_SCRIPT_PO.md](DEMO_SCRIPT_PO.md).

