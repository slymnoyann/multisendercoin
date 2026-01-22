"use client";

import { useState, useEffect } from "react";

export default function Home() {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return (
      <div className="app">
        <header className="app-header" role="banner">
          <div className="header-content">
            <div className="logo-section">
              <h1 className="app-title">🚀 MultiSender</h1>
              <p className="app-subtitle">Send tokens to multiple recipients in one transaction</p>
            </div>
          </div>
        </header>
        <main className="main-content" role="main">
          <div className="welcome-section" aria-labelledby="welcome-heading">
            <div className="welcome-card">
              <h2 id="welcome-heading">Loading...</h2>
              <p>Please wait while we load the application.</p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Import and render the actual component only on client
  const HomeComponent = require("@/components/Home").default;
  return <HomeComponent />;
}