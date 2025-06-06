import React, { useState } from "react";
import "./fingerprint.css";


const FakeFingerprintAccess = () => {
  const [access, setAccess] = useState(false);

  const handleScan = () => {
    setAccess(true);
    setTimeout(() => setAccess(false), 2000);
  };

  return (
    <div className="fingerprint-container">
      <div className={`fingerprint ${access ? "scanned" : ""}`} onClick={handleScan}>
        <div className="lines"></div>
      </div>
      <button onClick={handleScan}>Scan Fingerprint</button>
      {access && <div className="access-granted">Access Granted</div>}
    </div>
  );
};

export default FakeFingerprintAccess;
