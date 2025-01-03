// src/app/utils/xrpLedger.ts
import { Client, Wallet } from "xrpl";

const client = new Client("wss://s.altnet.rippletest.net:51233"); // Utilisez le réseau approprié

export const connectClient = async () => {
  if (!client.isConnected()) {
    await client.connect();
  }
};

export const disconnectClient = async () => {
  if (client.isConnected()) {
    await client.disconnect();
  }
};

export const getAccountInfo = async (address: string) => {
  await connectClient();
  const info = await client.request({
    command: "account_info",
    account: address,
    ledger_index: "validated",
  });
  return info.result;
};
