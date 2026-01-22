import { isAddress as viemIsAddress } from "viem";

/**
 * Format address for display (truncate middle)
 */
export function formatAddress(address, start = 6, end = 4) {
  if (!address || !viemIsAddress(address)) return address;
  return `${address.slice(0, start)}...${address.slice(-end)}`;
}

/**
 * Copy address to clipboard
 */
export async function copyAddress(address) {
  if (!address) return false;
  try {
    await navigator.clipboard.writeText(address);
    return true;
  } catch (error) {
    console.error("Failed to copy address:", error);
    return false;
  }
}

/**
 * Validate Ethereum address
 */
export function isValidAddress(address) {
  return viemIsAddress(address);
}

/**
 * Get address from localStorage address book
 */
export function getAddressBook() {
  if (typeof window === "undefined") return [];
  try {
    const saved = localStorage.getItem("multisender_addressbook");
    return saved ? JSON.parse(saved) : [];
  } catch {
    return [];
  }
}

/**
 * Save address to address book
 */
export function saveToAddressBook(address, label) {
  if (typeof window === "undefined" || !isValidAddress(address)) return false;
  try {
    const book = getAddressBook();
    const existing = book.find((entry) => entry.address.toLowerCase() === address.toLowerCase());
    if (existing) {
      existing.label = label;
    } else {
      book.push({ address, label, timestamp: Date.now() });
    }
    localStorage.setItem("multisender_addressbook", JSON.stringify(book));
    return true;
  } catch {
    return false;
  }
}
