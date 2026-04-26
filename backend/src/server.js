const { pool } = require('./config/db');
const { app } = require('./app');

const port = Number(process.env.PORT) || 5000;

const server = app.listen(port, () => {
  console.log(`Backend server is running on port ${port}.`);
});

async function shutdown() {
  server.close(async () => {
    await pool.end().catch(() => {});
    process.exit(0);
  });
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
