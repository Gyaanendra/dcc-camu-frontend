# Club DCC Camu - Attendance & Analytics System 🚀

This project contains the complete source code for **Club DCC Camu**, an ultra-fast QR-based attendance and analytics application built specifically for **Club DCC** (Developers & Creators Club).

---

## 🔑 Key Authentication Rules & Role Control

1. **Bennett University Email Pattern**:
   - All email addresses MUST match the strict Bennett email pattern: `*@bennett.edu.in` (e.g. `s24cseu0771@bennett.edu.in`).
2. **Default Sign Up Role**:
   - Every user who signs up via the registration page receives the **`user` role** (`role: 'user'`) by default.
   - Roles can only be promoted to **`admin`** by an existing Admin in the app UI or manually in the database.
3. **User Editable Position Field**:
   - Every user has a **`position`** title (e.g. *Web Lead*, *Core Member*, *Frontend Developer*, *UI Designer*).
   - Users can edit their own `position` anytime directly from their Dashboard profile or registration.
   - Users **cannot** edit their own `role` (`admin` / `user`).

---

## 📁 Directory Structure

- **`dcc-camu-backend`**: Express + TypeScript + Drizzle ORM + Neon PostgreSQL Serverless API backend.
- **`dcc-camu-frontend`**: Next.js 14 + Shadcn UI + Tailwind CSS + Recharts + HTML5 QR Camera Scanner frontend.

---

## 🛠️ Step-by-Step Manual Setup Instructions

### 1️⃣ Backend Setup (`dcc-camu-backend`)

1. Open a terminal in `e:\dcc\dcc-camu-backend`:
   ```bash
   cd e:\dcc\dcc-camu-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure your Neon PostgreSQL Database:
   - Open `.env`.
   - Replace `DATABASE_URL` with your actual Neon PostgreSQL connection string from [console.neon.tech](https://console.neon.tech):
     ```env
     DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-sample.us-east-2.aws.neon.tech/neondb?sslmode=require"
     PORT=5000
     JWT_SECRET="dcc_camu_super_secret_jwt_key_2026"
     ```

4. Push Database Schema to Neon & Seed Initial Real Data:
   ```bash
   # Push schema tables (users, teams, sessions, attendance) to Neon
   npm run db:push

   # Seed database with initial real teams, admin, members & past attendance logs
   npm run db:seed
   ```

5. Start the Backend Development Server:
   ```bash
   npm run dev
   ```
   The backend will start running at `http://localhost:5000`.

---

### 2️⃣ Frontend Setup (`dcc-camu-frontend`)

1. Open another terminal in `e:\dcc\dcc-camu-frontend`:
   ```bash
   cd e:\dcc\dcc-camu-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Ensure `.env.local` points to the Express API:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:5000/api"
   ```

4. Start the Next.js Development Server:
   ```bash
   npm run dev
   ```
   The frontend will start running at `http://localhost:3000`.

---

## 🔐 Built-in Seed Credentials (Bennett Email Pattern)

Once you seed the database with `npm run db:seed`, you can test with:

| Role | Name | Bennett Email | Password | Position Title |
| :--- | :--- | :--- | :--- | :--- |
| **Admin (President)** | Aarav Sharma | `s21cseu0001@bennett.edu.in` | `admin123` | Club President |
| **Admin (Tech Head)** | Ananya Verma | `s21cseu0002@bennett.edu.in` | `admin123` | Tech Lead |
| **User (Member)** | Rohan Gupta | `s24cseu0771@bennett.edu.in` | `user123` | Frontend Developer |
| **User (Member)** | Priya Patel | `s22cseu0102@bennett.edu.in` | `user123` | Fullstack Contributor |

> 💡 **Manual DB Role Promotion**: To promote yourself to `admin` in PostgreSQL, execute:
> ```sql
> UPDATE users SET role = 'admin' WHERE email = 's24cseu0771@bennett.edu.in';
> ```
