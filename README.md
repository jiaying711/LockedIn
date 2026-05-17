# Project scope: 💚
- user authentication
- user sessions
- database with password hashing and profile picture?
- pomodoro / timer (study with me)
    - focus session (start and end)
- can choose music (link to youtube music and/or spotify)
- basic dashboard (total study time today)
    - like YPT -> different mode / 
- task list (what are you working on today?)

- track time + block time if possible
- leaderboard (future)


## Instructions to start:
1. cd backend & npm run dev
2. brew services start mysql

3. mysql < database/schema.sql (for first time)
4. mysql < backup.sql (with users info, i.e. not first time)
5. USE lockedin;

after exiting:
5. mysqldump > database/backup.sql