CREATE TABLE seats (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    isbooked INT DEFAULT 0,
    price INT NOT NULL DEFAULT 100,
    type VARCHAR(10) NOT NULL DEFAULT 'regular'
);

-- Row 0: VIP Sofa/Couch (5 seats) — $1200-$1500
-- Row 1: Premium front  (5 seats) — $750-$900
-- Row 2: Standard       (5 seats) — $450-$580
-- Row 3: Economy        (5 seats) — $220-$320
-- Row 4: Back cheap     (5 seats) — $60-$130
-- Row 5: Last row       (5 seats) — $40-$80
INSERT INTO seats (isbooked, price, type) VALUES
  (0, 1400, 'sofa'), (0, 1500, 'sofa'), (0, 1350, 'sofa'), (0, 1450, 'sofa'), (0, 1200, 'sofa'),
  (0, 810,  'regular'), (0, 760, 'regular'), (0, 900, 'regular'), (0, 780, 'regular'), (0, 830, 'regular'),
  (0, 510,  'regular'), (0, 470, 'regular'), (0, 570, 'regular'), (0, 490, 'regular'), (0, 530, 'regular'),
  (0, 260,  'regular'), (0, 230, 'regular'), (0, 310, 'regular'), (0, 240, 'regular'), (0, 280, 'regular'),
  (0, 90,   'regular'), (0, 70,  'regular'), (0, 120, 'regular'), (0, 60,  'regular'), (0, 100, 'regular'),
  (0, 50,   'regular'), (0, 40,  'regular'), (0, 80,  'regular'), (0, 45,  'regular'), (0, 60,  'regular');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    balance INT NOT NULL DEFAULT 0,
    bookings INT NOT NULL DEFAULT 0
);
