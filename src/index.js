import express from 'express';
import usersRouter from './routes/users.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Body parser middleware
app.use(express.json());

// CORS middleware for separate frontend apps
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Root API info
app.get('/', (req, res) => {
  res.json({
    message: 'User Management API is running',
    endpoints: {
      'GET /users': 'Get all users',
      'GET /users/:id': 'Get a user by ID',
      'POST /users': 'Create a new user',
      'PUT /users/:id': 'Update a user by ID',
      'DELETE /users/:id': 'Delete a user by ID'
    }
  });
});

// Mount user routes
app.use('/users', usersRouter);

// 404 handler for unmatched routes
app.use((req, res, next) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

const server = app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another process.`);
    console.error(`To fix this, kill the process using port ${PORT} or start with another port:`);
    console.error(`  lsof -ti :${PORT} | xargs kill -9`);
    console.error(`  or: PORT=3001 npm start`);
  } else {
    console.error('Server error:', err);
  }
});

export default app;
