# React + Neon Auth Starter

A minimal authentication boilerplate built with React and Neon's auth platform. Includes email/password sign up, OTP email verification, Google OAuth, protected routes, profile creation, and persistent session management.

## Stack

- **React** + Vite
- **Neon** — auth and data API
- **React Router** — client-side routing

## Features

- Email + password sign up with OTP email verification
- Email OTP login (two-step)
- Google OAuth (one-click sign in)
- Protected routes
- Profile creation flow for new users
- Persistent sessions across page refreshes
- Single source of truth for auth state via React Context
- Loading spinner while session is being resolved

---

## File Structure

```
.
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── public
│   └── vite.svg
├── README.md
├── src
│   ├── App.jsx
│   ├── application
│   │   ├── Home.css
│   │   └── Home.jsx
│   ├── lib
│   │   ├── Auth.jsx
│   │   ├── AuthContext.jsx
│   │   ├── AuthProvider.jsx
│   │   ├── CheckRegistration.jsx
│   │   ├── client.jsx
│   │   └── ProtectedRoutes.jsx
│   ├── login
│   │   ├── Login.css
│   │   └── Login.jsx
│   ├── main.jsx
│   ├── makeProfile
│   │   ├── Profile.css
│   │   └── Profile.jsx
│   └── signUp
│       ├── SignUp.css
│       └── SignUp.jsx
└── vite.config.js
```

---

## Neon Setup

### 1. Create a Neon project

