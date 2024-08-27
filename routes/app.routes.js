const express = require('express');
const router = express.Router();
const path = require('path'); 
const hubspotController = require('../controllers/hubspotController');

router.get('/install', hubspotController.install);
router.get('/redirect', hubspotController.oAuthCallback);

router.get('/error', (req, res) => {
    res.sendFile(path.join(__dirname, '../public/error.html'));
});

module.exports = router;
