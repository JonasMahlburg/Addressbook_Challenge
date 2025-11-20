let addressTable = null;
const requiredFields = ['firstname', 'name', 'street', 'street_nr', 'plz', 'city'];

document.addEventListener('DOMContentLoaded', initializeApp);

function initializeApp() {
    if (typeof Tabulator === 'undefined' || typeof XLSX === 'undefined') {
        console.error("Tabulator oder XLSX Library nicht geladen. Überprüfen Sie index.html.");
        return;
    }
    
    const statusEl = document.getElementById('status');
    
    async function api(path, opts) {
        const res = await fetch(path, opts);
        if (res.status === 404) throw new Error('Not Found');
        
        const text = await res.text();
        
        if (!text || text.trim() === '') {
            return { ok: res.ok, status: res.status, data: null };
        }
        
        try { 
            return { ok: res.ok, status: res.status, data: JSON.parse(text) }; 
        }
        catch (e) { 
            console.error('JSON Parse Error:', text);
            throw new Error('Invalid JSON from server'); 
        }
    }

    function escapeHtml(s){ return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }


    function initializeTable(data) {
        const tableContainer = document.getElementById('address-table');
        
        const tableData = Object.keys(data).map(key => ({
            key: key, 
            ...data[key]
        }));

        const columns = [
            {
                title: "Aktionen",
                width: 170,
                hozAlign: "center",
                frozen: true,
                formatter: function(cell, formatterParams, onRender){
                    const rowData = cell.getRow().getData();
                    const key = rowData.key;
                    
                    const container = document.createElement("div");

                    const editButton = document.createElement("button");
                    editButton.textContent = "✏️ Bearbeiten";
                    editButton.className = "tabulator-btn tabulator-edit-btn";
                    editButton.onclick = (e) => {
                        e.stopPropagation();
                        const item = {...rowData};
                        delete item.key;
                        openEditModal(key, item);
                    };
                    
                    const deleteButton = document.createElement("button");
                    deleteButton.textContent = "🗑️ Löschen";
                    deleteButton.className = "tabulator-btn tabulator-delete-btn";
                    deleteButton.style.marginLeft = '5px';
                    deleteButton.onclick = (e) => {
                        e.stopPropagation();
                        if (confirm(`Eintrag "${key}" wirklich löschen?`)) {
                            deleteAddress(key);
                        }
                    };
                    
                    container.appendChild(editButton);
                    container.appendChild(deleteButton);
                    return container;
                }
            },
            {title: "Vorname", field: "firstname", width: 150, headerFilter: "input"},
            {title: "Name", field: "name", width: 150, headerFilter: "input"},
            {title: "Straße", field: "street", width: 200, headerFilter: "input"},
            {title: "Nr.", field: "street_nr", width: 80, hozAlign: "center", headerFilter: "input"},
            {title: "PLZ", field: "plz", width: 100, headerFilter: "input"},
            {title: "Ort", field: "city", width: 150, headerFilter: "input"},
            {title: "Email", field: "email", width: 200, headerFilter: "input"},
            {title: "Telefon", field: "phone", width: 150, headerFilter: "input"},
            {title: "Mobile", field: "mobile", width: 150, headerFilter: "input"},
            {title: "WhatsApp", field: "whatsapp", width: 150, headerFilter: "input"},
            {title: "Web", field: "internet", width: 150, headerFilter: "input"},
            
        ];

        if (addressTable) {
            addressTable.replaceData(tableData);
            return;
        }
        addressTable = new Tabulator(tableContainer, {
            data: tableData,              
            columns: columns,             
            layout: "fitColumns",         
            height: "600px",              
            pagination: "local",          
            paginationSize: 50,           
            paginationSizeSelector: [10, 50, 100, 500, true], 
            movableColumns: true,         
            resizableColumns: true,       
            index: "key",               
            placeholder: "Keine Adressen gefunden",
        });
    }

    window.loadAddresses = async function loadAddresses() {
        statusEl.textContent = 'lade…';
        try {
            const r = await api('/api/addresses');
            if (!r.ok) throw new Error('Fehler: ' + r.status);
            
            initializeTable(r.data || {});
            statusEl.textContent = `bereit. ${Object.keys(r.data).length} Adressen gefunden.`;
        } catch (e) {
            statusEl.textContent = 'Fehler';
            alert('Fehler beim Laden: ' + e.message);
        }
    }

    async function addAddress(obj) {
        if (!obj.firstname || !obj.name || !obj.street || !obj.street_nr || !obj.plz || !obj.city) {
            alert('Bitte Vorname, Name, Straße, Nr., PLZ und Ort ausfüllen.');
            return;
        }
        
        try {
            const r = await api('/api/addresses', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(obj)
            });
            if (r.ok) {
                const key = `${obj.firstname} ${obj.name}`;
                if (addressTable) {
                    addressTable.addRow({key: key, ...obj}, true);
                    statusEl.textContent = 'Adresse hinzugefügt.';
                } else {
                    loadAddresses();
                }
                document.getElementById('addForm').reset();
            } else if (r.status === 409) {
                alert('Fehler: Adresse existiert bereits.');
            } else { 
                alert('Fehler beim Hinzufügen: ' + r.status); 
            }
        } catch (e) { alert('Fehler beim Hinzufügen: ' + e.message); }
    }

    async function updateAddress(key, obj) {
        try {
            const r = await api('/api/addresses/' + encodeURIComponent(key), {
                method: 'PUT',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify(obj)
            });
            if (r.ok) {
                if (addressTable) {
                    addressTable.updateRow(key, {key: key, ...obj});
                    statusEl.textContent = 'Adresse aktualisiert.';
                } else {
                    loadAddresses(); 
                }
            } else { alert('Fehler beim Aktualisieren: ' + r.status); }
        } catch (e) { alert('Fehler beim Aktualisieren: ' + e.message); }
    }

    async function deleteAddress(key) {
        try {
            const r = await api('/api/addresses/' + encodeURIComponent(key), { method: 'DELETE' });
            if (r.ok) {
                if (addressTable) {
                    addressTable.getRow(key).delete();
                    statusEl.textContent = 'Adresse gelöscht.';
                } else {
                    loadAddresses(); 
                }
            } else { alert('Fehler beim Löschen: ' + r.status); }
        } catch (e) { alert('Fehler beim Löschen: ' + e.message); }
    }


    async function handleExcelImport() {
        const fileInput = document.getElementById('excel-file-input');
        const importMessage = document.getElementById('import-message');
        const file = fileInput.files[0];

        if (!file) {
            importMessage.textContent = 'Bitte wählen Sie eine Datei aus.';
            return;
        }
        
        importMessage.textContent = 'Importiere... Bitte warten...';

        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, {type: 'array'});
                
                const firstSheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                const jsonAddresses = XLSX.utils.sheet_to_json(worksheet);

                if (jsonAddresses.length === 0) {
                     importMessage.textContent = 'Fehler: Datei enthält keine Adressen.';
                     return;
                }
                
                let successCount = 0;
                let errorCount = 0;
                
                for (const address of jsonAddresses) {
                    const isValid = requiredFields.every(field => address[field] && String(address[field]).toString().trim() !== '');

                    if (isValid) {
                        const obj = {};
                        for (const key of Object.keys(address)) {
                             if (requiredFields.includes(key) || ['phone', 'mobile', 'email', 'whatsapp', 'internet'].includes(key)) {
                                obj[key] = (address[key] || '').toString().trim();
                             }
                        }
                        
                        try {
                            const r = await api('/api/addresses', {
                                method: 'POST',
                                headers: {'Content-Type':'application/json'},
                                body: JSON.stringify(obj)
                            });
                            
                            if (r.ok) {
                                successCount++;
                            } else if (r.status === 409) {
                                successCount++; 
                            } else {
                                errorCount++;
                            }
                        } catch (e) {
                            errorCount++;
                        }
                    } else {
                        errorCount++;
                    }
                }
                
                loadAddresses(); 
                importMessage.textContent = `Import abgeschlossen. Erfolgreich verarbeitet: ${successCount}, Fehler (fehlende Pflichtfelder/API-Fehler): ${errorCount}.`;

            } catch (error) {
                importMessage.textContent = `Fehler beim Verarbeiten der Datei: ${error.message}`;
                console.error(error);
            }
        };

        reader.readAsArrayBuffer(file);
    }

    function openEditModal(key, item) {

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
          if (requiredFields.includes(f)) {
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
          const obj = {};
          for (const f of fields) obj[f] = inputs[f].value.trim();
          if (!obj.firstname || !obj.name || !obj.street || !obj.street_nr || !obj.plz || !obj.city) {
            alert('Bitte Vorname, Name, Straße, Nr., PLZ und Ort ausfüllen.');
            return;
          }
          await updateAddress(key, obj);
          document.body.removeChild(backdrop);
        };
        actions.appendChild(cancelBtn);
        actions.appendChild(saveBtn);
        modal.appendChild(actions);

        backdrop.appendChild(modal);
        backdrop.onclick = (e) => { if (e.target === backdrop) document.body.removeChild(backdrop); };
        document.body.appendChild(backdrop);

        inputs.firstname.focus();
      }

    let isSubmitting = false; 

    document.getElementById('addForm').addEventListener('submit', e => {
        e.preventDefault();
        
        if (isSubmitting) return; 
        isSubmitting = true;
        
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
          isSubmitting = false;
          return;
        }
        
        addAddress(obj).finally(() => {
          isSubmitting = false; 
          f.reset();
        });
    });
  
    const importBtn = document.getElementById('import-btn');
    if (importBtn) {
        importBtn.addEventListener('click', handleExcelImport);
    }
 
    loadAddresses();
}