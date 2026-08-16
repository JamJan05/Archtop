# Prompt dla agenta AI — Archtop: GitHub Desktop na Arch Linux

Pracujesz bezpośrednio w repozytorium:

<https://github.com/JamJan05/Github-archtop>

Twoim zadaniem jest zaimplementowanie kompletnego, bezpiecznego i utrzymywalnego wsparcia GitHub
Desktop dla Arch Linux. Aplikacja ma działać bezpośrednio na Linuksie, bez Wine, Protona i maszyny
wirtualnej, a jej wygląd ma pozostać zgodny z oficjalnym GitHub Desktop.

Nie kończ pracy na analizie ani planie. Po audycie repozytorium przejdź do implementacji, testów
i przygotowania pakietu dla Arch Linux, przestrzegając opisanej poniżej polityki gałęzi i polityki
operacji git.

---

## 0. Reguła nadrzędna — zakaz operacji zapisujących w git

**Ta sekcja ma pierwszeństwo przed każdą inną sekcją tego promptu.** Jeżeli jakakolwiek dalsza
sekcja zawiera polecenie git, które modyfikuje repozytorium, traktuj je jako komendę do
**przygotowania i pokazania mi**, a nie do wykonania.

### 0.1. Domyślnie zabronione

Bez mojej jednoznacznej, wyraźnej komendy **nie wykonujesz** żadnej z poniższych operacji:

| Kategoria | Zabronione bez komendy |
|---|---|
| Zapis historii | `git commit`, `git commit --amend`, `git revert` |
| Publikacja | `git push` (w dowolnej formie, także `-u`, także nowej gałęzi) |
| Łączenie | `git merge`, `git rebase`, `git cherry-pick`, `git pull` (bo zawiera merge) |
| Gałęzie | `git branch`, `git switch -c`, `git checkout -b`, `git branch -d/-D`, `git switch` |
| Znaczniki i wydania | `git tag`, tworzenie release'ów, publikacja artefaktów |
| Stan drzewa | `git reset`, `git restore`, `git checkout <plik>`, `git clean`, `git stash drop` |
| Zdalne | `git remote add/remove/set-url`, zmiana konfiguracji remote |
| GitHub | tworzenie i mergowanie pull requestów, zamykanie PR-ów, edycja gałęzi przez API |

Dozwolone zawsze, bez pytania, bo są **tylko do odczytu**:
`git status`, `git log`, `git diff`, `git show`, `git branch -a` (bez argumentów zapisu),
`git remote -v`, `git fetch` (tylko pobiera, nie zmienia gałęzi lokalnych), `git ls-files`,
`git rev-parse`, `git blame`.

### 0.2. Co jest zgodą, a co nią nie jest

Zgodą jest wyłącznie moja wiadomość, która **wprost nazywa operację i cel**, na przykład:

```text
Zrób commit tych zmian na bieżącej gałęzi.
Wypchnij bieżącą gałąź na origin.
Zmerguj upstream/development do development.
```

**Zgodą nie są** sformułowania takie jak: „zapisz to", „ogarnij git", „gotowe?", „możesz kończyć",
„zrób porządek", „wrzuć to", ani milczące założenie, że skoro praca jest skończona, to należy ją
zacommitować. W razie wątpliwości pytasz i czekasz.

### 0.3. Zakres i wygasanie zgody

- Zgoda dotyczy **jednej operacji** i **jednego stanu drzewa roboczego**.
- Po wykonaniu operacji zgoda wygasa. Kolejne zmiany wymagają nowej zgody.
- Zgoda na commit **nie jest** zgodą na push. Zgoda na push **nie jest** zgodą na merge.
- Zgoda dotycząca jednej gałęzi **nie przenosi się** na inną gałąź.

### 0.4. Zabronione bezwarunkowo — nawet po mojej komendzie

Poniższych operacji nie wykonujesz nigdy. Jeżeli o nie poproszę, odmawiasz, wyjaśniasz ryzyko
i proponujesz bezpieczną alternatywę:

- `git push --force`, `git push --force-with-lease`, `git push +branch` na `development`,
  `linux-unstable` i `linux-stable`;
- `git reset --hard` na gałęzi opublikowanej;
- `git rebase` gałęzi opublikowanej, jeżeli wymagałby force-pusha;
- `git filter-branch`, `git filter-repo`, nadpisywanie historii;
- usuwanie zdalnych gałęzi `development`, `linux-unstable`, `linux-stable`;
- kasowanie lub nadpisywanie niezacommitowanych zmian, których sam nie wprowadziłeś.

### 0.5. Tryb pracy domyślny

Domyślnie pracujesz **w drzewie roboczym**: tworzysz i modyfikujesz pliki, uruchamiasz build, lint
i testy, a na końcu raportujesz. Nie zapisujesz nic w historii git. Na koniec każdej sesji podajesz:

1. `git status --short` — lista niezacommitowanych zmian;
2. `git diff --stat` — rozmiar zmian;
3. **gotowy blok komend git**, które mógłbym wykonać, gdybym chciał zapisać tę pracę — jako tekst
   do skopiowania, nieuruchomiony.

### 0.6. Konflikt z narzuconą gałęzią roboczą

Jeżeli środowisko, w którym działasz, narzuca własną gałąź roboczą (np. `claude/...`), **nie
próbujesz** przełączać się na `linux-unstable`, tworzyć jej ani przenosić na nią commitów. Pracujesz
w drzewie roboczym tam, gdzie jesteś, i wyraźnie zaznaczasz w raporcie:

```text
Gałąź narzucona przez środowisko: <nazwa>
Gałąź docelowa według polityki:   linux-unstable
Przeniesienie: do wykonania przeze mnie (użytkownika)
```

Decyzja o tym, jak ta praca trafi na `linux-unstable`, należy do mnie.

---

## 1. Stan początkowy projektu

Stan zweryfikowany w checkoutcie (potwierdzony, nie zakładany):

| Element | Wartość | Źródło |
|---|---|---|
| repozytorium | `JamJan05/Github-archtop` | `git remote -v` |
| główna gałąź | `development` | `git branch -a` |
| bazowy commit | `6f67d8b94af85689813d60975342fc646d9af3ed` | `git log -1` |
| wersja aplikacji | `3.6.5-beta1` | `app/package.json` |
| Electron | `42.0.1` | `package.json` |
| TypeScript | `^5.8.2` | `package.json` |
| React | `^16.8.4` | `app/package.json` |
| packager | `@electron/packager` `^18.4.4` | `package.json` |
| keytar | `^7.8.0` | `app/package.json` |
| Node / yarn | v22.x / yarn 1.x (`yarn.lock` v1) | `package.json` → `engines` |

### 1.1. Co dla Linuksa **już istnieje** w kodzie

To nie jest port od zera. Przed napisaniem czegokolwiek sprawdź, co jest już zrobione:

