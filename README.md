# start
```bash
docker compose up

docker exec -it chai_sql_db psql -U postgres -d sql_book_my_show_db

```
```sql
-- to see who are taken seat and how much
SELECT * FROM seats ORDER BY id;
-- to see user that has been registered 
SELECT * FROM users;
-- ! for set seats to default values
UPDATE seats SET name = NULL, isbooked = 0;
```
--- 
# instructions
Your goal is to build a simplified Book My Ticket platform where:

    Users can register
    Users can login
    Only authenticated users can access protected endpoints
    Logged-in users can book seats for a movie

For now, you can assume mock movie data and focus mainly on authentication and seat booking logic. Frontend is optional. You can build it if you want, but evaluation will be based on backend implementation.

This assignment is designed to simulate a real developer scenario where you extend an existing production codebase instead of starting fresh.
Rules & Guidelines

    Starter source code must be used as the base
    Do not remove or break existing endpoints
    Add authentication layer on top of the current system
    Implement register and login functionality
    Protect booking related endpoints using auth middleware
    Only logged-in users should be allowed to book seats
    Prevent duplicate seat bookings
    Associate bookings with logged-in users
    Keep movie data mocked for now
    Frontend is optional
    Code should be clean, structured and readable
    Submit a working GitHub repository with proper README explaining setup and flow
