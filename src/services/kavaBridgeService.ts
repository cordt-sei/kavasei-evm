import { DirectSecp256k1HdWallet, SigningStargateClient, AminoTypes, Registry } from '@cosmjs/stargate';
import { MsgTransfer } from 'cosmjs-types/ibc/applications/transfer/v1/tx';
import { MsgConvertERC20ToCoin } from '@kava-labs/javascript-sdk/lib/proto/kava/evmutil/v1beta1/tx';
import { ethers } from 'ethers';
import axios from 'axios';
import logger from '../utils/logger';

// Constants
const KAVA_GRPC_URL = process.env.KAVA_GRPC_URL!;
const SEI_RPC_URL = process.env.SEI_RPC_URL!;
const EVM_CHAIN_ID = process.env.EVM_CHAIN_ID!;
const USDT_CONTRACT_ADDRESS = '0xUSDT_CONTRACT_ADDRESS'; // Replace with actual USDT ERC20 contract address

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
  const convertMsg: MsgConvertERC20ToCoin = {
    initiator: evmAddress,
    receiver: cosmosRecipientAddress,
    kavaErc20Address: USDT_CONTRACT_ADDRESS,
    amount: amount,
  };

  // Construct the second message: Perform IBC transfer from Kava to Sei
  const ibcMsg: MsgTransfer = {
    sourcePort: 'transfer',
    sourceChannel: 'channel-132', // Replace with actual channel ID
    token: { denom: 'erc20/tether/usdt', amount },
    sender: cosmosRecipientAddress,
    receiver: seiAddress,
    timeoutHeight: { revisionNumber: 0, revisionHeight: 100 }, // Adjust as needed
    timeoutTimestamp: 0,
  };

  // Combine both messages into a single transaction
  const combinedMessages = [
    { typeUrl: '/kava.evmutil.v1beta1.MsgConvertERC20ToCoin', value: convertMsg },
    { typeUrl: '/ibc.applications.transfer.v1.MsgTransfer', value: ibcMsg },
  ];

  try {
    // Use MetaMask for signing using ethers.js
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const metamaskAddress = await signer.getAddress();

    // Prepare the EIP-712 data for signing
    const eip712Data = {
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
          { name: 'chainId', type: 'uint256' },
          { name: 'verifyingContract', type: 'string' },
        ],
        MsgConvertERC20ToCoin: [
          { name: 'initiator', type: 'string' },
          { name: 'receiver', type: 'string' },
          { name: 'kavaErc20Address', type: 'string' },
          { name: 'amount', type: 'string' },
        ],
        MsgTransfer: [
          { name: 'sourcePort', type: 'string' },
          { name: 'sourceChannel', type: 'string' },
          { name: 'token', type: 'Coin' },
          { name: 'sender', type: 'string' },
          { name: 'receiver', type: 'string' },
          { name: 'timeoutHeight', type: 'Height' },
          { name: 'timeoutTimestamp', type: 'uint64' },
        ],
      },
      domain: {
        name: 'Kava Cosmos',
        version: '1.0.0',
        chainId: EVM_CHAIN_ID,
        verifyingContract: 'kavaCosmos',
      },
      primaryType: 'Tx',
      message: {
        accountNumber: firstAccount.accountNumber.toString(),
        chainId: EVM_CHAIN_ID,
        fee: { amount: [{ denom: 'ukava', amount: '2000' }], gas: '200000' },
        memo: 'app.kava.io',
        msg1: convertMsg,
        msg2: ibcMsg,
        sequence: firstAccount.sequence.toString(),
      },
    };

    // Sign with MetaMask
    const signature = await signer._signTypedData(
      eip712Data.domain,
      eip712Data.types,
      eip712Data.message
    );

    // Broadcast the transaction
    const ibcResult = await ibcClient.signAndBroadcast(
      firstAccount.address,
      combinedMessages,
      'auto', // Automatically calculate gas
      [{ denom: 'ukava', amount: '2000' }] // Adjust fees as needed
    );

    logger.info('Combined transaction successful:', ibcResult);
    return ibcResult.transactionHash;

  } catch (error) {
    logger.error('Error during combined transaction from Kava EVM to Sei:', error.message);
    throw error;
  }
}
