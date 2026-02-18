import { Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext";

const ProtectedRoutes = ({ children }) => {
  const { session } = useAuth();

  if (!session) {
    return <Navigate to="/Login" replace />;
  }

  return children;
};

export default ProtectedRoutes;
