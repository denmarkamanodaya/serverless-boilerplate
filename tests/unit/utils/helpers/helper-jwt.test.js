const { sign, decode, isExpired, verify } = require('../../../../src/utils/helpers/jwt-helperv2');
const { mockClient } = require('aws-sdk-client-mock');
const { randomUUID } = require('crypto');
const { KMSClient, SignCommand, VerifyCommand } = require('@aws-sdk/client-kms');

const kmsMock = mockClient(KMSClient);

describe('helper-test', () => {
  beforeEach(() => {
    kmsMock.reset();
  });

  const expiredToken =
    'eyJhbGciOiJSUzI1NiIsInR5cCI6ImpXVCJ9.eyJpYXQiOjE2OTI4NTc3NjEsImV4cCI6MTY5Mjg1Nzc2MiwiZGF0YSI6ImRhdGEifQ.c2lnbmF0dXJl';

  describe('sign', () => {
    test('should create a jwt token', async () => {
      const mockedSignature = randomUUID();
      kmsMock.on(SignCommand).resolves({
        Signature: mockedSignature,
      });

      const jwtToken = await sign({ data: 'data' });

      const [header, payload, signature] = jwtToken.split('.').map((tkn) => Buffer.from(tkn, 'base64url').toString());

      expect(JSON.parse(header)).toMatchObject({
        alg: expect.any(String),
        typ: expect.any(String),
      });
      expect(JSON.parse(payload)).toMatchObject({
        iat: expect.any(Number),
        exp: expect.any(Number),
        data: expect.any(String),
      });
      expect(signature).toBe(mockedSignature);
    });
  });

  describe('decode', () => {
    test('should return the token payload', () => {
      const token =
        'eyJhbGciOiJSUzI1NiIsInR5cCI6ImpXVCJ9.eyJpYXQiOjE2OTI4NTcwMjksImV4cCI6MTY5Mjg1ODgyOSwiZGF0YSI6ImRhdGEifQ.MDNkMmVjODYtZjZiNS00M2JiLWJkYjEtMTdiZGRjYTA2YjVi';
      const decodedPayload = decode(token);

      expect(decodedPayload).toMatchObject({
        iat: expect.any(Number),
        exp: expect.any(Number),
        data: expect.any(String),
      });
    });
  });

  describe('isExpired', () => {
    test('should return false when token is not expired', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      const token = await sign({ data: 'data' });

      expect(isExpired(token)).toBe(false);
    });

    test('should return true when token is expired', async () => {
      expect(isExpired(expiredToken)).toBe(true);
    });
  });

  describe('verify', () => {
    test('should return true when token is kms verified and not expired', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });

      const token = await sign({ data: 'data' });

      expect(verify(token)).resolves.toBe(true);
    });

    test('should return false when token is not kms verified and not expired', async () => {
      kmsMock.on(SignCommand).resolves({
        Signature: 'signature',
      });
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: false,
      });

      const token = await sign({ data: 'data' });

      expect(verify(token)).resolves.toBe(false);
    });

    test('should return false when token is kms verified and is expired', async () => {
      kmsMock.on(VerifyCommand).resolves({
        SignatureValid: true,
      });

      expect(verify(expiredToken)).resolves.toBe(false);
    });

    test('should throw an error when kms request failed', async () => {
      kmsMock.on(VerifyCommand).rejects();
      expect(verify(expiredToken)).rejects.toThrow('JWT_INVALID');
    });
  });
});
