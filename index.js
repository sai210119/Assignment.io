const express = require('express');
const multer = require('multer');
const mysql = require('mysql2');
const { body, validationResult } = require('express-validator');
const cors = require('cors');
const path = require('path');
const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// MySQL connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '', // Default for phpMyAdmin
  database: 'registration_db'
});
db.connect(err => {
  if (err) throw err;
  console.log('Connected to MySQL');
});

// Multer config for photo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) cb(null, true);
  else cb(new Error('Only images are allowed'), false);
};
const upload = multer({ storage, fileFilter });

// Validation rules
const validate = [
  body('name').notEmpty(),
  body('age').isInt({ min: 0 }),
  body('dob').isDate(),
  body('mobile').matches(/^[6-9]\d{9}$/),
  body('email').isEmail(),
  body('pincode').isPostalCode('IN')
];

// Create
app.post('/api/register', upload.single('photo'), validate, (req, res) => {
  const errors = validationResult(req);
  if (!req.file) return res.status(400).json({ errors: [{ msg: 'Photo is required' }] });
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, age, dob, gender, mobile, email, address, state, pincode, occupation, marital_status } = req.body;
  const photo = req.file.filename;
  const sql = `INSERT INTO users SET ?`;
  const user = { name, age, dob, gender, mobile, email, address, state, pincode, occupation, marital_status, photo };

  db.query(sql, user, (err, result) => {
    if (err) throw err;
    res.json({ message: 'User registered successfully' });
  });
});

// Read All
app.get('/api/users', (req, res) => {
  db.query('SELECT * FROM users', (err, results) => {
    if (err) throw err;
    res.json(results);
  });
});

// Read One
app.get('/api/users/:id', (req, res) => {
  db.query('SELECT * FROM users WHERE id = ?', [req.params.id], (err, results) => {
    if (err) throw err;
    if (results.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(results[0]);
  });
});

// Update
app.put('/api/users/:id', upload.single('photo'), validate, (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { name, age, dob, gender, mobile, email, address, state, pincode, occupation, marital_status } = req.body;
  const user = { name, age, dob, gender, mobile, email, address, state, pincode, occupation, marital_status };
  if (req.file) user.photo = req.file.filename;

  db.query('UPDATE users SET ? WHERE id = ?', [user, req.params.id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'User updated successfully' });
  });
});

// Delete
app.delete('/api/users/:id', (req, res) => {
  db.query('DELETE FROM users WHERE id = ?', [req.params.id], (err, result) => {
    if (err) throw err;
    res.json({ message: 'User deleted successfully' });
  });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
