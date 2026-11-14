/**
 * TaTonTicket — formulaire de contact du site vitrine (Google Apps Script).
 *
 * À installer dans un projet Apps Script SÉPARÉ, sur le compte support.tatonticket@gmail.com.
 * Ne pas l'ajouter au projet « TaTonTicket support » : ce formulaire doit être déployé avec
 * l'accès « Tout le monde », ce qui rendrait publique la page de suivi de l'autre projet.
 *
 * Reçoit les envois du formulaire (POST) et les transmet par e-mail à la boîte du compte,
 * sous le libellé « Site/Contact ». Aucune réponse automatique n'est envoyée au visiteur,
 * pour que le formulaire ne puisse pas servir à envoyer des e-mails à n'importe qui.
 */

const LIBELLE = 'Site/Contact';
const PREFIXE_OBJET = '[Site]';
const SUJETS = ['Question', 'Être prévenu du lancement', 'Suggestion', 'Partenariat', 'Autre'];
const MAX = { nom: 100, email: 200, metier: 100, message: 5000 };
const DELAI_MIN_MS = 3000;          // envoi plus rapide que 3 s après l'affichage : robot
const LIMITE_GLOBALE = 30;          // envois maximum par heure, tous visiteurs confondus
const LIMITE_PAR_EMAIL = 3;         // envois maximum par heure pour une même adresse

function doPost(e) {
  try {
    const p = (e && e.parameter) || {};

    // Pièges à robots : champ caché rempli, ou formulaire envoyé trop vite.
    if (p.site_web) return repondre(true);
    const affiche = Number(p.t || 0);
    if (!affiche || Date.now() - affiche < DELAI_MIN_MS) return repondre(true);

    const nom = nettoyer(p.nom, MAX.nom);
    const email = nettoyer(p.email, MAX.email).toLowerCase();
    const metier = nettoyer(p.metier, MAX.metier);
    const message = nettoyer(p.message, MAX.message, true);
    const sujet = SUJETS.indexOf(p.sujet) >= 0 ? p.sujet : 'Autre';

    if (!nom || !message || !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return repondre(false, 'champs');
    }
    if (!sousLaLimite('global', LIMITE_GLOBALE) || !sousLaLimite('email:' + email, LIMITE_PAR_EMAIL)) {
      return repondre(false, 'limite');
    }

    const destinataire = Session.getEffectiveUser().getEmail();
    const objet = PREFIXE_OBJET + ' ' + sujet + ' – ' + nom;
    const corps = [
      'Message reçu depuis le formulaire du site TaTonTicket.',
      '',
      'Nom : ' + nom,
      'E-mail : ' + email,
      'Métier : ' + (metier || 'non précisé'),
      'Sujet : ' + sujet,
      '',
      message,
      '',
      '— Répondre à ce message écrit directement au visiteur.'
    ].join('\n');

    GmailApp.sendEmail(destinataire, objet, corps, { replyTo: email, name: 'Formulaire TaTonTicket' });
    ranger(objet);
    return repondre(true);
  } catch (err) {
    console.error(err);
    return repondre(false, 'erreur');
  }
}

/** Page affichée si l'on ouvre l'URL du script dans un navigateur. */
function doGet() {
  return ContentService.createTextOutput('Formulaire de contact TaTonTicket : utilisez le site.');
}

function nettoyer(valeur, max, multiligne) {
  let s = String(valeur || '').slice(0, max);
  s = multiligne ? s.replace(/\r\n?/g, '\n') : s.replace(/[\r\n]+/g, ' ');
  return s.trim();
}

function sousLaLimite(cle, max) {
  const cache = CacheService.getScriptCache();
  const verrou = LockService.getScriptLock();
  verrou.waitLock(5000);
  try {
    const n = Number(cache.get(cle) || 0);
    if (n >= max) return false;
    cache.put(cle, String(n + 1), 3600);
    return true;
  } finally {
    verrou.releaseLock();
  }
}

/** Range le message envoyé sous le libellé du site (au mieux : Gmail peut mettre un instant à l'indexer). */
function ranger(objet) {
  const libelle = GmailApp.getUserLabelByName(LIBELLE) || GmailApp.createLabel(LIBELLE);
  for (let essai = 0; essai < 3; essai++) {
    Utilities.sleep(1500);
    const fils = GmailApp.search('subject:"' + objet.replace(/"/g, '') + '" newer_than:1d', 0, 1);
    if (fils.length) {
      fils[0].addLabel(libelle);
      return;
    }
  }
}

function repondre(ok, raison) {
  return ContentService
    .createTextOutput(JSON.stringify(ok ? { ok: true } : { ok: false, raison: raison }))
    .setMimeType(ContentService.MimeType.JSON);
}

/** À lancer une fois depuis l'éditeur : demande les autorisations et envoie un message de test. */
function tester() {
  const r = doPost({ parameter: {
    nom: 'Test formulaire', email: Session.getEffectiveUser().getEmail(), sujet: 'Question',
    metier: 'Test', message: 'Message de test envoyé depuis l\'éditeur Apps Script.',
    t: String(Date.now() - 10000)
  }});
  console.log(r.getContent());
}
