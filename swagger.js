'use strict'

const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');
const yaml = require('js-yaml');

const apiRoot = './src/api/endpoints';
const files = [
  'users.js',
  'auth/session/generate.js',
  'auth/session/userkey.js',
];

const errorDefinition = {
  'type': 'object',
  'properties':{
    'error': {
      'type': 'string',
      'description': 'Error message'
    }
  }
} 

var options = {
  swaggerDefinition: {
    swagger: '2.0',
    info: {
      title: 'Misskey API',
      version: 'aoi',
    },
    host: 'api.misskey.xyz',
    schemes: ['https'],
    consumes: [
      'application/x-www-form-urlencoded'
    ],
    produces: [
      'application/json'
    ]
  },
  apis: []
};
options.apis = files.map(c => {return `${apiRoot}/${c}`;});

if(fs.existsSync('.config/config.yml')){
  var config = yaml.safeLoad(fs.readFileSync('./.config/config.yml', 'utf8'));
  options.swaggerDefinition.host = config.url;
  options.swaggerDefinition.schemes = config.https.enable ? ['https'] : ['http'];
}

var swaggerSpec = swaggerJSDoc(options);
swaggerSpec.definitions.Error = errorDefinition;

fs.writeFileSync('api-docs.json', JSON.stringify(swaggerSpec));

