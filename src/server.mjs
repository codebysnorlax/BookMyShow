import "dotenv/config";
import app from "./app.mjs";
import { initDB } from "./config/db.mjs";

const port = process.env.PORT || 8080;

if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not set in environment");

await initDB();
app.listen(port, () => console.log(`Server running on port ${port}`));
