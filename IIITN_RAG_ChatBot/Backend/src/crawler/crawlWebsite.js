// crawler.js
const { chromium } = require("playwright");
const cheerio = require("cheerio");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const mammoth = require("mammoth");
const pdfParse = require("pdf-parse");

const BASE_URL = "https://iiitn.ac.in";
const OUTPUT_DIR = "./downloaded_files";
const KNOWLEDGE_FILE = "./knowledge.json";

if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR);

const visited = new Set();
const knowledge = [];
const pdfLinks = new Set();

// ─── Page Text Extract ───────────────────────────────────────
async function scrapePage(page, url) {
  try {
    console.log(`📄 Scraping: ${url}`);
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(1500);

    const html = await page.content();
    const $ = cheerio.load(html);

    $("script, style, nav, footer, header").remove();

    const text = $("body").text().replace(/\s+/g, " ").trim();
    const title = $("title").text().trim();

    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (href) {
        const fullHref = href.startsWith("http") ? href : BASE_URL + href;
        if (href.toLowerCase().endsWith(".pdf") || href.includes("/media/")) {
          pdfLinks.add(fullHref);
        }
      }
    });

    const links = [];
    $("a").each((_, el) => {
      const href = $(el).attr("href");
      if (
        href &&
        href.startsWith("/") &&
        !href.toLowerCase().endsWith(".pdf") &&
        !href.toLowerCase().endsWith(".docx")
      ) {
        links.push(BASE_URL + href);
      }
    });

    knowledge.push({ url, title, text });
    return links;
  } catch (err) {
    console.error(`❌ Error on ${url}: ${err.message}`);
    return [];
  }
}

// ─── PDF Download + Text Extract ────────────────────────────
async function downloadAndExtractPDF(url) {
  try {
    const filename =
      path.basename(url.split("?")[0]) || `file_${Date.now()}.pdf`;
    const filepath = path.join(OUTPUT_DIR, filename);

    let buffer;

    if (fs.existsSync(filepath)) {
      console.log(`⏭️  Already exists, extracting: ${filename}`);
      buffer = fs.readFileSync(filepath);
    } else {
      console.log(`📥 Downloading PDF: ${url}`);
      const response = await axios.get(url, {
        responseType: "arraybuffer",
        timeout: 20000,
      });
      buffer = Buffer.from(response.data);
      fs.writeFileSync(filepath, buffer);
    }

    const data = await pdfParse(buffer);
    knowledge.push({
      type: "pdf",
      url,
      file: filename,
      text: data.text.replace(/\s+/g, " ").trim(),
    });
    console.log(`✅ PDF done: ${filename}`);
  } catch (err) {
    console.error(`❌ PDF Error ${url}: ${err.message}`);
  }
}

// ─── Main Crawler ────────────────────────────────────────────
async function main() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const startPages = [
    `${BASE_URL}/`,
    `${BASE_URL}/page/notices/7/`,
    `${BASE_URL}/page/faculty/204/`,
    `${BASE_URL}/page/events/8/`,
    `${BASE_URL}/page/about/1/`,
    `${BASE_URL}/page/academics/2/`,
    `${BASE_URL}/page/admissions/5/`,
    `${BASE_URL}/page/placements/6/`,
    `${BASE_URL}/page/research/9/`,
    `${BASE_URL}/page/tenders/10/`,
  ];

  const queue = [...startPages];

  while (queue.length > 0) {
    const url = queue.shift();

    if (visited.has(url)) continue;
    if (visited.size > 150) break;
    visited.add(url);

    const newLinks = await scrapePage(page, url);

    for (const link of newLinks) {
      if (
        link.includes("iiitn.ac.in") &&
        !visited.has(link) &&
        !queue.includes(link)
      ) {
        queue.push(link);
      }
    }

    await page.waitForTimeout(800);
  }

  await browser.close();

  console.log(`\n📦 Total PDFs found: ${pdfLinks.size}`);
  for (const pdfUrl of pdfLinks) {
    await downloadAndExtractPDF(pdfUrl);
  }

  fs.writeFileSync(KNOWLEDGE_FILE, JSON.stringify(knowledge, null, 2));
  console.log(`\n🎉 Done! Total entries: ${knowledge.length}`);
  console.log(`📁 Knowledge saved to: ./knowledge.json`);
}

main();
