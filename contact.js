// Formulaire de contact : envoi au script Google (data-endpoint), ou à défaut ouverture de l'application e-mail.
(function () {
  'use strict';
  var form = document.getElementById('formulaire-contact');
  if (!form) return;

  var etat = form.querySelector('.etat-form');
  var bouton = form.querySelector('button[type="submit"]');
  var endpoint = (form.getAttribute('data-endpoint') || '').trim();
  var courriel = form.getAttribute('data-courriel');
  form.elements.t.value = String(Date.now());

  function afficher(texte, type) {
    etat.textContent = texte;
    etat.className = 'etat-form' + (type ? ' ' + type : '');
  }

  function verifier() {
    var erreurs = [];
    [['nom', 'votre nom'], ['email', 'votre adresse e-mail'], ['message', 'votre message']].forEach(function (c) {
      var champ = form.elements[c[0]];
      var vide = !champ.value.trim();
      var invalide = c[0] === 'email' && !vide && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(champ.value.trim());
      champ.setAttribute('aria-invalid', vide || invalide ? 'true' : 'false');
      if (vide) erreurs.push('indiquez ' + c[1]);
      else if (invalide) erreurs.push('vérifiez votre adresse e-mail');
    });
    return erreurs;
  }

  function parEmail() {
    var f = form.elements;
    var corps = f.message.value.trim() + '\n\n— ' + f.nom.value.trim() +
      (f.metier.value.trim() ? ' (' + f.metier.value.trim() + ')' : '');
    window.location.href = 'mailto:' + courriel +
      '?subject=' + encodeURIComponent('[Site] ' + f.sujet.value + ' – ' + f.nom.value.trim()) +
      '&body=' + encodeURIComponent(corps);
    afficher('Votre application e-mail va s\'ouvrir avec le message prérempli : il ne reste qu\'à l\'envoyer.', 'ok');
  }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var erreurs = verifier();
    if (erreurs.length) {
      afficher('Pour envoyer : ' + erreurs.join(', ') + '.', 'erreur');
      form.querySelector('[aria-invalid="true"]').focus();
      return;
    }
    if (!endpoint) { parEmail(); return; }

    bouton.disabled = true;
    afficher('Envoi en cours…');
    fetch(endpoint, { method: 'POST', body: new URLSearchParams(new FormData(form)) })
      .then(function (r) { return r.json(); })
      .then(function (rep) {
        if (rep.ok) {
          form.reset();
          form.elements.t.value = String(Date.now());
          afficher('Merci, votre message est bien envoyé. Nous vous répondrons par e-mail.', 'ok');
        } else if (rep.raison === 'limite') {
          afficher('Trop de messages envoyés pour le moment : réessayez dans une heure, ou écrivez-nous directement par e-mail.', 'erreur');
        } else {
          afficher('Le message n\'a pas pu être envoyé : vérifiez les champs, ou écrivez-nous directement par e-mail.', 'erreur');
        }
      })
      .catch(function () {
        afficher('Le message n\'a pas pu être envoyé : vérifiez votre connexion, ou écrivez-nous directement par e-mail.', 'erreur');
      })
      .then(function () { bouton.disabled = false; });
  });
})();
