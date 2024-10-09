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

async function main() {
  const db = await initializeDatabase();
  const items = await scrapeHackerNews();
  await saveToDatabase(db, items);
  console.log(`Saved ${items.length} items to the database.`);
  await db.close();
}

main().catch(console.error);
