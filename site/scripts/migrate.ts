// npm run db:migrate: apply db/migrations to $DATABASE_URL (also runs
// automatically on the app's first database access).
import { getDb } from "../src/lib/db/client";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set");
  process.exit(1);
}
getDb()
  .then(() => {
    console.log("Migrations up to date");
    process.exit(0);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
