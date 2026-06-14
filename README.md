#  MindSpace — Anonymous Mental Health Forum

A MERN stack project for students to discuss stress and anxiety anonymously.

## Features
- **Fully anonymous posting** — users post under a chosen alias, real identity never exposed
- **Sentiment analysis** — keyword-based flagging of harmful/crisis content
- **Crisis resource delivery** — helpline cards auto-surface when distress is detected
- **Professional counselor profiles** — public listing with availability status
- **Ephemeral 1-on-1 chat** — Socket.io powered private sessions, messages never stored in DB
- **Admin dashboard** — user management, role promotion, flagged content review

---

## Project Structure

```
mental-health-forum/
├── backend/
│   ├── API/          UserAPI.js  PostAPI.js  AdminAPI.js
│   ├── Models/       UserModel  PostModel  CommentModel  ChatRoomModel
│   ├── middlewares/  verifyToken.js
│   ├── config/       sentiment.js
│   ├── server.js     (Express + Socket.io)
│   └── .env
└── frontend/
    └── src/
        ├── components/
        │   ├── auth/     Login  Register  Profile  Admin
        │   ├── forum/    Forum  NewPost  PostDetail
        │   ├── counselor/Counselors  ChatQueue
        │   ├── chat/     ChatRoom
        │   └── shared/   Header  CrisisBanner
        ├── store/    authStore.js  (Zustand)
        ├── api/      axiosInstance.js
        └── styles/   common.js
```

---

## Step-by-Step Setup

### Prerequisites
- Node.js v18+
- MongoDB (local or Atlas)

---

### Step 1 — Set up the Backend

```bash
cd backend
npm install
```

Edit `.env` (already created):
```
PORT=8000
DB_URL=mongodb://localhost:27017/mental-health-forum
JWT_SECRET=change_this_to_a_long_random_string
CLIENT_URL=http://localhost:5173
```

> **MongoDB Atlas?** Replace `DB_URL` with your Atlas connection string.

Start the backend:
```bash
npm run dev
```

You should see:
```
✓ DB connected
✓ Server running on port 8000
```

---

### Step 2 — Set up the Frontend

```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173**

---

### Step 3 — Create your first Admin user

1. Register normally at `/register`
2. Open MongoDB shell or Compass
3. Run:
```js
db.users.updateOne({ email: "youremail@example.com" }, { $set: { role: "admin" } })
```
4. Log out and log back in — you'll see the Admin panel in the nav.

---

### Step 4 — Create a Counselor

From the Admin panel:
1. Go to **Users** tab
2. Find the user → click **Make counselor**
3. Optionally update their `counselorProfile` in MongoDB:
```js
db.users.updateOne(
  { email: "counselor@example.com" },
  { $set: { "counselorProfile.name": "Dr. Priya S.", "counselorProfile.specialization": "Anxiety & Stress", "counselorProfile.bio": "5 years supporting students.", "counselorProfile.isAvailable": true } }
)
```

---

## How the Chat Works

1. A student clicks **Request private chat** on `/counselors`
2. A Socket.io room is created — the room ID is broadcast to all connected counselors
3. A counselor on `/chat-queue` clicks **Join session**
4. Both parties chat in real-time
5. Messages are **NOT saved to DB** (ephemeral by design)
6. Either party can end the session; the room and messages are destroyed

---

## How Sentiment Analysis Works

When a post or comment is submitted, `config/sentiment.js` scans the text for:
- **Crisis keywords** → flags the post + shows helpline resources to the author
- **Negative keywords** → labels as negative, may flag for counselor review
- **Positive keywords** → labels as positive

This can be upgraded to a real ML model later.

---

## What to Build Next

- [ ] Email notifications for crisis flagged posts (Nodemailer)
- [ ] Counselor availability toggle from their own dashboard
- [ ] Rate limiting (express-rate-limit)
- [ ] Post bookmarking / saved posts
- [ ] PWA support for mobile students
- [ ] Replace keyword sentiment with a real model (Hugging Face API)


deployment link :- https://anonymous-mental-health-forum.vercel.app