- `app/app-info.ts:25` — definiuje `__LINUX__`;
- `script/build.ts:136` — `toPackagePlatform` akceptuje już `'linux'`;
- `script/dist-info.ts:28` — zwraca na Linuksie nazwę wykonywalną `desktop`;
- `app/static/linux/icon-logo.png` — **katalog i ikona już istnieją**;
- `app/src/lib/shells/linux.ts` — **istnieje** obsługa terminali;
- `app/src/lib/editors/linux.ts` — **istnieje** wykrywanie edytorów;
- `__LINUX__` jest już używane m.in. w `app/src/main-process/app-window.ts`,
  `app/src/main-process/notifications.ts`, `app/src/lib/shells/shared.ts`,
  `app/src/lib/editors/lookup.ts`, `app/src/ui/app.tsx`, `app/src/ui/about/about.tsx`;
- `app/src/main-process/main.ts` — ma już blokadę pojedynczej instancji
  (`requestSingleInstanceLock`, linia ~175), obsługę `second-instance` (~178) i rejestrację
  protokołów `x-github-client`, `x-github-desktop-auth`, `x-github-desktop-dev-auth` (~105–109, 333).

### 1.2. Co **nie działa** i jest faktycznym blokerem

- `script/package.ts:39–46` — obsługuje tylko `darwin` i `win32`; na Linuksie wypisuje
  `I don't know how to package for linux :(` i kończy się `process.exit(1)`;
- `script/build.ts:173–177` — **bezwarunkowy** `assert(existsSync(assetsCarPath))` na `Assets.car`,
  zasób wyłącznie macOS-owy; to zatrzymuje build linuksowy;
- `script/build.ts:192` — `extraResource: [assetsCarPath]` przekazywane bezwarunkowo;
- `script/build.ts` — `osxSign`, `osxNotarize`, `extendInfo` konfigurowane niezależnie od platformy;
- brak katalogu `packaging/` i jakiegokolwiek systemu pakowania dla Arch Linux;
- auto-updater: `app/src/main-process/squirrel-updater.ts` oraz użycie `autoUpdater`
  w `app/src/main-process/app-window.ts` — Squirrel jest macOS/Windows-only.

Zweryfikuj te dane w aktualnym checkoutcie. Jeżeli repozytorium jest nowsze, dostosuj implementację
do bieżącego kodu. Nie cofaj projektu do wymienionego commita i nie obniżaj wersji zależności.

---

## 2. Polityka gałęzi

Repozytorium ma docelowo posiadać trzy główne gałęzie:

| Gałąź | Przeznaczenie |
|---|---|
| `development` | Czysta kopia `desktop/desktop:development`, wyłącznie do synchronizacji z upstreamem |
| `linux-unstable` | Cały rozwój, testy i poprawki wersji dla Arch Linux |
| `linux-stable` | Wyłącznie wersje uznane przeze mnie za stabilne |

Git nie pozwala na spacje w nazwach gałęzi, dlatego używamy dokładnie nazw `linux-unstable`
oraz `linux-stable`.

> **Uwaga o stanie faktycznym.** W chwili pisania tego promptu w repozytorium istnieją tylko
> `development` i gałąź robocza narzucona przez środowisko agenta. **Nie ma** ani `linux-unstable`,
> ani `linux-stable`, ani remote'a `upstream` — jest wyłącznie `origin`. Utworzenie tych gałęzi
> i remote'a należy do mnie, zgodnie z sekcją 0.

### 2.1. Kontrola stanu

Na początku każdej sesji wykonaj i pokaż (to operacje tylko do odczytu, więc są dozwolone):

```bash
git status
git remote -v
git branch -a
git log -1 --oneline
```

Nie usuwaj i nie nadpisuj istniejących zmian użytkownika.

### 2.2. Synchronizacja czystej gałęzi `development` — komendy dla mnie

Gałąź `development` musi pozostać czystą kopią `desktop/desktop:development`.

Agent **przygotowuje** poniższe komendy i weryfikuje ich sensowność, ale **nie wykonuje** ich bez
mojej wyraźnej zgody (sekcja 0):

```bash
# jednorazowo, jeżeli remote nie istnieje
git remote add upstream https://github.com/desktop/desktop.git
git fetch origin
git fetch upstream

# synchronizacja wyłącznie fast-forward
git switch development
git merge --ff-only upstream/development
git push origin development
```

Jeżeli `--ff-only` nie jest możliwe, agent **nie** rozwiązuje rozbieżności przez reset, rebase,
merge commit ani force-push. Zatrzymuje się i przedstawia mi problem wraz z diagnozą:

```bash
git log --oneline upstream/development..development   # nasze commity, których nie ma w upstreamie
git log --oneline development..upstream/development   # commity upstreamu, których nie mamy
```

Na `development` nie wolno:

- implementować obsługi Linuksa;
- dodawać PKGBUILD ani plików pakowania;
- dodawać linuksowych zasobów;
- commitować dokumentacji specyficznej dla tego forka;
- mergować `linux-unstable` ani `linux-stable`;
- publikować wydań tego forka;
- wprowadzać jakichkolwiek własnych commitów niezwiązanych z czystym upstreamem.

Po synchronizacji sprawdzamy:

```bash
git log --oneline upstream/development..development
git diff --stat upstream/development...development
```

Oczekiwany wynik: brak własnych commitów i brak różnic.

### 2.3. Utworzenie gałęzi linuksowych — komendy dla mnie

Agent **nie tworzy** gałęzi. Przygotowuje komendy i czeka:

```bash
git switch development
git switch -c linux-unstable
git push -u origin linux-unstable

git switch development
git switch -c linux-stable
git push -u origin linux-stable

git switch linux-unstable
```

Jeżeli gałąź już istnieje lokalnie albo na GitHubie, nie tworzymy jej ponownie — pobieramy ją
(`git fetch origin`), sprawdzamy historię i kontynuujemy bez przepisywania historii.

Po początkowym utworzeniu `linux-stable` gałąź pozostaje zamrożona.

### 2.4. Gałąź robocza `linux-unstable`

Cała implementacja dla Arch Linux — kod, testy, CI, dokumentacja, PKGBUILD, zasoby linuksowe,
pakiety testowe i wszystkie eksperymenty — należy docelowo do `linux-unstable`.

Agent pracuje **w drzewie roboczym** na gałęzi, na której się znajduje, i raportuje jej nazwę:

```bash
git branch --show-current
```

Jeżeli wynik jest inny niż `linux-unstable`, agent **nie przełącza gałęzi**, tylko zgłasza to
w raporcie (sekcja 0.6).

Wszystkie pull requesty dotyczące implementacji Linuksa mają wskazywać jako bazę `linux-unstable`,
nigdy `development` ani `linux-stable`. PR-y tworzę ja, chyba że wyraźnie polecę inaczej.

Po aktualizacji upstreamu najpierw synchronizujemy `development`, a następnie włączamy nowy
`development` do `linux-unstable` zwykłym, niedestrukcyjnym mergem. Nie rebase'ujemy opublikowanej
gałęzi w sposób wymagający force-pusha.

Wydania tworzone z `linux-unstable` muszą być oznaczone jako prerelease, beta albo unstable.
Nie nazywamy ich stabilnymi.

### 2.5. Zamrożona gałąź `linux-stable`

Pod żadnym warunkiem nie mergujemy automatycznie do `linux-stable`.

Wersji **nie wolno** uznać za stabilną tylko dlatego, że:

- build przeszedł;
- wszystkie testy przeszły;
- CI jest zielone;
- aplikacja uruchamia się poprawnie;
- nie wykryto błędów;
- minął określony czas;
- agent AI uważa wersję za gotową.

