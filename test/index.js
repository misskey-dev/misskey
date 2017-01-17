// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

// Init babel
require('babel-core/register');
require('babel-polyfill');
