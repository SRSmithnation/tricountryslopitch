config().then(cfg => {
  const form = document.getElementById('pw-form');
  const note = document.getElementById('pw-note');
  const btn = document.getElementById('pw-send');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    if (document.getElementById('pw-hp').value) return;
    const name = document.getElementById('pw-name').value.trim();
    const email = document.getElementById('pw-email').value.trim();
    if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      note.textContent = 'Please add your name and a valid email address.';
      note.className = 'form__note form__note--err';
      return;
    }
    if (!cfg.contact_endpoint) {
      note.textContent = 'Sending is not set up yet. Please try the contact page.';
      note.className = 'form__note form__note--err';
      return;
    }
    btn.disabled = true;
    note.textContent = 'Sending…';
    note.className = 'form__note';
    const payload = {
      name, email,
      subject: 'Players wanted: ' + document.getElementById('pw-kind').value,
      message: document.getElementById('pw-msg').value.trim() || '(no message)',
      source: 'players-wanted'
    };
    try {
      await fetch(cfg.contact_endpoint, {
        method: 'POST', mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(payload)
      });
      form.reset();
      note.textContent = 'Thanks. We will be in touch about the coming season.';
      note.className = 'form__note form__note--ok';
    } catch (err) {
      note.textContent = 'Something went wrong sending that. Please try again.';
      note.className = 'form__note form__note--err';
    } finally {
      btn.disabled = false;
    }
  });
});
