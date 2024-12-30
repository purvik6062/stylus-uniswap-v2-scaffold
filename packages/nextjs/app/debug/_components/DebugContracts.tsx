"use client";

import React, { useEffect, useState } from "react";
import { IVendingMachine } from "./IVendingMachine";
import { ethers } from "ethers";

const contractAddress = "0xa6e41ffd769491a42a6e5ce453259b93983a22ef"; // Get this from run-dev-node.sh output
const provider = new ethers.JsonRpcProvider("http://localhost:8547/");
const privateKey = "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659";
const signer = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, IVendingMachine, signer);

export default function DebugContracts() {
  const [userAddress, setUserAddress] = useState("");
  const [balance, setBalance] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [lastCupcakeTime, setLastCupcakeTime] = useState<any>(null);

  const checkBalance = async () => {
    if (!userAddress) {
      setError("Please enter a valid address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const balance = await contract.getCupcakeBalanceFor(userAddress);
      setBalance(balance.toString());
      setSuccess(`Successfully retrieved balance for ${userAddress}`);
    } catch (err) {
      setError(`Error checking balance: ${err}`);
    }
    setLoading(false);
  };

  const giveCupcake = async () => {
    if (!userAddress) {
      setError("Please enter a valid address");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const tx = await contract.giveCupcakeTo(userAddress);
      await tx.wait();
      const newBalance = await contract.getCupcakeBalanceFor(userAddress);
      setBalance(newBalance.toString());
      setSuccess(`Successfully gave a cupcake to ${userAddress}`);
      setLastCupcakeTime(Date.now());
    } catch (err) {
      setError(`Error giving cupcake: ${err}`);
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      {/* Main Debug Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-4">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">🧁 Cupcake Vending Machine Debug</h2>

        {/* Input Section */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-200">User Address</label>
          <input
            type="text"
            className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 
                     dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="Enter Ethereum address"
            value={userAddress}
            onChange={e => setUserAddress(e.target.value)}
          />
        </div>

        {/* Buttons */}
        <div className="flex gap-4">
          <button
            onClick={checkBalance}
            disabled={loading}
            className="flex-1 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 
                     disabled:bg-blue-300 dark:disabled:bg-blue-800"
          >
            Check Balance
          </button>
          <button
            onClick={giveCupcake}
            disabled={loading}
            className="flex-1 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 
                     disabled:bg-green-300 dark:disabled:bg-green-800"
          >
            Give Cupcake
          </button>
        </div>

        {/* Balance Display */}
        {balance !== null && (
          <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded-lg">
            <div className="font-medium text-gray-900 dark:text-gray-200">Current Balance:</div>
            <div className="text-2xl text-gray-900 dark:text-white">{balance} 🧁</div>
          </div>
        )}

        {/* Last Cupcake Time */}
        {lastCupcakeTime && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Last cupcake given: {new Date(lastCupcakeTime).toLocaleTimeString()}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div
            className="bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 
                       text-red-700 dark:text-red-400 px-4 py-3 rounded"
          >
            {error}
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div
            className="bg-green-100 dark:bg-green-900/30 border border-green-400 dark:border-green-800 
                       text-green-700 dark:text-green-400 px-4 py-3 rounded"
          >
            {success}
          </div>
        )}
      </div>

      {/* Contract Info Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 space-y-2">
        <h3 className="text-xl font-bold mb-4 text-gray-900 dark:text-white">Contract Information</h3>

        <div className="text-gray-900 dark:text-white">
          <span className="font-medium">Contract Address: </span>
          <code className="bg-gray-100 dark:bg-gray-700 p-1 rounded text-sm">{contractAddress}</code>
        </div>

        <div className="text-gray-900 dark:text-white">
          <span className="font-medium">Network: </span>
          <span>Local Testnet (http://localhost:8547/)</span>
        </div>

        <div className="text-gray-900 dark:text-white">
          <span className="font-medium">Cupcake Cooldown: </span>
          <span>5 seconds between cupcakes</span>
        </div>
      </div>
    </div>
  );
}
