// Load ./.env if present (local use). Hosting dashboards set real environment variables instead.
try {
  process.loadEnvFile();
} catch {
  /* no .env file */
}
