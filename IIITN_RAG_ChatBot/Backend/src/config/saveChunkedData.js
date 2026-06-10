const fs = require("fs");

async function chunkedData(filePath, data) {
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8", () => {});

    console.log("Chunks saved successfully!!");
  } catch (error) {
    console.error("Error during saving chunked data", error);
  }
}

module.exports = { chunkedData };
