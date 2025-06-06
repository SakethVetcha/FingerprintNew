import React, { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import styled, { keyframes } from "styled-components";
import { ReactComponent as ThumbIdle } from "../thumb (2).svg";
import { ReactComponent as ThumbScan } from "../thumbscan.svg";

const scanAnimation = keyframes`
  0% { opacity: 0; transform: translateY(-100%);}
  50% { opacity: 1;}
  100% { opacity: 0; transform: translateY(100%);}
`;

const pulseAnimation = keyframes`
  0% { box-shadow: 0 0 0 0 rgba(32, 250, 252, 0.4);}
  70% { box-shadow: 0 0 0 10px rgba(32, 250, 252, 0);}
  100% { box-shadow: 0 0 0 0 rgba(32, 250, 252, 0);}
`;

const Container = styled.div`
  max-width: 350px;
  margin: 40px auto;
  padding: 2rem;
  background: #232323;
  color: #fff;
  border-radius: 10px;
  box-shadow: 0 4px 24px #0003;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Input = styled.input`
  margin: 1rem 0;
  padding: 0.7rem;
  width: 100%;
  border-radius: 5px;
  border: line;
  border-color:#232323;
  border-thickness:5px;
  font-size: 1rem;
`;

const Button = styled.button`
  padding: 0.7rem 1.5rem;
  margin-top: 1rem;
  background: #20fafc;
  color: #232323;
  border: none;
  border-radius: 5px;
  font-weight: bold;
  cursor: pointer;
`;

const ScannerContainer = styled.div`
  position: relative;
  width: 180px;
  height: 180px;
  border-radius: 20px;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  margin: 1rem auto;
  animation: ${props => props.isScanning ? pulseAnimation : 'none'} 2s infinite;
  transition: all 0.3s ease;

  &:hover {
    background: #333;
  }
`;

const ThumbIdleStyled = styled(ThumbIdle)`
  width: 120px;
  height: 120px;
  opacity: ${props => props.isScanning ? 0 : 1};
  transition: opacity 0.3s ease;
`;

const ThumbScanStyled = styled(ThumbScan)`
  width: 120px;
  height: 120px;
  position: absolute;
  opacity: ${props => props.isScanning ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const ScanLine = styled.div`
  position: absolute;
  width: 100%;
  height: 4px;
  background: linear-gradient(90deg, transparent, #20FAFC, transparent);
  animation: ${scanAnimation} 2s linear infinite;
  display: ${props => props.isScanning ? 'block' : 'none'};
`;

const Status = styled.div`
  margin-top: 1rem;
  color: ${({ success }) => (success === true ? "#20FAFC" : success === false ? "#ff4444" : "#fff")};
  font-weight: bold;
  word-break: break-all;
`;

//Functionality
const AuthFingerprint = () => {
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState("register"); // "register" or "login"
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(null);
  const [visitorId, setVisitorId] = useState("");

  // Check if already registered
  useEffect(() => {
    if (localStorage.getItem("fp_phone") && localStorage.getItem("fp_id")) {
      setPhase("login");
    }
  }, []);

  // Handle Scan (used for both register and login)
  const handleScan = async () => {
    if (isScanning) return;
    if (!phone.match(/^\d{10}$/)) {
      setStatus("Enter a valid phone number.");
      setSuccess(false);
      return;
    }
    setIsScanning(true);
    setStatus("Scanning...");
    setSuccess(null);

    // Simulate scanning animation
    setTimeout(async () => {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setVisitorId(result.visitorId);

      if (phase === "register") {
        // Save to localStorage
        localStorage.setItem("fp_phone", phone);
        localStorage.setItem("fp_id", result.visitorId);
        setStatus("Registered! You can now login.");
        setSuccess(true);
        setPhase("login");
        setPhone("");
      } else {
        // Login: compare values
        const storedPhone = localStorage.getItem("fp_phone");
        const storedId = localStorage.getItem("fp_id");
        if (phone === storedPhone && result.visitorId === storedId) {
          setStatus("Access Granted!");
          setSuccess(true);
        } else {
          setStatus("Access Denied!");
          setSuccess(false);
        }
      }
      setIsScanning(false);
      // Hide visitorId after 4s if login
      if (phase === "login") {
        setTimeout(() => setVisitorId(""), 4000);
      }
    }, 2000);
  };

  return (
    <Container>
      <h2>{phase === "register" ? "Register" : "Login"}</h2>
      <Input
        type="tel"
        placeholder="Phone Number"
        value={phone}
        onChange={e => setPhone(e.target.value)}
        disabled={isScanning}
      />
      <ScannerContainer onClick={handleScan} isScanning={isScanning}>
        <ThumbIdleStyled isScanning={isScanning} />
        <ThumbScanStyled isScanning={isScanning} />
        <ScanLine isScanning={isScanning} />
      </ScannerContainer>
      <Button onClick={handleScan} disabled={isScanning}>
        {phase === "register" ? "Register" : "Login"} with Fingerprint
      </Button>
      <Status success={success}>
        {status}
        {visitorId && (
          <div style={{ marginTop: 10, fontSize: '0.9rem', color: '#aaa' }}>
            <strong>Fingerprint ID has been set</strong>
          </div>
        )}
      </Status>
      {phase === "login" && (
        <Button
          style={{ marginTop: "2rem", background: "#444", color: "#fff" }}
          onClick={() => {
            localStorage.removeItem("fp_phone");
            localStorage.removeItem("fp_id");
            setPhase("register");
            setStatus("");
            setSuccess(null);
            setPhone("");
            setVisitorId("");
          }}
        >
          Reset Registration
        </Button>
      )}
    </Container>
  );
};

export default AuthFingerprint;
