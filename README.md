# 🚂 m5ticket

> **Booking train ticket → Train WL/RAC? → Find [AVL] here**

**Status:** `v0.1 — Early Dev / Local Only`
**Versioned link:** [github.com/mahesh9114/m5ticket](https://github.com/mahesh9114/m5ticket)

---

## WHY

You're travelling tomorrow. Your ticket is WL/45. IRCTC shows no direct seats.
You try different dates, different classes — still nothing.

m5ticket solves this automatically. It doesn't just check the direct route — it tries 5 different strategies (split tickets, alternate boarding/alighting points) and stops the moment it finds something available.

---

## WHAT

A Node.js CLI tool + HTML frontend that searches Indian Railways availability via the **RailKit API**.

When your direct ticket is WL/RAC/REGRET, it runs through 5 modules in order:

| Module | Strategy         | What it does                                                 |
| ------ | ---------------- | ------------------------------------------------------------ |
| M1     | Direct           | `from → to` (normal search)                                  |
| M2     | Earlier Boarding | `before_from → to` (board one stop earlier)                  |
| M3     | Later Alighting  | `from → after_to` (get off one stop later)                   |
| M4     | Split Ticket     | `from → mid` + `mid → to` (two tickets via a middle station) |
| M5     | Extended Split   | `before_from → after_to` (combines M2 + M3 + M4)             |

Modules run M1 → M5 in sequence. **Search stops as soon as one works.** ✅

---

## HOW

### 1. Clone

```bash
git clone https://github.com/mahesh9114/m5ticket.git
cd m5ticket
```

### 2. Install

```bash
npm install
```

### 3. Set up your API key

```bash
cp .env.example .env
```

Open `.env` and add:

```
API_KEY=your_key_here
```

> API key is available from the creator. Contact to get one.

### 4. Run

```bash
node main.js
```

You'll be prompted in the terminal:

```
Enter Train Number    (e.g., 12711):
Enter From Station    (e.g., BZA):
Enter To Station      (e.g., MAS):
Enter Date            (DD-MM-YYYY):
Enter Coach           (e.g., 2S):
Enter Quota           (e.g., GN):
```

---

## WHERE (Project Structure)

```
m5ticket/
├── modules/
│   ├── module1.js          # M1 — Direct search
│   ├── module2.js          # M2 — Earlier boarding
│   ├── module3.js          # M3 — Later alighting
│   ├── module4.js          # M4 — Split ticket via middle station
│   └── module5.js          # M5 — Extended split
├── main.js                 # Entry point — runs M1 → M5 in order
├── splicingfunction.js     # Gets all stations between from and to
├── frontend/
│   └── m5ticket.html       # Browser UI (POSTs to /search)
├── .env                    # Your API key — never pushed to GitHub
├── .env.example            # Copy this to .env to get started
├── .gitignore              # Excludes .env and node_modules
└── package.json
```

---

## Example Output

```
🔎 Searching for tickets... Please wait.

🔍 Trying M1 (Direct)...
❌ WAITLIST — skipping

🔍 Trying M2 (Earlier Boarding)...
❌ WAITLIST — skipping

🔍 Trying M3 (Later Alighting)...
❌ WAITLIST — skipping

🔍 Trying M4 (Split Ticket)...

🎉 Split Ticket Found!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎟  Ticket 1: BZA → OGL
🎟  Ticket 2: OGL → MAS
📅  Date: 23-06-2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Search complete.
```

---

## Frontend (Browser UI)

The `m5ticket.html` file is a standalone browser interface for the same search.
No install needed — open it in a browser or serve locally.

```bash
# serve locally
npx serve .
# or
python3 -m http.server 8080
```

It POSTs to `/search` with:

```json
{
  "trainNo": "12711",
  "fromStnCode": "BZA",
  "toStnCode": "MAS",
  "date": "23-06-2026",
  "coach": "2S",
  "quota": "GN"
}
```

> The frontend needs a backend running at `/search` to return results. The CLI works independently.

---

## Reference

**Coach codes**

| Code | Class               |
| ---- | ------------------- |
| `2S` | Second Sitting      |
| `SL` | Sleeper             |
| `3A` | AC 3 Tier           |
| `2A` | AC 2 Tier           |
| `1A` | AC First Class      |
| `CC` | Chair Car           |
| `EC` | Executive Chair Car |
| `3E` | AC Economy (3 Tier) |

**Quota codes**

| Code | Quota          |
| ---- | -------------- |
| `GN` | General        |
| `TQ` | Tatkal         |
| `PT` | Premium Tatkal |
| `LD` | Ladies         |
| `SS` | Senior Citizen |
| `DF` | Defence        |

**Requirements**

| Item    | Detail                     |
| ------- | -------------------------- |
| Node.js | v18 or higher              |
| API Key | Required — contact creator |

---

## Current Stage

```
[✅] M1 — Direct search         working
[✅] M2 — Earlier boarding       working
[✅] M3 — Later alighting        working
[✅] M4 — Split ticket           working
[🔧] M5 — Extended split         in progress
[🔧] Frontend ↔ CLI bridge       in progress
[⏳] Deployment / hosted URL     not started
```

> This is a local-only tool right now. A hosted version is planned.

---

## Disclaimer

m5ticket is independent and not affiliated with Indian Railways or IRCTC.
Always verify and book on the official site: [irctc.co.in](https://www.irctc.co.in)

---

## License

Private — all rights reserved. No part of this project may be copied, modified, distributed, or used without explicit permission from the creator..

---

<p align="center">Made with ❤️ for fastest last-min train travel 🚂</p>
