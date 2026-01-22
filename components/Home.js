"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
  useBalance,
  useEstimateGas,
} from "wagmi";
import { parseUnits, formatUnits, isAddress, encodeFunctionData } from "viem";
import { MULTI_SENDER_ABI, ERC20_ABI, BASE_TOKENS } from "@/lib/contracts";

const MULTI_SENDER = process.env.NEXT_PUBLIC_MULTI_SENDER_ADDRESS || "";

function TokenSelect({ value, onChange, balance, symbol, decimals, isNative }) {
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  return (
    <div className="token-select">
      <label htmlFor="token-select" className="form-label">Select Token</label>
      <div className="token-input-group">
        <select
          id="token-select"
          value={useCustom ? "custom" : value || ""}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setUseCustom(true);
              if (custom && isAddress(custom)) onChange({ address: custom, isNative: false });
            } else if (e.target.value === "native") {
              setUseCustom(false);
              onChange({ address: "native", isNative: true });
            } else {
              setUseCustom(false);
              const token = BASE_TOKENS.find(t => t.address === e.target.value);
              onChange({ address: e.target.value, isNative: false });
            }
          }}
          className="token-select-input"
          aria-describedby="token-balance"
        >
          <option value="">Choose token</option>
          {BASE_TOKENS.map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol} - {t.name}
            </option>
          ))}
          <option value="custom">Custom ERC20 address</option>
        </select>
        {useCustom && (
          <input
            placeholder="0x..."
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              if (isAddress(e.target.value)) onChange({ address: e.target.value, isNative: false });
            }}
            className="custom-token-input"
          />
        )}
      </div>
      {balance !== undefined && (
        <div id="token-balance" className="balance-display" aria-live="polite">
          <span className="balance-icon" aria-hidden="true">💰</span>
          <span className="balance-text">
            Balance: {formatUnits(balance, decimals || 18)} {symbol || "ETH"}
          </span>
        </div>
      )}
    </div>
  );
}

