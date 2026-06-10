const fs = require("fs");
const { Document } = require("@langchain/core/documents");


function loadJSON(filePath) {
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

  // console.log(`Loaded ${data.length} raw records`);

  return data;
}

module.exports = { loadJSON };

