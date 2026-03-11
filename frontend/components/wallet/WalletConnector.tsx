/**
 * Wallet Connector - Main wallet UI component
 * 
 * Two states: "not connected" (shows connect button) and "connected" (shows address dropdown)
 */

"use client";

import { useState, useRef, useEffect } from "react";
import { useConnect, useDisconnect, useAccount } from "@starknet-react/core";
import { useWalletStore } from "@/store/walletStore";

// Format Starknet address: "0x8B5C...f246"
function formatAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

// Format STRK balance to 4 decimal places
function formatStrkBalance(balance: bigint | null): string {
  if (balance === null) return "—";
  const divisor = 10n ** 18n;
  const whole = balance / divisor;
  const remainder = balance % divisor;
  const decimals = remainder.toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${decimals}`;
}

export function WalletConnector() {
  const { connect, connectors } = useConnect();
  const { disconnect } = useDisconnect();
  const { address, status } = useAccount();
  const { isWrongNetwork, strkBalance } = useWalletStore();
  const [showModal, setShowModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // NOT CONNECTED STATE
  if (status === "disconnected" || status === "reconnecting") {
    return (
      <>
        <button
          className="wallet-connect-btn px-4 py-2 bg-[--violet] text-white rounded-lg font-medium hover:bg-[--violet-dim] transition-colors"
          onClick={() => setShowModal(true)}
          disabled={status === "reconnecting"}
        >
          {status === "reconnecting" ? "Reconnecting..." : "Connect Wallet"}
        </button>
        {showModal && (
          <WalletSelectionModal
            connectors={connectors}
            onConnect={(connector) => {
              connect({ connector });
              setShowModal(false);
            }}
            onClose={() => setShowModal(false)}
          />
        )}
      </>
    );
  }

  // CONNECTING STATE
  if (status === "connecting") {
    return (
      <button className="wallet-connect-btn px-4 py-2 bg-[--violet-dim] text-white rounded-lg font-medium" disabled>
        Connecting...
      </button>
    );
  }

  // CONNECTED STATE
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`wallet-address-btn flex items-center gap-3 px-4 py-2 bg-[--surface-2] rounded-lg font-mono text-sm ${
          isWrongNetwork ? "ring-2 ring-[--warning]" : ""
        }`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {strkBalance !== null && (
          <span className="text-[--text-subtle]">
            {formatStrkBalance(strkBalance)} STRK
          </span>
        )}
        <span className="text-[--violet-bright]">{formatAddress(address ?? "")}</span>
        <span className="text-[--text-subtle]">▾</span>
      </button>

      {showDropdown && (
        <WalletDropdown
          address={address ?? ""}
          onClose={() => setShowDropdown(false)}
          onDisconnect={() => {
            disconnect();
            setShowDropdown(false);
          }}
        />
      )}
    </div>
  );
}

// Wallet Selection Modal
function WalletSelectionModal({
  connectors,
  onConnect,
  onClose,
}: {
  connectors: ReturnType<typeof useConnect>["connectors"];
  onConnect: (connector: any) => void;
  onClose: () => void;
}) {
  return (
    <div 
      className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-[--surface-2] rounded-xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Connect Wallet</h2>
          <button onClick={onClose} className="text-[--text-subtle] hover:text-[--text]">✕</button>
        </div>

        <div className="space-y-3">
          {connectors.map((connector) => (
            <button
              key={connector.id}
              className="w-full flex items-center gap-3 p-4 bg-[--surface-3] rounded-lg hover:bg-[--border] transition-colors disabled:opacity-50"
              onClick={() => onConnect(connector)}
              disabled={!connector.available()}
            >
              <div className="w-8 h-8 bg-[--violet-dim] rounded-full flex items-center justify-center">
                {connector.name[0]}
              </div>
              <span className="font-medium">{connector.name}</span>
              {!connector.available() && (
                <span className="ml-auto text-sm text-[--warning]">Install →</span>
              )}
            </button>
          ))}
        </div>

        <p className="mt-4 text-sm text-[--text-subtle] text-center">
          By connecting, you agree that PHANTOM never sees your private keys.
        </p>
      </div>
    </div>
  );
}

// Connected Dropdown
function WalletDropdown({
  address,
  onClose,
  onDisconnect,
}: {
  address: string;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const { isWrongNetwork } = useWalletStore();
  const explorerUrl = `https://voyager.online/contract/${address}`;

  return (
    <div className="absolute right-0 mt-2 w-56 bg-[--surface-2] rounded-lg shadow-xl border border-[--border] overflow-hidden z-50">
      {isWrongNetwork && (
        <div className="px-4 py-2 bg-[--warning]/10 text-[--warning] text-sm">
          ⚠ Wrong network. Switch to Starknet Sepolia in your wallet.
        </div>
      )}

      <div className="px-4 py-3">
        <div className="font-mono text-sm text-[--text-subtle]">Address</div>
        <div className="font-mono text-sm text-[--violet-bright] break-all">{address}</div>
      </div>

      <div className="border-t border-[--border]">
        <button
          className="w-full px-4 py-3 text-left hover:bg-[--surface-3] transition-colors"
          onClick={() => { 
            navigator.clipboard.writeText(address); 
            onClose(); 
          }}
        >
          Copy Address
        </button>
        <a
          href={explorerUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="block px-4 py-3 hover:bg-[--surface-3] transition-colors"
          onClick={onClose}
        >
          View on Voyager ↗
        </a>
      </div>

      <div className="border-t border-[--border]">
        <button
          className="w-full px-4 py-3 text-left text-[--danger] hover:bg-[--danger]/10 transition-colors"
          onClick={onDisconnect}
        >
          Disconnect
        </button>
      </div>
    </div>
  );
}
