const express = require('express');
const sqlite3 = require('sqlite3');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3000;

// Create a SQLite database connection
const db = new sqlite3.Database('./db/blog.db', (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    // Create 'posts' table if it does not exist
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        content TEXT
      )
    `, (err) => {
      if (err) {
        console.error('Error creating table', err.message);
      } else {
        console.log('Connected to the database and table created');
      }
    });
  }
});

app.set('view engine', 'html');
app.engine('html', require('ejs').renderFile);
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));

app.get('/', (req, res) => {
  // Retrieve blog posts from the database
  db.all('SELECT * FROM posts', (err, rows) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.render('index', { posts: rows });
    }
  });
});

app.get('/compose', (req, res) => {
  res.render('compose'); // Render the 'compose' view
});

app.post('/compose', (req, res) => {
  const { title, content } = req.body;

  // Insert new post into the database
  db.run('INSERT INTO posts (title, content) VALUES (?, ?)', [title, content], (err) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else {
      res.redirect('/');
    }
  });
});

app.get('/posts/:postId', (req, res) => {
  const requestedPostId = req.params.postId;

  // Retrieve a specific post from the database
  db.get('SELECT * FROM posts WHERE id = ?', [requestedPostId], (err, row) => {
    if (err) {
      console.error(err);
      res.status(500).send('Internal Server Error');
    } else if (row) {
      res.render('post', { title: row.title, content: row.content });
    } else {
      res.status(404).send('Post Not Found');
    }
  });
});

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});
