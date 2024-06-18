const logger = require('../../../src/utils/logger');

describe('util-logger', () => {
  beforeEach(() => {
    const { stdout } = require('process');
    logSpy = jest.spyOn(stdout, 'write');
  });

  test('should be able to log all levels on non prod', () => {
    logger.error('error non prod');
    logger.debug('debug non prod');
    logger.info('info non prod');

    expect(logSpy.mock.calls.length).toBe(3);
    expect(logSpy.mock.calls[0][0]).toContain('error non prod');
    expect(logSpy.mock.calls[1][0]).toContain('debug non prod');
    expect(logSpy.mock.calls[2][0]).toContain('info non prod');
  });

  test('should be able to log only error and debug in prod', () => {
    jest.resetModules();
    process.env.NODE_ENV = 'production';
    const logger = require('../../../src/utils/logger');

    logger.error('error prod');
    logger.debug('debug prod');
    logger.info('info prod');

    expect(logSpy.mock.calls.length).toBe(2);
    expect(logSpy.mock.calls[0][0]).toContain('error: error prod');
    expect(logSpy.mock.calls[1][0]).toContain('debug: debug prod');
    expect(logSpy.mock.calls[3]).toBeUndefined();
  });
});
