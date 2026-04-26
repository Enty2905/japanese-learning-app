const dotenv = require("dotenv");
const { Client } = require("pg");

dotenv.config();

async function testDatabaseConnection() {
  const requiredEnvVars = ["DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD"];
  const missingEnvVars = requiredEnvVars.filter((key) => !process.env[key]);

  if (missingEnvVars.length > 0) {
    console.error("[DB TEST] Missing env vars:", missingEnvVars.join(", "));
    process.exitCode = 1;
    return;
  }

  const client = new Client({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });

  try {
    await client.connect();
    const result = await client.query("SELECT NOW() AS server_time");
    console.log("[DB TEST] Connected to PostgreSQL successfully.");
    console.log("[DB TEST] Server time:", result.rows[0].server_time);
  } catch (error) {
    console.error("[DB TEST] Failed to connect to PostgreSQL.");
    console.error("[DB TEST] Error:", error.message);
    process.exitCode = 1;
  } finally {
    await client.end().catch(() => {});
  }
}

testDatabaseConnection();
