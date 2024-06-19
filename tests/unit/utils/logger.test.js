const logger = require('../../../src/common/logger');

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
});
