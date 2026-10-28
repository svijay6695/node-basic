import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';

const router = Router();

// Fallback in-memory data for when MONGODB_URI is not yet configured
let memoryUsers = [
  { id: '1', name: 'Alice Johnson', gender: 'Female', age: 28, email: 'alice@example.com' },
  { id: '2', name: 'Bob Smith', gender: 'Male', age: 34, email: 'bob@example.com' },
  { id: '3', name: 'Charlie Brown', gender: 'Male', age: 22, email: 'charlie@example.com' }
];

const isDBConnected = () => mongoose.connection.readyState === 1;

// GET /users - list all users
router.get('/', async (req, res, next) => {
  try {
    if (isDBConnected()) {
      const users = await User.find().sort({ createdAt: -1 });
      return res.json(users);
    }
    res.json(memoryUsers);
  } catch (err) {
    next(err);
  }
});

// GET /users/:id - get user by ID
router.get('/:id', async (req, res, next) => {
  try {
    if (isDBConnected()) {
      const user = await User.findById(req.params.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json(user);
    }

    const user = memoryUsers.find((u) => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(user);
  } catch (err) {
    next(err);
  }
});

// POST /users - create a new user
router.post('/', async (req, res, next) => {
  try {
    const { name, gender, age, email } = req.body;

    if (!name || !gender || age === undefined || age === '' || !email) {
      return res.status(400).json({ error: 'Name, gender, age, and email are required' });
    }

    const numericAge = Number(age);
    if (isNaN(numericAge) || numericAge <= 0 || numericAge > 150) {
      return res.status(400).json({ error: 'Age must be a valid positive number between 1 and 150' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (isDBConnected()) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ error: 'Email already exists' });
      }

      const newUser = await User.create({
        name: name.trim(),
        gender: gender.trim(),
        age: numericAge,
        email: normalizedEmail
      });

      return res.status(201).json(newUser);
    }

    // In-memory fallback
    const emailExists = memoryUsers.some((u) => u.email.toLowerCase() === normalizedEmail);
    if (emailExists) {
      return res.status(409).json({ error: 'Email already exists' });
    }

    const newUser = {
      id: String(Date.now()),
      name: name.trim(),
      gender: gender.trim(),
      age: numericAge,
      email: normalizedEmail
    };

    memoryUsers.unshift(newUser);
    res.status(201).json(newUser);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already exists' });
    }
    next(err);
  }
});

// PUT /users/:id - update existing user
router.put('/:id', async (req, res, next) => {
  try {
    const { name, gender, age, email } = req.body;

    if (!name && !gender && (age === undefined || age === '') && !email) {
      return res.status(400).json({ error: 'At least one field (name, gender, age, or email) is required to update' });
    }

    const updates = {};
    if (name) updates.name = name.trim();
    if (gender) updates.gender = gender.trim();

    if (age !== undefined && age !== '') {
      const numericAge = Number(age);
      if (isNaN(numericAge) || numericAge <= 0 || numericAge > 150) {
        return res.status(400).json({ error: 'Age must be a valid positive number between 1 and 150' });
      }
      updates.age = numericAge;
    }

    if (email) {
      const normalizedEmail = email.trim().toLowerCase();
      if (isDBConnected()) {
        const existingUser = await User.findOne({
          email: normalizedEmail,
          _id: { $ne: req.params.id }
        });
        if (existingUser) {
          return res.status(409).json({ error: 'Email already in use by another user' });
        }
      } else {
        const emailConflict = memoryUsers.some(
          (u) => u.id !== req.params.id && u.email.toLowerCase() === normalizedEmail
        );
        if (emailConflict) {
          return res.status(409).json({ error: 'Email already in use by another user' });
        }
      }
      updates.email = normalizedEmail;
    }

    if (isDBConnected()) {
      const updatedUser = await User.findByIdAndUpdate(req.params.id, updates, {
        new: true,
        runValidators: true
      });

      if (!updatedUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(updatedUser);
    }

    // In-memory fallback
    const userIndex = memoryUsers.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    memoryUsers[userIndex] = {
      ...memoryUsers[userIndex],
      ...updates
    };

    res.json(memoryUsers[userIndex]);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Email already in use by another user' });
    }
    next(err);
  }
});

// DELETE /users/:id - delete a user
router.delete('/:id', async (req, res, next) => {
  try {
    if (isDBConnected()) {
      const deletedUser = await User.findByIdAndDelete(req.params.id);
      if (!deletedUser) {
        return res.status(404).json({ error: 'User not found' });
      }
      return res.json({ message: 'User deleted successfully', user: deletedUser });
    }

    // In-memory fallback
    const userIndex = memoryUsers.findIndex((u) => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [deletedUser] = memoryUsers.splice(userIndex, 1);
    res.json({ message: 'User deleted successfully', user: deletedUser });
  } catch (err) {
    next(err);
  }
});

export default router;
