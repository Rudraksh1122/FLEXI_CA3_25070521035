# SkillSwap — Exchange Skills Without Money

A full-stack skill-exchange platform where members teach one skill and learn another without paying money. For example, one member teaches Python in exchange for learning graphic design.

## Features
- Secure registration/login (bcrypt password hashing, JWT authentication, protected API routes).
- Profiles with bio, location, skills to teach, and skills to learn.
- Create/read/update/delete your own skill listings.
- Matching algorithm ranks members by overlapping teach/learn goals.
- Exchange requests with accept, decline, cancel, and completion states.
- Private conversation history with Socket.IO event delivery and REST messaging.
- Session scheduling, completion status, member ratings, and notifications.
- Responsive React interface with a polished dark theme, clearer active navigation, stronger contrast, keyboard focus states, consistent controls, and hover feedback.
- Search, validation, empty/loading/error states, and mobile navigation.
- MongoDB persistence through Mongoose.

## Stack
React, Vite, React Router, Axios, JavaScript, CSS, Node.js, Express, MongoDB, Mongoose, JWT, bcryptjs, Socket.IO.

## Structure
```text
YOUR_PRN/
├── client/
│   ├── public/
│   └── src/
│       ├── assets/
│       ├── components/
│       ├── context/
│       ├── pages/
│       ├── services/
│       ├── App.jsx
│       ├── main.jsx
│       └── index.css
├── server/
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/auth.js
│   ├── models/
│   ├── routes/api.js
│   ├── .env.example
│   ├── package.json
│   └── server.js
└── README.md
```

## Run locally
Prerequisites: Node.js 20+ and MongoDB Community Server or MongoDB Atlas. MongoDB Compass is optional for inspecting data; the backend connects to MongoDB, not to Compass.

1. Copy `server/.env.example` to `server/.env`. Configure `MONGODB_URI`, a long random `JWT_SECRET`, `PORT=5000`, and `CLIENT_URL=http://localhost:5173`.
2. Copy `client/.env.example` to `client/.env`. Set `VITE_API_URL=http://localhost:5000/api`.
3. Start MongoDB if using a local instance.
4. Terminal 1:
   ```bash
   cd YOUR_PRN/server
   npm install
   npm run dev
   ```
5. Terminal 2:
   ```bash
   cd YOUR_PRN/client
   npm install
   npm run dev
   ```
6. Open `http://localhost:5173` and register an account.

For Atlas, use your Atlas connection string as `MONGODB_URI`. Never commit `.env`.

## API endpoints
Unauthenticated: `GET /api/health`, `POST /api/auth/register`, `POST /api/auth/login`.
Authenticated endpoints use `Authorization: Bearer <JWT>`.

| Method | Endpoint | Purpose |
|---|---|---|
| GET/PUT | `/api/auth/me` | Read/update profile |
| GET/POST | `/api/skills` | Search/list and create skill listings |
| GET/PUT/DELETE | `/api/skills/:id` | Read/update/delete a listing (updates/deletes owner-only) |
| GET | `/api/matches` | Ranked skill compatibility |
| GET/POST | `/api/exchanges` | List/create exchange requests |
| PATCH | `/api/exchanges/:id` | Accept/decline/cancel/complete |
| GET/POST | `/api/messages/:exchangeId` | Load history/send message |
| GET/POST | `/api/sessions` | List/schedule sessions |
| PATCH | `/api/sessions/:id` | Mark completed/cancelled |
| GET/POST | `/api/ratings` | Read received ratings/create a rating |
| GET | `/api/notifications` | List notifications |
| PATCH | `/api/notifications/:id/read` | Mark notification read |

## Database collections
- `users`: profile, email, hashed password, teach/learn skill arrays.
- `skills`: owner, title, category, description, level.
- `exchanges`: requester, recipient, offered/wanted skill, status.
- `messages`: exchange, sender, message text.
- `sessions`: exchange, scheduled date, notes, status.
- `ratings`: exchange, reviewer/reviewee, score, comment.
- `notifications`: owner, type, message, read status.

## Matching algorithm
For every other user, compare the current member's `learnSkills` with the other member's `teachSkills`, and the current member's `teachSkills` with the other member's `learnSkills`. Each overlap adds one point. Results with no overlap are omitted, and the highest score is listed first. Matching is case-insensitive.

## Manual test plan
- Register two accounts and sign in to both.
- Add teaching/learning skills to each profile and verify reciprocal matches.
- Create, edit, and delete a skill listing.
- Send an exchange request and accept it from the other account.
- Exchange messages and refresh to verify history is persisted.
- Schedule a future session, mark it complete, and leave a rating.
- Verify one account cannot edit another member's skill listing or access an unrelated conversation.
- Restart the backend and confirm data persists in MongoDB.

**Verification note:** Source files have been generated, but the application has not been run against your MongoDB instance or browser in this environment. Complete the manual test plan after configuration.

## GitHub
Create a repository named `YOUR_PRN-CA-03` and replace `YOUR_PRN` with your actual PRN. From the project root:
```bash
git init
git add .
git commit -m "Build SkillSwap full-stack application"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_PRN-CA-03.git
git push -u origin main
```
No repository is created or pushed automatically.
