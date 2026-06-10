const { Document } = require("@langchain/core/documents");

function cleanDocuments(data) {
  return data
    .filter((item) => item.text && !item.text.includes("404Page Not Found"))
    .map((item) => {
      const cleanText = item.text
        .replace(/\s+/g, " ")
        .replace(/Original textRate this translation/gi, "")
        .trim();

      return new Document({
        pageContent: cleanText,
        metadata: {
          url: item.url,
          title: item.title || "Untitled PDF",
        },
      });
    });
}

module.exports = { cleanDocuments };
