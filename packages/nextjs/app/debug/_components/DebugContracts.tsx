"use client";

import { use, useEffect, useMemo, useState } from "react";
import { ethers } from "ethers";
import { ICounter } from "./ICounter";

const contractAddress = "0xa6e41ffd769491a42a6e5ce453259b93983a22ef";
const provider = new ethers.JsonRpcProvider("http://localhost:8547/");
const privateKey = "0xb6b15c8cb491557369f3c7d2c287b053eb229daa9c22138887752191c9520659";
const signer = new ethers.Wallet(privateKey, provider);
const contract = new ethers.Contract(contractAddress, ICounter, signer);

export function DebugContracts() {
  const [number, setNumber] = useState<number | null>(null);
  const [inputNumber, setInputNumber] = useState<string>("");

  const fetchNumber = async () => {
    const currentNumber = await contract.number();
    console.log(currentNumber);
    setNumber(Number(currentNumber));
  };

  useEffect(() => {
    fetchNumber()
  })

  const setANumber = async () => {
    try {
      const tx = await contract.setNumber(Number(inputNumber));
      await tx.wait();
      await fetchNumber();
    } catch (error) {
      console.error("Error setting number:", error);
    }
  };

  const addNumber = async () => {
    try {
      const tx = await contract.addNumber(Number(inputNumber));
      await tx.wait();
      await fetchNumber();
    } catch (error) {
      console.error("Error adding number:", error);
    }
  };

  const mulNumber = async () => {
    try {
      const tx = await contract.mulNumber(Number(inputNumber));
      await tx.wait();
      await fetchNumber();
    } catch (error) {
      console.error("Error multiplying number:", error);
    }
  };

  const increment = async () => {
    try {
      const tx = await contract.increment();
      await tx.wait();
      await fetchNumber();
    } catch (error) {
      console.error("Error incrementing:", error);
    }
  };

  return (
    <div className="flex flex-col items-center w-full max-w-3xl mx-auto p-6">
      <div className="bg-base-100 shadow-lg rounded-2xl w-full p-8">
        <h1 className="text-3xl font-bold mb-6 text-center">Interact with Counter Contract</h1>
        
        <div className="flex justify-center mb-8">
          <div className="bg-base-200 rounded-lg px-6 py-4 shadow-inner">
            <span className="text-lg font-semibold">Current Number: </span>
            <span className="text-2xl font-bold text-white">
              {number !== null ? number : "Loading..."}
            </span>
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <input
              type="number"
              value={inputNumber}
              onChange={(e) => setInputNumber(e.target.value)}
              className="input input-bordered w-full sm:w-48"
              placeholder="Enter a number"
            />
            
            <div className="flex flex-wrap gap-2 justify-center">
              <button 
                className="btn btn-success"
                onClick={setANumber}
              >
                Set Number
              </button>

              <button 
                className="btn btn-secondary"
                onClick={addNumber}
              >
                Add Number
              </button>

              <button 
                className="btn btn-warning"
                onClick={mulNumber}
              >
                Multiply Number
              </button>
            </div>
          </div>

          <div className="flex justify-center">
            <button 
              className="btn btn-primary w-48"
              onClick={increment}
            >
              Increment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
