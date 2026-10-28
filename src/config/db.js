import mongoose from 'mongoose';

export const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI;

  if (!mongoURI) {
    console.warn('⚠️ MONGODB_URI is not set.');
    console.warn('To connect to MongoDB, add MONGODB_URI to your backend/.env or Render Environment Variables:');
    console.warn('  MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/registrations');
    return;
  }

  try {
    await mongoose.connect(mongoURI);
    console.log('✅ Connected to MongoDB Atlas successfully');
  } catch (err) {
    console.error('❌ MongoDB connection error:', err.message);
  }
};

