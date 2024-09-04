# Kava Bridge Backend

This backend service provides APIs to bridge EVM-based USDT tokens from the Kava EVM side to the Kava Cosmos side and perform IBC transfers (or use Packet Forward Middleware) to another IBC-enabled chain. The service allows for EVM address conversion to Sei native addresses and facilitates cross-chain transactions.

## Features

- **Bridge Tokens**: Transfer EVM-based tokens from Kava EVM to the Cosmos side.
- **Convert EVM Address to Sei Address**: Use Sei's RPC to convert EVM addresses to Sei native addresses.
- **IBC Transfer**: Perform IBC transfers to another IBC-enabled chain.

## Prerequisites

- **Node.js** (v14 or higher)
- **TypeScript**
- Access to Kava and Sei RPC endpoints

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/cordt-sei/kavasei-evm.git
   cd kavasei-evm
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

- **Environment Variables**: Create a `.env` file in the root directory and add the following:
  
  ```env
  PORT=3000
  KAVA_GRPC_URL='kava.grpc.io:9090' # Replace with actual Kava gRPC endpoint
  SEI_RPC_URL='https://sei-chain-rpc-url' # Replace with actual Sei RPC endpoint
  ```

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

## Testing

Run the tests using:

```bash
npm test
```

## Deployment

To deploy the backend on a server:

1. Set environment variables as per your environment.
2. Run `node dist/index.js`.

## Troubleshooting

- **Connection Errors**: Ensure the RPC endpoints are accessible and correctly configured.
- **Transaction Errors**: Check the input parameters and ensure the addresses, amounts, and denominations are valid.

## Contributing

Feel free to submit pull requests or open issues for any bugs or feature requests.

## License

MIT License
