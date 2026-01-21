"use client";

import { useState, useMemo, useEffect } from "react";
import { ConnectButton } from "@rainbow-me/rainbowkit";
import {
  useAccount,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { parseUnits, formatUnits, isAddress } from "viem";
import { MULTI_SENDER_ABI, ERC20_ABI, BASE_TOKENS } from "@/lib/contracts";

const MULTI_SENDER = process.env.NEXT_PUBLIC_MULTI_SENDER_ADDRESS || "";

function TokenSelect({ value, onChange, balance, symbol, decimals }) {
  const [custom, setCustom] = useState("");
  const [useCustom, setUseCustom] = useState(false);

  return (
    <div className="token-select">
      <label>Token</label>
      <div className="token-row">
        <select
          value={useCustom ? "custom" : value || ""}
          onChange={(e) => {
            if (e.target.value === "custom") {
              setUseCustom(true);
              if (custom && isAddress(custom)) onChange(custom);
            } else {
              setUseCustom(false);
              onChange(e.target.value);
            }
          }}
        >
          <option value="">Select token</option>
          {BASE_TOKENS.map((t) => (
            <option key={t.address} value={t.address}>
              {t.symbol}
            </option>
          ))}
          <option value="custom">Custom address</option>
        </select>
        {useCustom && (
          <input
            placeholder="0x..."
            value={custom}
            onChange={(e) => {
              setCustom(e.target.value);
              if (isAddress(e.target.value)) onChange(e.target.value);
            }}
            className="input-addr"
          />
        )}
      </div>
      {balance !== undefined && value && (
        <p className="balance">Balance: {formatUnits(balance, decimals || 18)} {symbol || "?"}</p>
      )}
    </div>
  );
}

function RecipientsList({ mode, rows, setRows, amountPer, setAmountPer, decimals }) {
  const add = () => setRows((r) => [...r, { address: "", amount: "" }]);
  const remove = (i) => setRows((r) => r.filter((_, j) => j !== i));
  const update = (i, field, v) =>
    setRows((r) => {
      const n = [...r];
      if (!n[i]) n[i] = { address: "", amount: "" };
      n[i][field] = v;
      return n;
    });

  return (
    <div className="recipients">
      <div className="recipients-head">
        <span>Recipients</span>
        <button type="button" onClick={add} className="btn-add">
          + Add
        </button>
      </div>
      {mode === "equal" && (
        <div className="equal-amount">
          <label>Amount per recipient</label>
          <input
            type="text"
            placeholder="0.0"
            value={amountPer}
            onChange={(e) => setAmountPer(e.target.value)}
          />
        </div>
      )}
      <div className="rows">
        {rows.map((r, i) => (
          <div key={i} className="row">
            <input
              placeholder="0x..."
              value={r.address}
              onChange={(e) => update(i, "address", e.target.value)}
            />
            {mode === "custom" && (
              <input
                placeholder="Amount"
                value={r.amount}
                onChange={(e) => update(i, "amount", e.target.value)}
              />
            )}
            <button type="button" onClick={() => remove(i)} className="btn-remove">
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Home() {
  const [token, setToken] = useState("");
  const [mode, setMode] = useState("equal");
  const [amountPer, setAmountPer] = useState("");
  const [rows, setRows] = useState([{ address: "", amount: "" }]);
  const [status, setStatus] = useState("");
  const [approveHash, setApproveHash] = useState(null);

  const { address, isConnected } = useAccount();

  const { data: balance } = useReadContract({
    address: token && isAddress(token) ? token : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: decimals } = useReadContract({
    address: token && isAddress(token) ? token : undefined,
    abi: ERC20_ABI,
    functionName: "decimals",
  });

  const { data: symbol } = useReadContract({
    address: token && isAddress(token) ? token : undefined,
    abi: ERC20_ABI,
    functionName: "symbol",
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: token && isAddress(token) ? token : undefined,
    abi: ERC20_ABI,
    functionName: "allowance",
    args: address && MULTI_SENDER ? [address, MULTI_SENDER] : undefined,
  });

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

  useEffect(() => {
    if (approveData) setApproveHash(approveData);
  }, [approveData]);

  useEffect(() => {
    if (approveConfirming === false && approveData) {
      refetchAllowance?.();
      setApproveHash(null);
    }
  }, [approveConfirming, approveData, refetchAllowance]);

  const decimalsNum = decimals != null ? Number(decimals) : 18;

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
  const needsApproval = allowance != null && totalWei > 0n && allowance < totalWei;

  const doApprove = () => {
    if (!token || !MULTI_SENDER || totalWei === 0n) return;
    setStatus("Approving...");
    approve({
      address: token,
      abi: ERC20_ABI,
      functionName: "approve",
      args: [MULTI_SENDER, totalWei],
    });
  };

  const doSend = () => {
    if (!token || !MULTI_SENDER || recipients.length === 0) return;
    setStatus("Sending...");
    if (mode === "equal" && amounts.length > 0) {
      sendTx({
        address: MULTI_SENDER,
        abi: MULTI_SENDER_ABI,
        functionName: "sendEqual",
        args: [token, recipients, amounts[0]],
      });
    } else if (mode === "custom" && amounts.length === recipients.length) {
      sendTx({
        address: MULTI_SENDER,
        abi: MULTI_SENDER_ABI,
        functionName: "sendToMany",
        args: [token, recipients, amounts],
      });
    }
  };

  useEffect(() => {
    if (approveError) setStatus(`Approve error: ${approveError.message}`);
    else if (sendError) setStatus(`Send error: ${sendError.message}`);
  }, [approveError, sendError]);

  useEffect(() => {
    if (sendConfirming === false && sendData) {
      setStatus("Sent successfully.");
      setRows([{ address: "", amount: "" }]);
      setAmountPer("");
    }
  }, [sendConfirming, sendData]);

  const canSend = token && MULTI_SENDER && recipients.length > 0 && amounts.length === recipients.length && totalWei > 0n;
  const hasEnoughBalance = balance != null && totalWei <= balance;

  return (
    <main className="main">
      <header className="header">
        <h1>Multiple Sender</h1>
        <p>Send any ERC20 to many addresses on Base</p>
        <ConnectButton />
      </header>

      {!isConnected && (
        <section className="card">
          <p>Connect your wallet to continue.</p>
        </section>
      )}

      {isConnected && (
        <section className="card form">
          <TokenSelect
            value={token}
            onChange={setToken}
            balance={balance}
            symbol={symbol}
            decimals={decimalsNum}
          />

          <div className="mode">
            <label>Mode</label>
            <div className="mode-btns">
              <button
                type="button"
                className={mode === "equal" ? "active" : ""}
                onClick={() => setMode("equal")}
              >
                Equal amount
              </button>
              <button
                type="button"
                className={mode === "custom" ? "active" : ""}
                onClick={() => setMode("custom")}
              >
                Custom amounts
              </button>
            </div>
          </div>

          <RecipientsList
            mode={mode}
            rows={rows}
            setRows={setRows}
            amountPer={amountPer}
            setAmountPer={setAmountPer}
            decimals={decimalsNum}
          />

          {canSend && (
            <div className="summary">
              Total: {formatUnits(totalWei, decimalsNum)} {symbol || ""} to {recipients.length} recipient(s)
            </div>
          )}

          {status && <p className="status">{status}</p>}

          {canSend && (
            <div className="actions">
              {needsApproval && (
                <button
                  onClick={doApprove}
                  disabled={approvePending || approveConfirming || !hasEnoughBalance}
                >
                  {approvePending || approveConfirming ? "Waiting..." : "Approve"}
                </button>
              )}
              <button
                onClick={doSend}
                disabled={
                  sendPending ||
                  sendConfirming ||
                  (needsApproval && (allowance == null || allowance < totalWei)) ||
                  !hasEnoughBalance
                }
              >
                {sendPending || sendConfirming ? "Sending..." : "Send"}
              </button>
            </div>
          )}

          {canSend && !hasEnoughBalance && (
            <p className="error">Insufficient balance.</p>
          )}

          {isConnected && !MULTI_SENDER && (
            <p className="error">Set NEXT_PUBLIC_MULTI_SENDER_ADDRESS in .env (deploy the contract first).</p>
          )}
        </section>
      )}

      <footer className="footer">
        <a href="https://base.org" target="_blank" rel="noopener noreferrer">
          Base
        </a>
      </footer>
    </main>
  );
}
