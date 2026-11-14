# TizenTube – TV Samsung de Pradeep

Contexte pour Claude : historique et fonctionnement de ma version personnalisée de TizenTube. Je suis débutant sur GitHub : guide-moi pas à pas, dans le navigateur, sans terminal si possible.

## Matériel et logiciel
- TV : Samsung **QE65Q67RATXXC** (Q60 series, **2019**, Tizen).
- **TizenBrew** (lanceur maison) → module **TizenTube** (YouTube sans pub).
- La version standalone de TizenTube ne fonctionne pas sur cette TV.
- Mode développeur TV : IP hôte = `127.0.0.1` (nécessaire à TizenBrew, ne pas changer).

## Problème d'origine (résolu le 14/11/2026)
Après extinction/rallumage de la TV, la vidéo YouTube restait **figée** (l'interface répondait, mais aucune vidéo ne se lisait). Seul un quitter/relancer TizenTube réglait le problème.

Ce qui n'a PAS marché :
- Samsung Instant On : introuvable dans les menus (modèle 2019).
- Désactiver « relancer la dernière appli » (Paramètres → Général → Fonction smart) : vidéo toujours figée.
- Fermer l'appli via `tizen.application...exit()` : **`tizen is not defined`** dans la page YouTube (API Tizen indisponible pour les modules).
- Rechargement seulement après 30 s de veille : la TV envoie bien `visibilitychange`, mais le délai n'était pas atteint.

Solution qui marche (**fix4**) : fichier `mods/features/resumeFix.js`
- TV éteinte (`document.hidden`) → pause + libération du lecteur vidéo (`removeAttribute('src')` + `load()`).
- TV rallumée (visible après > 2 s) → `location.reload()`.
- Secours : vidéo en lecture qui n'avance plus pendant 10 s → reload (max 2 / 5 min).
- Diagnostic : encadré « Correctif actif (fix4) » 8 s au démarrage, avec les 6 derniers événements (stockés dans `localStorage` clé `ttFixLog`).

## Mon dépôt GitHub
- Fork : **https://github.com/GitPradeepDev/TizenTube** (de `reisxd/TizenTube`).
- Modifs : `mods/features/resumeFix.js` + ligne `import "./features/resumeFix.js";` à la fin de `mods/userScript.js`.
- `.github/workflows/build-dist.yml` : à chaque push sur `main`, compile `mods` et `service` et commit `dist/` (TizenBrew lit `dist/` depuis GitHub via jsDelivr ; `dist/` est dans `.gitignore`, d'où `git add -f`).
- `.github/workflows/auto-update.yml` : chaque lundi ~5 h (et bouton *Run workflow*), fusionne les nouveautés de `reisxd/TizenTube`, recompile, publie un tag **`1.0.x`** (1.0.0 créé le 14/11/2026).
- Anciens tags de test : `fix2`, `fix3`, `fix4`.

## Sur la TV
- Module installé : **`GitPradeepDev/TizenTube@1`** (type GitHub) → suit automatiquement le dernier tag `1.0.x`.
- AutoLaunch TizenBrew = ce module. « Relancer la dernière appli » activé dans Fonction smart.
- Le titre affiché est toujours `TizenTube (1.15.2)` (vient du package.json), quel que soit le tag.

## Astuces TizenBrew (télécommande sans boutons de couleur)
- Rester sur le menu TizenBrew (bloquer AutoLaunch) : appuyer plusieurs fois sur **flèche ↑** pendant le chargement.
- Menus : icônes en haut à droite → 🏠 accueil, ⚙️ paramètres (AutoLaunch), 📦 gestionnaire de modules, ❓ à propos.
- Ajouter un module GitHub : 📦 → Ajouter un Module → Ajouter un Module GitHub → taper `user/repo[@tag]` (sans `gh/`) → fermer le clavier (Terminé ou Retour) = validation.
- « Unknown Module () » = nom introuvable (faute de frappe ou cache).
- « Service déjà lancé » : message normal.
- Après une mise à jour : **redémarrage complet** de la TV (Power maintenu jusqu'au logo Samsung), sinon TizenBrew garde l'ancienne version en mémoire.

## Pièges connus
- **Cache jsDelivr** : `cdn.jsdelivr.net/gh/GitPradeepDev/TizenTube/...` (sans version) peut servir une vieille copie pendant des heures → toujours passer par un tag. Vérifier une version : ouvrir `https://cdn.jsdelivr.net/gh/GitPradeepDev/TizenTube@1/dist/userScript.js` et chercher un mot du code (ex. `fix4`).
- Purge manuelle : `https://purge.jsdelivr.net/gh/GitPradeepDev/TizenTube@1/dist/userScript.js`.
- Si l'auto-update échoue (e-mail GitHub « Run failed ») : conflit entre une mise à jour officielle et mon correctif → la TV garde la version précédente ; il faut résoudre le conflit.
- Si GitHub désactive la tâche planifiée (60 jours sans activité) : onglet Actions → *Enable workflow*.
- Le workflow officiel `build-release.yaml` ne se déclenche que sur les tags `v*.*.*` → ne pas créer de tags avec `v`.

## Si ça recasse : infos à donner à Claude
1. Ce qui se passe exactement (vidéo figée ? écran noir ? pubs revenues ? erreur ?).
2. Photo de l'encadré de diagnostic au démarrage de TizenTube.
3. Dernier tag sur `github.com/GitPradeepDev/TizenTube/tags` et état de l'onglet Actions.
