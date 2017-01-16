/**
 * API TESTS
 */

// During the test the env variable is set to test
process.env.NODE_ENV = 'test';

const chai = require('chai');
const chaiHttp = require('chai-http');
const server = require('../built/server');
const should = chai.should();

chai.use(chaiHttp);
