/* HICHAM SPONSORING — configuration du tracking.
   Ce fichier est PUBLIC : n'y mettez jamais de clé secrète, de service account ni de token admin.
   (La config Web Firebase ci-dessous n'est pas un secret : la sécurité repose sur les règles Firestore.) */
window.HS_CONFIG = {
  consentRequired: true,            // true = aucun traceur avant consentement

  meta:   { pixelId: '1413903509783002' },
  openai: { pixelId: '8ub6kuvf8nNa4QtmTqarVJ', debug: true },   // debug:true = logs console (comme dans le code officiel fourni) ; passez à false en production
  // TikTok Pixel : volontairement NON installé pour le moment.

  // >>> GOOGLE ANALYTICS 4 : collez ici votre Measurement ID (format G-XXXXXXXXXX). Vide = GA4 désactivé.
  ga4: { measurementId: '' },

  // >>> FIREBASE (stats first-party + dashboard) : valeurs de Paramètres du projet > Vos applications > Web.
  // Vide = aucune statistique first-party n'est enregistrée et le dashboard affiche un message de configuration.
  firebase: {
    apiKey: 'AIzaSyApjO4L33zja8By57EY7W1-6MT6tP35Nmg',
    authDomain: 'ads-site-vitrine.firebaseapp.com',
    projectId: 'ads-site-vitrine',
    appId: '1:523710351509:web:368253740105ddede8b39c'
  }
};
