# Církev jako kráva – hlavní web

Zatím jen přistávací stránka „BRZY“ s odkazy na [manifest](https://manifest.cirkevjakokrava.cz),
[otázky na tělo](https://otazky.cirkevjakokrava.cz) a kontaktem `ahoj@cirkevjakokrava.cz`.

**Živě:** https://cirkevjakokrava.cz (GitHub Pages z kořene větve `main`)

Sourozenec repozitářů `cirkevjakokrava` (manifest) a `otazky` – stejné barvy (`#3b2f2f` / `#e6acac`),
písmo Agrandir i otisk z Figmy.

## Struktura

```
index.html              celá stránka, styly jsou uvnitř – žádný build
CNAME                   cirkevjakokrava.cz
assets/otisk.svg        otisk („Group 14“ z Figmy, stejné křivky jako manifest)
assets/fonts/*.woff     Agrandir – subset (latinka, čeština, šipka)
assets/favicon.svg      ikona webu (+ favicon-32.png, icon-180.png) – převzaté z manifestu
assets/og.jpg           náhled při sdílení odkazu (1200×630, vyfocená stránka)
```

Texty se mění přímo v `index.html` (i ve webovém editoru GitHubu). Po uložení je změna do minuty venku.

## Nasazení

1. **Settings → Pages:** Source „Deploy from a branch“, větev `main`, složka `/ (root)`.
   Custom domain `cirkevjakokrava.cz` (načte se ze souboru `CNAME`).
2. **DNS** domény `cirkevjakokrava.cz`:

   | typ | název | hodnota |
   | --- | --- | --- |
   | A | @ | 185.199.108.153 |
   | A | @ | 185.199.109.153 |
   | A | @ | 185.199.110.153 |
   | A | @ | 185.199.111.153 |
   | AAAA | @ | 2606:50c0:8000::153 |
   | AAAA | @ | 2606:50c0:8001::153 |
   | AAAA | @ | 2606:50c0:8002::153 |
   | AAAA | @ | 2606:50c0:8003::153 |
   | CNAME | www | radomilcz.github.io. |

   Původní A záznamy na webhosting (`178.238.44.12`) pro `@` i `www` smazat. Záznamy `manifest`
   a `otazky` a MX (pošta) nechat, jak jsou – pokud MX míří přímo na `cirkevjakokrava.cz`, je potřeba
   ho nejdřív přesměrovat na vlastní jméno (např. `mail.cirkevjakokrava.cz` → `178.238.44.12`),
   jinak by po změně A záznamu přestala chodit pošta.
3. Až GitHub vystaví certifikát, zaškrtnout **Enforce HTTPS**.
