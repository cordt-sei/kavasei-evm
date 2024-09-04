import * as grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';
import { ethers } from 'ethers';
import { DirectSecp256k1HdWallet, SigningStargateClient } from '@cosmjs/stargate';
import axios from 'axios';

// Constants
const KAVA_GRPC_URL = 'kava.grpc.io:9090'; // Replace with actual Kava gRPC endpoint
const SEI_RPC_URL = 'https://sei-chain-rpc-url'; // Replace with actual Sei RPC endpoint

// Load the gRPC proto file
const PROTO_PATH = __dirname + '/../grpc/kava.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const evmultiProto = grpc.loadPackageDefinition(packageDefinition).evmulti;

// Function to construct the transaction for bridging tokens from Kava EVM to Cosmos
export async function bridgeTokens(
  evmAddress: string,
  cosmosRecipientAddress: string,
  amount: string,
  denom: string
): Promise<string> {
  // Create a gRPC client for the evmulti module
  const client = new evmultiProto.Evmulti(KAVA_GRPC_URL, grpc.credentials.createInsecure());

  // Prepare the MsgSend message for bridging tokens
  const msgSend = {
    from_address: evmAddress,
    to_address: cosmosRecipientAddress,
    amount: [{ denom, amount }],
  };

  return new Promise((resolve, reject) => {
    // Broadcast the MsgSend transaction to bridge tokens
    client.MsgSend(msgSend, (error: grpc.ServiceError, response: any) => {
      if (error) {
        console.error('Error while bridging tokens:', error.message);
        return reject(error);
      }

      console.log('Bridge transaction successful:', response);
      resolve(response.tx_hash);
    });
  });
}

// Function to perform IBC transfer to another IBC-enabled chain
export async function ibcTransfer(
  mnemonic: string,
  sourceAddress: string,
  destinationAddress: string,
  amount: string,
  denom: string,
  channel: string
): Promise<void> {
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'kava' });
  const [firstAccount] = await wallet.getAccounts();
  const ibcClient = await SigningStargateClient.connectWithSigner(KAVA_GRPC_URL, wallet);

  const ibcMsg = {
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    value: {
      source_port: 'transfer',
      source_channel: channel,
      token: { denom, amount },
      sender: sourceAddress,
      receiver: destinationAddress,
      timeout_height: { revision_number: 0, revision_height: 100 }, // Adjust as necessary
      timeout_timestamp: 0,
    },
  };

  const ibcResult = await ibcClient.signAndBroadcast(
    firstAccount.address,
    [ibcMsg],
    'auto', // Automatically calculate gas
    [{ denom: 'ukava', amount: '2000' }] // Adjust fees as needed
  );

  console.log('IBC transfer successful:', ibcResult);
}
