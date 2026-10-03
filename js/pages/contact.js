window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-B4KTYY907V');

/* Posts the form to a Google Apps Script endpoint which emails the league.
   No address appears anywhere in this page's source. */
const form = document.getElementById('contact-form');
const note = document.getElementById('form-note');
const btn  = form.querySelector('button[type=submit]');

form.addEventListener('submit', async e => {
  e.preventDefault();
  const cfg = await config();
  const v = n => (form.elements[n]?.value || '').trim();
  const payload = { name:v('name'), email:v('email'), team:v('team'),
                    topic:v('topic'), message:v('message'), hp:v('hp') };

  if (!cfg.contact_endpoint) {
    note.textContent = 'The contact form is not connected yet. Please try again later.';
    note.className = 'form__note form__note--err';
    return;
  }

  btn.disabled = true;
  note.className = 'form__note';
  note.textContent = 'Sending…';
  try {
    await fetch(cfg.contact_endpoint, {
      method: 'POST',
      mode: 'no-cors',                       // Apps Script sends no CORS headers
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload)
    });
    form.reset();
    note.textContent = 'Thanks — your message has been sent.';
    note.className = 'form__note form__note--ok';
  } catch (err) {
    note.textContent = 'Something went wrong sending that. Please try again.';
    note.className = 'form__note form__note--err';
  } finally {
    btn.disabled = false;
  }
});

const subForm = document.getElementById('sub-form');
const subNote = document.getElementById('sub-note');
subForm.addEventListener('submit', async e => {
  e.preventDefault();
  const cfg = await config();
  const v = n => (subForm.elements[n]?.value || '').trim();
  if (!cfg.subscribe_endpoint) {
    subNote.textContent = 'Sign-up is not connected yet. Please try again later.';
    subNote.className = 'form__note form__note--err';
    return;
  }
  const btn = subForm.querySelector('button[type=submit]');
  btn.disabled = true; subNote.className = 'form__note'; subNote.textContent = 'Signing you up…';
  try {
    await fetch(cfg.subscribe_endpoint, {
      method: 'POST', mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ name: v('name'), email: v('email'), team: v('team'),
                             hp: v('hp'), consent: subForm.elements.consent.checked })
    });
    subForm.reset();
    subNote.textContent = "You're on the list. See you Sunday.";
    subNote.className = 'form__note form__note--ok';
  } catch (err) {
    subNote.textContent = 'Something went wrong. Please try again.';
    subNote.className = 'form__note form__note--err';
  } finally { btn.disabled = false; }
});
