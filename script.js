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
        const names = Object.keys(data).sort((a,b) => a.localeCompare(b));
        if (names.length === 0) {
          ul.innerHTML = '<li class="meta">Keine Einträge</li>';
          return;
        }
        for (const name of names) {
          const li = document.createElement('li');
          const left = document.createElement('div');
          left.innerHTML = `<strong>${escapeHtml(name)}</strong><div class="meta">${escapeHtml(data[name])}</div>`;
          const actions = document.createElement('div');
          actions.className = 'actions';
          const edit = document.createElement('button');
          edit.textContent = 'Bearbeiten';
          edit.onclick = () => {
            const newAddr = prompt('Neue Adresse für ' + name, data[name]);
            if (newAddr !== null) updateAddress(name, newAddr.trim());
          };
          const del = document.createElement('button');
          del.textContent = 'Löschen';
          del.onclick = () => {
            if (confirm('Eintrag löschen?')) deleteAddress(name);
          };
          actions.appendChild(edit);
          actions.appendChild(del);
          li.appendChild(left);
          li.appendChild(actions);
          ul.appendChild(li);
        }
      }

      function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

      async function addAddress(name, address) {
        try {
          const r = await api('/api/addresses', {
            method: 'POST',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({name, address})
          });
          if (r.ok) loadAddresses(); else alert('Fehler: ' + r.status);
        } catch (e) { alert('Fehler beim Hinzufügen: ' + e.message); }
      }

      async function updateAddress(name, address) {
        try {
          const r = await api('/api/addresses/' + encodeURIComponent(name), {
            method: 'PUT',
            headers: {'Content-Type':'application/json'},
            body: JSON.stringify({address})
          });
          if (r.ok) loadAddresses(); else alert('Fehler: ' + r.status);
        } catch (e) { alert('Fehler beim Aktualisieren: ' + e.message); }
      }

      async function deleteAddress(name) {
        try {
          const r = await api('/api/addresses/' + encodeURIComponent(name), { method: 'DELETE' });
          if (r.ok) loadAddresses(); else alert('Fehler: ' + r.status);
        } catch (e) { alert('Fehler beim Löschen: ' + e.message); }
      }

      document.getElementById('addForm').addEventListener('submit', e => {
        e.preventDefault();
        const f = e.target;
        const name = f.name.value.trim();
        const address = f.address.value.trim();
        if (!name || !address) return;
        addAddress(name, address);
        f.reset();
      });
 
      loadAddresses();

      window.loadAddresses = loadAddresses;
    });