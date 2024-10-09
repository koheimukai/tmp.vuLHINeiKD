import { chromium } from "playwright";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

async function initializeDatabase() {
  const db = await open({
    filename: "hackernews.db",
    driver: sqlite3.Database,
  });

  await db.exec(`
    CREATE TABLE IF NOT EXISTS news_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      rank INTEGER,
      title TEXT,
      link TEXT,
      points INTEGER,
      comments INTEGER
    )
  `);

  await db.exec(`
    CREATE TABLE IF NOT EXISTS link_contents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      link TEXT UNIQUE,
      content TEXT
    )
  `);

  return db;
}

async function scrapeHackerNews() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto("https://news.ycombinator.com");

  const items = await page.$$eval(".athing", (elements) => {
    return elements.map((el) => {
      const rank = el.querySelector(".rank")?.innerText.replace(".", "") || "";
      const title = el.querySelector(".titleline > a")?.innerText || "";
      const link = el.querySelector(".titleline > a")?.href || "";

      const subtext = el.nextElementSibling;
      const points =
        subtext?.querySelector(".score")?.innerText.split(" ")[0] || "0";
      const commentsLink = subtext?.querySelector("a:last-child");
      const comments =
        commentsLink?.innerText.split(" ")[0] === "discuss"
          ? "0"
          : commentsLink?.innerText.split(" ")[0] || "0";

      return {
        rank: parseInt(rank),
        title,
        link,
        points: parseInt(points),
        comments: parseInt(comments),
      };
    });
  });

  await browser.close();
  return items;
}

async function saveToDatabase(db, items) {
  const stmt = await db.prepare(
    "INSERT INTO news_items (rank, title, link, points, comments) VALUES (?, ?, ?, ?, ?)",
  );
  for (const item of items) {
    await stmt.run(
      item.rank,
      item.title,
      item.link,
      item.points,
      item.comments,
    );
  }
  await stmt.finalize();
}

async function fetchAndExtractContent(url) {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  try {
    await page.goto(url, { timeout: 30000 });
    const content = await page.evaluate(() => {
      return document.body.innerText;
    });
    return content.slice(0, 1000); // Limit content to 1000 characters
  } catch (error) {
    console.error(`Error fetching content from ${url}: ${error.message}`);
    return "";
  } finally {
    await browser.close();
  }
}

async function main() {
  const db = await initializeDatabase();
  const items = await scrapeHackerNews();
  await saveToDatabase(db, items);
  console.log(`Saved ${items.length} items to the database.`);

  const contentStmt = await db.prepare(
    "INSERT OR REPLACE INTO link_contents (link, content) VALUES (?, ?)",
  );
  for (const item of items) {
    const content = await fetchAndExtractContent(item.link);
    await contentStmt.run(item.link, content);
    console.log(`Saved content for: ${item.title}`);
  }
  await contentStmt.finalize();

  await db.close();
}

main().catch(console.error);
