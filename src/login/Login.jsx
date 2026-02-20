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
    setError("");
    setLoading(true);
    if (!email || !password) {
      setError("All fields are mandatory");
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
      setError(`Error sending OTP: ${error.message ?? error}`);
    }
  };

  const handleOTPSubmit = async () => {
    setError("");
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
          placeholder="Enter OTP"
          className="otp_input"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button type="button" className="otp_btn" onClick={handleOTPSubmit}>
          Verify
        </button>
        <button type="button" className="otp_resend" onClick={resendOtp}>
          Resend OTP
        </button>
      </div>
    );
  };

  const Google_OAuth = async () => {
    await client.auth.signIn.social({
      provider: "google",
      callbackURL: "https://yourapp.com/auth/callback",
    });
  };

  const resendOtp = async () => {
    const { error } = await client.auth.emailOtp.sendVerificationOtp({
      email: email,
      type: "sign-in",
    });
    if (error) {
      setError("Could not send OTP");
    }
  };

  return (
    <div>
      <div className="container">
        <div className="login_container">
          <p className="login_title">Welcome back</p>
          <p className="login_subtitle">Sign in to your account</p>

          <div className="oauth_group">
            <button type="button" className="oauth_btn" onClick={Google_OAuth}>
              Sign in with Google
            </button>
          </div>

          <div className="divider">
            <span>or</span>
          </div>

          <input
            placeholder="Email address"
            className="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            className="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <p className="error_msg">{error}</p>}
          <button type="button" onClick={handleInitSubmit} disabled={loading}>
            {loading
              ? "Processing..."
              : showOtpScreen
                ? "Resend OTP"
                : "Sign in"}
          </button>
          <button
            type="button"
            className="switch_btn"
            onClick={() => navigate("/SignUp")}
          >
            Don't have an account? Sign up
          </button>
          {showOtpScreen ? renderOtpRegion() : null}
        </div>
      </div>
    </div>
  );
};

export default Login;
