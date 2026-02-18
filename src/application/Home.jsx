import "./Home.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext";
import client from "../lib/client";

const Home = () => {
  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const handleSignOut = async () => {
    const { error } = await client.auth.signOut();

    if (error) {
      console.error("Sign out error:", error.message);
    } else {
      await refreshSession();
      navigate("/Login");
    }
  };

  return (
    <div className="home-container">
      <h1>Hello Logged In User :)</h1>
      <button type="submit" onClick={handleSignOut}>
        Log Out
      </button>
    </div>
  );
};

export default Home;
