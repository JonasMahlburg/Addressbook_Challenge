# Adressbook_Challenge

Kleiner lokaler HTTP-API-Server für ein Adressbuch (keine externen Frameworks).

## Voraussetzungen
- macOS
- Windows
- Python 3 (empfohlen: python3)

## Dateien
- `addressBook.py` — Python-HTTP-Server (API + statische Dateien)
- `index.html` — Frontend (ruft die API per fetch auf)
- `script.js`, `style.css` — Frontend-Script und Styles
- `addresses.json` — persistente Daten (wird vom Server gelesen/geschrieben)

## Server starten
1. Terminal öffnen und in das Projektverzeichnis wechseln:
   cd Adressbook_Challenge
2. Server starten:
   python3 addressBook.py
3. Im Browser öffnen:
   http://localhost:8000

Zum Beenden

MacOS:
Ctrl+C im Terminal.

Windows:
Strg+C im Terminal.

## Nutzung (API)
Die API-Endpunkte befinden sich unter `/api/addresses`.

- GET alle Einträge:
  curl http://localhost:8000/api/addresses

- POST (neuen Eintrag anlegen):
  curl -X POST http://localhost:8000/api/addresses \
    -H "Content-Type: application/json" \
    -d '{"name":"Max Mustermann","address":"Musterstr 1"}'

- PUT (Adresse aktualisieren):
  curl -X PUT http://localhost:8000/api/addresses/Max%20Mustermann \
    -H "Content-Type: application/json" \
    -d '{"address":"Neue Str 2"}'

- DELETE (Eintrag löschen):
  curl -X DELETE http://localhost:8000/api/addresses/Max%20Mustermann

Hinweis: Namen in URLs müssen URL-encodiert werden (z. B. Leerzeichen -> `%20`).

## Frontend
- Öffne `http://localhost:8000` im Browser (nicht `file://`).
- Das Frontend verwendet `fetch` gegen die oben genannten Endpunkte.
- Bearbeiten erfolgt per alert/prompt (oder Modal, falls aktualisiert).

## Persistenz
Änderungen werden in `addresses.json` gespeichert. Backup der Datei möglich durch Kopie.

## CORS
Der Server setzt `Access-Control-Allow-Origin: *`, sodass das Frontend auch von anderen Hosts auf die API zugreifen kann (lokal normalerweise nicht nötig).

## Fehlerbehebung
- API gibt 404: Server läuft evtl. nicht auf Port 8000 — Terminal prüfen.
- Browser-Fehler `Unexpected token '<'`: Frontend lädt HTML statt JSON — auf korrekten Pfad `/api/addresses` achten und Server-URL korrekt verwenden.
- Änderungen an Dateien erfordern Neustart des Servers, falls Dateiänderungen serverseitig geladen werden sollen.

