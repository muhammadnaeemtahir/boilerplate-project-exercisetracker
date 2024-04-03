const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


// Sample data (temporary)
let users = [];

// POST route to create a new user
app.post('/api/users', (req, res) => {
  const { username } = req.body;
  const newUser = {
    _id: users.length + 1,
    username: username
  };
  users.push(newUser);
  res.json(newUser);
});

// POST route to add exercise for a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  
  // For simplicity, we are assuming the user exists
  const user = users.find(user => user._id == _id);

  const exercise = {
    description: description,
    duration: parseInt(duration),
    date: date ? new Date(date).toDateString() : new Date().toDateString()
  };

  if (!user.log) {
    user.log = [exercise];
  } else {
    user.log.push(exercise);
  }

  res.json({
    _id: user._id,
    username: user.username,
    description: description,
    duration: parseInt(duration),
    date: exercise.date
  });
});

// GET route to retrieve exercise logs of a user
app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  // For simplicity, we are assuming the user exists
  const user = users.find(user => user._id == _id);
  
  let { from, to, limit } = req.query;
  
  let log = user.log || [];

  if (from) {
    log = log.filter(entry => new Date(entry.date) >= new Date(from));
  }
  if (to) {
    log = log.filter(entry => new Date(entry.date) <= new Date(to));
  }
  if (limit) {
    log = log.slice(0, limit);
  }

  res.json({
    _id: user._id,
    username: user.username,
    count: log.length,
    log: log
  });
});

// GET route to retrieve all users
app.get('/api/users', (req, res) => {
  res.json(users);
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
