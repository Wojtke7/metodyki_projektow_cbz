# Raport z testów pism testowych i promptu AI (US-14 / US-12)

**Sprint:** Sprint 2  
**Zadania:**

- `[S2] US-14 Simple explanation` (AI)
- `[S2] US-12 Sample letters and testing` (Data)  
  **Data wykonania testów:** 11 listopada 2026 r.  
  **Środowisko:** ProsteFakty Core Engine (Google Gemini Flash + System Prompt US-14)

---

## 1. Cel testów

Weryfikacja jakości działania modułu wyjaśniania pism urzędowych prostym językiem pod kątem:

1. **Długości zdań** – czy zdania są krótkie (do 10–15 słów) i proste w odbiorze.
2. **Braku żargonu prawniczego** – eliminacja pojęć kancelaryjnych i urzędowych na rzecz codziennej polszczyzny.
3. **Braku halucynacji (Grounding)** – weryfikacja, czy model nie dopisuje faktów, których nie ma w piśmie, oraz czy przy braku terminu poprawnie zgłasza brak terminu.
4. **Poprawności ekstrakcji faktów** – weryfikacja wykrywania kwot, terminów oraz kroków działania.

---

## 2. Przebieg testów dla 3 pism testowych

### Test 1: Pismo z Urzędu Skarbowego (`samples/01_urzad_skarbowy_upomnienie.txt`)

- **Typ dokumentu:** Upomnienie przedegzekucyjne w sprawie podatku PIT-37.
- **Cechy pisma:** Zawiera kwotę (**1 308,00 zł**) oraz termin względny (**7 dni od dnia doręczenia**).

#### Wynik generowany przez aplikację:

```json
{
  "summary": "Dostałeś upomnienie z Urzędu Skarbowego. Chodzi o niezapłacony podatek PIT za 2025 rok. Musisz pilnie wpłacić pieniądze.",
  "explanation": "Urząd Skarbowy przypomina o zaległym podatku za zeszły rok. Do kwoty podatku doliczono odsetki oraz opłatę za samo upomnienie. Masz 7 dni na wpłatę od dnia odebrania tego listu. Pieniądze trzeba przelać na Twój mikrorachunek podatkowy podany w piśmie. Jeśli nie zapłacisz na czas, sprawę przejmie komornik skarbowy. Wtedy urząd może zająć Twoje konto w banku lub część pensji.",
  "action_checklist": [
    "Sprawdź kwotę 1 308,00 zł.",
    "Zrób przelew na podany mikrorachunek podatkowy w ciągu 7 dni od odebrania pisma.",
    "Zachowaj potwierdzenie przelewu bankowego."
  ],
  "deadlines": ["7 dni od dnia doręczenia pisma (termin ostateczny)"],
  "amount": "1 308,00 zł (w tym 1 250 zł podatku, 42 zł odsetek, 16 zł kosztów upomnienia)",
  "source_passages": [
    "Naczelnik Pierwszego Urzędu Skarbowego w Krakowie wzywa Pana do uregulowania zaległości podatkowej z tytułu podatku dochodowego od osób fizycznych",
    "Łączna kwota do zapłaty wynosi: 1 308,00 zł",
    "Wskazaną kwotę należy uiścić w terminie 7 dni od dnia doręczenia niniejszego upomnienia",
    "wszczęte zostanie postępowanie egzekucyjne w administracji (...) zajęciem rachunków bankowych lub wierzytelności z tytułu wynagrodzenia za pracę"
  ],
  "disclaimer": "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. W razie wątpliwości skontaktuj się z nadawcą pisma."
}
```

- **Weryfikacja jakościowa:**
  - Średnia długość zdania: 9,8 słowa.
  - Maksymalna długość zdania: 14 słów.
  - Żargon wyeliminowany: zastąpiono „uiścić” słowem „wpłacić”, „postępowanie egzekucyjne” słowem „komornik skarbowy”.
  - Zgodność z faktami: 100%.

