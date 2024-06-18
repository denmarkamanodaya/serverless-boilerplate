const { mockClient } = require('aws-sdk-client-mock');
const { randomUUID } = require('crypto');
const { KMSClient, GenerateRandomCommand, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');
const { kmsGenerateRandom, kmsSign, kmsVerify, kmsSignv2, kmsVerifyv2 } = require('../../../../src/utils/aws/kms');

let kmsMock = mockClient(KMSClient);

describe('aws-kms', () => {
  beforeEach(() => {
    kmsMock.reset();
  });

  describe('kmsGenerateRandom', () => {
    test('should return random generated value from kms', async () => {
      const Plaintext = randomUUID();
      kmsMock.on(GenerateRandomCommand).resolves({
        Plaintext,
      });
      const mockedGeneratedRandom = await kmsGenerateRandom({ bytes: 16 });
      expect(Buffer.from(mockedGeneratedRandom, 'base64url').toString()).toBe(Plaintext);
    });
  });

  describe('kmsSign', () => {
    test('should create a digital signature', async () => {
      const Signature = randomUUID();
      kmsMock.on(SignCommand).resolves({
        Signature,
      });
      const mockedSignature = await kmsSign({ data: 'data' });
      expect(mockedSignature.Signature).toBe(Signature);
    });
  });

  describe('kmsVerify', () => {
    test('should verify digital signature', async () => {
      const Signature = randomUUID();
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const mockedIsVerified = await kmsVerify(Signature);
      expect(mockedIsVerified).toBe(true);
    });
  });

  describe('kmsSignv2', () => {
    test('should create a digital signature', async () => {
      const Signature = randomUUID();
      kmsMock.on(SignCommand).resolves({
        Signature,
      });
      const mockedSignature = await kmsSignv2({ data: 'data' });
      expect(mockedSignature).toBe(Signature);
    });

    test('should throw an error when request to aws fails', async () => {
      kmsMock.on(SignCommand).rejects();
      expect(kmsSignv2({ data: 'data' })).rejects.toThrow('ERROR_PROCESSING');
    });
  });

  describe('kmsVerifyv2', () => {
    test('should verify digital signature', async () => {
      const Signature = randomUUID();
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });
      const mockedIsVerified = await kmsVerifyv2(Signature);
      expect(mockedIsVerified).toBe(true);
    });

    test('should throw an error when request to aws fails', async () => {
      kmsMock.on(VerifyCommand).rejects();
      expect(kmsVerifyv2('Signature')).rejects.toThrow('JWT_INVALID');
    });
  });
});
