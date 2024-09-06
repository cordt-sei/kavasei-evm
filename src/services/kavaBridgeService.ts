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

// Main function to handle USDT transfer from Kava EVM to Sei
export async function transferUsdtToSei(
  evmAddress: string,
  cosmosRecipientAddress: string,
  seiAddress: string,
  amount: string
): Promise<string> {
  // Step 1: Convert ERC20 USDT to Kava native tokens
  const client = createGrpcClient();

  const convertMsg = {
    type: 'evmutil/MsgConvertERC20ToCoin',
    value: {
      initiator: evmAddress,
      receiver: cosmosRecipientAddress,
      kava_erc20_address: '0xUSDT_CONTRACT_ADDRESS', // Replace with actual USDT ERC20 contract address
      amount: amount,
    },
  };

  try {
    const convertResponse = await new Promise((resolve, reject) => {
      client.MsgConvertERC20ToCoin(convertMsg, (error: grpc.ServiceError, response: any) => {
        if (error) {
          logger.error('Error converting USDT from Kava EVM to Kava Cosmos:', error.message);
          return reject(error);
        }

        logger.info('USDT converted successfully:', response);
        resolve(response.tx_hash);
      });
    });

    // Step 2: Perform IBC transfer from Kava to Sei
    const mnemonic = process.env.KAVA_MNEMONIC!;
    const wallet = await DirectSecp256k1HdWallet.fromMnemonic(mnemonic, { prefix: 'kava' });
    const [firstAccount] = await wallet.getAccounts();
    const ibcClient = await SigningStargateClient.connectWithSigner(KAVA_GRPC_URL, wallet);

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

    const ibcResult = await ibcClient.signAndBroadcast(
      firstAccount.address,
      [ibcMsg],
      'auto',
      [{ denom: 'ukava', amount: '2000' }] // Adjust fee as necessary
    );

    logger.info('IBC transfer successful:', ibcResult);
    return ibcResult.transactionHash;

  } catch (error) {
    logger.error('Error during transfer from Kava EVM to Sei:', error.message);
    throw error;
  }
}
