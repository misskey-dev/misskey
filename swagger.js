const swaggerJSDoc = require('swagger-jsdoc');
const fs = require('fs');

const apiRoot = './src/api/endpoints';
const files = [
  'auth/session/generate.js'
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

var swaggerSpec = swaggerJSDoc(options);
swaggerSpec.definitions.Error = errorDefinition;

fs.writeFileSync('api-docs.json', JSON.stringify(swaggerSpec));

