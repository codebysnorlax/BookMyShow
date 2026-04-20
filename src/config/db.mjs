import pg from "pg";
import "dotenv/config";

export const pool = new pg.Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || "5432", 10),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  max: 20,
});

export async function initDB() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id       SERIAL PRIMARY KEY,
      username VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      balance  INT NOT NULL DEFAULT 0,
      bookings INT NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS used_coupons (
      user_id INT NOT NULL,
      code    VARCHAR(20) NOT NULL,
      PRIMARY KEY (user_id, code)
    );

    CREATE TABLE IF NOT EXISTS seats (
      id       SERIAL PRIMARY KEY,
      isbooked INT DEFAULT 0,
      price    INT NOT NULL DEFAULT 100,
      type     VARCHAR(10) NOT NULL DEFAULT 'regular'
    );

    -- migrate: add user_id FK if it doesn't exist yet
    ALTER TABLE seats ADD COLUMN IF NOT EXISTS user_id INT REFERENCES users(id) ON DELETE SET NULL;

    INSERT INTO seats (isbooked, price, type)
    SELECT * FROM (VALUES
      (0, 1400, 'sofa'), (0, 1500, 'sofa'), (0, 1350, 'sofa'), (0, 1450, 'sofa'), (0, 1200, 'sofa'),
      (0, 810,  'regular'), (0, 760, 'regular'), (0, 900, 'regular'), (0, 780, 'regular'), (0, 830, 'regular'),
      (0, 510,  'regular'), (0, 470, 'regular'), (0, 570, 'regular'), (0, 490, 'regular'), (0, 530, 'regular'),
      (0, 260,  'regular'), (0, 230, 'regular'), (0, 310, 'regular'), (0, 240, 'regular'), (0, 280, 'regular'),
      (0, 90,   'regular'), (0, 70,  'regular'), (0, 120, 'regular'), (0, 60,  'regular'), (0, 100, 'regular'),
      (0, 50,   'regular'), (0, 40,  'regular'), (0, 80,  'regular'), (0, 45,  'regular'), (0, 60,  'regular')
    ) AS v(isbooked, price, type)
    WHERE NOT EXISTS (SELECT 1 FROM seats LIMIT 1);
  `);
}