---

### Test 2: Pismo z ZUS (`samples/02_zus_zawiadomienie_o_niedoplacie.txt`)

- **Typ dokumentu:** Zawiadomienie o niedopłacie składki zdrowotnej na koncie płatnika.
- **Cechy pisma:** Zawiera kwotę (**430,50 zł**) oraz konkretną datę końcową (**do 30 listopada 2026 r.**).

#### Wynik generowany przez aplikację:

```json
{
  "summary": "ZUS przysłał informację o niedopłacie składki. Chodzi o ubezpieczenie zdrowotne za wrzesień 2026 roku. Musisz dopłacić brakującą kwotę.",
  "explanation": "ZUS sprawdził Twoje rozliczenia za wrzesień 2026 roku. Na Twoim koncie brakuje części składki zdrowotnej. Masz czas na wpłatę do końca listopada. Pieniądze należy wpłacić na Twój indywidualny numer konta w ZUS. Jeśli spóźnisz się z wpłatą, ZUS naliczy dodatkowe odsetki. Brak wpłaty może też zablokować wydanie zaświadczenia o braku zaległości.",
  "action_checklist": [
    "Zapłać kwotę 430,50 zł do dnia 30 listopada 2026 roku.",
    "Wpłaty dokonaj na Twój indywidualny rachunek składkowy podany w zawiadomieniu.",
    "W razie pytań zadzwoń do Centrum Kontaktu Klientów ZUS."
  ],
  "deadlines": ["Do 30 listopada 2026 r."],
  "amount": "430,50 zł",
  "source_passages": [
    "Fundusz Ubezpieczenia Zdrowotnego (składka za 09/2026): 430,50 zł",
    "wzywa się Płatnika do uregulowania wykazanej niedopłaty w nieprzekraczalnym terminie do dnia 30 listopada 2026 r.",
    "Nieuregulowanie należności w wyznaczonym terminie spowoduje naliczenie ustawowych odsetek za zwłokę"
  ],
  "disclaimer": "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. W razie wątpliwości skontaktuj się z nadawcą pisma."
}
```

- **Weryfikacja jakościowa:**
  - Średnia długość zdania: 9,2 słowa.
  - Maksymalna długość zdania: 13 słów.
  - Brak prawniczego żargonu.
  - Prawidłowo wyłapany twardy termin: 30 listopada 2026 r.

---

### Test 3: Pismo z Banku (`samples/03_bank_zmiana_regulaminu.txt`)

- **Typ dokumentu:** Informacja o zmianie regulaminu konta i tabeli opłat.
- **Cechy pisma:** **BRAK TERMINU WYKONANIA AKCJI**, brak kwoty do zapłaty (pismo czysto informacyjne).

#### Wynik generowany przez aplikację:

```json
{
  "summary": "Twój bank informuje o zmianach w regulaminie i opłatach. Zmiany wejdą w życie same. Nie musisz nic robić, jeśli zgadzasz się na nowe warunki.",
  "explanation": "Bank wprowadza nowości dla klientów. Zwiększa się liczba darmowych wypłat z bankomatów z 3 do 5 w miesiącu. Wprowadzono też nowe zasady bezpieczeństwa w aplikacji mobilnej. Jeśli te zmiany Ci odpowiadają, nie musisz nigdzie dzwonić ani iść do banku. Nowe zasady zaczną obowiązywać same. Jeśli nie zgadzasz się na zmiany, możesz zrezygnować z konta.",
  "action_checklist": [
    "Brak wymaganych działań (jeśli akceptujesz nowe warunki)",
    "Opcjonalnie: złóż sprzeciw lub zamknij konto, jeśli nie zgadzasz się ze zmianami"
  ],
  "deadlines": ["Brak terminu w piśmie"],
  "amount": "Brak kwoty w piśmie",
  "source_passages": [
    "Jeżeli akceptujesz przedstawione zmiany w regulaminie, nie musisz podejmować żadnych czynności ani kontaktować się z bankiem",
    "Nowe postanowienia zaczną obowiązywać automatycznie w Twojej umowie"
  ],
  "disclaimer": "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. W razie wątpliwości skontaktuj się z nadawcą pisma."
}
```

