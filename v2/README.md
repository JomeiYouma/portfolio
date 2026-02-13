# Portfolio V2 - React + GSAP

## Changements clefs

### Esthétique conservée
- **Polices**: Punc (YOUMA/CTA), Tektur (titres), Orbitron (body)
- **Couleurs**: #24FBC5 (cyan accent), #090909 (dark), #FFFFFF (light), #231F20 (bg)
- **Design**: Clip-path nav, cards sans border-radius, accents cyan sur bordures

### Navigation horizontale
- Scroll horizontal fluide avec GSAP ScrollTrigger
- Sections 100vw en rangée horizontale
- Nav latérale avec clip-path original
- ScrollProgress bar en haut
- ScrollSpy pour section active

### Projets
- Grid vertical avec scroll interne (max-height: 60vh)
- Données i18n (FR/EN) du projects.json V1
- Images copiées depuis V1
- Hover reveal des skills

### Fonctionnalités migrées
- **i18n**: Hook useI18n + bouton FR/ENG
- **Contraste AAA**: Hook useContrast + bouton toggle
- **GitHub**: Component GitHubRepos (fetch API)
- **Traductions**: JSON V1 copié

## Lancement

```powershell
cd v2
npm run dev
```

Serveur: http://localhost:5174/

## Prochaines étapes

1. Ajouter section GitHub avec GitHubRepos component
2. Affiner animations GSAP (parallax, reveals)
3. Responsive mobile (vertical scroll fallback)
4. Perf optimizations (code splitting, lazy load)
5. Remplacer placeholders contact/hero avec tes infos
