# React + Neon Auth Starter

A minimal authentication boilerplate built with React and Neon's auth platform. Includes email/password sign up, OTP email verification, protected routes, and persistent session management.

## Stack

- **React** + Vite
- **Neon** — auth and data API
- **React Router** — client-side routing

## Features

- Email + password sign up with OTP email verification
- Email OTP login (two-step)
- Protected routes
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
│   │   ├── Auth.jsx           # Neon auth client instance
│   │   ├── AuthContext.jsx    # React context + useAuth hook
│   │   ├── AuthProvider.jsx   # Session fetching and state management
│   │   ├── client.jsx         # Neon full client (auth + data API)
│   │   └── ProtectedRoutes.jsx
│   ├── login
│   │   ├── Login.css
│   │   └── Login.jsx
│   ├── main.jsx
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

In your project dashboard go to the **Data API** tab → Enable Data API. This lets you query your Neon database directly from the frontend using `client.dataApi`.

Once enabled you can query your database like this:

```jsx
const result = await client.dataApi.query(
  "SELECT * FROM your_table WHERE user_id = $1",
  [user.id],
);
```

### 5. Get your environment variables

- **Auth URL** → found in the **Auth** tab → this is your `VITE_NEON_AUTH`
- **Data API URL** → found in the **Data API** tab → this is your `VITE_NEON_DATA_API`

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
// src/lib/Auth.jsx
import { createAuthClient } from "@neondatabase/neon-js/auth";

export const authClient = createAuthClient(import.meta.env.VITE_NEON_AUTH);
```

`client.jsx` is the full Neon client used in Login, SignUp, and Home for auth actions and future data queries:

```jsx
// src/lib/client.jsx
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
// src/lib/AuthContext.jsx
import { createContext, useContext } from "react";

export const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
```

---

### AuthProvider — Single Source of Truth

`AuthProvider` fetches the session once on mount and exposes `refreshSession` to any component that needs to sync state after a login or logout. Nothing outside this file directly sets session or user:

```jsx
// src/lib/AuthProvider.jsx
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

useEffect(() => {
  const init = async () => {
    try {
      await refreshSession();
    } finally {
      setLoading(false);
    }
  };
  init();
}, [refreshSession]);
```

While loading, a spinner is shown so protected routes never render before the session is resolved.

The context value exposes:

```jsx
<AuthContext.Provider value={{ user, session, refreshSession }}>
```

---

### Protected Routes

`ProtectedRoutes` reads from context. By the time it renders, `AuthProvider` has already resolved the session so no extra loading logic is needed here:

```jsx
// src/lib/ProtectedRoutes.jsx
const ProtectedRoutes = ({ children }) => {
  const { session } = useAuth();

  if (!session) return <Navigate to="/Login" replace />;
  return children;
};
```

Wrap any route you want to protect in `App.jsx`:

```jsx
<Route
  path="/Dashboard"
  element={
    <ProtectedRoutes>
      <Dashboard />
    </ProtectedRoutes>
  }
/>
```

---

### Root Redirect

The root `/` route checks the session and redirects accordingly:

```jsx
// src/App.jsx
const RootRedirect = () => {
  const { session } = useAuth();
  return <Navigate to={session ? "/Home" : "/Login"} replace />;
};
```

---

### Login and Sign Up — calling refreshSession

After a successful OTP verification, call `refreshSession()` before navigating. This syncs the context with the active session:

```jsx
const { refreshSession } = useAuth();

// after OTP verified:
await refreshSession();
navigate("/Home");
```

Same pattern on sign out:

```jsx
await client.auth.signOut();
await refreshSession(); // clears session and user in context
navigate("/Login");
```

---

## Auth Flow

**Sign Up**

1. User enters email, password, and name
2. Account is created via `client.auth.signUp.email()`
3. OTP sent to email via `client.auth.emailOtp.sendVerificationOtp()`
4. User enters OTP → verified via `client.auth.emailOtp.verifyEmail()`
5. `refreshSession()` called → session stored in context → redirect to Home

**Login**

1. User enters email and password → `client.auth.signIn.email()`
2. OTP sent to email via `client.auth.emailOtp.sendVerificationOtp()`
3. User enters OTP → verified via `client.auth.signIn.emailOtp()`
4. `refreshSession()` called → session stored in context → redirect to Home

**On Page Refresh**

- `AuthProvider` calls `authClient.getSession()` on mount
- If a valid session exists it is restored automatically
- Protected routes stay accessible, spinner shows while resolving

---

## Extending This

**Add a new protected route**

```jsx
// App.jsx
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

const result = await client.dataApi.query(
  "SELECT * FROM posts WHERE user_id = $1",
  [user.id],
);
```
