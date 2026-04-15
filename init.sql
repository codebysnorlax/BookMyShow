CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    isbooked INT DEFAULT 0
);

INSERT INTO seats (isbooked) SELECT 0 FROM generate_series(1, 20);

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

SELECT * FROM seats ORDER BY id;
-- ! for set seats to default values
UPDATE seats SET name = NULL, isbooked = 0;
SELECT * FROM users;