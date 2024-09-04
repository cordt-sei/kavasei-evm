import express from 'express';
import rateLimit from 'express-rate-limit'; // Rate limiting middleware
import dotenv from 'dotenv';
import { bridgeTokens, ibcTransfer } from './services/kavaBridgeService';
import { convertEvmToSeiAddress } from './services/seiAddressService';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Rate limiting to prevent abuse
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Middleware for logging
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.post('/bridge', async (req, res) => {
  try {
    const { evmAddress, cosmosRecipientAddress, amount, denom } = req.body;
    if (!evmAddress || !cosmosRecipientAddress || !amount || !denom) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const txHash = await bridgeTokens(evmAddress, cosmosRecipientAddress, amount, denom);
    res.json({ txHash });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/convert-address', async (req, res) => {
  try {
    const { evmAddress } = req.body;
    if (!evmAddress) {
      return res.status(400).json({ error: 'Missing evmAddress' });
    }
    const seiAddress = await convertEvmToSeiAddress(evmAddress);
    res.json({ seiAddress });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/ibc-transfer', async (req, res) => {
  try {
    const { mnemonic, sourceAddress, destinationAddress, amount, denom, channel } = req.body;
    if (!mnemonic || !sourceAddress || !destinationAddress || !amount || !denom || !channel) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    await ibcTransfer(mnemonic, sourceAddress, destinationAddress, amount, denom, channel);
    res.json({ status: 'IBC transfer successful' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
