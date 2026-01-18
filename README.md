# Portfolio de Raphaël Madoré

Portfolio personnel présentant mes projets et compétences en développement web et multimédia.

## 🎯 À propos

Site portfolio interactif créé pour présenter mon parcours, mes projets académiques et personnels, ainsi que mes compétences techniques. Le design met l'accent sur une expérience utilisateur fluide avec des animations subtiles et une navigation horizontale unique sur desktop.

## ✨ Fonctionnalités

- **Navigation horizontale** : Défilement horizontal sur desktop avec snap-scroll
- **Mode contraste AAA** : Mode haute-fidélité pour l'accessibilité
- **Multilingue** : Basculement Français/Anglais (i18n)
- **Intégration GitHub** : Affichage en temps réel de l'activité GitHub
- **Design responsive** : Optimisé pour desktop et mobile
- **Animations fluides** : Transitions et effets visuels soignés
- **Easter eggs** : Interactions cachées sur les technologies

## 🛠️ Technologies utilisées

### Front-end
- **HTML5** : Structure sémantique
- **CSS3** : Animations, Grid, Flexbox, Container Queries
- **JavaScript (ES6+)** : Modules, Fetch API, DOM manipulation

### Fonctionnalités
- **i18n** : Système de traduction multilingue
- **GitHub API** : Intégration de l'activité en temps réel
- **GitHub Readme Activity Graph** : Visualisation des contributions

### Design
- **Typographies** : Punc (custom), Tektur, Orbitron, Monofett (Google Fonts)
- **Palette de couleurs** : `#231F20`, `#24FBC5`, `#090909`
- **Principe du Golden Ratio** : Espacements harmonieux

## 📁 Structure du projet

```
portfolio/
├── index.html              # Page principale
├── README.md               # Documentation
├── favicon_portfolio.ico   # Icône du site
├── css/                    # Feuilles de style
│   ├── style.css          # Styles principaux
│   ├── loader.css         # Écran de chargement
│   ├── aaa-contrast.css   # Mode contraste
│   ├── tech-easter-eggs.css   # Easter eggs
│   └── cover-letter-btn.css   # Style bouton lettre
├── js/                     # Scripts JavaScript
│   ├── nav.js             # Navigation et scroll
│   ├── projects.js        # Gestion des projets
│   ├── i18n.js            # Internationalisation
│   ├── contrast.js        # Mode contraste
│   ├── github.js          # Intégration GitHub
│   ├── github-graph-toggle.js # Bascule graphique
│   ├── animations.js      # Animations
│   ├── pattern-effect.js  # Effets géométriques
│   ├── tech-easter-eggs.js    # Easter eggs
│   ├── cover-letter-btn.js    # Génération lettre
│   └── loader.js          # Écran de chargement
├── assets/                 # Ressources statiques
│   ├── fonts/             # Polices personnalisées
│   │   ├── punc-bold.woff2
│   │   └── punc-regular.woff2
│   ├── images/            # Images des projets
│   │   ├── astdx2.png
│   │   ├── campain.png
│   │   ├── horus.png
│   │   ├── museorium.png
│   │   ├── nuit-info.png
│   │   ├── orbis.png
│   │   ├── restaure.png
│   │   ├── street-dreams.png
│   │   └── web-inventory.png
│   └── documents/         # Documents téléchargeables
│       └── cv_raphel_madore_2026.pdf
└── data/                   # Données JSON
    ├── projects.json      # Données des projets
    └── translations.json  # Traductions FR/EN
```

## 🚀 Installation & Utilisation

### Prérequis
Aucun prérequis nécessaire, le site fonctionne avec des fichiers statiques.

### Lancement local

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/JomeiYouma/portfolio.git
   cd portfolio
   ```

2. **Ouvrir le fichier**
   - Double-cliquer sur `index.html`, ou
   - Utiliser un serveur local (recommandé pour éviter les problèmes CORS) :
   ```bash
   # Avec Python 3
   python -m http.server 8000
   
   # Avec Node.js (http-server)
   npx http-server
   ```

3. **Accéder au site**
   Ouvrir `http://localhost:8000` dans votre navigateur

## 🌐 Déploiement

Le site est compatible avec :
- **GitHub Pages**
- **Netlify**
- **Vercel**
- Tout hébergeur de fichiers statiques

### Déploiement GitHub Pages

1. Pusher le code sur GitHub
2. Aller dans Settings > Pages
3. Sélectionner la branche `main` et le dossier `/root`
4. Le site sera accessible à `https://username.github.io/portfolio`

## 📱 Compatibilité

- ✅ Chrome/Edge (recommandé)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile (iOS/Android)

## 🎨 Crédits

### Polices
- **Punc** : Police personnalisée
- **Tektur** : [Google Fonts](https://fonts.google.com/specimen/Tektur)
- **Orbitron** : [Google Fonts](https://fonts.google.com/specimen/Orbitron)
- **Monofett** : [Google Fonts](https://fonts.google.com/specimen/Monofett)

### APIs & Services
- [GitHub REST API](https://docs.github.com/en/rest)
- [GitHub Readme Activity Graph](https://github.com/Ashutosh00710/github-readme-activity-graph)

## 📄 Licence

Ce projet est un portfolio personnel. Le code est disponible pour référence éducative.

## 👤 Auteur

**Raphaël Madoré** (Youma)
- LinkedIn : [raphaël-madoré](https://www.linkedin.com/in/raphaël-madoré/)
- GitHub : [@JomeiYouma](https://github.com/JomeiYouma)
- Email : raphael.madore.pro@mailo.com

---

*Built with passion & code // 2025*
