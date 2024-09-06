import * as grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';
import { DirectSecp256k1HdWallet, SigningStargateClient } from '@cosmjs/stargate';
import { ethers } from 'ethers';
import axios from 'axios';
import logger from '../utils/logger';

// Constants
const KAVA_GRPC_URL = process.env.KAVA_GRPC_URL!;
const SEI_RPC_URL = process.env.SEI_RPC_URL!;

const PROTO_PATH = __dirname + '/../grpc/kava.proto';
const packageDefinition = protoLoader.loadSync(PROTO_PATH, {
  keepCase: true,
  longs: String,
  enums: String,
  defaults: true,
  oneofs: true,
});
const evmultiProto = grpc.loadPackageDefinition(packageDefinition).evmulti;

// Utility to create gRPC client
function createGrpcClient() {
  return new evmultiProto.Evmulti(KAVA_GRPC_URL, grpc.credentials.createInsecure());
}

// Main function to handle combined transaction
export async function combinedTransferUsdtToSei(
  evmAddress: string,
  cosmosRecipientAddress: string,
  seiAddress: string,
  amount: string
): Promise<string> {
  // Initialize wallet for signing
  const mnemonic = process.env.KAVA_MNEMONIC!;
  const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'kava' });
  const [firstAccount] = await wallet.getAccounts();
  const ibcClient = await SigningStargateClient.connectWithSigner(KAVA_GRPC_URL, wallet);

  // Construct the first message: Convert ERC20 USDT to Kava Cosmos tokens
  const convertMsg = {
    typeUrl: '/kava.evmutil.v1beta1.MsgConvertERC20ToCoin',
    value: {
      initiator: evmAddress,
      receiver: cosmosRecipientAddress,
      kavaErc20Address: '0xUSDT_CONTRACT_ADDRESS', // Replace with actual USDT ERC20 contract address
      amount: amount,
    },
  };

  // Construct the second message: Perform IBC transfer from Kava to Sei
  const ibcMsg = {
    typeUrl: '/ibc.applications.transfer.v1.MsgTransfer',
    value: {
      source_port: 'transfer',
      source_channel: 'channel-132', // Replace with actual channel ID
      token: { denom: 'erc20/tether/usdt', amount },
      sender: cosmosRecipientAddress,
      receiver: seiAddress,
      timeout_height: { revision_number: 0, revision_height: 100 }, // Adjust as needed
      timeout_timestamp: 0,
    },
  };

  // Combine both messages into a single transaction
  const combinedMessages = [convertMsg, ibcMsg];

  try {
    // Sign and broadcast the combined transaction
    const result = await ibcClient.signAndBroadcast(
      firstAccount.address,
      combinedMessages,
      'auto', // Automatically calculate gas
      [{ denom: 'ukava', amount: '2000' }] // Adjust fees as needed
    );

    logger.info('Combined transaction successful:', result);
    return result.transactionHash;

  } catch (error) {
    logger.error('Error during combined transaction from Kava EVM to Sei:', error.message);
    throw error;
  }
}
