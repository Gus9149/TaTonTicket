# Formulaire de contact (Google Apps Script)

Le site est statique : les envois du formulaire de contact sont reçus par ce petit script, qui tourne gratuitement sur le compte **support.tatonticket@gmail.com** et transmet chaque message par e-mail, sous le libellé **Site/Contact**.

Tant que l'adresse du script n'est pas renseignée dans `index.html`, le formulaire ouvre l'application e-mail du visiteur avec le message prérempli.

## Installation (une seule fois, environ 5 minutes)
1. Ouvrir [script.google.com](https://script.google.com) **connecté avec support.tatonticket@gmail.com**, puis **Nouveau projet**, nommé « TaTonTicket formulaire site ».
   - Projet **séparé** de « TaTonTicket support » : celui-ci sera ouvert à tout le monde, ce qui rendrait publique la page de suivi de l'autre.
2. Remplacer le contenu de `Code.gs` par celui de ce dossier, puis enregistrer.
3. Choisir la fonction **`tester`** et cliquer sur **Exécuter**. Google demande d'autoriser l'accès à Gmail (écran « application non validée » : *Paramètres avancés → Accéder au projet*, normal pour un script personnel). Un e-mail « [Site] Question – Test formulaire » arrive dans la boîte.
4. **Déployer → Nouveau déploiement** → ⚙️ type **Application Web** :
   - Description : « Formulaire site »
   - Exécuter en tant que : **Moi**
   - Qui a accès : **Tout le monde**
5. **Déployer**, puis copier l'**URL de l'application Web** (elle se termine par `/exec`).
6. Coller cette URL dans `index.html`, attribut `data-endpoint` du formulaire (`<form id="formulaire-contact" … data-endpoint="">`), puis publier le site.

Après une modification du code : Déployer → **Gérer les déploiements** → ✏️ → Version : **Nouvelle version** → Déployer (l'URL ne change pas).

## Protection contre les abus
- Champ caché piège à robots, et refus des envois faits moins de 3 secondes après l'affichage.
- Au plus 30 messages par heure au total, et 3 par heure pour une même adresse e-mail.
- **Aucune réponse automatique** au visiteur : le formulaire ne peut pas servir à envoyer des e-mails à des tiers.
- Les messages commencent par `[Site]` : le script de signalements (`[TaTonTicket]`) ne les traite pas.

## Limites
- ~100 e-mails envoyés par jour (compte Gmail gratuit), largement suffisant.
- Les erreurs éventuelles sont visibles dans Apps Script → *Exécutions*.
