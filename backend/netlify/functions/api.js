const serverless = require("serverless-http");
const app = require("../../server");

module.exports.handler = serverless(app, {
  binary: [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "application/pdf",
    "application/octet-stream"
  ]
});
