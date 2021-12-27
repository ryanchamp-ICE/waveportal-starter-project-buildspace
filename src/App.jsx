import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import './App.css';

import abiJson from "./utils/WavePortal.json";

export default function App() {

  const [currentAccount, setCurrentAccount] = useState("");
  const [isLoading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [allWaves, setAllWaves] = useState([]);

  const contractAddress = "0x193910940F9af0CD1A1E6CF7BC2d1Edf3E950fF4";
  const contractABI = abiJson.abi;

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach(wave => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message
          });
        });

        setAllWaves(wavesCleaned);

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count.toNumber());
        setTotalCount(count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  }

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log("Make sure you have metamask!");
        return;
      } else {
        console.log("We have the ethereum object", ethereum);
      }

      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account: ", account);
        setCurrentAccount(account);

        setLoading(true);
        await getAllWaves();
        setLoading(false);
      } else {
        console.log("No authorized account found.");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({ method: "eth_requestAccounts" })
      
      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  }

  const wave = async (message) => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);

        setLoading(true);
        const waveTxn = await wavePortalContract.wave(message, { gasLimit: 300000 });
        console.log("Mining... ", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      setLoading(false);
      console.log(error);
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    await wave(event.target.message.value);
    event.target.message.value = '';
  }

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        }
      ]);

      setTotalCount(prevCount => prevCount + 1);
      setLoading(false);
    }

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();

      wavePortalContract = new ethers.Contract(contractAddress, contractABI, signer);
      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    }
  }, []);

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);
  
  return (
    <div class="container mx-auto mt-4">

      <div class="flex flex-col justify-center mx-auto max-w-md">
        <div class="text-center font-sans font-semibold text-xl">
        👋Hello, is it me you are looking for?
        </div>

        <div class="text-center text-gray-400 mt-4">
        My name is Ryan, also known a IceColdEdge in competitive gaming circles. 
        I'm learning about web3 because it's the future! Connect your Ethereum wallet and wave at me!
        </div>

        <div class="text-center font-semibold text-xl mt-4">Total waves so far:</div>
        {!isLoading ? (
          <div class="text-center font-semibold text-5xl mt-4">{totalCount}</div>
        ) :
        (
          <div
            class='text-center m-auto mt-4 border-4 rounded-full w-12 h-12 animate-spin'
            style={{ borderTop: '4px solid #FBBF24' }}
          />
        )}

        <form class="flex flex-col" onSubmit={handleSubmit}>

          <input id="wave-message" name="message" class={`border rounded-md placeholder-gray-400 focus-border-yellow-400 w-full placeholder-opacity-75 text-center text-xl py-2 mt-4 ${!currentAccount ? 'hidden' : ''}`} required placeholder="Special Message"/>

          <button type="submit" class="mt-8 p-4 rounded-lg bg-yellow-400">
            Wave at Me
          </button>
        </form>

        {/*
          * If there is no currentAccount render this button
          */}
        {!currentAccount && (
          <button class="mt-8 p-4 rounded-lg bg-yellow-400" onClick={connectWallet}>
            Connect Wallet
          </button>
        )}

        {allWaves.map((wave, index) => {
          return (
           <div key={index} style={{ backgroundColor: "OldLace", marginTop: "16px", padding: "8px" }}>
              <div>Address: {wave.address}</div>
              <div>Time: {wave.timestamp.toString()}</div>
              <div>Message: {wave.message}</div>
            </div> 
          )
        })}
      </div>
    </div>
  );
}
