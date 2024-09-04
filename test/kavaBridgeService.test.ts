import { bridgeTokens } from '../src/services/kavaBridgeService';
import { convertEvmToSeiAddress } from '../src/services/seiAddressService';
import { expect } from 'chai';
import 'mocha';

describe('Kava Bridge Service', () => {
  it('should bridge tokens correctly', async () => {
    const evmAddress = '0xYourEvmAddress';
    const cosmosRecipientAddress = 'kava1recipientaddress';
    const amount = '1000000';
    const denom = 'erc20/usdt';

    const txHash = await bridgeTokens(evmAddress, cosmosRecipientAddress, amount, denom);
    expect(txHash).to.be.a('string');
  });

  it('should convert EVM to Sei address correctly', async () => {
    const evmAddress = '0xYourEvmAddress';
    const seiAddress = await convertEvmToSeiAddress(evmAddress);
    expect(seiAddress).to.match(/^sei1/);
  });
});
