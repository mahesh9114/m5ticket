# m5ticket
Last min --> Train WL/RAC? --> we got you [AVL] .

```md
# 🚂 mSticket — Smart Train Ticket Search

> Automatically finds available train tickets using split-ticket strategies when direct tickets are unavailable.

---

## 📖 What is mSticket?

mSticket is a CLI tool that searches for train ticket availability on Indian Railways using the **RailKit API**. When a direct ticket is unavailable (WAITLIST/REGRET), it intelligently tries multiple strategies to find an alternative route combination.

---

## 🧠 How It Works

| Module | Strategy | Description |
|--------|----------|-------------|
| **M1** | Direct Search | Searches direct route `from → to` |
| **M2** | Earlier Boarding | Boards from an earlier station `before_from → to` |
| **M3** | Later Alighting | Gets off at a later station `from → after_to` |
| **M4** | Split Ticket | Splits journey via a middle station `from → mid + mid → to` |
| **M5** | Extended Split | Combines earlier boarding + later alighting `before_from → after_to` |

> Modules run in order M1 → M5. Search stops as soon as a valid ticket is found. ✅

---

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/yourusername/mSticket.git
cd mSticket
```

### 2. Install dependencies
```bash
npm install
```

### 3. Setup environment variables
```bash
# copy the example env file
cp .env.example .env
```

Then open `.env` and add your RailKit API key:
```
RAILKIT_API_KEY=your_api_key_here
```

> Get your API key from creator(me).

---

## 🚀 Usage

```bash
node index.js
```

You will be prompted (terminal) to enter:

```
=== mSticket Search ===
Enter Train Number    (e.g., 12711):
Enter From Station    (e.g., BZA):
Enter To Station      (e.g., MAS):
Enter Date            (DD-MM-YYYY):
Enter Coach           (e.g., 2S):
Enter Quota           (e.g., GN):
```

---

## 📦 Project Structure

```
mSticket/
├── modules/
│   ├── module1.js        # M1 — Direct search
│   ├── module2.js        # M2 — Earlier boarding
│   ├── module3.js        # M3 — Later alighting
│   ├── module4.js        # M4 — Split ticket
│   └── module5.js        # M5 — Extended split
├── index.js              # Main entry point
├── splicingfunction.js   # Gets all stations between from and to
├── .env                  # Your API key (never pushed to github)
├── .env.example          # Template for env setup
├── .gitignore            # Ignores .env and node_modules
└── package.json          # Project dependencies
```

---

## 🔍 Example Output

```
🔎 Searching for tickets... Please wait.

=== Availability Results ===

🔍 Trying M1 (Direct Search)...
❌ Status: "WAITLIST" — not available

🔍 Trying M2 (Earlier Boarding)...
❌ Status: "WAITLIST" — not available

🔍 Trying M3 (Later Alighting)...
❌ Status: "WAITLIST" — not available

🔍 Trying M4 (Split Ticket — Middle Stations)...

🎉 Split Ticket Found!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎟️  Tkt 1: BZA -> OGL
🎟️  Tkt 2: OGL -> MAS
📅 Date: 23-6-2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Ticket found! Search complete.
```

---

## 🛠️ Requirements

| Requirement | Version |
|-------------|---------|
| Node.js | v18+ |
| API Key | required |

---

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `API_KEY` | Your API key | ✅ Yes |

---

## 📋 Coach Types

| Code | Type |
|------|------|
| `2S` | Second Sitting |
| `SL` | Sleeper |
| `3A` | AC 3 Tier |
| `2A` | AC 2 Tier |
| `1A` | AC First Class |

---

## 📋 Quota Types

| Code | Type |
|------|------|
| `GN` | General |
| `TQ` | Tatkal |
| `PT` | Premium Tatkal |
| `LD` | Ladies |

---

## ⚠️ Disclaimer

> mSticket is an independent tool and is not affiliated with Indian Railways or IRCTC. Always verify ticket availability on the official [IRCTC website](https://www.irctc.co.in) before booking.

---

## 📄 License

MIT License — feel free to use and collaburate.

---

<p align="center">Made with ❤️ for Fastest Last-mint train travel 🚂</p>
```

---

Save this as `README.md` in your project root and push to GitHub! 🚀
