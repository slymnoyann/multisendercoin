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
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Container } from "@/components/layout/Container";
import { TokenSelector } from "@/components/forms/TokenSelector";
import { ModeToggle } from "@/components/forms/ModeToggle";
import { RecipientsList } from "@/components/forms/RecipientsList";
import { TransactionSummary } from "@/components/features/TransactionSummary";
import { TransactionHistory } from "@/components/features/TransactionHistory";
import { GasEstimate } from "@/components/features/GasEstimate";
import { TransactionFlow } from "@/components/features/TransactionFlow";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/feedback/EmptyState";
import { LoadingState } from "@/components/feedback/LoadingState";
import { useToast } from "@/lib/use-toast";
import { Zap, Shield, Coins, Activity, Wallet } from "lucide-react";

const MULTI_SENDER = process.env.NEXT_PUBLIC_MULTI_SENDER_ADDRESS || "";

export default function Home() {
  const [token, setToken] = useState({ address: "", isNative: false });
  const [mode, setMode] = useState("equal");
  const [amountPer, setAmountPer] = useState("");
  const [rows, setRows] = useState([{ address: "", amount: "" }]);
  const [transactionHistory, setTransactionHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const { toast } = useToast();

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
  const { data: erc20Balance, isLoading: erc20BalanceLoading } = useReadContract({
    address: token.address && !token.isNative && isAddress(token.address) ? token.address : undefined,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
  });

  const { data: nativeBalance, isLoading: nativeBalanceLoading } = useBalance({
    address: address,
  });

  const balance = token.isNative ? nativeBalance?.value : erc20Balance;
  const balanceLoading = token.isNative ? nativeBalanceLoading : erc20BalanceLoading;

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
      toast({
        title: "Approved!",
        description: "Token spending approved successfully",
        variant: "success",
      });
    }
  }, [approveConfirming, approveData, refetchAllowance, toast]);

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
    try {
      approve({
        address: token.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [MULTI_SENDER, totalWei + estimatedFee],
      });
      toast({
        title: "Approving...",
        description: "Please confirm the transaction in your wallet",
        variant: "info",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to approve token spending",
        variant: "destructive",
      });
    }
  };

  const doSend = async () => {
    if (!MULTI_SENDER || recipients.length === 0) return;
    try {
      if (token.isNative) {
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
      toast({
        title: "Sending...",
        description: "Please confirm the transaction in your wallet",
        variant: "info",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send transaction",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (approveError) {
      toast({
        title: "Approval Failed",
        description: approveError.message,
        variant: "destructive",
      });
    }
  }, [approveError, toast]);

  useEffect(() => {
    if (sendError) {
      toast({
        title: "Transaction Failed",
        description: sendError.message,
        variant: "destructive",
      });
    }
  }, [sendError, toast]);

  useEffect(() => {
    if (sendConfirming === false && sendData) {
      toast({
        title: "Success!",
        description: "Transaction completed successfully",
        variant: "success",
      });

      // Add to transaction history
      const newTransaction = {
        id: sendData,
        timestamp: Date.now(),
        token: token.isNative ? "ETH" : (symbol || token.address),
        isNative: token.isNative,
        recipientCount: recipients.length,
        totalAmount: formatUnits(totalWei, decimalsNum),
        fee: formatUnits(estimatedFee, decimalsNum),
        recipients: recipients.slice(0, 3),
        mode: mode,
        hash: sendData,
      };

      setTransactionHistory(prev => [newTransaction, ...prev.slice(0, 9)]);
      setRows([{ address: "", amount: "" }]);
      setAmountPer("");
    }
  }, [sendConfirming, sendData, token, symbol, recipients, totalWei, estimatedFee, decimalsNum, mode, toast]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Container className="py-8">
          {!isConnected ? (
            <div className="flex min-h-[60vh] items-center justify-center">
              <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                    <Wallet className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-2xl">Connect Your Wallet</CardTitle>
                  <CardDescription className="text-base">
                    Connect your wallet to start sending tokens to multiple recipients efficiently.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                      <Zap className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium">Gas Optimized</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                      <Shield className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium">Secure</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                      <Coins className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium">Low Fees</p>
                    </div>
                    <div className="flex flex-col items-center gap-2 rounded-lg border p-4">
                      <Activity className="h-6 w-6 text-primary" />
                      <p className="text-sm font-medium">Multi-Token</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Send Tokens</CardTitle>
                  <CardDescription>
                    Send tokens to multiple recipients in a single transaction
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <TokenSelector
                    value={token.address}
                    onChange={setToken}
                    balance={balance}
                    symbol={token.isNative ? "ETH" : symbol}
                    decimals={decimalsNum}
                    isNative={token.isNative}
                    isLoading={balanceLoading}
                  />

                  <ModeToggle mode={mode} onChange={setMode} />

                  <RecipientsList
                    mode={mode}
                    rows={rows}
                    setRows={setRows}
                    amountPer={amountPer}
                    setAmountPer={setAmountPer}
                    decimals={decimalsNum}
                    isNative={token.isNative}
                  />

                  {canSend && (
                    <>
                      <TransactionSummary
                        totalAmount={totalWei}
                        recipientCount={recipients.length}
                        fee={estimatedFee}
                        symbol={token.isNative ? "ETH" : symbol}
                        isNative={token.isNative}
                        gasEstimate={token.isNative ? nativeGasEstimate : erc20GasEstimate}
                      />

                      <GasEstimate
                        gasEstimate={token.isNative ? nativeGasEstimate : erc20GasEstimate}
                      />

                      {(!token.isNative && needsApproval) && (
                        <TransactionFlow
                          currentStep={approvePending || approveConfirming ? "approve" : "send"}
                          isProcessing={approvePending || approveConfirming}
                        />
                      )}

                      {!hasEnoughBalance && (
                        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                          <p className="text-sm font-medium text-destructive">
                            Insufficient balance for this transaction
                          </p>
                        </div>
                      )}

                      <div className="flex gap-3">
                        {!token.isNative && needsApproval && (
                          <Button
                            onClick={doApprove}
                            disabled={approvePending || approveConfirming || !hasEnoughBalance}
                            className="flex-1"
                            variant="outline"
                          >
                            {approvePending || approveConfirming ? (
                              <LoadingState size="sm" className="mr-2">
                                <span className="ml-2">Approving...</span>
                              </LoadingState>
                            ) : (
                              "Approve Token"
                            )}
                          </Button>
                        )}
                        <Button
                          onClick={doSend}
                          disabled={
                            sendPending ||
                            sendConfirming ||
                            (!token.isNative && needsApproval && (allowance == null || allowance < totalWei)) ||
                            !hasEnoughBalance
                          }
                          className="flex-1"
                          variant="gradient"
                        >
                          {sendPending || sendConfirming ? (
                            <LoadingState size="sm" className="mr-2">
                              <span className="ml-2">Sending...</span>
                            </LoadingState>
                          ) : (
                            <>
                              <Zap className="mr-2 h-4 w-4" />
                              Send Transaction
                            </>
                          )}
                        </Button>
                      </div>
                    </>
                  )}

                  {isConnected && !MULTI_SENDER && (
                    <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4">
                      <p className="text-sm font-medium text-destructive">
                        Contract not deployed. Set NEXT_PUBLIC_MULTI_SENDER_ADDRESS in .env
                      </p>
                    </div>
                  )}

                  <TransactionHistory
                    history={transactionHistory}
                    showHistory={showHistory}
                    setShowHistory={setShowHistory}
                  />
                </CardContent>
              </Card>
            </div>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
