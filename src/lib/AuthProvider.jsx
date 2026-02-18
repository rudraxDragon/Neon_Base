import { useState, useEffect, useCallback } from "react";
import { authClient } from "./Auth.jsx";
import { AuthContext } from "./AuthContext.jsx";

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          background: "#0a0a0a",
        }}
      >
        <div
          style={{
            width: "80px",
            height: "80px",
            border: "8px solid #2a2a2a",
            borderTop: "8px solid #00e599",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, session, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
};
