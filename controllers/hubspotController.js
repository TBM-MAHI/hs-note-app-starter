const { getAccessToken, isAuthorized, getAccountInfo, exchangeForTokens } = require('./hs_oauthController');
const logger = require('../utils/logger'); // Add logger
const BASE_URL = "http://localhost:3500";
const REDIRECT_URL = `${BASE_URL}/redirect`;


// Utility function to log with portal ID and email
const logWithDetails = (level, message, req) => {
  const portalId = req.session.portalId || 'unknown';
  const email = req.session.email || 'unknown';
  logger.log({ level, message, portalId, email });
};

exports.install = (req, res) => {
  const authUrl = `https://app.hubspot.com/oauth/authorize?client_id=${process.env.CLIENT_ID}&redirect_uri=${REDIRECT_URL}&scope=${process.env.SCOPES}`;
  
  res.redirect(authUrl);
  
  logWithDetails('info', 'Redirected user to HubSpot OAuth URL for installation', req);
};

exports.oAuthCallback = async (req, res) => {
  if (req.query.code) {
    const authCodeProof = {
      grant_type: 'authorization_code',
      client_id: process.env.CLIENT_ID,
      client_secret: process.env.CLIENT_SECRET,
      redirect_uri: REDIRECT_URL,
      code: req.query.code
    };
    const tokens = await exchangeForTokens(req, authCodeProof);
    if (tokens.message) {
      logWithDetails('error', `Error during OAuth callback: ${tokens.message}`, req);
      return res.redirect(`/error?msg=${tokens.message}`);
    }
    logWithDetails('info', 'OAuth callback successful, redirecting to home', req);
    let accInfo = await getAccountInfo(tokens.access_token);
    console.log("************* logging account information *************");
    console.log(accInfo);
    
    // Render the Pug template with the account information
    res.render('success', { accInfo });
  } else {
    logWithDetails('warn', 'OAuth callback received without a code', req);
    res.redirect('/error?msg=No%20code%20provided');
  }
};
