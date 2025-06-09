import React, { useState, useEffect } from "react";
import FingerprintJS from "@fingerprintjs/fingerprintjs";
import styled, { keyframes } from "styled-components";
import { ReactComponent as ThumbIdle } from "../thumb (2).svg";
import { ReactComponent as ThumbScan } from "../thumbscan.svg";

// Animations
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

// Styled Components
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
  border: 1px solid #444;
  font-size: 1rem;
  background: #333;
  color: #fff;
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
  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
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
  z-index: 1;
`;

const Status = styled.div`
  margin-top: 1rem;
  color: ${({ success }) => (success === true ? "#20FAFC" : success === false ? "#ff4444" : "#fff")};
  font-weight: bold;
  word-break: break-all;
`;

// Main Component
const AuthFingerprint = () => {
  const [phone, setPhone] = useState("");
  const [phase, setPhase] = useState("register"); // "register" or "login"
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState("");
  const [success, setSuccess] = useState(null);
  const [visitorId, setVisitorId] = useState("");

  // Test server connection on component mount
  useEffect(() => {
    const testConnection = async () => {
      try {
        const response = await fetch('http://localhost:3001/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ phone: '1234567890', visitorId: 'test' }),
        });
        console.log('Server test response:', response.status);
        if (response.ok) {
          setStatus("Server is connected and ready");
        } else {
          setStatus("Server is running but returned an error");
        }
      } catch (error) {
        console.error('Server connection test failed:', error);
        setStatus("Cannot connect to server. Please check if the server is running.");
      }
    };
    testConnection();
  }, []);

  // Handle Scan (used for both register and login)
  const handleScan = async () => {
    if (isScanning) return;
    if (!phone.match(/^\d{10,}$/)) {
      setStatus("Enter a valid phone number (10+ digits).");
      setSuccess(false);
      return;
    }
    setIsScanning(true);
    setStatus("Scanning...");
    setSuccess(null);

    try {
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setVisitorId(result.visitorId);

      // Use backend API instead of localStorage
      const endpoint = phase === "register" ? "/register" : "/login";
      const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';
      
      try {
        console.log('Sending request to:', `${API_URL}${endpoint}`);
        console.log('Request body:', { phone, visitorId: result.visitorId });
        
        const response = await fetch(`${API_URL}${endpoint}`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({ phone, visitorId: result.visitorId }),
        });

        console.log('Response status:', response.status);
        let data = {};
        const text = await response.text();
        console.log('Raw response:', text);
        
        try {
          data = text ? JSON.parse(text) : {};
          console.log('Parsed response:', data);
        } catch (e) {
          console.error('JSON parse error:', e);
          data = {};
        }

        if (!response.ok) {
          console.log('Response not OK:', response.status);
          // Show specific error messages for registration and login
          if (phase === "register") {
            if (data.error === "Phone already registered") {
              setStatus("This phone number is already registered. Please login or use a different number.");
            } else if (data.error === "Device already registered") {
              setStatus("This fingerprint is already registered with another phone number.");
            } else {
              setStatus(data.error || "Registration failed. Please try again.");
            }
          } else {
            if (data.error === "Phone not registered") {
              setStatus("This phone number is not registered. Please register first.");
            } else if (data.error === "Fingerprint mismatch") {
              setStatus("Fingerprint does not match the registered device for this phone number.");
            } else {
              setStatus(data.error || "Login failed. Please try again.");
            }
          }
          setSuccess(false);
          return;
        }

        // If we get here, response was OK
        if (phase === "register") {
          if (data.success) {
            setStatus("Registration successful! You can now login.");
            setSuccess(true);
            setPhase("login");
            setPhone("");
          } else {
            setStatus("Registration failed. Please try again.");
            setSuccess(false);
          }
        } else {
          if (data.success) {
            setStatus("Access Granted!");
            setSuccess(true);
          } else {
            setStatus("Access Denied - Invalid credentials");
            setSuccess(false);
          }
        }
      } catch (error) {
        console.error('Network error:', error);
        setStatus("Cannot connect to server. Please check if the server is running.");
        setSuccess(false);
      } finally {
        setIsScanning(false);
        if (phase === "login") {
          setTimeout(() => setVisitorId(""), 4000);
        }
      }
    } catch (error) {
      setStatus(error.message || "An error occurred");
      setSuccess(false);
    }
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
        {isScanning
          ? "Scanning..."
          : `${phase === "register" ? "Register" : "Login"} with Fingerprint`}
      </Button>
      <Status success={success}>
        {status}
        {visitorId && (
          <div style={{ marginTop: 10, fontSize: '0.9rem', color: '#aaa' }}>
            <strong>Fingerprint ID:</strong><br />{visitorId}
          </div>
        )}
      </Status>
      {phase === "login" && (
        <Button
          style={{ marginTop: "2rem", background: "#444", color: "#fff" }}
          onClick={() => {
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
