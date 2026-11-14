# Scenariusz Demo na Sprint Review dla Product Ownera (US-14 / US-12)

Ten dokument zawiera dokładny scenariusz prezentacji funkcjonalności wyjaśniania pism prostym językiem dla **Product Ownera (PO)** podczas spotkania **Sprint Review**, gwarantujący odbiór i akceptację zadań **US-14** i **US-12**.

---

## 1. Przygotowanie do Demo (przed spotkaniem)

1. Upewnij się, że w repozytorium znajdują się:
   - Folder `prompts/` z plikami `system_prompt.txt` oraz `explanation_schema.json`.
   - Folder `samples/` z 3 pismami testowymi:
     * `01_urzad_skarbowy_upomnienie.txt` (Urząd Skarbowy)
     * `02_zus_zawiadomienie_o_niedoplacie.txt` (ZUS)
     * `03_bank_zmiana_regulaminu.txt` (Bank)
   - Wyniki testów jednostkowych: uruchom `python3 -m unittest tests/test_prompts.py` (wszystkie testy zielone).
   - Otwarty raport z testów `samples/TESTING_REPORT.md`.

---

## 2. Krok po kroku: Co mówić i pokazywać Product Ownerowi

### Wstęp (30 sekund)
> *"Cześć! W ramach Sprintu 2 zrealizowaliśmy dwa powiązane zadania kluczowe dla wartości naszego produktu: **US-14 (Proste wyjaśnienie pism)** oraz **US-12 (Pisma testowe i testy demo)**.  
> Naszym celem było stworzenie instrukcji AI, która tłumaczy trudne pisma urzędowe na krótki, prosty język bez żargonu prawniczego oraz nie zmyśla faktów, a także przetestowanie tego na 3 realistycznych, bezpiecznych pismach."*

---

### Część 1: Pokazanie pism testowych (US-12)
1. **Pokaż folder `samples/` w repozytorium:**
   > *"Zgodnie z wymaganiami przygotowaliśmy 3 zanonimizowane pisma od 3 kluczowych instytucji:*
   > *1. **Urząd Skarbowy** – upomnienie z kwotą 1 308 zł i terminem 7 dni.*
   > *2. **ZUS** – zawiadomienie o niedopłacie z kwotą 430,50 zł i twardym terminem do 30 listopada.*
   > *3. **Bank** – pismo informacyjne o regulaminie, które celowo **nie ma żadnego terminu ani kwoty**, żeby sprawdzić, czy AI nie halucynuje."*
2. **Podkreśl anonimizację danych (Kryterium US-12):**
   > *"Wszystkie dane osobowe, adresy, NIP, PESEL i numery kont są w 100% fikcyjne."*

---

### Część 2: Prezentacja wyników na żywo (US-14 & US-12)

#### Przypadek 1: Urząd Skarbowy
* **Akcja:** Skopiuj treść z `samples/01_urzad_skarbowy_upomnienie.txt` i pokaż wynik wyjaśnienia.
* **Komentarz dla PO:**
  > *"Zwróć uwagę na formę:*
  > *- Zdania są bardzo krótkie (średnio poniżej 10 słów).*
  > *- Zamiast urzędniczego 'uiszczenia należności pod rygorem wszczęcia egzekucji' mamy proste: 'Musisz wpłacić pieniądze. Jeśli nie zapłacisz na czas, sprawę przejmie komornik'.*
  > *- AI bezbłędnie wyciągnęło dokładną kwotę 1 308,00 zł i termin 7 dni."*

#### Przypadek 2: ZUS
* **Akcja:** Skopiuj treść z `samples/02_zus_zawiadomienie_o_niedoplacie.txt` i pokaż wynik.
* **Komentarz dla PO:**
  > *"W przypadku ZUS-u aplikacja jasno wskazała konkretny termin: 'do 30 listopada 2026 r.' oraz kwotę 430,50 zł. W liście kroków odbiorca od razu widzi, na jaki numer rachunku składkowego ma przelać środki."*

#### Przypadek 3: Bank (Kluczowy test anty-halucynacji!)
* **Akcja:** Skopiuj treść z `samples/03_bank_zmiana_regulaminu.txt` i pokaż wynik.
* **Komentarz dla PO:**
  > *"To jest nasz najważniejszy test odporności na zmyślanie faktów. Pismo z banku to tylko informacja o zmianie tabeli opłat. Zobacz, co zrobiła aplikacja:*
  > *- W sekcji terminów napisała wprost: **'Brak terminu w piśmie'**.*
  > *- W planie działania napisała: **'Brak wymaganych działań'** i uspokoiła użytkownika, że zmiany wejdą w życie automatycznie.*
  > *- Model nie wymyślił żadnego terminu ani nie dodał nieprawdziwych faktów."*

---

### Część 3: Wykryte błędy i ciągłe doskonalenie (Kryterium US-12)
* **Pokaż dokument `samples/TESTING_REPORT.md` (Sekcja 3: Wykryte błędy):**
  > *"Zgodnie z kryterium akceptacji US-12 spisaliśmy błędy, które wyłapaliśmy w pierwszych wersjach promptu:*
  > *1. Początkowo model tworzył zbyt długie zdania – wprowadziliśmy twardy limit 10-15 słów.*
  > *2. Zdarzało mu się przepisywać słowo 'doręczenie' i 'uiścić' – dodaliśmy słownik zakazanych słów.*
  > *3. W piśmie z banku model próbował zgadywać 14-dniowy termin sprzeciwu – zablokowaliśmy to zasadą zerowej halucynacji."*

---

### Część 4: Pytanie o akceptację PO (Zakończenie)
> *"Wszystkie kryteria akceptacji obu historyjek zostały spełnione, a testy automatyczne w repozytorium przechodzą w 100%. Czy akceptujesz to demo i możemy przenieść zadania US-14 i US-12 do kolumny CLOSED?"*

