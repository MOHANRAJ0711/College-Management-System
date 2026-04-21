const jwt = require('jsonwebtoken');
const generateToken = require('../utils/generateToken');

jest.mock('jsonwebtoken');

describe('generateToken', () => {
  let originalEnv;

  beforeAll(() => {
    originalEnv = process.env;
    process.env = { ...originalEnv, JWT_SECRET: 'testsecret', JWT_EXPIRE: '1d' };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('should call jwt.sign with correct payload and options', () => {
    jwt.sign.mockReturnValue('mockedToken');
    
    const token = generateToken('userId123');
    
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 'userId123' }, 
      'testsecret', 
      { expiresIn: '1d' }
    );
    expect(token).toBe('mockedToken');
  });
});
