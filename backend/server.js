// server.js
const express = require('express');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const fs = require('fs');
const path = require('path');
const uploadsDir = path.join(__dirname, '..', 'ClientDataUpload');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Mount at /api/auth
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
