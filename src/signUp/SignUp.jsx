import client from "../lib/client.jsx";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { useAuth } from "../lib/AuthContext.jsx";
import "./SignUp.css";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const { refreshSession } = useAuth();

  const navigate = useNavigate();

  const handleInitSubmit = async () => {
    setLoading(true);
    const result = await client.auth.signUp.email({
      email: email,
      password: password,
      name: name,
    });

    if (result.error) {
      console.log("ah man ... error log: ", result.error.message);
    } else {
      console.log("check mail (hopefully) log : ", result.data.user);

      await handleOtpSubmit();
    }
    setLoading(false);
  };

  const handleOtpSubmit = async () => {
    const { error } = await client.auth.emailOtp.sendVerificationOtp({
      email: email,
      type: "email-verification",
    });
    if (error) {
      console.log("error during otp verification : ", error);
    } else {
      setShowOtp(true);
    }
  };

  const handleOtpVerify = async () => {
    if (!email || !password || !name) {
      console.log("add all feilds before you verify");
      return;
    }
    const { data, error } = await client.auth.emailOtp.verifyEmail({
      email: email,
      otp: otp,
    });

    if (error) {
      console.log("otp verification failed , log : ", error);
    } else {
      await refreshSession();
      navigate("/Home");
    }
  };

  const renderOtpRegion = () => {
    return (
      <div className="otp-container">
        <h1>Enter your otp here:</h1>
        <input
          placeholder="Enter Otp"
          className="opt_input"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />
        <button type="submit" onClick={handleOtpVerify}>
          Verify
        </button>
      </div>
    );
  };

  return (
    <div className="container">
      <div className="sign_up_container">
        <input
          placeholder="Enter Email"
          className="email_input"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          placeholder="Enter Password"
          className="password_input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <input
          placeholder="Enter Full Name"
          className="name_input"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <button type="submit" disabled={loading} onClick={handleInitSubmit}>
          {loading ? "wait ..." : "Sign Up"}
        </button>
        {!showOtp ? null : renderOtpRegion()}
      </div>
      <button type="submit" onClick={() => navigate("/Login")}>
        switch to Login
      </button>
    </div>
  );
};

export default SignUp;
