import * as grpc from 'grpc';
import * as protoLoader from '@grpc/proto-loader';
import { DirectSecp256k1HdWallet, SigningStargateClient } from '@cosmjs/stargate';
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

// Function to retry network requests
async function retryRequest<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      logger.warn(`Attempt ${attempt} failed: ${error.message}`);
      if (attempt === retries) {
        throw error;
      }
    }
  }
  throw new Error('Max retries reached');
}

export async function bridgeTokens(
  evmAddress: string,
  cosmosRecipientAddress: string,
  amount: string,
  denom: string
): Promise<string> {
  const client = createGrpcClient();
  const msgSend = { from_address: evmAddress, to_address: cosmosRecipientAddress, amount: [{ denom, amount }] };

  return new Promise((resolve, reject) => {
    client.MsgSend(msgSend, (error: grpc.ServiceError, response: any) => {
      if (error) {
        logger.error(`gRPC Error: ${error.message}`);
        return reject(error);
      }
      logger.info(`Bridge transaction successful: ${response.tx_hash}`);
      resolve(response.tx_hash);
    });
  });
}

// IBC function
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
      timeout_height: { revision_number: 0, revision_height: 100 },
      timeout_timestamp: 0,
    },
  };

  const ibcResult = await ibcClient.signAndBroadcast(
    firstAccount.address,
    [ibcMsg],
    'auto',
    [{ denom: 'ukava', amount: '2000' }]
  );

  logger.info(`IBC transfer successful: ${ibcResult.transactionHash}`);
}
