import client from "../lib/client.jsx";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import "./SignUp.css";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
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

    const result = await client.auth.signUp.email({
      email: email,
      password: password,
      name: email,
    });

    if (result.error) {
      setError(result.error.message ?? "Sign up failed, please try again");
    } else {
      if (result.data?.user && !result.data.user.emailVerified) {
        setShowOtp(true);
      }
    }
    setLoading(false);
  };

  const handleOtpVerify = async () => {
    setError("");
    if (!otp) {
      setError("Please enter your OTP");
      return;
    }

    const { data, error } = await client.auth.emailOtp.verifyEmail({
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

  const resendOtp = async () => {
    setError("");
    const { error } = await client.auth.emailOtp.sendVerificationOtp({
      email: email,
      type: "sign-in",
    });

    if (error) {
      setError("Could not send OTP");
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
        <button type="button" className="otp_btn" onClick={handleOtpVerify}>
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

  const Zoho_OAuth = async () => {
    await client.auth.signIn.social({
      provider: "zoho",
      callbackURL: "https://yourapp.com/auth/callback",
    });
  };

  return (
    <div className="container">
      <div className="sign_up_container">
        <p className="signup_title">Create an account</p>
        <p className="signup_subtitle">Sign up to get started</p>

        <div className="oauth_group">
          <button type="button" className="oauth_btn" onClick={Google_OAuth}>
            Sign up with Google
          </button>
          <button type="button" className="oauth_btn" onClick={Zoho_OAuth}>
            Sign up with Zoho
          </button>
        </div>

        <div className="divider">
          <span>or</span>
        </div>

        <input
          placeholder="Email address"
          className="email_input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Password"
          className="password_input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <p className="error_msg">{error}</p>}
        <button type="button" disabled={loading} onClick={handleInitSubmit}>
          {loading ? "Processing..." : "Sign up"}
        </button>
        <button
          type="button"
          className="switch_btn"
          onClick={() => navigate("/Login")}
        >
          Already have an account? Sign in
        </button>
        {showOtp ? renderOtpRegion() : null}
      </div>
    </div>
  );
};

export default SignUp;
