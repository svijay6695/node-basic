import { Router } from 'express';

const router = Router();

// In-memory user data
let users = [
  { id: 1, name: 'Alice Johnson', gender: 'Female', age: 28, email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', gender: 'Male', age: 34, email: 'bob@example.com' },
  { id: 3, name: 'Charlie Brown', gender: 'Male', age: 22, email: 'charlie@example.com' }
];

// GET /users - list all users
router.get('/', (req, res) => {
  res.json(users);
});

// GET /users/:id - get user by ID
router.get('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === userId);

  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }

  res.json(user);
});

// POST /users - create a new user
router.post('/', (req, res) => {
  const { name, gender, age, email } = req.body;

  if (!name || !gender || age === undefined || age === '' || !email) {
    return res.status(400).json({ error: 'Name, gender, age, and email are required' });
  }

  const numericAge = Number(age);
  if (isNaN(numericAge) || numericAge <= 0 || numericAge > 150) {
    return res.status(400).json({ error: 'Age must be a valid positive number' });
  }

  const emailExists = users.some((u) => u.email.toLowerCase() === email.toLowerCase());
  if (emailExists) {
    return res.status(409).json({ error: 'Email already exists' });
  }

  const newUser = {
    id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
    name: name.trim(),
    gender: gender.trim(),
    age: numericAge,
    email: email.trim()
  };

  users.push(newUser);
  res.status(201).json(newUser);
});

// PUT /users/:id - update existing user
router.put('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { name, gender, age, email } = req.body;
  if (!name && !gender && (age === undefined || age === '') && !email) {
    return res.status(400).json({ error: 'At least one field (name, gender, age, or email) is required to update' });
  }

  let numericAge;
  if (age !== undefined && age !== '') {
    numericAge = Number(age);
    if (isNaN(numericAge) || numericAge <= 0 || numericAge > 150) {
      return res.status(400).json({ error: 'Age must be a valid positive number' });
    }
  }

  if (email) {
    const emailConflict = users.some((u) => u.id !== userId && u.email.toLowerCase() === email.toLowerCase());
    if (emailConflict) {
      return res.status(409).json({ error: 'Email already in use by another user' });
    }
  }

  users[userIndex] = {
    ...users[userIndex],
    ...(name && { name: name.trim() }),
    ...(gender && { gender: gender.trim() }),
    ...(numericAge !== undefined && { age: numericAge }),
    ...(email && { email: email.trim() })
  };

  res.json(users[userIndex]);
});

// DELETE /users/:id - delete a user
router.delete('/:id', (req, res) => {
  const userId = parseInt(req.params.id, 10);
  const userIndex = users.findIndex((u) => u.id === userId);

  if (userIndex === -1) {
    return res.status(404).json({ error: 'User not found' });
  }

  const [deletedUser] = users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully', user: deletedUser });
});

export default router;
