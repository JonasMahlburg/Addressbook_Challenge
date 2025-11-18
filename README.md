# Adressbook_Challenge

Kleiner lokaler HTTP-API-Server für ein Adressbuch (keine externen Frameworks).

## Voraussetzungen
- macOS (oder Windows)
- Python 3 (empfohlen: python3)

## Dateien
- `addressBook.py` — Python-HTTP-Server (API + statische Dateien)
- `index.html` — Frontend (ruft die API per fetch auf)
- `script.js`, `style.css` — Frontend-Script und Styles (Modal-/Button-Styles in `style.css`)
- `addresses.json` — persistente Daten (wird vom Server gelesen/geschrieben)

## Änderungen / Hinweise
- Bearbeiten erfolgt jetzt per Modal: Klick auf "Bearbeiten" öffnet ein Formular mit Input‑Feldern, die mit den aktuellen Werten vorbelegt sind. Nur geänderte Felder müssen bearbeitet werden.
- Modal-Styles wurden in `style.css` verschoben. Die Aktionstasten ("Abbrechen", "Speichern") sind statisch rechts unten im Modal positioniert und verhindern Zeilenumbruch (bleiben nebeneinander).
- Pflichtfelder beim Erstellen/Ändern: `firstname`, `name`, `street`, `street_nr`, `plz`, `city`.
- Hinweis zur Namensänderung: PUT update erfolgt am alten Schlüssel (bestehend aus "Vorname Name"). Wenn Vorname/Name geändert werden, legt der Server keinen neuen Schlüssel an und löscht den alten nicht automatisch — es wird unter dem übergebenen Schlüssel gespeichert. Falls gewünschte: Server kann so erweitert werden, dass bei geänderten Namen der Eintrag umbenannt wird.

## Server starten
1. Terminal öffnen und in das Projektverzeichnis wechseln:
   cd /Users/jonas/Projekte/Adressbook_Challenge_Jonas_Mahlburg
2. Server starten:
   python3 addressBook.py
3. Im Browser öffnen:
   http://localhost:8000

Beenden: Ctrl+C im Terminal (macOS) / Strg+C (Windows).

## API (Kurz)
- GET alle Einträge:
  GET /api/addresses
- POST (neuen Eintrag anlegen): JSON-Body mit Feldern `firstname`, `name`, `street`, `street_nr`, `plz`, `city`, `phone`, `mobile`, `email`, `whatsapp`, `internet`
  POST /api/addresses
- PUT (Adresse aktualisieren): PUT /api/addresses/<url-encodierter Schlüssel> mit komplettem JSON-Objekt (wie bei POST)
- DELETE: DELETE /api/addresses/<url-encodierter Schlüssel>

Beispiel für POST:
curl -X POST http://localhost:8000/api/addresses \
  -H "Content-Type: application/json" \
  -d '{"firstname":"Max","name":"Mustermann","street":"Musterstr","street_nr":"1","plz":"12345","city":"Stadt"}'

## Persistenz
Änderungen werden in `addresses.json` gespeichert.

## Fehlerbehebung
- API gibt 404: Server läuft evtl. nicht auf Port 8000 — Terminal prüfen.
- Browser-Fehler `Unexpected token '<'`: Frontend lädt HTML statt JSON — auf korrekten Pfad `/api/addresses` achten.
- Änderungen an Server-Dateien erfordern Neustart des Servers.

