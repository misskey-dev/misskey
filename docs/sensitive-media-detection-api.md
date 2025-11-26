# Sensitive Media Detection External Service API

This document describes the API contract for an external sensitive media detection service that can be used with Misskey.

## Endpoint

The external service should expose a single HTTP POST endpoint at the URL configured in the Misskey admin settings (`sensitiveMediaDetectionProxyUrl`).

## Request

### Method
`POST`

### Headers
- `Content-Type: application/json`

### Body
JSON object with the following structure:
```json
{
  "image": "base64-encoded-image-data"
}
```

Where `image` is the base64-encoded binary data of the image file to analyze.

## Response

### Success (HTTP 200)

JSON object with the following structure:
```json
{
  "predictions": [
    {
      "className": "Neutral",
      "probability": 0.95
    },
    {
      "className": "Drawing",
      "probability": 0.03
    },
    {
      "className": "Sexy",
      "probability": 0.01
    },
    {
      "className": "Porn",
      "probability": 0.005
    },
    {
      "className": "Hentai",
      "probability": 0.005
    }
  ]
}
```

The `predictions` array should contain objects with:
- `className`: One of `"Neutral"`, `"Drawing"`, `"Sexy"`, `"Porn"`, or `"Hentai"`
- `probability`: A number between 0 and 1 indicating the confidence level

The classification names and behavior should match the [nsfwjs](https://github.com/infinitered/nsfwjs) library.

### Error

On error, the external service can return any HTTP error status code. Misskey will treat the request as failed and will not mark the file as sensitive (allowing the upload to proceed).

## Timeout

Requests will timeout after 10 seconds. The external service should respond within this time limit.

## Example Implementation

A simple example using nsfwjs:

```javascript
const express = require('express');
const nsfw = require('nsfwjs');
const tf = require('@tensorflow/tfjs-node');

const app = express();
app.use(express.json({ limit: '50mb' }));

let model;

async function loadModel() {
  model = await nsfw.load();
}

app.post('/', async (req, res) => {
  try {
    const { image } = req.body;
    const buffer = Buffer.from(image, 'base64');
    const tfImage = await tf.node.decodeImage(buffer, 3);
    const predictions = await model.classify(tfImage);
    tfImage.dispose();
    
    res.json({ predictions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

loadModel().then(() => {
  app.listen(3000, () => {
    console.log('Sensitive media detection service running on port 3000');
  });
});
```

## Benefits of External Service

- **Reduced Memory Usage**: nsfwjs and TensorFlow can be memory-intensive. Running them separately reduces Misskey's memory footprint.
- **Scalability**: The detection service can be scaled independently.
- **Alternative Implementations**: Operators can use different detection models or services (e.g., cloud-based APIs, more efficient models).
- **Isolation**: Issues with the detection service don't affect Misskey's core functionality.
