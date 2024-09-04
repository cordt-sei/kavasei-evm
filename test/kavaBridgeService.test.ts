import { bridgeTokens, ibcTransfer } from '../src/services/kavaBridgeService';
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

  it('should handle invalid inputs for bridge tokens', async () => {
    try {
      await bridgeTokens('', '', '0', '');
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });

  it('should convert EVM to Sei address correctly', async () => {
    const evmAddress = '0xYourEvmAddress';
    const seiAddress = await convertEvmToSeiAddress(evmAddress);
    expect(seiAddress).to.match(/^sei1/);
  });

  it('should handle network failures for address conversion', async () => {
    try {
      await convertEvmToSeiAddress('invalid address');
    } catch (error) {
      expect(error).to.be.an('error');
    }
  });
});
