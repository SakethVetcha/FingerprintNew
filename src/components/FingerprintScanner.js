import React, { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import FingerprintJS from '@fingerprintjs/fingerprintjs';
import { ReactComponent as ThumbIdle } from '../thumb (2).svg';
import { ReactComponent as ThumbScan } from '../thumbscan.svg';

const scanAnimation = keyframes`
  0% {
    opacity: 0;
    transform: translateY(-100%);
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0;
    transform: translateY(100%);
  }
`;

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(32, 250, 252, 0.4);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(32, 250, 252, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(32, 250, 252, 0);
  }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 100vh;
  background-color: #1a1a1a;
  color: white;
  padding-bottom: 40px;
`;

const ScannerContainer = styled.div`
  position: relative;
  width: 300px;
  height: 300px;
  border-radius: 20px;
  background: #2a2a2a;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  overflow: hidden;
  animation: ${props => props.isScanning ? pulseAnimation : 'none'} 2s infinite;
  transition: all 0.3s ease;

  &:hover {
    background: #333;
  }
`;

const ThumbIdleStyled = styled(ThumbIdle)`
  width: 200px;
  height: 200px;
  opacity: ${props => props.isScanning ? 0 : 1};
  transition: opacity 0.3s ease;
`;

const ThumbScanStyled = styled(ThumbScan)`
  width: 200px;
  height: 200px;
  position: absolute;
  opacity: ${props => props.isScanning ? 1 : 0};
  transition: opacity 0.3s ease;
`;

const ScanLine = styled.div`
  position: absolute;
  width: 100%;
  height: 4px;
  background: linear-gradient(
    90deg,
    transparent,
    #20FAFC,
    transparent
  );
  animation: ${scanAnimation} 2s linear infinite;
  display: ${props => props.isScanning ? 'block' : 'none'};
`;

const Status = styled.div`
  margin-top: 20px;
  font-size: 1.2rem;
  color: ${props => {
    switch (props.status) {
      case 'success':
        return '#20FAFC';
      case 'error':
        return '#ff4444';
      default:
        return '#fff';
    }
  }};
  word-break: break-all;
`;

const FingerprintScanner = () => {
  const [isScanning, setIsScanning] = useState(false);
  const [status, setStatus] = useState('Place your finger on the scanner');
  const [statusType, setStatusType] = useState('idle');
  const [visitorId, setVisitorId] = useState('');

  const handleScan = async () => {
    if (isScanning) return;
    setIsScanning(true);
    setStatus('Scanning...');
    setStatusType('scanning');

    // Simulate scanning process
    setTimeout(async () => {
      // Get the browser fingerprint using FingerprintJS
      const fp = await FingerprintJS.load();
      const result = await fp.get();
      setVisitorId(result.visitorId);

      setIsScanning(false);
      setStatus('Access Granted');
      setStatusType('success');

      // Reset after 4 seconds
      setTimeout(() => {
        setStatus('Place your finger on the scanner');
        setStatusType('idle');
        setVisitorId('');
      }, 4000);
    }, 2000);
  };

  return (
    <Container>
      <ScannerContainer onClick={handleScan} isScanning={isScanning}>
        <ThumbIdleStyled isScanning={isScanning} />
        <ThumbScanStyled isScanning={isScanning} />
        <ScanLine isScanning={isScanning} />
      </ScannerContainer>
      <Status status={statusType}>
        {status}
        {visitorId && (
          <div style={{ marginTop: 10, fontSize: '0.9rem', color: '#aaa' }}>
            <strong>Fingerprint ID:</strong><br />{visitorId}
          </div>
        )}
      </Status>
    </Container>
  );
};

export default FingerprintScanner;