Tylko moja jednoznaczna wiadomość, że aktualna wersja jest stabilna i można ją przenieść do
`linux-stable`, stanowi zgodę na merge. Przykład:

```text
Ta wersja jest stabilna. Możesz zmergować linux-unstable do linux-stable.
```

Każda zgoda dotyczy wyłącznie aktualnego, sprawdzonego commita `linux-unstable`. Późniejsze commity
wymagają nowej zgody.

Do czasu takiej wiadomości: żadnego PR-a do `linux-stable`, merge'a, cherry-picka, przesuwania
gałęzi, aktualizacji z `development`, stabilnego taga, stabilnego wydania ani force-pusha.

### 2.6. Procedura promocji wersji stabilnej

Dopiero po mojej wyraźnej zgodzie, i tak samo krok po kroku — każdy krok zapisujący wymaga
osobnego potwierdzenia zgodnie z sekcją 0.3:

1. Zapisz SHA zatwierdzonego commita `linux-unstable`.
2. Upewnij się, że po zgodzie nie pojawiły się nowe commity (jeżeli są — zgoda wygasła).
3. Uruchom pełny zestaw testów z listy A (sekcja 12) i poproś mnie o wyniki listy B.
4. Pokaż różnice:

   ```bash
   git log --oneline linux-stable..linux-unstable
   git diff --stat linux-stable...linux-unstable
   ```

5. Jeżeli testy przejdą — przygotuj PR `linux-unstable` → `linux-stable` i poczekaj na moją komendę.
6. Merge bez przepisywania historii i bez force-pusha.
7. Pokaż SHA commita znajdującego się po merge na `linux-stable`.
8. Dopiero wtedy stabilny tag i stabilne wydanie — również po osobnej zgodzie.

Jeżeli którykolwiek test nie przejdzie, nie mergujemy pomimo wcześniejszej zgody. Poprawki wracają
na `linux-unstable`, a nowe commity wymagają ponownej zgody.

Wymagany przepływ:

```text
desktop/desktop:development
          ↓ synchronizacja
development
          ↓ aktualizacja bazy
linux-unstable
          ↓ tylko po mojej wyraźnej zgodzie
linux-stable
```

Nigdy w przeciwną stronę:

```text
linux-unstable → development
linux-stable   → development
linux-stable   → linux-unstable
```

---

## 3. Cel projektu i jego zakres

### 3.1. Czym ten projekt jest

**Archtop to natywny pakiet Arch Linux dla niezmienionego GitHub Desktop.**

Nie jest to nowy port Linuksa ani nowy fork z własnymi funkcjami. Trzy cechy definiują ten projekt
i odróżniają go od wszystkiego, co już istnieje:

1. **Pakiet natywny dla Arch** — `.pkg.tar.zst` budowany ze źródeł przez `makepkg`, linkowany
   z aktualnymi bibliotekami systemowymi (w szczególności `keytar` ↔ systemowy `libsecret`),
   a nie repakowany `.deb` ani AppImage.
2. **Zero dryfu względem upstreamu** — aplikacja ma być dokładnie tym, czym jest
   `desktop/desktop`, z jedyną różnicą w postaci minimalnej warstwy platformowej. Żadnych
   dodanych funkcji, żadnych zmian wyglądu, żadnego brandingu.
3. **Nazwa własna projektu to `Archtop`** — pakiet nosi nazwę opisową
   `github-desktop-archtop`, a sama aplikacja zachowuje branding upstreamu. Pełne zasady
   nazewnictwa i ich uzasadnienie: sekcja 4.1. Nie wymyślaj własnych wariantów nazwy.

### 3.2. Kontekst — co już istnieje i czego nie powielamy

| Projekt | Wersja | Stan | Pakiety |
|---|---|---|---|
| `desktop/desktop` (upstream) | 3.6.x | aktywny, bez wsparcia Linuksa | Windows, macOS |
| `desktop-plus/desktop-plus` | 3.6.4 | **aktywny, nadąża za upstreamem** | deb, rpm, AppImage |
| `shiftkey/desktop` | 3.4.13 | stoi od lutego 2025 | deb, rpm, AppImage |
| AUR `github-desktop-bin` | 3.4.13 | repakuje deb shiftkeya | `.pkg.tar.zst` |

Wniosek, który wiąże Twoją pracę: **problem „GitHub Desktop działa na Linuksie" jest już
rozwiązany przez Desktop Plus.** Nierozwiązane pozostają wyłącznie dwie rzeczy z sekcji 3.1 —
natywny pakiet Arch i czystość względem upstreamu (Desktop Plus świadomie dokłada funkcje:
wyszukiwanie commitów, wiele kont, GitLab/Bitbucket/Gitea, graf commitów — czego sekcja 4 zakazuje).

### 3.3. Zakres pracy — w zakresie i poza zakresem

**W zakresie (główny deliverable):**

- `packaging/arch/` — PKGBUILD, `.SRCINFO`, plik `.desktop`, skrypty instalacyjne, dokumentacja;
- obsługa `linux` w `script/package.ts`;
- warunki platformowe w `script/build.ts` (macOS-owe zasoby nie mogą blokować builda);
- wyłączenie auto-updatera na Linuksie (pakiet zarządzany przez Pacmana);
- weryfikacja i **minimalne** uzupełnienie istniejących ścieżek `__LINUX__`;
- testy jednostkowe nowych warunków linuksowych, dokumentacja.

**Poza zakresem — nie rób tego, nawet jeśli zauważysz, że działa gorzej niż na Windows:**

- przepisywanie warstwy UI pod Linuksa;
- własne rozwiązania dla titlebara, kontrolek okna, dekoracji;
- nowe funkcje aplikacji jakiegokolwiek rodzaju;
- refaktory niezwiązane z pakowaniem lub z warunkami platformowymi;
- „naprawianie" upstreamu tam, gdzie problem dotyczy wszystkich platform;
- optymalizacje wydajności, aktualizacje zależności, porządki w kodzie.

**Zasada rozstrzygająca w razie wątpliwości:** jeżeli zmiana nie jest konieczna, żeby pakiet
`.pkg.tar.zst` powstał, zainstalował się i uruchomił poprawnie na Arch Linux — jest poza zakresem.
Zgłoś ją w raporcie jako obserwację i idź dalej.

### 3.4. Wymagania funkcjonalne pakietu

Zbudowana i zainstalowana aplikacja ma:

- kompilować się na aktualnym Arch Linux x86_64;
- uruchamiać się bez Wine, Protona, maszyny wirtualnej i kontenera;
- zachować architekturę Electron + React + TypeScript;
- działać w sesjach Wayland i X11;
- obsługiwać HiDPI;
- zapewniać funkcje oficjalnego GitHub Desktop — nie mniej i nie więcej;
- korzystać z bezpiecznego systemowego magazynu poświadczeń;
- zachować wygląd oficjalnego GitHub Desktop.

Electron jest właściwą platformą uruchomieniową tego projektu. Nie przepisuj aplikacji do GTK, Qt,
Tauri ani innego frameworka.

---

## 4. Bezwzględny zakaz zmiany wyglądu

