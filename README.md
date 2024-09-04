# Kava Bridge Backend

This backend service provides APIs to bridge EVM-based USDT tokens from the Kava EVM side to the Kava Cosmos side and perform IBC transfers (or use Packet Forward Middleware) to another IBC-enabled chain. The service allows for EVM address conversion to Sei native addresses and IBC transfers.

## Features

- **Bridge Tokens**: Transfer EVM-based tokens from Kava EVM to the Cosmos side.
- **Convert EVM Address to Sei Address**: Use Sei's RPC to convert EVM addresses to Sei native addresses.
- **IBC Transfer**: Perform IBC transfers to another IBC-enabled chain.

## Prerequisites

- **Node.js** (v14 or higher)
- **TypeScript**

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-repo/kava-bridge-backend.git
   cd kava-bridge-backend
   ```

2. Install the dependencies:

   ```bash
   npm install
   ```

3. Compile the TypeScript files:

   ```bash
   npx tsc
   ```

## Configuration

- Ensure the correct gRPC and RPC endpoints are configured:
  - **Kava gRPC URL**: Update the `KAVA_GRPC_URL` constant in `src/services/kavaBridgeService.ts`.
  - **Sei RPC URL**: Update the `SEI_RPC_URL` constant in `src/services/seiAddressService.ts`.

- Adjust the `kava.proto` file under the `grpc` folder to match the latest Kava protocol definitions.

## Usage

Run the server:

```bash
node dist/index.js
```

The server will start on `http://localhost:3000`.

### API Endpoints

1. **Bridge Tokens**

   - **Endpoint**: `/bridge`
   - **Method**: `POST`
   - **Description**: Constructs a transaction to bridge tokens from Kava EVM to the Kava Cosmos side.
   - **Request Body**:
     ```json
     {
       "evmAddress": "0xYourEvmAddress",
       "cosmosRecipientAddress": "kava1recipientaddress",
       "amount": "1000000",
       "denom": "erc20/usdt"
     }
     ```
   - **Response**:
     ```json
     {
       "txHash": "transaction_hash"
     }
     ```

2. **Convert EVM to Sei Address**

   - **Endpoint**: `/convert-address`
   - **Method**: `POST`
   - **Description**: Converts an EVM address to a Sei native address.
   - **Request Body**:
     ```json
     {
       "evmAddress": "0xYourEvmAddress"
     }
     ```
   - **Response**:
     ```json
     {
       "seiAddress": "sei1address"
     }
     ```

3. **IBC Transfer**

   - **Endpoint**: `/ibc-transfer`
   - **Method**: `POST`
   - **Description**: Performs an IBC transfer from Kava to another IBC-enabled chain.
   - **Request Body**:
     ```json
     {
       "mnemonic": "your mnemonic here",
       "sourceAddress": "kava1sourceaddress",
       "destinationAddress": "cosmos1destinationaddress",
       "amount": "1000000",
       "denom": "ukava",
       "channel": "channel-0"
     }
     ```
   - **Response**:
     ```json
     {
       "status": "IBC transfer successful"
     }
     ```

## Notes

- Replace the placeholder values with actual data.
- Make sure you have the correct permissions and wallets set up to perform the transactions.

## License

MIT License
