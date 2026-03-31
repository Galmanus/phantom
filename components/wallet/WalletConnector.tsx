// components/wallet/WalletConnector.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { useConnect, useDisconnect, useAccount } from "@starknet-react/core";
import { useWalletStore } from "@/store/walletStore";

function formatAddress(address: string): string {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

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

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "disconnected" || status === "reconnecting") {
    return (
      <>
        <button
          className="btn-outline text-sm py-2 px-4"
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

  if (status === "connecting") {
    return (
      <button className="btn-outline text-sm py-2 px-4" disabled>
        Connecting...
      </button>
    );
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        className={`flex items-center gap-3 px-4 py-2 rounded-lg border transition-all ${
          isWrongNetwork 
            ? "border-error bg-error/10" 
            : "border-amber bg-amber/10 hover:bg-amber/20"
        }`}
        onClick={() => setShowDropdown(!showDropdown)}
      >
        {strkBalance !== null && (
          <span className="font-mono text-xs text-amber">
            {formatStrkBalance(strkBalance)} STRK
          </span>
        )}
        <span className="font-mono text-sm text-parchment">
          {formatAddress(address ?? "")}
        </span>
        <span className="text-muted">▾</span>
      </button>

      {showDropdown && (
        <WalletDropdown
          address={address ?? ""}
          isWrongNetwork={isWrongNetwork}
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

function WalletSelectionModal({
  connectors,
  onConnect,
  onClose,
}: {
  connectors: any[];
  onConnect: (connector: any) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-void/80 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-panel border border-border rounded-2xl p-6 w-full max-w-sm" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-display font-bold text-xl text-parchment">Connect Wallet</h3>
          <button onClick={onClose} className="text-muted hover:text-parchment">✕</button>
        </div>
        
        {connectors.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted mb-4">No wallets detected</p>
            <p className="text-sm text-muted">
              Please install Argent X or Braavos wallet extension.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {connectors.map((connector) => (
              <button
                key={connector.id}
                className="w-full flex items-center gap-3 p-4 rounded-xl bg-surface hover:bg-amber/10 border border-border hover:border-amber transition-all"
                onClick={() => onConnect(connector)}
              >
                {connector.icon && (
                  <img
                    src={connector.icon.dark ?? connector.icon.light ?? connector.icon}
                    alt={connector.name}
                    width={32}
                    height={32}
                    className="rounded-lg"
                  />
                )}
                <span className="font-mono text-sm text-parchment">{connector.name}</span>
                {!connector.available() && (
                  <span className="ml-auto text-xs text-muted">Install →</span>
                )}
              </button>
            ))}
          </div>
        )}
        <p className="text-xs text-muted mt-4 text-center">
          By connecting, you agree that MIDAS never sees your private keys.
        </p>
      </div>
    </div>
  );
}

function WalletDropdown({
  address,
  isWrongNetwork,
  onClose,
  onDisconnect,
}: {
  address: string;
  isWrongNetwork: boolean;
  onClose: () => void;
  onDisconnect: () => void;
}) {
  const explorerUrl = `https://voyager.online/contract/${address}`;

  return (
    <div className="absolute right-0 top-full mt-2 w-56 bg-panel border border-border rounded-xl overflow-hidden shadow-xl z-50">
      {isWrongNetwork && (
        <div className="px-4 py-3 bg-error/10 border-b border-border">
          <span className="text-xs text-error">
            ⚠ Wrong network. Switch to Starknet Sepolia.
          </span>
        </div>
      )}
      <div className="p-3 border-b border-border">
        <span className="font-mono text-xs text-muted">Full address:</span>
        <div className="font-mono text-xs text-parchment mt-1 break-all">{address}</div>
      </div>
      <button
        className="w-full px-4 py-3 text-left text-sm text-secondary hover:bg-surface transition-colors"
        onClick={() => { navigator.clipboard.writeText(address); onClose(); }}
      >
        Copy Address
      </button>
      <a
        href={explorerUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-3 text-sm text-secondary hover:bg-surface transition-colors"
        onClick={onClose}
      >
        View on Voyager ↗
      </a>
      <div className="border-t border-border"></div>
      <button
        className="w-full px-4 py-3 text-left text-sm text-error hover:bg-surface transition-colors"
        onClick={onDisconnect}
      >
        Disconnect
      </button>
    </div>
  );
}