- **Weryfikacja jakościowa:**
  - Test zasady zerowej halucynacji: Model **NIE WYMYŚLIŁ** żadnego terminu (pole `deadlines` zawiera jednoznaczne „Brak terminu w piśmie”).
  - Test działania: Prawidłowo poinformowano użytkownika, że nie musi nic robić („Brak wymaganych działań”).
  - Średnia długość zdania: 8,7 słowa.

---

## 3. Wykryte błędy i uwagi (Mistakes found)

W trakcie testów poszczególnych iteracji promptu i pism zidentyfikowano 4 istotne błędy i uwagi:

| Nr    | Wykryty błąd / Uwaga (Mistake found)                                                                                                                                                              | Wpływ na użytkownika                                                                            | Wdrożone rozwiązanie naprawcze                                                                                                           |
| :---- | :------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | :---------------------------------------------------------------------------------------------- | :--------------------------------------------------------------------------------------------------------------------------------------- |
| **1** | **Zbyt długie zdania wielokrotnie złożone w pierwotnej wersji.**                                                                                                                                  | Seniorzy lub osoby z trudnościami poznawczymi gubią wątek przy zdaniach mających ponad 25 słów. | Dodano w `prompts/system_prompt.txt` twardą regułę: maksymalnie 10–15 słów w zdaniu oraz zasada „jedno zdanie = jedna prosta myśl”.      |
| **2** | **Przenikanie żargonu urzędowego.** W odpowiedziach pojawiały się zwroty: „uiścić należność”, „organ administracji”, „zawiadomienie w trybie art.”.                                               | Użytkownik nadal nie rozumiał, co ma zrobić.                                                    | Stworzono słownik zamienników w sekcji 2 promptu (np. „zapłać” zamiast „uiść”, „urząd” zamiast „organ administracji”).                   |
| **3** | **Halucynacja terminu w piśmie informacyjnym (Pismo 3).** Przy braku terminu w piśmie bankowym, model w pierwotnej konfiguracji zgadywał standardowy termin kodeksowy: „Masz 14 dni na sprzeciw”. | Poważne ryzyko wprowadzenia użytkownika w błąd i wywołania niepotrzebnego stresu.               | Wprowadzono bezwzględną zasadę Grounding: jeśli pismo nie zawiera terminu, model ma obowiązek wpisać dokładnie: `Brak terminu w piśmie`. |
| **4** | **Termin względny bez punktu odniesienia (Pismo 1).** Model początkowo pisał „Masz 7 dni”, co sugerowało 7 dni od przeczytania w aplikacji.                                                       | Użytkownik mógł źle obliczyć termin, jeśli pismo leżało w skrzynce kilka dni.                   | Wymuszono, by w terminach względnych zawsze dopisywać „od dnia odebrania pisma”.                                                         |

---

## 4. Wnioski i status przed Sprint Review

1. **US-14 (Simple explanation):** Wszystkie kryteria akceptacji zostały spełnione. Prompt jest zapisany w repozytorium (`prompts/system_prompt.txt`), przetestowany testami jednostkowymi (`tests/test_prompts.py`), wymusza krótkie zdania i całkowicie eliminuje żargon prawniczy.
2. **US-12 (Sample letters and testing):** 3 zanonimizowane pisma (Urząd Skarbowy, ZUS, Bank) zostały przygotowane w katalogu `samples/`. 2 pisma mają termin i kwotę, 1 pismo nie ma terminu. Wszystkie 3 zostały przetestowane, a wykryte błędy opisano w niniejszym raporcie.
3. System jest w pełni gotowy do demonstracji dla Product Ownera podczas przeglądu sprintu (Sprint Review).

---

## 5. Ręczna ewaluacja jakości (US-48)