Nie wykonuj redesignu i nie dodawaj własnych ulepszeń wizualnych.

Nie zmieniaj: układu interfejsu, komponentów wizualnych, kolorów i motywów, typografii, odstępów,
rozmiarów i obramowań, ikon i grafik, animacji, nazw i kolejności elementów menu, ekranów logowania
i onboardingu, widoku zmian, historii, commitów i gałęzi, istniejących skrótów klawiaturowych
(poza technicznie koniecznymi odpowiednikami linuksowymi).

W szczególności unikaj zmian w:

```text
app/src/ui/
app/styles/
app/static/common/
app/static/logos/
```

Katalog `app/static/linux/` **już istnieje** (zawiera `icon-logo.png`) — możesz go rozbudować
o zasoby techniczne (np. ikony w wymaganych rozmiarach dla hicolor), ale korzystaj z istniejącej
grafiki bez jej wizualnego przerabiania. Nie wprowadzaj linuksowego motywu GTK do obszaru aplikacji.

Natywne obramowanie okna może zależeć od KDE, GNOME, X11 lub Wayland, ale zawartość okna aplikacji
ma wyglądać jak upstream GitHub Desktop.

Jeżeli zmiana komponentu UI okaże się absolutnie konieczna do działania na Linuksie, najpierw
udokumentuj powód i wybierz rozwiązanie o najmniejszym możliwym zakresie. Nie wykorzystuj portu jako
okazji do poprawiania wyglądu.

### 4.1. Nazewnictwo i znaki towarowe

Rozróżniamy trzy różne rzeczy i **nie wolno ich mieszać**:

| Warstwa | Wartość | Charakter |
|---|---|---|
| Marka / nazwa projektu | `Archtop` | nazwa własna, należy do nas |
| Nazwa pakietu i ścieżki | `github-desktop-archtop` | opisowa — mówi, co jest w środku |
| Nazwa wyświetlana w systemie | `GitHub Desktop (Archtop)` | branding upstreamu + oznaczenie buildu |
| Wewnętrzny `productName` | `GitHub Desktop` | **bez zmian**, upstream |

Pełny zestaw docelowy:

```text
Marka / projekt:      Archtop
Repo:                 Github-archtop                    (slug, bez zmian)
Pakiet AUR/pacman:    github-desktop-archtop
Katalog instalacji:   /opt/github-desktop-archtop/
Launcher:             /usr/bin/github-desktop-archtop
Plik desktopowy:      /usr/share/applications/github-desktop-archtop.desktop
Ikona:                github-desktop-archtop
Name= w .desktop:     GitHub Desktop (Archtop)
Opis pakietu:         GitHub Desktop packaged natively for Arch Linux
Katalog w repo:       packaging/arch/                   (bez zmian)
```

**Zakazy:**

- nie umieszczaj „GitHub" ani „Git" w nazwie marki, produktu ani w nazwie wyświetlanej innej niż
  podana wyżej — w szczególności nie używaj form „GitHub Archtop" ani „Git-Archtop";
- nie twórz nowych logo, nie modyfikuj i nie mieszaj z niczym oznaczenia Invertocat;
- nie podmieniaj zawartości `app/static/logos/`;
- nie zmieniaj `productName`, `bundleID` ani `companyName` w `app/package.json` — pozostają
  odpowiednio `GitHub Desktop`, `com.github.GitHubClient`, `GitHub, Inc.`;
- nie zmieniaj wewnętrznej nazwy binarnej upstreamu (`desktop`) — launcher
  `github-desktop-archtop` ma być cienką nakładką albo symlinkiem (sekcja 10).

