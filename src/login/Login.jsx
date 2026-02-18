import client from "../lib/client.jsx";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/AuthContext.jsx";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [error, setError] = useState("");
  const { refreshSession } = useAuth();

  const navigate = useNavigate();

  const handleInitSubmit = async () => {
    setLoading(true);
    if (!email || !password) {
      setError("All feilds are mandetory");
      setLoading(false);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email");
      setLoading(false);
      return;
    }

    const { data, error } = await client.auth.signIn.email({
      email: email,
      password: password,
    });

    if (error) {
      setError("Invalid email or password");
    } else {
      setShowOtpScreen(true);
      sendOtp();
    }
    setLoading(false);
  };

  const sendOtp = async () => {
    const { error } = await client.auth.emailOtp.sendVerificationOtp({
      email: email,
      type: "sign-in",
    });

    if (error) {
      setError("error in sending otp, log: ", error);
    }
  };

  const handleOTPSubmit = async () => {
    if (!otp) {
      setError("Please enter your OTP");
      return;
    }

    const { data, error } = await client.auth.signIn.emailOtp({
      email: email,
      otp: otp,
    });

    if (error) {
      setError("Incorrect OTP, please try again");
    } else {
      await refreshSession();
      navigate("/Home");
    }
  };

  const renderOtpRegion = () => {
    return (
      <div className="otp_section">
        <input
          placeholder="Enter Otp"
          className="opt_input"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button type="submit" className="otp_btn" onClick={handleOTPSubmit}>
          Verify
        </button>
      </div>
    );
  };

  return (
    <div>
      <div className="container">
        <div className="login_container">
          <input
            placeholder="Enter Email"
            className="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Enter Password"
            className="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && (
            <p
              style={{
                color: "#ff4444",
                fontSize: "13px",
                marginBottom: "8px",
              }}
            >
              {error}
            </p>
          )}
          <button type="submit" onClick={handleInitSubmit}>
            {loading
              ? "processing request ..."
              : showOtpScreen
                ? "Resend Otp"
                : "Login"}
          </button>
          <button
            type="submit"
            className="switch_btn"
            onClick={() => navigate("/SignUp")}
          >
            switch to Sign Up
          </button>
          {showOtpScreen ? renderOtpRegion() : null}
        </div>
      </div>
    </div>
  );
};

export default Login;
