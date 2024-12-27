"use client";

import React, { useEffect, useState } from "react";
import { IMultiSig } from "./IMultiSig";
import { ethers } from "ethers";

export default function DebugContracts() {
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [numConfirmations, setNumConfirmations] = useState<number>(0);
  const [transactionCount, setTransactionCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    to: "",
    value: "",
    data: "",
    txIndex: "",
    checkAddress: "",
    owners: "", // Add this field for comma-separated owner addresses
    numConfirmationsRequired: "", // Add this field for required confirmations
  });
  const [isOwnerResult, setIsOwnerResult] = useState<boolean | null>(null);

  useEffect(() => {
    initializeContract();
  }, []);

  const initializeContract = async () => {
    try {
      if (typeof window === "undefined") return;

      const contractAddress = "0xa6e41ffd769491a42a6e5ce453259b93983a22ef";
      const rpcUrl = "http://localhost:8547";
      const privateKey = "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659";
      // const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
      // const rpcUrl = process.env.NEXT_PUBLIC_RPC_URL;
      // const privateKey = process.env.NEXT_PUBLIC_PRIVATE_KEY;

      if (!contractAddress || !rpcUrl || !privateKey) {
        throw new Error("Missing environment variables. Please check your .env.local file");
      }

      const provider = new ethers.JsonRpcProvider(rpcUrl);

      try {
        const network = await provider.getNetwork();
        console.log("Connected to network:", network.name);
      } catch (e) {
        throw new Error("Failed to connect to network. Please check your RPC URL and network status");
      }

      const signer = new ethers.Wallet(privateKey, provider);
      console.log("Signer address:", await signer.getAddress());

      const newContract = new ethers.Contract(contractAddress, IMultiSig, signer);

      // Verify contract deployment
      const code = await provider.getCode(contractAddress);
      if (code === "0x") {
        throw new Error("No contract deployed at the specified address");
      }

      setContract(newContract);

      // Test basic contract interaction
      try {
        await newContract.numConfirmationsRequired();
        console.log("Contract connection successful");
      } catch (e) {
        throw new Error("Contract interaction failed. Please verify the contract ABI and address");
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to initialize contract";
      setError(errorMessage);
      console.error("Contract initialization error:", err);
    }
  };

  const fetchContractData = async () => {
    if (!contract) return;

    try {
      setLoading(true);
      const [numRequired, txCount] = await Promise.all([
        contract.numConfirmationsRequired(),
        contract.getTransactionCount(),
      ]);

      setNumConfirmations(Number(numRequired));
      setTransactionCount(Number(txCount));

      console.log("Contract state updated:", {
        numConfirmations: Number(numRequired),
        transactionCount: Number(txCount),
      });
    } catch (error) {
      console.error("Error fetching contract data:", error);
      setError("Failed to fetch contract data. Please check console for details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (contract) {
      fetchContractData();
    }
  }, [contract]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!contract) {
      setError("Contract not initialized");
      return;
    }

    setError(null);
    setLoading(true);
    setLastTxHash(null);

    const form = e.currentTarget;
    const action = form.getAttribute("data-action");

    try {
      let tx;
      switch (action) {
        case "deposit":
          tx = await contract.deposit({
            value: ethers.parseEther(formData.value),
          });
          break;

        case "submitTransaction":
          tx = await contract.submitTransaction(formData.to, ethers.parseEther(formData.value), formData.data || "0x");
          break;

        case "confirmTransaction":
          tx = await contract.confirmTransaction(formData.txIndex);
          break;

        case "executeTransaction":
          tx = await contract.executeTransaction(formData.txIndex);
          break;

        case "revokeConfirmation":
          tx = await contract.revokeConfirmation(formData.txIndex);
          break;

        case "checkOwner":
          const isOwner = await contract.isOwner(formData.checkAddress);
          setIsOwnerResult(isOwner);
          console.log("Owner check result:", isOwner);
          break;

        case "initialize":
          // Split comma-separated addresses into array and remove whitespace
          const ownerAddresses = formData.owners.split(",").map(addr => addr.trim());
          tx = await contract.initialize(ownerAddresses, ethers.toNumber(formData.numConfirmationsRequired), {
            gasLimit: 10000000,
          });
          break;

        default:
          throw new Error("Invalid action");
      }

      if (tx) {
        console.log("Transaction submitted:", tx.hash);
        setLastTxHash(tx.hash);

        // Wait for transaction confirmation
        const receipt = await tx.wait();
        console.log("Transaction confirmed:", receipt);

        // Clear form data after successful transaction
        if (action !== "checkOwner") {
          setFormData({
            to: "",
            value: "",
            data: "",
            txIndex: "",
            checkAddress: "",
            owners: "",
            numConfirmationsRequired: "",
          });
        }
      }

      await fetchContractData();
    } catch (err) {
      console.error("Transaction error:", err);
      let errorMessage = "Transaction failed";

      if (err instanceof Error) {
        // Parse ethers error message
        const match = err.message.match(/reason="([^"]+)"/);
        errorMessage = match ? match[1] : err.message;
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Rest of the component remains the same...
  return (
    <div className="flex flex-col gap-4 w-full max-w-3xl mx-auto p-4">
      {error && (
        <div className="alert alert-error overflow-x-auto">
          <span className="font-bold">Error:</span>
          <span className="">{error}</span>
        </div>
      )}

      {loading && (
        <div className="alert alert-info">
          <span>Processing transaction...</span>
        </div>
      )}

      {lastTxHash && (
        <div className="alert alert-success">
          <span>Transaction submitted: {lastTxHash}</span>
        </div>
      )}

      {/* Contract Status */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Contract Status</h2>
          <div className="space-y-2">
            <p>Required Confirmations: {numConfirmations}</p>
            <p>Total Transactions: {transactionCount}</p>
          </div>
        </div>
      </div>

      {/* Deposit ETH */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Deposit ETH</h2>
          <form onSubmit={handleSubmit} data-action="deposit" className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Amount (ETH)</span>
              </label>
              <input
                type="text"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="0.1"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Deposit
            </button>
          </form>
        </div>
      </div>

      {/* Submit Transaction */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Submit Transaction</h2>
          <form onSubmit={handleSubmit} data-action="submitTransaction" className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">To Address</span>
              </label>
              <input
                type="text"
                name="to"
                value={formData.to}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="0x..."
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Value (ETH)</span>
              </label>
              <input
                type="text"
                name="value"
                value={formData.value}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="0.1"
              />
            </div>
            <div>
              <label className="label">
                <span className="label-text">Data (hex)</span>
              </label>
              <input
                type="text"
                name="data"
                value={formData.data}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="0x"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Submit Transaction
            </button>
          </form>
        </div>
      </div>

      {/* Transaction Management */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Transaction Management</h2>
          <div className="space-y-6">
            <form onSubmit={handleSubmit} data-action="confirmTransaction" className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Confirm Transaction</span>
                </label>
                <input
                  type="number"
                  name="txIndex"
                  value={formData.txIndex}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Transaction Index"
                />
              </div>
              <button type="submit" className="btn btn-success">
                Confirm
              </button>
            </form>

            <form onSubmit={handleSubmit} data-action="executeTransaction" className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Execute Transaction</span>
                </label>
                <input
                  type="number"
                  name="txIndex"
                  value={formData.txIndex}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Transaction Index"
                />
              </div>
              <button type="submit" className="btn btn-accent">
                Execute
              </button>
            </form>

            <form onSubmit={handleSubmit} data-action="revokeConfirmation" className="space-y-4">
              <div>
                <label className="label">
                  <span className="label-text">Revoke Confirmation</span>
                </label>
                <input
                  type="number"
                  name="txIndex"
                  value={formData.txIndex}
                  onChange={handleInputChange}
                  className="input input-bordered w-full"
                  placeholder="Transaction Index"
                />
              </div>
              <button type="submit" className="btn btn-error">
                Revoke
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Check Owner Status */}
      <div className="card bg-base-200 shadow-xl">
        <div className="card-body">
          <h2 className="card-title">Check Owner Status</h2>
          <form onSubmit={handleSubmit} data-action="checkOwner" className="space-y-4">
            <div>
              <label className="label">
                <span className="label-text">Address</span>
              </label>
              <input
                type="text"
                name="checkAddress"
                value={formData.checkAddress}
                onChange={handleInputChange}
                className="input input-bordered w-full"
                placeholder="0x..."
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Check Owner
            </button>
            {isOwnerResult !== null && (
              <div className={`alert ${isOwnerResult ? "alert-success" : "alert-error"}`}>
                <span>Address is {isOwnerResult ? "an owner" : "not an owner"}</span>
              </div>
            )}
          </form>
        </div>
      </div>

      {/* Initialize Contract */}
      <form data-action="initialize" onSubmit={handleSubmit} className="flex flex-col gap-3 p-4 border rounded">
        <h3 className="text-lg font-bold">Initialize Contract</h3>
        <div className="form-control">
          <label className="label">Owner Addresses (comma-separated)</label>
          <input
            type="text"
            name="owners"
            value={formData.owners}
            onChange={handleInputChange}
            placeholder="0x123...,0x456..."
            className="input input-bordered"
            required
          />
        </div>
        <div className="form-control">
          <label className="label">Required Confirmations</label>
          <input
            type="number"
            name="numConfirmationsRequired"
            value={formData.numConfirmationsRequired}
            onChange={handleInputChange}
            placeholder="2"
            className="input input-bordered"
            required
            min="1"
          />
        </div>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          Initialize
        </button>
      </form>
    </div>
  );
}
