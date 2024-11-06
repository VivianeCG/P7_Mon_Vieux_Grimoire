const express = require('express');
const path = require('path');
const app = express();

app.use(express.json());

const booksRoutes = require('./route/books_routes');
const userRoutes = require('./route/user_routes');

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content, Accept, Content-Type, Authorization');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    next();
  });

const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://user1:Ihp24@cluster0.2uyvp.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0')
      .then(() => console.log('Connexion à MongoDB réussie !'))
      .catch(() => console.log('Connexion à MongoDB échouée !'));

app.use('/api/books', booksRoutes);
app.use('/api/auth', userRoutes);
app.use('/images', express.static(path.join(__dirname, 'images')))

module.exports = app;