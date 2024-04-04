const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();
const cors = require('cors');
require('dotenv').config();

// Mongoose schema for users
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  exercises: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }]
});

// Mongoose schema for exercises
const exerciseSchema = new mongoose.Schema({
  description: { type: String, required: true },
  duration: { type: Number, required: true },
  date: { type: Date, default: Date.now }
});

const User = mongoose.model('User', userSchema);
const Exercise = mongoose.model('Exercise', exerciseSchema);

// Middleware
app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static('public'));
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to DB...');
  // Start listening once connected to the database
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}).catch(err => {
  console.error('MongoDB connection error:', err);
  process.exit(1); // Exit the process if connection fails
});

// Create new user
app.post('/api/users', async (req, res) => {
  const { username } = req.body;

  try {
    const user = new User({ username });
    await user.save();
    res.json({ username: user.username, _id: user._id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get all users
app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find();
    res.json(users.map(user => ({ username: user.username, _id: user._id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Add exercise to user
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userId = req.params._id;
  const { description, duration, date } = req.body;

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const exercise = new Exercise({ description, duration, date });
    await exercise.save();
    user.exercises.push(exercise);
    await user.save();
    res.json({
      _id: user._id,
      username: user.username,
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Get user exercise log
app.get('/api/users/:_id/logs', async (req, res) => {
  const userId = req.params._id;
  const { from, to, limit } = req.query;

  try {
    const user = await User.findById(userId).populate('exercises');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    let logs = user.exercises.map(exercise => ({
      description: exercise.description,
      duration: exercise.duration,
      date: exercise.date.toDateString()
    }));

    // Filter logs by date range if from and to parameters are provided
    if (from && to) {
      logs = logs.filter(exercise => {
        const exerciseDate = new Date(exercise.date);
        return exerciseDate >= new Date(from) && exerciseDate <= new Date(to);
      });
    }

    // Limit the number of logs if limit parameter is provided
    if (limit) {
      logs = logs.slice(0, parseInt(limit, 10));
    }

    res.json({
      _id: user._id,
      username: user.username,
      count: logs.length,
      log: logs
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
