const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { v4: uuid } = require('uuid');

const app = express();
const PORT = 3000;
const DB_FILE = './db.json';

app.use(cors());
app.use(express.json());

/* ========== DB HELPERS ========== */

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

/* ========== APIs ========== */

/** LIST EMPLOYEES */
app.get('/api/employees', (req, res) => {
  const db = readDB();
  res.json(db.employees || []);
});

/** CREATE EMPLOYEE */
app.post('/api/employees', (req, res) => {
  const db = readDB();

  const employee = {
    id: uuid(),
    createdAt: new Date().toISOString(),
    ...req.body
  };

  db.employees.push(employee);
  writeDB(db);

  res.status(201).json(employee);
});

/** UPDATE EMPLOYEE */
app.put('/api/employees/:id', (req, res) => {
  const db = readDB();

  const index = db.employees.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ message: 'Employee not found' });
  }

  db.employees[index] = {
    ...db.employees[index],
    ...req.body,
    updatedAt: new Date().toISOString()
  };

  writeDB(db);
  res.json(db.employees[index]);
});

/** DELETE EMPLOYEE */
app.delete('/api/employees/:id', (req, res) => {
  const db = readDB();

  db.employees = db.employees.filter(e => e.id !== req.params.id);
  writeDB(db);

  res.json({ success: true });
});

/* ========== START ========== */

app.listen(PORT, () => {
  console.log(`✅ Mock API running at http://localhost:${PORT}`);
});
