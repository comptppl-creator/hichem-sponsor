# HICHAM SPONSORING — Tracking & dashboard privé

## 1. Fichiers

| Fichier | Statut |
|---|---|
| `index.html` | **Modifié** : +2 balises `<script defer>` dans `<head>` ; correction de la faute `document.document.documentElement` (elle faisait planter le bouton العربية). Rien d'autre (contenu, design, liens, ids identiques — vérifié par comparaison). |
| `assets/tracking-config.js` | Nouveau — **les identifiants à compléter** (IDs pixels déjà remplis). |
| `assets/tracking.js` | Nouveau — consentement, Meta Pixel, ChatGPT Ads Pixel, GA4, stats first-party. |
| `admin/index.html` | Nouveau — dashboard privé (connexion obligatoire). |
| `firestore.rules` | Nouveau — règles à publier dans Firebase. |

## 2. Identifiants encore nécessaires

1. **GA4 Measurement ID** (`G-XXXXXXXXXX`) → `ga4.measurementId`. Sans lui, GA4 reste désactivé (rien n'est inventé).
2. **Config Web Firebase** (`apiKey`, `authDomain`, `projectId`, `appId`) → section `firebase`. Ce n'est pas un secret : la protection vient des règles Firestore.
3. **UID de votre compte admin** → à coller dans `firestore.rules` (`isAdmin()`).
4. TikTok : volontairement non installé.

## 3. Configurer Firebase (plan gratuit Spark, sans backend)

> **Utilisez un projet Firebase séparé de votre CRM.** Les règles ci-jointes autorisent l'écriture publique (limitée) dans `events` ; ne mélangez pas cela avec vos données financières. Si vous réutilisez quand même un projet existant, **fusionnez** les règles : publier ce fichier remplacerait les règles actuelles.

1. console.firebase.google.com → créer le projet → ajouter une app **Web** → copier la config dans `tracking-config.js`.
2. **Authentication** → Méthode de connexion → activer **E-mail/Mot de passe** → créer votre utilisateur. Copiez son **UID**.
3. **Authentication → Paramètres → Domaines autorisés** : ajouter `votrecompte.github.io`.
4. **Firestore Database** → créer (mode production) → onglet **Règles** → coller `firestore.rules` avec votre UID → Publier.
5. Google Cloud Console → Identifiants → clé API du navigateur → **Restrictions d'application : référents HTTP** (`https://votrecompte.github.io/*`) et restreindre aux API *Cloud Firestore* et *Identity Toolkit*.
6. Facultatif : alerte de budget/quota dans Firebase.

## 4. Activer Google Analytics 4

analytics.google.com → Admin → Créer une propriété → Flux de données **Web** → copier l'ID `G-…` dans `ga4.measurementId`. Puis Admin → Événements → marquer `WhatsApp_Click` et `Phone_Click` comme **événements clés** (après leur première réception).

## 5. Accéder au dashboard

`https://votrecompte.github.io/<repo>/admin/` → connexion e-mail/mot de passe. Si l'écran « Accès refusé » apparaît, il affiche votre UID : ajoutez-le dans `isAdmin()` et republiez les règles.
Le dossier `/admin/` est séparé du site public, en `noindex`, mais **son URL reste publique** : la vraie protection = Firebase Auth + règles Firestore (sans compte admin, aucune donnée n'est lisible).

**Exclure vos propres visites :** ouvrez le site une fois avec `?notrack=1` (annuler : `?notrack=0`).

## 6. Publier sur GitHub Pages

1. Copiez le contenu du dossier `site/` à la racine de votre dépôt (remplace `index.html`, ajoute `assets/`, `admin/`, `firestore.rules`, `SETUP.md`).
2. `git add . && git commit -m "Tracking + dashboard" && git push`
3. Settings → Pages → branche `main` / racine → patienter 1–2 min.

## 7. Marquer vos publicités (indispensable pour la précision)

- Meta Ads (paramètres d'URL) : `utm_source={{site_source_name}}&utm_medium=paid_social&utm_campaign={{campaign.name}}&utm_content={{ad.name}}`
  (`fb` → Facebook, `ig` → Instagram, `an`/`msg` → Facebook.)
- TikTok Ads : `utm_source=tiktok&utm_medium=paid_social&utm_campaign=__CAMPAIGN_NAME__`
- ChatGPT Ads : OpenAI ajoute `oppref` ; le site le reconnaît comme source ChatGPT. Ajoutez aussi vos UTM si possible.

## 8. Ce qui est suivi, et par qui

| Événement | Meta | ChatGPT Ads | GA4 | Firestore |
|---|---|---|---|---|
| Page vue | `PageView` | `page_viewed` | `page_view` (auto) | `page_view` |
| WhatsApp | `WhatsApp_Click` + `Contact` | `lead_created` | `WhatsApp_Click` | `whatsapp_click` |
| Téléphone | `Phone_Click` + `Contact` | `lead_created` | `Phone_Click` | `phone_click` |
| Maps | `Maps_Click` | `custom` (`maps_click`) | `Maps_Click` | `maps_click` |

Anti-doublon : 1 envoi par clic et par plateforme (filtre 1,5 s) ; `Contact` (standard Meta) n'est ajouté que pour WhatsApp/téléphone. Le KPI « Contact » du dashboard = visiteurs ayant cliqué WhatsApp ou téléphone.
Consentement : **Statistiques** (GA4 + Firestore) et **Publicité** (Meta + ChatGPT) sont deux choix séparés ; rien n'est chargé ni stocké avant le choix ; lien « Gérer les cookies » dans le pied de page.

## 9. Tests à faire (après publication)

1. **Avant consentement** : onglet Réseau → aucune requête vers `facebook`, `openai`, `googletagmanager`, `firestore`. Stockage local vide.
2. **Refuser tout** → recharger : toujours rien d'envoyé.
3. **Accepter tout** → Meta : extension *Meta Pixel Helper* (PageView) ; Events Manager → *Tester les événements*.
4. ChatGPT Ads : Ads Manager → Conversions → événements récents (le pixel est en `debug:true` : logs dans la console).
5. GA4 : Rapports → Temps réel, puis DebugView.
6. Cliquer : bouton WhatsApp (haut, héros, bandeau, flottant), le numéro, Google Maps (×2) → chaque clic = 1 événement, visible dans le dashboard.
7. Provenance : ouvrir `…/?utm_source=ig&utm_medium=paid&utm_campaign=test` puis `…/?utm_source=google` : première source = Instagram, dernière = Google.
8. Sécurité : en navigation privée, sur `/admin/` → pas de données sans connexion ; dans la console : tentative de lecture/modification/suppression de `events` → refusée.
9. Site : bascule FR/العربية, bouton Copier le CCP, liens du menu.

## 10. Limites à connaître

- **Non testé en réel** : Firebase (écriture, règles, connexion), Meta, ChatGPT Ads et GA4 réels. J'ai testé le code dans un navigateur simulé avec des services simulés (voir « tests »), pas contre vos comptes. Utilisez *Règles → Simulateur* dans Firebase pour valider les règles.
- **Une écriture publique ne peut pas être « authentifiée »** : les règles valident forme, types, tailles et horodatage serveur, interdisent lecture/modification/suppression, mais n'empêchent pas un script malveillant d'ajouter de faux événements. Durcissement possible : Cloud Function ou Cloudflare Worker + Turnstile (hébergé hors GitHub Pages, Cloud Functions requiert le plan Blaze).
- **Géographie** : approximative (fuseau horaire/langue). Pour une vraie géolocalisation → GA4.
- **Volume** : le dashboard lit les événements bruts (limite 20 000 par période, 1 lecture Firestore par événement ; quota gratuit 50 000 lectures/jour). Au-delà, prévoir des agrégats serveur.
- **Visiteurs uniques** = navigateurs (identifiant aléatoire local), pas des personnes ; un refus de consentement = visiteur non compté.
- ChatGPT Ads : l'événement personnalisé `maps_click` suit le format de nom documenté ; les événements personnalisés ne peuvent pas servir d'objectif d'optimisation.