Go to [console.neon.tech](https://console.neon.tech) → New Project → give it a name.

### 2. Enable Auth

In your project dashboard go to the **Auth** tab → Enable Auth. Neon will provision an auth endpoint for you.

### 3. Enable Email OTP

In the Auth tab → Authentication Methods → enable **Email OTP**. This is required for the two-step login and email verification on sign up.

### 4. Enable Data API

In your project dashboard go to the **Data API** tab → Enable Data API. This lets you query your Neon database directly from the frontend using the Neon client.

### 5. Create the users table

The profile flow writes to a `users` table. Run this in your Neon SQL editor:

```sql
CREATE TABLE users (
  user_id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL
);
```

### 6. Get your environment variables

- **Auth URL** → found in the **Auth** tab → this is your `VITE_NEON_AUTH`
- **Data API URL** → found in the **Data API** tab → this is your `VITE_NEON_DATA_API`

---

## Google OAuth Setup

Google OAuth works in development with no configuration — Neon provides shared credentials out of the box. For production you'll want to set up your own credentials.

### Production setup

Go to [console.cloud.google.com](https://console.cloud.google.com) → create a project → **APIs & Services** → **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**.

Set the application type to **Web application**. Under **Authorized redirect URIs**, add your app's domain — this is whatever you set as `callbackURL` in `Login.jsx` and `SignUp.jsx`.

In your Neon dashboard → **Settings** → **Auth**, add your Google Client ID and Client Secret.

### Callback URL

The `callbackURL` in `Login.jsx` and `SignUp.jsx` controls where Neon redirects the user after OAuth completes. Update it to match your domain before deploying:

```jsx
callbackURL: "https://yourapp.com/Home";
```

In development it points to `http://localhost:5173/Home` by default.

### How it works

When a user clicks **Continue with Google**, Neon handles the full OAuth redirect flow. On success Neon redirects back to your `callbackURL` with an active session already created. `RootRedirect` then runs the registration check and routes the user to `/Profile` or `/Home` accordingly.

---

## Getting Started

### 1. Clone the repo

```bash
git clone git@github.com:yourusername/yourrepo.git
cd yourrepo
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env.local` file in the root:

```
VITE_NEON_AUTH=your_neon_auth_url
VITE_NEON_DATA_API=your_neon_data_api_url
```

### 4. Run the dev server

```bash
npm run dev
```

---

## How It Works

### Auth Client Setup

Two separate clients are used. `Auth.jsx` is a lightweight auth-only client used by `AuthProvider` to check sessions:

```jsx
import { createAuthClient } from "@neondatabase/neon-js/auth";

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH);
```

`client.jsx` is the full Neon client used everywhere else for auth actions and database queries:

```jsx
import { createClient } from "@neondatabase/neon-js";

const client = createClient({
  auth: { url: import.meta.env.VITE_NEON_AUTH },
  dataApi: { url: import.meta.env.VITE_NEON_DATA_API },
});

export default client;
```

---

### Auth Context

`AuthContext.jsx` creates the context and exports a `useAuth` hook so any component can read auth state without importing `useContext` and `AuthContext` separately:

```jsx
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
```

---

### AuthProvider — Single Source of Truth

`AuthProvider` fetches the session once on mount and exposes `refreshSession` to any component that needs to sync state after a login or logout:

```jsx
const refreshSession = useCallback(async () => {
  const result = await authClient.getSession();
  if (result.data?.session && result.data?.user) {
    setSession(result.data.session);
    setUser(result.data.user);
  } else {
    setSession(null);
    setUser(null);
  }
}, []);
```

While loading, a spinner is shown so protected routes never render before the session is resolved.

The context exposes:

```jsx
<AuthContext.Provider value={{ user, session, refreshSession }}>
```

---

### Protected Routes

`ProtectedRoutes` reads from context. By the time it renders, `AuthProvider` has already resolved the session so no extra loading logic is needed:

```jsx
const ProtectedRoutes = ({ children }) => {
  const { session } = useAuth();

  if (!session) return <Navigate to="/Login" replace />;
  return children;
};
```

---

### Root Redirect and Registration Check

The root `/` route checks both the session and whether the user has completed profile setup. `CheckRegistration` queries the `users` table to see if a row exists for the current user:

```jsx
const RootRedirect = () => {
  const { session, user } = useAuth();
  const [isRegistered, setIsRegistered] = useState(null);

  useEffect(() => {
    if (!user) return;
    checkRegistration(user.id).then((e) => setIsRegistered(e));
  }, [user, session]);

  if (!session) return <Navigate to="/Login" />;
  if (isRegistered === null) return null;
  return <Navigate to={isRegistered ? "/Home" : "/Profile"} />;
};
```

This means any user — whether they signed up via email or Google OAuth — is routed to `/Profile` first if they haven't created their profile yet, and to `/Home` if they have.

---

### Profile Flow

`Profile.jsx` is a one-time setup page where new users enter their first and last name. On submit it inserts a row into the `users` table and navigates to `/Home`. Once that row exists, `CheckRegistration` returns `true` and the user will never be routed to `/Profile` again.

---

### refreshSession after Auth Actions

After any action that creates or ends a session, call `refreshSession()` before navigating to sync the context:

```jsx
await refreshSession();
navigate("/Home");
```

On sign out:

```jsx
await client.auth.signOut();
await refreshSession();
navigate("/Login");
```

---

## Auth Flow

**Sign Up**

1. User enters email and password
2. Account created via `client.auth.signUp.email()`
3. OTP sent to email automatically by Neon
4. User enters the 6-digit code → verified via `client.auth.emailOtp.verifyEmail()`
5. `refreshSession()` called → redirect to `/Profile`
6. User enters first and last name → row inserted into `users` table → redirect to `/Home`

**Login**

1. User enters email and password → `client.auth.signIn.email()`
2. OTP sent to email via `client.auth.emailOtp.sendVerificationOtp()`
3. User enters the 6-digit code → verified via `client.auth.signIn.emailOtp()`
4. `refreshSession()` called → `CheckRegistration` runs → redirect to `/Profile` or `/Home`

**Google OAuth**

1. User clicks Continue with Google
2. Neon redirects to Google's consent screen
3. On approval, Google redirects back to your `callbackURL` with an active session
4. `RootRedirect` runs `CheckRegistration` → redirect to `/Profile` or `/Home`

**On Page Refresh**

- `AuthProvider` calls `authClient.getSession()` on mount
- If a valid session exists it is restored automatically
- Protected routes stay accessible, spinner shows while resolving

---

## Extending This

**Add a new protected route**

```jsx
import Dashboard from "./dashboard/Dashboard.jsx";

<Route
  path="/Dashboard"
  element={
    <ProtectedRoutes>
      <Dashboard />
    </ProtectedRoutes>
  }
/>;
```

**Access user info in any component**

```jsx
import { useAuth } from "../lib/AuthContext.jsx";

const { user } = useAuth();

console.log(user.name, user.email);
```

**Query the database**

```jsx
import client from "../lib/client.jsx";
import { useAuth } from "../lib/AuthContext.jsx";

const { user } = useAuth();

const { data, error } = await client
  .from("your_table")
  .select("*")
  .eq("user_id", user.id);
```
