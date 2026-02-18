import SignUp from "./signUp/SignUp.jsx";
import Login from "./login/Login.jsx";
import Home from "./application/Home.jsx";
import ProtectedRoutes from "./lib/ProtectedRoutes.jsx";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./lib/AuthContext.jsx";

const RootRedirect = () => {
  const { session } = useAuth();
  return <Navigate to={session ? "/Home" : "/Login"} replace />;
};

export default function App() {
  return (
    <Routes>
      <Route path="/SignUp" element={<SignUp />} />
      <Route path="/Login" element={<Login />} />
      <Route
        path="Home"
        element={
          <ProtectedRoutes>
            <Home />
          </ProtectedRoutes>
        }
      />
      <Route path="/" element={<RootRedirect />} />
    </Routes>
  );
}
