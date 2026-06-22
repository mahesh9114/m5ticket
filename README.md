# 🚂 m5ticket

> Last min → Train WL/RAC? → we got you [AVL] 🚂

---

## Why?
Stuck with a WAITLIST ticket at the last minute? m5ticket finds you an available alternative automatically.

## What?
A smart search tool that tries 5 strategies to find available Indian Railways tickets when your direct route is full.

| Module | Strategy |
|--------|----------|
| M1 | Direct `from → to` |
| M2 | Board earlier station |
| M3 | Alight at later station |
| M4 | Split via middle station |
| M5 | Extended split outside range |

## How?

```bash
# 1. clone
git clone https://github.com/mahesh9114/m5ticket.git
cd m5ticket

# 2. install
npm install

# 3. setup env
cp .env.example .env
# add your API_KEY in .env (contact creator)

# 4. run
node main.js
```

POST `http://localhost:8000/search`
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

---

> Not affiliated with Indian Railways or IRCTC. Verify before booking at [irctc.co.in](https://www.irctc.co.in)

<p align="center">Made with ❤️ for fastest last-min train travel 🚂</p>
