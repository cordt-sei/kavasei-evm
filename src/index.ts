app.post('/bridge', async (req, res) => {
  try {
    const { evmAddress, seiAddress, amount } = req.body;
    if (!evmAddress || !seiAddress || !amount) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const cosmosRecipientAddress = convertEvmToSeiAddress(evmAddress); // Convert EVM to Cosmos address

    const txHash = await combinedTransferUsdtToSei(evmAddress, cosmosRecipientAddress, seiAddress, amount);
    res.json({ txHash });

  } catch (error) {
    logger.error('Error handling bridge request:', error.message);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});
