# Project Name

Brief description of your project.

## Project Structure

This project is structured with separate frontend and backend directories:

```
project-root/
├── frontend/
│   ├── src/
│   ├── public/
│   └── server.js (frontend server)
├── backend/
│   └── server.js (backend server)
├── package.json
└── .gitignore
```

- `frontend/`: Contains the React application and its development server.
- `backend/`: Contains the Express.js API server and database operations.

## Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Start the backend server:
   ```
   node backend/server.js
   ```
4. In a new terminal, start the frontend development server:
   ```
   cd frontend
   npm start
   ```

## Database

This project uses SQLite. The database file is located at `backend/your_database.db`.

## API Endpoints

- `GET /api/data`: Fetches all data from the database.

## Technologies Used

- Frontend: React, Vite
- Backend: Node.js, Express.js
- Database: SQLite

## Contributing

Instructions for how to contribute to your project.

## License

Specify your project's license here.
