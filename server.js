require('dotenv').config();
const express = require('express');
const path = require("path");
const appRoutes = require('./routes/app.routes');
const session = require('express-session');
const logger = require('./utils/logger'); // Add logger

const app = express();
const PORT = process.env.PORT || 3500;

app.use(express.static(path.join(__dirname, 'public')));
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

app.use(express.json());
app.use(session({
    secret: Math.random().toString(36).substring(2),
    resave: false,
    saveUninitialized: true
}));

app.use('/', appRoutes);


app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    console.log(`URL : 👉 http://localhost:${PORT}/`);
});
