document.addEventListener('DOMContentLoaded', () => {
      const statusEl = document.getElementById('status');

      async function api(path, opts) {
        const res = await fetch(path, opts);
        if (res.status === 404) throw new Error('Not Found');
        const text = await res.text();
        try { return { ok: res.ok, status: res.status, data: text ? JSON.parse(text) : null }; }
        catch { throw new Error('Invalid JSON from server'); }
      }

      async function loadAddresses() {
        statusEl.textContent = 'lade…';
        try {
          const r = await api('/api/addresses');
          if (!r.ok) throw new Error('Fehler: ' + r.status);
          renderList(r.data || {});
          statusEl.textContent = 'bereit';
        } catch (e) {
          statusEl.textContent = 'Fehler';
          alert('Fehler beim Laden: ' + e.message);
        }
      }

      function renderList(data) {
        const ul = document.getElementById('list');
        ul.innerHTML = '';
        const keys = Object.keys(data).sort((a,b) => a.localeCompare(b));
        if (keys.length === 0) {
          ul.innerHTML = '<li class="meta">Keine Einträge</li>';
          return;
        }
        for (const key of keys) {
          const item = data[key];
          const li = document.createElement('li');
          const left = document.createElement('div');
          const fullname = `${escapeHtml(item.firstname)} ${escapeHtml(item.name)}`;
          const addrLines = [];
          if (item.street) addrLines.push(escapeHtml(item.street) + (item.street_nr ? ' ' + escapeHtml(item.street_nr) : ''));
          if (item.plz || item.city) addrLines.push((item.plz?escapeHtml(item.plz)+' ':'') + (item.city?escapeHtml(item.city):''));
          const contact = [];
          if (item.phone) contact.push('Tel: ' + escapeHtml(item.phone));
          if (item.mobile) contact.push('Mobil: ' + escapeHtml(item.mobile));
          if (item.email) contact.push('Email: ' + escapeHtml(item.email));
          if (item.whatsapp) contact.push('Whatsapp: ' + escapeHtml(item.whatsapp));
          if (item.internet) contact.push('Web: ' + escapeHtml(item.internet));
          left.innerHTML = `<strong>${fullname}</strong><div class="meta">${addrLines.join('<br>')}${contact.length?'<br>'+contact.join(' · '):''}</div>`;
          const actions = document.createElement('div');
          actions.className = 'actions';
          const edit = document.createElement('button');
          edit.textContent = 'Bearbeiten';
          edit.onclick = () => {
            openEditModal(key, item);
          };
          const del = document.createElement('button');
          del.textContent = 'Löschen';
          del.onclick = () => {
            if (confirm('Eintrag löschen?')) deleteAddress(key);
          };
          actions.appendChild(edit);
          actions.appendChild(del);
          li.appendChild(left);
          li.appendChild(actions);
          ul.appendChild(li);
        }
      }

      function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

      async function addAddress(obj) {
        try {
          const r = await api('/api/addresses', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(obj)
          });
          if (r.ok) loadAddresses(); else alert('Fehler: ' + r.status);
        } catch (e) { alert('Fehler beim Hinzufügen: ' + e.message); }
      }

      async function updateAddress(key, obj) {
        try {
          const r = await api('/api/addresses/' + encodeURIComponent(key), {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify(obj)
          });
          if (r.ok) loadAddresses(); else alert('Fehler: ' + r.status);
        } catch (e) { alert('Fehler beim Aktualisieren: ' + e.message); }
      }

      async function deleteAddress(key) {
        try {
          const r = await api('/api/addresses/' + encodeURIComponent(key), { method: 'DELETE' });
          if (r.ok) loadAddresses(); else alert('Fehler: ' + r.status);
        } catch (e) { alert('Fehler beim Löschen: ' + e.message); }
      }

      // Modal öffnen: zeigt alle Felder in Input-Feldern (voreingestellt), erlaubt Teiländerungen
      function openEditModal(key, item) {
        // backdrop
        const backdrop = document.createElement('div');
        backdrop.className = 'ab-modal-backdrop';
        backdrop.tabIndex = -1;

        const modal = document.createElement('div');
        modal.className = 'ab-modal';

        modal.innerHTML = `
          <h2>Eintrag bearbeiten</h2>
          <div class="ab-meta">Schlüssel: ${escapeHtml(key)}</div>
        `;

        const fields = ['firstname','name','street','street_nr','plz','city','phone','mobile','email','whatsapp','internet'];
        const inputs = {};

        for (const f of fields) {
          const row = document.createElement('div');
          row.className = 'row';
          const input = document.createElement('input');
          input.name = f;
          input.placeholder = f;
          input.value = item[f] || '';
          if ((f === 'firstname' || f === 'name' || f === 'street' || f === 'plz' || f === 'city' || f === 'street_nr')) {
            // mark required visually
            input.style.borderColor = '#999';
          }
          inputs[f] = input;
          row.appendChild(input);
          modal.appendChild(row);
        }

        const actions = document.createElement('div');
        actions.className = 'actions';
        const cancelBtn = document.createElement('button');
        cancelBtn.textContent = 'Abbrechen';
        cancelBtn.type = 'button';
        cancelBtn.onclick = () => { document.body.removeChild(backdrop); };
        const saveBtn = document.createElement('button');
        saveBtn.textContent = 'Speichern';
        saveBtn.type = 'button';
        saveBtn.onclick = async () => {
          // validate required
          const obj = {};
          for (const f of fields) obj[f] = inputs[f].value.trim();
          if (!obj.firstname || !obj.name || !obj.street || !obj.street_nr || !obj.plz || !obj.city) {
            alert('Bitte Vorname, Name, Straße, Nr., PLZ und Ort ausfüllen.');
            return;
          }
          // wenn Vorname/Name geändert -> neuer key; server speichert unter übergebenem key
          // wir senden die ganzen Felder (API erwartet alle wichtigen Felder)
          await updateAddress(key, obj);
          document.body.removeChild(backdrop);
        };
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        modal.appendChild(actions);

        backdrop.appendChild(modal);
        backdrop.onclick = (e) => { if (e.target === backdrop) document.body.removeChild(backdrop); };
        document.body.appendChild(backdrop);

        // focus erstes Feld
        inputs.firstname.focus();
      }

      document.getElementById('addForm').addEventListener('submit', e => {
        e.preventDefault();
        const f = e.target;
        const obj = {
          firstname: f.firstname.value.trim(),
          name: f.name.value.trim(),
          street: f.street.value.trim(),
          street_nr: f.street_nr.value.trim(),
          plz: f.plz.value.trim(),
          city: f.city.value.trim(),
          phone: f.phone.value.trim(),
          mobile: f.mobile.value.trim(),
          email: f.email.value.trim(),
          whatsapp: f.whatsapp.value.trim(),
          internet: f.internet.value.trim()
        };
        if (!obj.firstname || !obj.name || !obj.street || !obj.street_nr || !obj.plz || !obj.city) {
          alert('Bitte Vorname, Name, Straße, Nr., PLZ und Ort ausfüllen.');
          return;
        }
        addAddress(obj);
        f.reset();
      });
 
      loadAddresses();

      window.loadAddresses = loadAddresses;
    });