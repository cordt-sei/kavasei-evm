import express from 'express';
import { bridgeTokens, ibcTransfer } from './services/kavaBridgeService';
import { convertEvmToSeiAddress } from './services/seiAddressService';

const app = express();
app.use(express.json());

app.post('/bridge', async (req, res) => {
  try {
    const { evmAddress, cosmosRecipientAddress, amount, denom } = req.body;
    const txHash = await bridgeTokens(evmAddress, cosmosRecipientAddress, amount, denom);
    res.json({ txHash });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/convert-address', async (req, res) => {
  try {
    const { evmAddress } = req.body;
    const seiAddress = await convertEvmToSeiAddress(evmAddress);
    res.json({ seiAddress });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/ibc-transfer', async (req, res) => {
  try {
    const { mnemonic, sourceAddress, destinationAddress, amount, denom, channel } = req.body;
    await ibcTransfer(mnemonic, sourceAddress, destinationAddress, amount, denom, channel);
    res.json({ status: 'IBC transfer successful' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