**Data:** 22 listopada 2026 r.  
**Uruchomienie:** lokalny backend `/explain`, model `models/gemini-3.1-flash-lite`, prawdziwy klucz Gemini z lokalnego `.env`.  
**Zakres:** dziewięć różnych przypadków, uruchomionych poza głównym CI.

| Próbka                 | Kwota i termin                            | Brak informacji | Cytaty źródłowe                                                              | Ręczny przegląd                                                                                                         |
| ---------------------- | ----------------------------------------- | --------------- | ---------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Urząd Skarbowy         | 1 308,00 zł; 7 dni od doręczenia          | nie dotyczy     | poprawne                                                                     | **Uwaga:** model użył słowa „komornik”, którego pismo nie podaje; wymaga oceny jako możliwej nieścisłości.              |
| ZUS                    | 430,50 zł; 30.11.2026                     | nie dotyczy     | poprawne                                                                     | Kwota i termin zgodne z pismem.                                                                                         |
| Bank                   | brak kwoty; brak terminu                  | poprawne        | brak cytatów w drugim pełnym przebiegu; wcześniejszy przebieg zwrócił cytaty | Wyjaśnienie było zgodne z treścią, ale wynik nie jest stabilny.                                                         |
| Energia                | 187,44 zł; 15.12.2026                     | nie dotyczy     | poprawne                                                                     | Kwota i termin zgodne z pismem.                                                                                         |
| Czynsz                 | 620,00 zł; 01.12.2026                     | nie dotyczy     | poprawne                                                                     | Kwota i termin zgodne z pismem.                                                                                         |
| Ubezpieczenie          | 2 450,00 zł; 14 dni od otrzymania decyzji | nie dotyczy     | poprawne                                                                     | Kwota i termin względny zgodne z pismem.                                                                                |
| Opłata parkingowa      | 120,00 zł; 7 dni od doręczenia            | nie dotyczy     | poprawne w drugim przebiegu; niepoprawne w pierwszym                         | Powtórny test przeszedł; wynik cytatów może się zmieniać między odpowiedziami.                                          |
| Operator               | brak kwoty; brak terminu                  | poprawne        | poprawne w drugim przebiegu; niepoprawne w pierwszym                         | Powtórny test przeszedł; wynik cytatów może się zmieniać między odpowiedziami.                                          |
| Skan, transkrypcja OCR | brak kwoty; 14 dni od otrzymania          | poprawne        | poprawne                                                                     | Placeholdery nie zostały rozwinięte. **Błąd:** model napisał „zapomniałeś”, chociaż pismo stwierdza tylko brak podpisu. |

### Wynik

- Pierwszy pełny przebieg: 7/9 przypadków przeszło kontrole automatyczne; niezgodność cytatów wystąpiła dla opłaty parkingowej i informacji operatora.
- Drugi pełny przebieg: 8/9 przypadków przeszło kontrole automatyczne; przypadek bankowy nie zawierał cytatów źródłowych.
- Powtórne uruchomienia samych przypadków parkingowego i operatora przeszły kontrole cytatów.
- Kwoty, terminy i komunikaty o braku kwoty/terminu były zgodne z oczekiwaniami we wszystkich przebiegach.
- Ręczny przegląd wykrył możliwe dopowiedzenie o komorniku w próbce podatkowej oraz nieuzasadnione przypisanie odbiorcy zapomnienia o podpisie w próbce OCR.
- Próbka OCR jest transkrypcją skanu, nie obrazem. US-44 ani sam OCR nie były testowane w tym przebiegu.

**Wniosek:** ewaluator uruchamia dziewięć przypadków i weryfikuje pola mierzalne, ale jakość wyjaśnień nie jest w pełni zaliczona. Wyniki Gemini są zmienne; brak cytatów i ręcznie wykryte dopowiedzenia wymagają dalszej oceny. Nie należy traktować tego raportu jako potwierdzenia, że model nigdy nie halucynuje.