**Dlaczego tak:** licencja MIT obejmuje kod, ale **nie** znaki towarowe — mówi to wprost
`README.md:101-106` w tym repozytorium („The MIT license grant is not for GitHub's trademarks").
Nazwa pakietu w dystrybucji jest użyciem opisowym i jest w porządku — dokładnie tak działa AUR-owy
`github-desktop-bin`. Nazwa produktu zawierająca cudzy znak sugerowałaby afiliację i już w porządku
nie jest. To nie jest porada prawna, tylko reguła projektowa, której się trzymamy.

---

## 5. Referencyjne forki linuksowe

### 5.1. Referencja podstawowa — Desktop Plus

<https://github.com/desktop-plus/desktop-plus>

To jest **właściwe źródło poprawek linuksowych** dla tego projektu. Fork aktywnie nadąża za
upstreamem (wersja 3.6.4 w sierpniu 2026), więc jego warstwa platformowa dotyczy tej samej bazy
kodu co nasza — Electron 42, TypeScript 5.8, ta sama struktura `script/` i `main-process/`.

Zasady korzystania:

- traktuj go jako dokumentację i źródło **pojedynczych, punktowych** rozwiązań;
- nie kopiuj repozytorium w całości i nie merguj jego gałęzi;
- **nie przenoś jego funkcji.** Desktop Plus świadomie rozszerza GitHub Desktop o wyszukiwanie
  commitów, obsługę wielu kont, integrację z GitLab, Bitbucket, Codeberg i Gitea oraz graf commitów.
  Wszystko to łamie sekcję 4 i wykracza poza zakres z sekcji 3.3. Interesuje nas wyłącznie to,
  co dotyczy uruchomienia i zbudowania aplikacji na Linuksie;
- szczególnie użyteczne obszary do podejrzenia: warunki platformowe w skryptach budujących, obsługa
  `keytar`/Secret Service, wyłączenie auto-updatera, rejestracja protokołów, plik `.desktop`.

### 5.2. Referencja historyczna — shiftkey/desktop

<https://github.com/shiftkey/desktop/tree/linux>

Ten fork zatrzymał się na wersji 3.4.13 (luty 2025) i jest o dwie wersje minor oraz kilkanaście
miesięcy rozwoju zależności za naszą bazą. Część jego poprawek dotyczy problemów, które
w 3.6.x już nie istnieją albo zostały rozwiązane inaczej.

Korzystaj z niego **wyłącznie** wtedy, gdy Desktop Plus nie odpowiada na dane pytanie — i zawsze
weryfikuj, czy problem nadal występuje w aktualnym kodzie, zanim zastosujesz poprawkę.

To z tego forka pochodzą pakiety `github-desktop-bin` w AUR, więc jest też przydatny jako
punkt odniesienia dla list zależności — z zastrzeżeniem, że są to zależności sprzed półtora roku.

### 5.3. Wspólne zakazy dla obu forków

Nie przenoś zmian dotyczących: titlebara, kontrolek okna, preferencji wyglądu, dodatkowych opcji
wizualnych, komponentów React niezwiązanych bezpośrednio z obsługą systemu, SCSS titlebara,
brandingu, ani żadnych funkcji nieobecnych w upstreamie.

Nie obniżaj Electron, TypeScriptu, Reacta ani innych zależności tylko po to, aby zastosować starą
poprawkę. Jeżeli poprawka wymaga starszej wersji zależności — nie jest to poprawka dla nas.

Każdą poprawkę przeniesioną z któregokolwiek forka odnotuj w `packaging/arch/PORTED-PATCHES.md`:
źródło, powód, zakres. To jest dokumentacja długu technicznego, którą trzeba będzie przeglądać
przy każdej aktualizacji upstreamu.

---

## 6. Audyt przed implementacją

Znajdź miejsca zależne od systemu:

```bash
rg "__DARWIN__|__WIN32__|__LINUX__|process\.platform" app script
```

Sprawdź przede wszystkim:

```text
script/build.ts
script/build-platforms.ts
script/package.ts
script/dist-info.ts
script/post-install.ts
app/app-info.ts
app/src/main-process/main.ts            # single instance, rejestracja protokołów, argumenty
app/src/main-process/app-window.ts      # autoUpdater, stan okna
app/src/main-process/squirrel-updater.ts
app/src/main-process/shell.ts
app/src/main-process/notifications.ts
app/src/lib/editors/linux.ts + lookup.ts
app/src/lib/shells/linux.ts + shared.ts
app/src/lib/stores/token-store.ts
app/src/lib/custom-integration.ts
app/src/lib/app-state.ts
```

Ustal:

- które funkcje linuksowe **już istnieją** (patrz sekcja 1.1) i czy są kompletne;
- które są niedokończone;
- gdzie kod zakłada macOS lub Windows;
- które zależności zawierają natywne moduły Node (w szczególności `keytar`);
- gdzie używany jest macOS Keychain lub Windows Credential Manager;
- gdzie używany jest rejestr Windows, AppleScript lub systemowe lokalizacje aplikacji;
- jak obsługiwane są protokoły URL, aktualizacje, terminale, edytory, SSH, GPG i askpass.

Przed implementacją przedstaw krótki plan oparty na rzeczywistym kodzie, a następnie od razu go
realizuj. Plan opisuje zmiany w plikach — **nie** commity ani gałęzie.

---

## 7. Budowanie na Linuksie

Popraw `script/build.ts`, aby build linuksowy działał bez zasobów przeznaczonych wyłącznie dla macOS.

Konkretne miejsca do naprawy (numery linii orientacyjne, zweryfikuj w aktualnym pliku):

- `script/build.ts:173–177` — `assert(existsSync(assetsCarPath))` jest bezwarunkowy; ma się wykonywać
  wyłącznie dla `darwin`;
- `script/build.ts:188–192` — `icon` i `extraResource: [assetsCarPath]` — na Linuksie ikona ma być
  w formacie PNG (`app/static/linux/icon-logo.png`), a `extraResource` nie może zawierać `Assets.car`;
- `osxSign`, `osxNotarize`, `extendInfo` — tylko dla `darwin`;
- metadane Windows — tylko dla `win32`.

Na Linuksie:

- nie wymagaj `Assets.car`;
- nie przekazuj macOS-owych zasobów do `@electron/packager`;
- nie wykonuj podpisywania ani notaryzacji macOS;
- nie używaj `extendInfo` ani macOS-owych entitlements;
- ustaw ikonę w formacie obsługiwanym na Linuksie;
- zachowaj istniejące zachowanie Windows i macOS bez zmian.

Nie naprawiaj problemów przez dodanie `--no-sandbox`. Zachowaj zabezpieczenia Electron/Chromium.

Build powinien działać co najmniej przez:

```bash
yarn
yarn build:prod
```

---

## 8. Integracja systemowa

**Kolejność pracy dla każdego punktu poniżej jest obowiązkowa:**

1. **Sprawdź, czy to już działa.** Większość tych rzeczy ma już implementację (sekcja 1.1).
   Uruchom, przetestuj, dopiero potem oceniaj.
2. Jeżeli nie działa — sprawdź, czy problem blokuje cel z sekcji 3.1 (zbudowanie, instalację
   i poprawne uruchomienie pakietu). Jeżeli nie blokuje, zapisz obserwację w raporcie i **nie
   naprawiaj**.
3. Jeżeli blokuje — poszukaj rozwiązania w Desktop Plus (sekcja 5.1), zanim napiszesz własne.
4. Zastosuj najmniejszą możliwą poprawkę, w gałęzi `__LINUX__`, i odnotuj ją
   w `packaging/arch/PORTED-PATCHES.md`.

Nie pisz od zera niczego, co już istnieje w kodzie albo w Desktop Plus.

Lista do zweryfikowania (implementacja tylko wtedy, gdy weryfikacja wykaże realny bloker):

- blokadę pojedynczej instancji aplikacji (już jest w `main.ts` — sprawdź zachowanie na Linuksie);
- przekazywanie argumentów i deep linków do działającej instancji (`second-instance`);
- OAuth oraz powrót do aplikacji;
- protokoły `x-github-desktop-auth`, `x-github-desktop-dev-auth`, `x-github-client`;
- rejestrację protokołów — uwaga: `app.setAsDefaultProtocolClient` na Linuksie jest realizowane przez
  `xdg-settings` i wymaga zainstalowanego pliku `.desktop` o nazwie zgodnej z identyfikatorem
  aplikacji oraz pakietu `xdg-utils`. Zweryfikuj to eksperymentalnie, nie zakładaj;
- otwieranie adresów w domyślnej przeglądarce;
- otwieranie repozytorium w systemowym menedżerze plików;
- wykrywanie terminali dostępnych na Arch Linux (rozszerz `app/src/lib/shells/linux.ts`);
- wykrywanie popularnych edytorów (rozszerz `app/src/lib/editors/linux.ts`);
- Git przez HTTPS i SSH;
- SSH askpass;
- credential helper;
- podpisywanie commitów GPG;
- ścieżki zgodne z XDG Base Directory;
- spacje i znaki Unicode w ścieżkach;
- symlinki;
- system plików rozróżniający wielkość liter;
- Wayland i X11;
- skalowanie HiDPI;
- powiadomienia systemowe (`app/src/main-process/notifications.ts` ma już gałąź `__LINUX__`);
- zapisywanie i odtwarzanie stanu okna;
- poprawne zamykanie aplikacji.

Nie dodawaj zależności od jednego środowiska graficznego. Aplikacja ma działać co najmniej w KDE
Plasma i GNOME oraz w typowych menedżerach okien używanych na Arch Linux.

---

## 9. Bezpieczne przechowywanie poświadczeń

Korzystaj z istniejącego `keytar` (`^7.8.0`) i linuksowego backendu Secret Service/libsecret.

Uwaga techniczna: `keytar` jest natywnym modułem Node — wymaga `libsecret` zarówno przy kompilacji,
jak i w czasie działania. Ma to bezpośredni wpływ na `depends` i `makedepends` w PKGBUILD (sekcja 10).

Pakiet powinien deklarować wymagane biblioteki, a dokumentacja powinna wyjaśniać współpracę
z GNOME Keyring, KWallet lub innym kompatybilnym dostawcą Secret Service.

Jeżeli usługa Secret Service nie działa, aplikacja powinna:

- nie zapisywać tokenów jawnym tekstem;
- nie wyciekać tokenu do logów;
- zapisać techniczny, bezpieczny komunikat diagnostyczny;
- przedstawić użytkownikowi zrozumiałą informację;
- nie zawieszać się.

Nie dodawaj nowych sekretów OAuth, prywatnych tokenów ani kluczy do repozytorium.

---

## 10. Pakowanie dla Arch Linux

Rozszerz `script/package.ts` (linie ~39–46) o jawną obsługę `process.platform === 'linux'`.
Polecenie `yarn package` nie może kończyć się komunikatem:

```text
I don't know how to package for linux :(
```

Dodaj utrzymywalny katalog:

```text
packaging/arch/
```

Umieść w nim:

- `PKGBUILD`;
- `.SRCINFO`;
- `github-desktop-archtop.desktop`;
- deklaracje MIME i handlerów protokołów;
- potrzebne skrypty instalacyjne (`.install`, jeżeli konieczne — np. `update-desktop-database`,
  `gtk-update-icon-cache`);
- `README.md` — dokumentację budowania i instalacji;
- `TESTING.md` — checklistę z sekcji 12.2;
- `PORTED-PATCHES.md` — rejestr poprawek przeniesionych z obcych forków (sekcja 5.3).

Nazwy są ustalone w sekcji 4.1 i to ona jest źródłem prawdy — nie wymyślaj wariantów. Nazwa pakietu
nie jest powodem do zmiany czegokolwiek w interfejsie aplikacji.

Standardowe lokalizacje instalacji:

```text
/opt/github-desktop-archtop/
/usr/bin/github-desktop-archtop
/usr/share/applications/github-desktop-archtop.desktop
/usr/share/icons/hicolor/<rozmiar>/apps/github-desktop-archtop.png
```

Wewnętrzna nazwa binarna pozostaje `desktop` (sekcja 4.1). Utwórz bezpieczny launcher albo symlink
`github-desktop-archtop`, bez kopiowania kodu aplikacji w kilka miejsc.

### 10.1. Zależności — punkt wyjścia do weryfikacji

Poniższa lista jest **punktem wyjścia, nie gotową odpowiedzią**. Zweryfikuj ją przez `ldd` na
zbudowanym binarium i przez analizę faktycznie używanych bibliotek:

```bash
ldd dist/*/desktop | sort
```

- `depends`: `gtk3`, `nss`, `alsa-lib`, `libxss`, `libnotify`, `libsecret`, `git`
  (plus to, co wykaże `ldd`);
- `optdepends`: `gnome-keyring` lub `kwallet` (dostawca Secret Service), `openssh` (klonowanie przez
  SSH), `gnupg` (podpisywanie commitów), `xdg-utils` (rejestracja protokołów), `libappindicator-gtk3`
  (jeżeli używane);
- `makedepends`: `nodejs`, `yarn`, `python`, `base-devel`, `libsecret` (kompilacja `keytar`).

Nie przepisuj listy zależności z przypadkowego pakietu bez sprawdzenia.

### 10.2. Zasady budowania pakietu

- Pakiet musi powstawać bez uruchamiania builda jako root: `makepkg -s`.
- Instalacja: `sudo pacman -U ./*.pkg.tar.zst`.
- **Nie pobieraj nowych źródeł w funkcji `build()`.** Wszystko, co wymaga sieci (`yarn install`,
  pobranie Electrona, kompilacja `keytar`), musi być zadeklarowane w `source=` albo wykonane
  w `prepare()` zgodnie z zasadami Arch. Jeżeli pełna offline'owość jest niemożliwa, udokumentuj to
  jawnie w `packaging/arch/README.md` jako znane ograniczenie.
- Nie buduj jako root. Nie dodawaj `--no-sandbox`. Nie ustawiaj setuid bez jednoznacznego,
  udokumentowanego uzasadnienia bezpieczeństwa.
- W pakiecie zarządzanym przez Pacmana aplikacja nie może samodzielnie nadpisywać plików w `/opt`
  ani `/usr`. Aktualizacje dostarczamy jako nowe wersje pakietu. Wyłącz auto-updater na Linuksie —
  punkty wejścia: `app/src/main-process/squirrel-updater.ts` oraz użycie `autoUpdater`
  w `app/src/main-process/app-window.ts`. Wyłączenie ma być techniczne (gałąź `__LINUX__`), bez
  zmiany wyglądu aplikacji.

---

## 11. Plik desktopowy i protokoły

Dodaj `packaging/arch/github-desktop-archtop.desktop`. Nazwy pochodzą z sekcji 4.1 — nie zmieniaj
ich. Szkielet docelowy:

```ini
[Desktop Entry]
Type=Application
Version=1.0
Name=GitHub Desktop (Archtop)
GenericName=Git Client
Comment=Simple collaboration from your desktop
Exec=/usr/bin/github-desktop-archtop %U
Icon=github-desktop-archtop
Terminal=false
Categories=Development;RevisionControl;
MimeType=x-scheme-handler/x-github-client;x-scheme-handler/x-github-desktop-auth;x-scheme-handler/x-github-desktop-dev-auth;
StartupWMClass=GitHub Desktop
```

Uwagi do wypełnienia:

- `StartupWMClass` musi odpowiadać rzeczywistej klasie okna — zweryfikuj przez
  `xprop WM_CLASS` na działającej aplikacji i popraw, jeżeli różni się od podanej. Błędna wartość
  powoduje, że okno nie skleja się z ikoną w docku;
- `Comment` i `GenericName` weź z upstreamu (`app/package.json` → `description`), nie wymyślaj
  własnych opisów;
- `%U` jest wymagane, żeby deep linki trafiały do aplikacji jako argument.

Po instalacji (weryfikacja po mojej stronie, sekcja 12 lista B):

```bash
desktop-file-validate /usr/share/applications/github-desktop-archtop.desktop
update-desktop-database ~/.local/share/applications   # albo wywołane przez skrypt .install
xdg-mime query default x-scheme-handler/x-github-desktop-auth
```

Uwaga: `xdg-mime query default` zwróci sensowny wynik dopiero po zarejestrowaniu bazy plików
`.desktop` i tylko wtedy, gdy plik deklaruje odpowiedni `MimeType`. Brak wyniku bezpośrednio po
instalacji nie musi oznaczać błędu w pakiecie.

Sprawdź deep link zarówno przy zamkniętej aplikacji, jak i wtedy, gdy aplikacja już działa.

---

## 12. Testy i weryfikacja

Weryfikacja jest podzielona na dwie listy, bo narzędzia Arch Linux (`pacman`, `makepkg`, `namcap`,
`desktop-file-validate`) nie są dostępne w środowisku agenta.

### 12.1. Lista A — agent wykonuje sam i raportuje wyniki

```bash
yarn
yarn lint                 # prettier + eslint
yarn test                 # node script/test.mjs
yarn build:prod
yarn package              # musi przejść, nie kończyć się "I don't know how to package for linux"
```

Dodatkowo, w miarę możliwości środowiska:

```bash
bash -n packaging/arch/PKGBUILD                       # składnia
shellcheck packaging/arch/PKGBUILD                    # jeżeli dostępny
xvfb-run -a yarn test:e2e                             # headless smoke test
```

Repozytorium ma już infrastrukturę Playwright w `app/test/e2e/` (m.in. `app-launch.e2e.ts`,
`playwright.config.ts`). Wykorzystaj ją zamiast budować własny harness. `xvfb-run` jest dostępny.

Agent dodaje też:

- testy jednostkowe dla nowych warunków linuksowych (wzór: `app/test/unit/path-test.ts`, które już
  używa `__LINUX__`);
- jeżeli to możliwe, workflow GitHub Actions budujący i testujący w środowisku Arch Linux (kontener
  `archlinux:base-devel`) oraz test startu przez `xvfb`.

Jeżeli którejś komendy nie da się uruchomić w środowisku agenta, agent **wpisuje to wprost
w raporcie** wraz z powodem — nie zgłasza sukcesu, którego nie zweryfikował.

### 12.2. Lista B — checklist dla mnie, na prawdziwym Arch Linux

Agent przygotowuje tę listę jako gotowy do odhaczenia dokument w `packaging/arch/TESTING.md`.

Pakowanie:

```bash
cd packaging/arch
makepkg -s
namcap PKGBUILD
namcap ./*.pkg.tar.zst
sudo pacman -U ./*.pkg.tar.zst
desktop-file-validate /usr/share/applications/github-desktop-archtop.desktop
xdg-mime query default x-scheme-handler/x-github-desktop-auth
```

Funkcjonalność:

1. uruchomienie z czystym profilem;
2. logowanie OAuth;
3. ponowne uruchomienie po zalogowaniu;
4. bezpieczne zachowanie przy niedostępnym keyringu;
5. klonowanie repozytorium przez HTTPS;
6. klonowanie repozytorium przez SSH;
7. dodanie istniejącego lokalnego repozytorium;
8. utworzenie commita;
9. fetch, pull i push;
10. tworzenie i przełączanie gałęzi;
11. stash i przywracanie zmian;
12. rozwiązywanie konfliktu;
13. podpisywanie commita GPG;
14. otwieranie repozytorium w terminalu;
15. otwieranie repozytorium w edytorze;
16. deep link przy zamkniętej aplikacji;
17. deep link przy działającej aplikacji;
18. działanie w sesji Wayland;
19. działanie w sesji X11;
20. ponowne uruchomienie i odtworzenie stanu okna.

---

## 13. Kontrola niezmienionego wyglądu

Podstawową i obowiązkową kontrolą jest **diff**, nie zrzuty ekranu — zrzuty referencyjne „sprzed
zmian" nie są potrzebne, bo punktem odniesienia jest czysty `development`.

Agent na koniec każdej sesji pokazuje:

```bash
git diff development -- app/src/ui app/styles app/static/common app/static/logos
git diff --stat development
```

(po utworzeniu `linux-unstable` odpowiednio `git diff development...linux-unstable -- ...`).

Oczekiwany wynik pierwszego polecenia: **brak zmian** albo wyłącznie minimalne zmiany techniczne bez
wpływu na wygląd. Każdą zmianę dotykającą UI lub SCSS agent wyjaśnia osobno, z uzasadnieniem, dlaczego
była technicznie konieczna i dlaczego wybrany zakres jest najmniejszy z możliwych.

Kontrola wizualna (opcjonalna, po mojej stronie): zrzuty z zainstalowanej aplikacji porównane
z oficjalnym GitHub Desktop, przy identycznym rozmiarze okna, tych samych danych i tym samym motywie:

- ekran powitalny, ekran logowania, lista zmian, podgląd diff, historia, ustawienia, selektor
  repozytorium, selektor gałęzi — w motywie jasnym i ciemnym.

Dopuszczalne są wyłącznie różnice wynikające z natywnego obramowania okna oraz systemowego
antyaliasingu. Nie akceptujemy zmian w układzie, kolorach, ikonach, odstępach ani rozmiarach.

---

## 14. Jakość implementacji

- Nie psuj działania Windows ani macOS.
- Dodawaj ścieżki `__LINUX__` zamiast zmieniać zachowanie pozostałych systemów.
- Nie wykonuj niezwiązanych refaktorów.
- Nie aktualizuj wszystkich zależności bez konkretnej potrzeby.
- Nie obniżaj wersji zależności.
- Zachowaj istniejący styl TypeScriptu, lint i testy.
- Nie zapisuj do repozytorium `node_modules`, wygenerowanych paczek, logów ani sekretów — sprawdź
  `.gitignore` przed dodaniem czegokolwiek nowego.
- Grupuj zmiany w małe, logiczne całości i opisz proponowany podział na commity **w raporcie** —
  commity tworzę ja albo ty na moją wyraźną komendę (sekcja 0).
- Dokumentuj techniczne obejścia i ograniczenia.
- Nie zmieniaj brandingu ani wyglądu.

---

## 15. Definicja ukończenia wersji niestabilnej

Implementacja jest gotowa do moich testów, gdy:

**Zweryfikowane przez agenta (lista A):**

- `yarn build:prod` działa;
- `yarn package` obsługuje Linuksa i kończy się sukcesem;
- `yarn lint` i `yarn test` przechodzą;
- headless smoke test przez `xvfb-run` przechodzi;
- diff na `app/src/ui`, `app/styles`, `app/static/common`, `app/static/logos` jest pusty albo w pełni
  wyjaśniony;
- **diff poza katalogiem `packaging/` jest mały** — zmiany dotyczą wyłącznie `script/` oraz gałęzi
  `__LINUX__`, a każdy zmodyfikowany plik poza `packaging/` ma uzasadnienie w sekcji 3.3.
  To jest kluczowy wskaźnik zdrowia projektu: im większy diff, tym droższa każda przyszła
  synchronizacja z upstreamem;
- `packaging/arch/PORTED-PATCHES.md` wymienia każdą poprawkę przeniesioną z obcego forka;
- kod nie zawiera `--no-sandbox` ani zależności od Wine;
- `development` pozostał czysty (brak zmian w drzewie roboczym dotyczących tej gałęzi);
- `linux-stable` nietknięty;
- w repozytorium nie powstał żaden commit bez mojej zgody.

**Do zweryfikowania przeze mnie (lista B):**

- powstaje poprawny pakiet `.pkg.tar.zst`;
- pakiet przechodzi `namcap` bez poważnych błędów;
- aplikacja instaluje się przez Pacmana;
- uruchamia się z terminala i z menu systemowego;
- OAuth, keyring i podstawowe operacje Git działają;
- deep linki działają;
- aplikacja działa w Waylandzie i X11.

Spełnienie tych warunków **nie stanowi** zgody na merge do `linux-stable`.

---

## 16. Raport końcowy

Po każdej sesji pracy podaj:

1. aktualną gałąź (`git branch --show-current`) i informację, czy jest zgodna z polityką;
2. SHA ostatniego commita (`git log -1 --oneline`);
3. listę zmian **niezacommitowanych** (`git status --short`) — bo domyślnie nie commitujesz;
4. listę zmienionych plików z krótkim opisem każdej zmiany;
5. uzasadnienie każdej ważnej decyzji technicznej;
6. wyniki lintu i testów (lista A) — dokładne, z wyjściem komend;
7. **listę komend, których nie dało się uruchomić w Twoim środowisku, wraz z powodem**;
8. status pakowania: czy `yarn package` przeszedł, czy PKGBUILD jest gotowy do `makepkg`;
9. przewidywaną nazwę generowanego pakietu;
10. instrukcję instalacji i uruchomienia (dla mnie, do wykonania na Arch);
11. wyniki kontroli wyglądu (diff z sekcji 13);
12. znane ograniczenia i techniczne obejścia;
13. informację, czy `development` nadal odpowiada upstreamowi;
14. jednoznaczne potwierdzenie, że `linux-stable` nie został zmieniony;
15. **gotowy blok komend git do skopiowania**, gdybym chciał zapisać tę pracę — jako tekst,
    nieuruchomiony;
16. jednoznaczne potwierdzenie, że nie wykonałeś żadnej operacji zapisującej w git bez mojej zgody.

Nie merguj do `linux-stable` i nie publikuj stabilnego wydania, dopóki osobiście nie napiszę,
że aktualna wersja jest stabilna.

---

## Aneks — zmiany względem pierwotnego promptu

| # | Co było | Co jest teraz | Dlaczego |
|---|---|---|---|
| 1 | brak reguły o operacjach git | nowa sekcja 0, nadrzędna wobec wszystkich pozostałych | wymóg użytkownika: commit/push/merge tylko na wyraźną komendę |
| 2 | sekcje 2.2–2.6 jako polecenia do wykonania przez agenta | te same komendy, ale przygotowywane dla użytkownika | spójność z sekcją 0 |
| 3 | „nie ma jeszcze kompletnego systemu pakowania" | dodano sekcję 1.1 z listą tego, co **już działa** dla Linuksa | `shells/linux.ts`, `editors/linux.ts`, `app/static/linux/`, single instance i protokoły w `main.ts` już istnieją — inaczej agent pisałby je od zera |
| 4 | „Możesz dodać `app/static/linux/`" | „katalog już istnieje, rozbuduj go" | `app/static/linux/icon-logo.png` jest w repo |
| 5 | „`script/build.ts` rozpoznaje `process.platform === 'linux'`" | wskazano faktyczny bloker: `assert` na `Assets.car` w `build.ts:173–177` | `toPackagePlatform` już akceptuje `linux`; problemem jest bezwarunkowy assert |
| 6 | `electron-packager` | `@electron/packager` `^18.4.4` | faktyczna nazwa pakietu w `package.json` |
| 7 | brak wzmianki o remote'ach i gałęziach | jawne stwierdzenie: brak `upstream`, brak `linux-unstable`, brak `linux-stable` | prompt zakładał stan, którego nie ma |
| 8 | brak reakcji na narzuconą gałąź roboczą | sekcja 0.6 | środowiska agentowe wymuszają własną gałąź `claude/...`, co kolidowało z wymogiem „gałąź musi być `linux-unstable`" |
| 9 | sekcja 12 jako jedna lista komend | podział na listę A (agent) i listę B (użytkownik na Arch) | w środowisku agenta nie ma `pacman`, `makepkg`, `namcap` ani `desktop-file-validate` |
| 10 | sekcja 13: „wykonaj zrzuty referencyjne przed zmianami" | kontrola przez `git diff` jako obowiązkowa, zrzuty jako opcjonalne po stronie użytkownika | baza jest już ustalona, zrzutów „sprzed" nie da się zrobić wstecz |
| 11 | brak wskazania infrastruktury testowej | wskazano istniejące `app/test/e2e/` (Playwright) i dostępny `xvfb-run` | agent nie musi budować własnego harnessu |
| 12 | „zadeklaruj kompletne depends" bez podpowiedzi | dodano punkt wyjścia (`gtk3`, `nss`, `libsecret`, …) z wymogiem weryfikacji przez `ldd` | zmniejsza ryzyko wymyślonej listy, zachowując wymóg weryfikacji |
| 13 | „wyłącz auto-updater" bez wskazania miejsca | wskazano `squirrel-updater.ts` i `autoUpdater` w `app-window.ts` | konkretny punkt wejścia |
| 14 | „odpowiednie typy `x-scheme-handler`" | pełna linia `MimeType=` + uwaga o `xdg-settings`/`xdg-utils` | `setAsDefaultProtocolClient` na Linuksie działa inaczej niż na Windows |
| 15 | `xdg-mime query default` jako twardy test | dodano uwagę, że wymaga `update-desktop-database` | brak wyniku tuż po instalacji nie oznacza błędu pakietu |
| 16 | „nie pobieraj nowych źródeł w `build()`" | to samo + uwaga o natywnej kompilacji `keytar` i wymogu offline | `keytar` wymaga `libsecret` i kompilacji, co realnie utrudnia offline'owy `build()` |
| 17 | raport: 14 punktów | 16 punktów — dodano „komendy niewykonalne w środowisku" i „gotowy blok komend git" | wymuszenie uczciwego raportowania i spójność z sekcją 0 |
| 18 | sekcja 5 wskazywała `shiftkey/desktop` jako jedyną referencję | `desktop-plus/desktop-plus` jako referencja podstawowa, shiftkey jako historyczna | shiftkey stoi na 3.4.13 od lutego 2025; Desktop Plus wydał 3.6.4 w sierpniu 2026, czyli dotyczy tej samej bazy kodu co nasza |
| 19 | sekcja 3 opisywała pełny port Linuksa | sekcja 3.1–3.4: projekt zdefiniowany jako „natywny pakiet Arch + zero dryfu od upstreamu", z jawną listą „poza zakresem" i zasadą rozstrzygającą | problem „GitHub Desktop na Linuksie" jest już rozwiązany przez Desktop Plus; powielanie go to koszt bez wartości. Nierozwiązane są tylko pakiet Arch i czystość względem upstreamu |
| 20 | sekcja 8 jako lista do zaimplementowania | obowiązkowa kolejność: sprawdź → oceń czy blokuje cel → poszukaj w Desktop Plus → minimalna poprawka | większość tych funkcji już działa; bez tej kolejności agent pisze od zera rzeczy, które istnieją |
| 21 | brak wskaźnika rozmiaru zmian | sekcja 15: „diff poza `packaging/` musi być mały" jako kryterium ukończenia | rozmiar diffu determinuje koszt każdej przyszłej synchronizacji z upstreamem — to jedyna metryka, która decyduje, czy projekt przeżyje |
| 22 | brak śladu po przeniesionych poprawkach | wymagany `packaging/arch/PORTED-PATCHES.md` | przy każdej aktualizacji upstreamu trzeba wiedzieć, które obejścia można już usunąć |
| 23 | nazwa „GitHub Archtop", pakiet `github-archtop` | marka `Archtop`, pakiet `github-desktop-archtop`, w menu `GitHub Desktop (Archtop)`; nowa sekcja 4.1 | „GitHub Archtop" wstawia cudzy znak towarowy w nazwę produktu — `README.md:101-106` upstreamu mówi wprost, że MIT nie obejmuje znaków towarowych. Rozważany wariant „Git-Archtop" jest zakazany osobno przez politykę znaku „Git" (Software Freedom Conservancy), która nie dopuszcza użycia znaku jako sylaby ani części zbitki słownej; GitHub i GitLab są wyjątkami wynikającymi z umów sprzed powstania polityki, więc nie są precedensem. Nazwa pakietu pozostaje opisowa, bo to standardowe użycie nominatywne — tak samo działa AUR-owy `github-desktop-bin` |
| 24 | sekcja 11 opisywała pola `.desktop` | gotowy szkielet pliku z docelowymi wartościami + uwagi o `StartupWMClass`, `Comment`, `%U` | mniej miejsca na improwizację agenta w miejscu, które decyduje o deep linkach i ikonie w docku |