function RecipientsList({ mode, rows, setRows, amountPer, setAmountPer, decimals, isNative }) {
  const [showCSVModal, setShowCSVModal] = useState(false);
  const [csvError, setCsvError] = useState("");

  const add = useCallback(() => setRows((r) => [...r, { address: "", amount: "" }]), [setRows]);
  const remove = useCallback((i) => setRows((r) => r.filter((_, j) => j !== i)), [setRows]);
  const update = useCallback((i, field, v) =>
    setRows((r) => {
      const n = [...r];
      if (!n[i]) n[i] = { address: "", amount: "" };
      n[i][field] = v;
      return n;
    }), [setRows]);

  const handleCSVUpload = useCallback(async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.name.toLowerCase().endsWith('.csv')) {
      setCsvError("Please select a CSV file");
      return;
    }

    try {
      const text = await file.text();
      const { parseCSVRecipients, validateCSVRecipients } = await import("@/lib/csvParser");

      const parsed = parseCSVRecipients(text, true, mode === "custom");
      const validation = validateCSVRecipients(parsed, mode === "custom");

      if (!validation.isValid) {
        setCsvError(validation.errors.slice(0, 5).join("\n"));
        return;
      }

      setRows((r) => [...r, ...validation.validRecipients]);
      setCsvError("");
      setShowCSVModal(false);
    } catch (error) {
      setCsvError("Failed to parse CSV file. Please check the format.");
    }

    // Reset file input
    event.target.value = "";
  }, [mode, setRows]);

  const downloadCSVTemplate = useCallback(() => {
    const { generateCSVTemplate } = require("@/lib/csvParser");
    const csv = generateCSVTemplate(mode === "custom", true);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recipients-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [mode]);

  return (
    <div className="recipients-section">
      <div className="recipients-header">
        <h3 className="section-title">Recipients</h3>
        <div className="recipient-actions">
          <button type="button" onClick={add} className="btn-add-recipient">
            <span>+</span> Add Recipient
          </button>
          <button type="button" onClick={() => setShowCSVModal(true)} className="btn-bulk-upload">
            <span>📄</span> Bulk Upload
          </button>
        </div>
      </div>

      {mode === "equal" && (
        <div className="equal-amount-input">
          <label className="form-label">Amount per recipient</label>
          <div className="amount-input-wrapper">
            <input
              type="text"
              placeholder="0.0"
              value={amountPer}
              onChange={(e) => setAmountPer(e.target.value)}
              className="amount-input"
            />
            <span className="amount-unit">{isNative ? "ETH" : "tokens"}</span>
          </div>
        </div>
      )}

      <div className="recipients-grid">
        {rows.map((r, i) => (
          <div key={i} className={`recipient-row ${!isAddress(r.address) ? 'invalid' : ''}`}>
            <div className="recipient-input-group">
              <input
                placeholder="Recipient address (0x...)"
                value={r.address}
                onChange={(e) => update(i, "address", e.target.value)}
                className="recipient-address-input"
                aria-label={`Recipient ${i + 1} address`}
                aria-invalid={!isAddress(r.address) && r.address !== ""}
              />
              {mode === "custom" && (
                <input
                  type="text"
                  placeholder="Amount"
                  value={r.amount}
                  onChange={(e) => update(i, "amount", e.target.value)}
                  className="recipient-amount-input"
                  aria-label={`Recipient ${i + 1} amount`}
                  inputMode="decimal"
                />
              )}
            </div>
            <button type="button" onClick={() => remove(i)} className="btn-remove-recipient">
              <span>×</span>
            </button>
          </div>
        ))}
      </div>

      {/* CSV Upload Modal */}
      {showCSVModal && (
        <div className="modal-overlay" onClick={() => setShowCSVModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Bulk Upload Recipients</h3>
              <button
                type="button"
                onClick={() => setShowCSVModal(false)}
                className="modal-close"
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <p className="modal-description">
                Upload a CSV file with recipient addresses {mode === "custom" ? "and amounts" : ""}.
                The file should {mode === "custom" ? "have headers: address,amount" : "have a header: address"}.
              </p>

              <div className="csv-actions">
                <button
                  type="button"
                  onClick={downloadCSVTemplate}
                  className="btn-template"
                >
                  📥 Download Template
                </button>
                <label className="btn-upload">
                  📄 Choose CSV File
                  <input
                    type="file"
                    accept=".csv"
                    onChange={handleCSVUpload}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>

              {csvError && (
                <div className="csv-error">
                  <span className="error-icon">⚠️</span>
                  <div className="error-content">
                    <strong>Upload failed:</strong>
                    <pre>{csvError}</pre>
                  </div>
                </div>
              )}

              <div className="csv-format-info">
                <h4>CSV Format:</h4>
                <code>
                  {mode === "custom"
                    ? "address,amount\n0x742d35Cc6634C0532925a3b844Bc454e4438f44e,1.5"
                    : "address\n0x742d35Cc6634C0532925a3b844Bc454e4438f44e"
                  }
                </code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TransactionSummary({ totalAmount, recipientCount, fee, symbol, isNative, gasEstimate }) {
  if (!totalAmount || recipientCount === 0) return null;

  const formatGas = (gas) => {
    if (!gas) return "Estimating...";
    return `${(Number(gas) / 1e9).toFixed(2)} gwei`;
  };

  const estimatedCost = gasEstimate ? (Number(gasEstimate) * 0.000000001 * 0.0001).toFixed(4) : null;

  return (
    <div className="transaction-summary">
      <h4 className="summary-title">Transaction Summary</h4>
      <div className="summary-grid">
        <div className="summary-item">
          <span className="summary-label">Recipients:</span>
          <span className="summary-value">{recipientCount}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">Total Amount:</span>
          <span className="summary-value">{formatUnits(totalAmount, 18)} {symbol || "ETH"}</span>
        </div>
        {fee > 0n && (
          <div className="summary-item">
            <span className="summary-label">Service Fee:</span>
            <span className="summary-value">{formatUnits(fee, 18)} {symbol || "ETH"}</span>
          </div>
        )}
        {gasEstimate && (
          <div className="summary-item">
            <span className="summary-label">Gas Estimate:</span>
            <span className="summary-value">{formatGas(gasEstimate)}</span>
          </div>
        )}
        {estimatedCost && (
          <div className="summary-item">
            <span className="summary-label">Est. Cost:</span>
            <span className="summary-value">~${estimatedCost}</span>
          </div>
        )}
      </div>
    </div>
  );
}

function TransactionHistory({ history, showHistory, setShowHistory }) {
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleString();
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  if (!showHistory) {
    return (
      <button
        type="button"
        onClick={() => setShowHistory(true)}
        className="btn-show-history"
      >
        📋 Show Transaction History ({history.length})
      </button>
    );
  }

  return (
    <div className="transaction-history">
      <div className="history-header">
        <h4 className="history-title">Transaction History</h4>
        <button
          type="button"
          onClick={() => setShowHistory(false)}
          className="btn-hide-history"
        >
          Hide
        </button>
      </div>

      {history.length === 0 ? (
        <div className="no-history">
          <span>📝</span>
          <p>No transactions yet. Your successful transactions will appear here.</p>
        </div>
      ) : (
        <div className="history-list">
          {history.map((tx) => (
            <div key={tx.id} className="history-item">
              <div className="history-item-header">
                <div className="history-token">
                  <span className="token-icon">{tx.isNative ? "💰" : "🪙"}</span>
                  <span className="token-name">{tx.token}</span>
                </div>
                <div className="history-time">
                  {formatTime(tx.timestamp)}
                </div>
              </div>

              <div className="history-details">
                <div className="history-stat">
                  <span className="stat-label">Recipients:</span>
                  <span className="stat-value">{tx.recipientCount}</span>
                </div>
                <div className="history-stat">
                  <span className="stat-label">Amount:</span>
                  <span className="stat-value">{tx.totalAmount} {tx.token}</span>
                </div>
                {tx.fee > 0 && (
                  <div className="history-stat">
                    <span className="stat-label">Fee:</span>
                    <span className="stat-value">{tx.fee} {tx.token}</span>
                  </div>
                )}
                <div className="history-stat">
                  <span className="stat-label">Mode:</span>
                  <span className="stat-value">{tx.mode === "equal" ? "Equal" : "Custom"}</span>
                </div>
              </div>

              <div className="history-actions">
                <button
                  type="button"
                  onClick={() => copyToClipboard(tx.hash)}
                  className="btn-copy-hash"
                  title="Copy transaction hash"
                >
                  📋 Copy Hash
                </button>
                <a
                  href={`https://basescan.org/tx/${tx.hash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-view-tx"
                >
                  🔍 View on BaseScan
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Home() {
  const [token, setToken] = useState({ address: "", isNative: false });
  const [mode, setMode] = useState("equal");
  const [amountPer, setAmountPer] = useState("");
  const [rows, setRows] = useState([{ address: "", amount: "" }]);
  const [status, setStatus] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);

  const { address, isConnected } = useAccount();

  // Load transaction history from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('multisender_history');
      if (saved) {
        try {
          setTransactionHistory(JSON.parse(saved));
        } catch (error) {
          console.error('Failed to load transaction history:', error);
        }
      }
    }
  }, []);

  // Save transaction history to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('multisender_history', JSON.stringify(transactionHistory));
    }
  }, [transactionHistory]);

  // Token balance
  const { data: erc20Balance } = useReadContract({
    address: token.address && !token.isNative && isAddress(token.address) ? token.address : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: nativeBalance } = useBalance({
    address: address,
  });

  const balance = token.isNative ? nativeBalance?.value : erc20Balance;

  // Token metadata
  const { data: decimals } = useReadContract({
    address: token.address && !token.isNative && isAddress(token.address) ? token.address : undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const { data: symbol } = useReadContract({
    address: token.address && !token.isNative && isAddress(token.address) ? token.address : undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  // Contract data
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token.address && !token.isNative && isAddress(token.address) ? token.address : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && MULTI_SENDER ? [address, MULTI_SENDER] : undefined,
  });

  const { data: feePercentage } = useReadContract({
    address: MULTI_SENDER,
    abi: MULTI_SENDER_ABI,
    functionName: "feePercentage",
  });

  // Transaction hooks
  const {
    writeContract: approve,
    data: approveData,
    isPending: approvePending,
    error: approveError,
  } = useWriteContract();

  const { isLoading: approveConfirming } = useWaitForTransactionReceipt({ hash: approveData });

  const {
    writeContract: sendTx,
    data: sendData,
    isPending: sendPending,
    error: sendError,
  } = useWriteContract();

  const { isLoading: sendConfirming } = useWaitForTransactionReceipt({ hash: sendData });

  // Effects
  useEffect(() => {
    if (approveConfirming === false && approveData) {
      refetchAllowance?.();
    }
  }, [approveConfirming, approveData, refetchAllowance]);

  const decimalsNum = decimals != null ? Number(decimals) : 18;
  const selectedToken = BASE_TOKENS.find(t => t.address === token.address);

  const { recipients, amounts } = useMemo(() => {
    if (mode === "equal") {
      const rec = rows.map((r) => r.address).filter((a) => isAddress(a));
      if (!amountPer || isNaN(Number(amountPer)) || rec.length === 0) return { recipients: [], amounts: [] };
      try {
        const a = parseUnits(amountPer, decimalsNum);
        return { recipients: rec, amounts: rec.map(() => a) };
      } catch {
        return { recipients: [], amounts: [] };
      }
    }
    const valid = rows.filter(
      (r) => isAddress(r.address) && r.amount != null && r.amount !== "" && !isNaN(Number(r.amount))
    );
    const amt = [];
    for (const r of valid) {
      try {
        amt.push(parseUnits(r.amount, decimalsNum));
      } catch {
        return { recipients: [], amounts: [] };
      }
    }
    return {
      recipients: valid.map((r) => r.address),
      amounts: amt,
    };
  }, [mode, rows, amountPer, decimalsNum]);

  const totalWei = useMemo(() => amounts.reduce((a, b) => a + b, 0n), [amounts]);
  const estimatedFee = useMemo(() => {
    if (!feePercentage || totalWei === 0n) return 0n;
    return (totalWei * BigInt(feePercentage)) / 10000n;
  }, [totalWei, feePercentage]);

  const canSend = (token.address || token.isNative) && MULTI_SENDER && recipients.length > 0 && amounts.length === recipients.length && totalWei > 0n;

  // Gas estimation for ERC20 transfers
  const erc20Data = useMemo(() => {
    if (!canSend || token.isNative || !MULTI_SENDER) return undefined;
    try {
      if (mode === "equal" && amounts.length > 0) {
        const abiItem = MULTI_SENDER_ABI.find(abi => abi.name === "sendEqual");
        if (abiItem && abiItem.inputs) {
          return encodeFunctionData({
            abi: [abiItem],
            functionName: "sendEqual",
            args: [token.address, recipients, amounts[0]],
          });
        }
      } else {
        const abiItem = MULTI_SENDER_ABI.find(abi => abi.name === "sendToMany");
        if (abiItem && abiItem.inputs) {
          return encodeFunctionData({
            abi: [abiItem],
            functionName: "sendToMany",
            args: [token.address, recipients, amounts],
          });
        }
      }
    } catch (error) {
      console.error("Error encoding ERC20 function data:", error);
    }
    return undefined;
  }, [canSend, token.isNative, token.address, mode, recipients, amounts, MULTI_SENDER]);

  const { data: erc20GasEstimate } = useEstimateGas({
    to: MULTI_SENDER,
    data: erc20Data,
    value: 0n,
    query: {
      enabled: !!erc20Data,
    },
  });

  // Gas estimation for native transfers
  const nativeData = useMemo(() => {
    if (!canSend || !token.isNative || !MULTI_SENDER) return undefined;
    try {
      if (mode === "equal" && amounts.length > 0) {
        const abiItem = MULTI_SENDER_ABI.find(abi => abi.name === "sendNativeEqual");
        if (abiItem && abiItem.inputs) {
          return encodeFunctionData({
            abi: [abiItem],
            functionName: "sendNativeEqual",
            args: [recipients, amounts[0]],
          });
        }
      } else {
        const abiItem = MULTI_SENDER_ABI.find(abi => abi.name === "sendNativeToMany");
        if (abiItem && abiItem.inputs) {
          return encodeFunctionData({
            abi: [abiItem],
            functionName: "sendNativeToMany",
            args: [recipients, amounts],
          });
        }
      }
    } catch (error) {
      console.error("Error encoding native function data:", error);
    }
    return undefined;
  }, [canSend, token.isNative, mode, recipients, amounts, MULTI_SENDER]);

  const { data: nativeGasEstimate } = useEstimateGas({
    to: MULTI_SENDER,
    data: nativeData,
    value: totalWei + estimatedFee,
    query: {
      enabled: !!nativeData && totalWei > 0n,
    },
  });

  const needsApproval = !token.isNative && allowance != null && totalWei > 0n && allowance < totalWei;
  const hasEnoughBalance = balance != null && totalWei + estimatedFee <= balance;

  const doApprove = async () => {
    if (!token.address || !MULTI_SENDER || totalWei === 0n) return;
    setIsLoading(true);
    setStatus("Approving token spending...");
    try {
      approve({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [MULTI_SENDER, totalWei + estimatedFee],
      });
    } catch (error) {
      setStatus(`Approval failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  const doSend = async () => {
    if (!MULTI_SENDER || recipients.length === 0) return;
    setIsLoading(true);
    setStatus("Sending transaction...");

    try {
      if (token.isNative) {
        // Native token transfer
        const value = totalWei + estimatedFee;
        if (mode === "equal" && amounts.length > 0) {
          sendTx({
            address: MULTI_SENDER,
            abi: MULTI_SENDER_ABI,
            functionName: "sendNativeEqual",
            args: [recipients, amounts[0]],
            value: value,
          });
        } else {
          sendTx({
            address: MULTI_SENDER,
            abi: MULTI_SENDER_ABI,
            functionName: "sendNativeToMany",
            args: [recipients, amounts],
            value: value,
          });
        }
      } else {
        // ERC20 transfer
        if (mode === "equal" && amounts.length > 0) {
          sendTx({
            address: MULTI_SENDER,
            abi: MULTI_SENDER_ABI,
            functionName: "sendEqual",
            args: [token.address, recipients, amounts[0]],
          });
        } else {
          sendTx({
            address: MULTI_SENDER,
            abi: MULTI_SENDER_ABI,
            functionName: "sendToMany",
            args: [token.address, recipients, amounts],
          });
        }
      }
    } catch (error) {
      setStatus(`Transaction failed: ${error.message}`);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (approveError) setStatus(`Approval error: ${approveError.message}`);
    else if (sendError) setStatus(`Send error: ${sendError.message}`);
    setIsLoading(false);
  }, [approveError, sendError]);

  useEffect(() => {
    if (sendConfirming === false && sendData) {
      setStatus("✅ Transaction completed successfully!");

      // Add to transaction history
      const newTransaction = {
        id: sendData,
        timestamp: Date.now(),
        token: token.isNative ? "ETH" : (symbol || token.address),
        isNative: token.isNative,
        recipientCount: recipients.length,
        totalAmount: formatUnits(totalWei, decimalsNum),
        fee: formatUnits(estimatedFee, decimalsNum),
        recipients: recipients.slice(0, 3), // Store first 3 recipients
        mode: mode,
        hash: sendData,
      };

      setTransactionHistory(prev => [newTransaction, ...prev.slice(0, 9)]); // Keep last 10

      setRows([{ address: "", amount: "" }]);
      setAmountPer("");
      setIsLoading(false);
    }
  }, [sendConfirming, sendData, token, symbol, recipients, totalWei, estimatedFee, decimalsNum, mode]);


  return (
    <div className="app">
      <header className="app-header" role="banner">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="app-title">🚀 MultiSender</h1>
            <p className="app-subtitle">Send tokens to multiple recipients in one transaction</p>
          </div>
          <div role="region" aria-label="Wallet connection">
            <ConnectButton />
          </div>
        </div>
      </header>

      <main className="main-content" role="main">
        {!isConnected ? (
          <section className="welcome-section" aria-labelledby="welcome-heading">
            <div className="welcome-card">
              <h2 id="welcome-heading">Connect Your Wallet</h2>
              <p>Connect your wallet to start sending tokens to multiple recipients efficiently.</p>
              <div className="features-grid">
                <div className="feature-item">
                  <span className="feature-icon">⚡</span>
                  <span>Gas Optimized</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🔒</span>
                  <span>Secure & Audited</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">💰</span>
                  <span>Low Fees</span>
                </div>
                <div className="feature-item">
                  <span className="feature-icon">🌐</span>
                  <span>Multi-Token Support</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          <section className="send-form" aria-labelledby="form-heading">
            <div className="form-card">
              <h2 id="form-heading" className="sr-only">Send Tokens Form</h2>
              <TokenSelect
                value={token.address}
                onChange={setToken}
                balance={balance}
                symbol={token.isNative ? "ETH" : symbol}
                decimals={decimalsNum}
                isNative={token.isNative}
              />

              <fieldset className="mode-selector">
                <legend className="form-label">Distribution Mode</legend>
                <div className="mode-buttons" role="radiogroup" aria-labelledby="mode-legend">
                  <button
                    type="button"
                    className={`mode-btn ${mode === "equal" ? "active" : ""}`}
                    onClick={() => setMode("equal")}
                    aria-pressed={mode === "equal"}
                    aria-describedby="equal-mode-desc"
                  >
                    <span className="mode-icon" aria-hidden="true">⚖️</span>
                    Equal Amounts
                  </button>
                  <span id="equal-mode-desc" className="sr-only">
                    Send the same amount to all recipients
                  </span>
                  <button
                    type="button"
                    className={`mode-btn ${mode === "custom" ? "active" : ""}`}
                    onClick={() => setMode("custom")}
                    aria-pressed={mode === "custom"}
                    aria-describedby="custom-mode-desc"
                  >
                    <span className="mode-icon" aria-hidden="true">🎯</span>
                    Custom Amounts
                  </button>
                  <span id="custom-mode-desc" className="sr-only">
                    Send different amounts to each recipient
                  </span>
                </div>
              </fieldset>

              <RecipientsList
                mode={mode}
                rows={rows}
                setRows={setRows}
                amountPer={amountPer}
                setAmountPer={setAmountPer}
                decimals={decimalsNum}
                isNative={token.isNative}
              />

              <TransactionSummary
                totalAmount={totalWei}
                recipientCount={recipients.length}
                fee={estimatedFee}
                symbol={token.isNative ? "ETH" : symbol}
                isNative={token.isNative}
                gasEstimate={token.isNative ? nativeGasEstimate : erc20GasEstimate}
              />

              {status && (
                <div className={`status-message ${status.includes('error') || status.includes('failed') ? 'error' : status.includes('success') ? 'success' : 'info'}`}>
                  <span className="status-icon">
                    {status.includes('success') ? '✅' : status.includes('error') || status.includes('failed') ? '❌' : '⏳'}
                  </span>
                  <span>{status}</span>
                </div>
              )}

              {canSend && (
                <div className="action-buttons">
                  {!token.isNative && needsApproval && (
                    <button
                      onClick={doApprove}
                      disabled={approvePending || approveConfirming || !hasEnoughBalance || isLoading}
                      className="btn-approve"
                      aria-describedby="approve-desc"
                    >
                      {approvePending || approveConfirming ? (
                        <>
                          <span className="loading-spinner" aria-hidden="true"></span>
                          Approving...
                        </>
                      ) : (
                        "Approve Token"
                      )}
                    </button>
                  )}
                  <div id="approve-desc" className="sr-only">
                    Approve the contract to spend your tokens before sending
                  </div>
                  <button
                    onClick={doSend}
                    disabled={
                      isLoading ||
                      sendPending ||
                      sendConfirming ||
                      (!token.isNative && needsApproval && (allowance == null || allowance < totalWei)) ||
                      !hasEnoughBalance
                    }
                    className="btn-send"
                    aria-describedby="send-desc"
                  >
                    {sendPending || sendConfirming ? (
                      <>
                        <span className="loading-spinner" aria-hidden="true"></span>
                        Sending...
                      </>
                    ) : (
                      <>
                        <span aria-hidden="true">🚀</span>
                        Send Transaction
                      </>
                    )}
                  </button>
                  <div id="send-desc" className="sr-only">
                    Send tokens to all recipients in one transaction
                  </div>
                </div>
              )}

              {canSend && !hasEnoughBalance && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  Insufficient balance for this transaction
                </div>
              )}

              {isConnected && !MULTI_SENDER && (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  Contract not deployed. Set NEXT_PUBLIC_MULTI_SENDER_ADDRESS in .env
                </div>
              )}

              {isConnected && (
                <TransactionHistory
                  history={transactionHistory}
                  showHistory={showHistory}
                  setShowHistory={setShowHistory}
                />
              )}
            </div>
          </section>
        )}
      </main>

      <footer className="app-footer">
        <div className="footer-content">
          <p>Built for Base Network • Gas Optimized • Secure</p>
          <a href="https://base.org" target="_blank" rel="noopener noreferrer" className="base-link">
            Base
          </a>
        </div>
      </footer>
    </div>
  );
}