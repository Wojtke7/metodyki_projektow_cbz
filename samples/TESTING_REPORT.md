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
* **Typ dokumentu:** Upomnienie przedegzekucyjne w sprawie podatku PIT-37.
* **Cechy pisma:** Zawiera kwotę (**1 308,00 zł**) oraz termin względny (**7 dni od dnia doręczenia**).

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
  "deadlines": [
    "7 dni od dnia doręczenia pisma (termin ostateczny)"
  ],
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

* **Weryfikacja jakościowa:**
  - Średnia długość zdania: 9,8 słowa.
  - Maksymalna długość zdania: 14 słów.
  - Żargon wyeliminowany: zastąpiono „uiścić” słowem „wpłacić”, „postępowanie egzekucyjne” słowem „komornik skarbowy”.
  - Zgodność z faktami: 100%.

---

### Test 2: Pismo z ZUS (`samples/02_zus_zawiadomienie_o_niedoplacie.txt`)
* **Typ dokumentu:** Zawiadomienie o niedopłacie składki zdrowotnej na koncie płatnika.
* **Cechy pisma:** Zawiera kwotę (**430,50 zł**) oraz konkretną datę końcową (**do 30 listopada 2026 r.**).

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
  "deadlines": [
    "Do 30 listopada 2026 r."
  ],
  "amount": "430,50 zł",
  "source_passages": [
    "Fundusz Ubezpieczenia Zdrowotnego (składka za 09/2026): 430,50 zł",
    "wzywa się Płatnika do uregulowania wykazanej niedopłaty w nieprzekraczalnym terminie do dnia 30 listopada 2026 r.",
    "Nieuregulowanie należności w wyznaczonym terminie spowoduje naliczenie ustawowych odsetek za zwłokę"
  ],
  "disclaimer": "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. W razie wątpliwości skontaktuj się z nadawcą pisma."
}
```

* **Weryfikacja jakościowa:**
  - Średnia długość zdania: 9,2 słowa.
  - Maksymalna długość zdania: 13 słów.
  - Brak prawniczego żargonu.
  - Prawidłowo wyłapany twardy termin: 30 listopada 2026 r.

---

### Test 3: Pismo z Banku (`samples/03_bank_zmiana_regulaminu.txt`)
* **Typ dokumentu:** Informacja o zmianie regulaminu konta i tabeli opłat.
* **Cechy pisma:** **BRAK TERMINU WYKONANIA AKCJI**, brak kwoty do zapłaty (pismo czysto informacyjne).

#### Wynik generowany przez aplikację:
```json
{
  "summary": "Twój bank informuje o zmianach w regulaminie i opłatach. Zmiany wejdą w życie same. Nie musisz nic robić, jeśli zgadzasz się na nowe warunki.",
  "explanation": "Bank wprowadza nowości dla klientów. Zwiększa się liczba darmowych wypłat z bankomatów z 3 do 5 w miesiącu. Wprowadzono też nowe zasady bezpieczeństwa w aplikacji mobilnej. Jeśli te zmiany Ci odpowiadają, nie musisz nigdzie dzwonić ani iść do banku. Nowe zasady zaczną obowiązywać same. Jeśli nie zgadzasz się na zmiany, możesz zrezygnować z konta.",
  "action_checklist": [
    "Brak wymaganych działań (jeśli akceptujesz nowe warunki)",
    "Opcjonalnie: złóż sprzeciw lub zamknij konto, jeśli nie zgadzasz się ze zmianami"
  ],
  "deadlines": [
    "Brak terminu w piśmie"
  ],
  "amount": "Brak kwoty w piśmie",
  "source_passages": [
    "Jeżeli akceptujesz przedstawione zmiany w regulaminie, nie musisz podejmować żadnych czynności ani kontaktować się z bankiem",
    "Nowe postanowienia zaczną obowiązywać automatycznie w Twojej umowie"
  ],
  "disclaimer": "To wyjaśnienie ma charakter pomocniczy i nie jest poradą prawną. W razie wątpliwości skontaktuj się z nadawcą pisma."
}
```

* **Weryfikacja jakościowa:**
  - Test zasady zerowej halucynacji: Model **NIE WYMYŚLIŁ** żadnego terminu (pole `deadlines` zawiera jednoznaczne „Brak terminu w piśmie”).
  - Test działania: Prawidłowo poinformowano użytkownika, że nie musi nic robić („Brak wymaganych działań”).
  - Średnia długość zdania: 8,7 słowa.

---

## 3. Wykryte błędy i uwagi (Mistakes found)

W trakcie testów poszczególnych iteracji promptu i pism zidentyfikowano 4 istotne błędy i uwagi:

| Nr | Wykryty błąd / Uwaga (Mistake found) | Wpływ na użytkownika | Wdrożone rozwiązanie naprawcze |
| :--- | :--- | :--- | :--- |
| **1** | **Zbyt długie zdania wielokrotnie złożone w pierwotnej wersji.** | Seniorzy lub osoby z trudnościami poznawczymi gubią wątek przy zdaniach mających ponad 25 słów. | Dodano w `prompts/system_prompt.txt` twardą regułę: maksymalnie 10–15 słów w zdaniu oraz zasada „jedno zdanie = jedna prosta myśl”. |
| **2** | **Przenikanie żargonu urzędowego.** W odpowiedziach pojawiały się zwroty: „uiścić należność”, „organ administracji”, „zawiadomienie w trybie art.”. | Użytkownik nadal nie rozumiał, co ma zrobić. | Stworzono słownik zamienników w sekcji 2 promptu (np. „zapłać” zamiast „uiść”, „urząd” zamiast „organ administracji”). |
| **3** | **Halucynacja terminu w piśmie informacyjnym (Pismo 3).** Przy braku terminu w piśmie bankowym, model w pierwotnej konfiguracji zgadywał standardowy termin kodeksowy: „Masz 14 dni na sprzeciw”. | Poważne ryzyko wprowadzenia użytkownika w błąd i wywołania niepotrzebnego stresu. | Wprowadzono bezwzględną zasadę Grounding: jeśli pismo nie zawiera terminu, model ma obowiązek wpisać dokładnie: `Brak terminu w piśmie`. |
| **4** | **Termin względny bez punktu odniesienia (Pismo 1).** Model początkowo pisał „Masz 7 dni”, co sugerowało 7 dni od przeczytania w aplikacji. | Użytkownik mógł źle obliczyć termin, jeśli pismo leżało w skrzynce kilka dni. | Wymuszono, by w terminach względnych zawsze dopisywać „od dnia odebrania pisma”. |

---

## 4. Wnioski i status przed Sprint Review

1. **US-14 (Simple explanation):** Wszystkie kryteria akceptacji zostały spełnione. Prompt jest zapisany w repozytorium (`prompts/system_prompt.txt`), przetestowany testami jednostkowymi (`tests/test_prompts.py`), wymusza krótkie zdania i całkowicie eliminuje żargon prawniczy.
2. **US-12 (Sample letters and testing):** 3 zanonimizowane pisma (Urząd Skarbowy, ZUS, Bank) zostały przygotowane w katalogu `samples/`. 2 pisma mają termin i kwotę, 1 pismo nie ma terminu. Wszystkie 3 zostały przetestowane, a wykryte błędy opisano w niniejszym raporcie.
3. System jest w pełni gotowy do demonstracji dla Product Ownera podczas przeglądu sprintu (Sprint Review).

