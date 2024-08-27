const logger = require('../utils/logger'); // Add logger
const axios = require('axios');
const qs = require('qs');
const BASE_URL = "http://localhost:3500";
const REDIRECT_URL = `${BASE_URL}/redirect`;
let authData = {};

const TokenHeaders = {
    'Content-Type': 'application/x-www-form-urlencoded;charset=utf-8'
};

const exchangeForTokens = async (req, exchangeProof) => {
    try {
        const url_encoded_string = qs.stringify(exchangeProof);
        const responseBody = await axios.post('https://api.hubapi.com/oauth/v1/token', url_encoded_string, {
            headers: TokenHeaders
        });
        const tokens = responseBody.data;
       /*  console.log("***************TOKEN*****************");
        console.log(tokens); */
        //STORE TO LOCAL OBJECT
        authData.refresh_token = tokens.refresh_token;
        authData.access_token = tokens.access_token;
        authData.expires_in = tokens.expires_in;
        authData.token_timestamp = Date.now();
        //STORE TO SESSION
        req.session.refresh_token = tokens.refresh_token;
        req.session.access_token = tokens.access_token;
        req.session.expires_in = tokens.expires_in;
        req.session.token_timestamp = Date.now();

        logger.info(`Received access token and refresh token`);

        return tokens;
    } catch (e) {
        logger.error(`Error exchanging ${exchangeProof.grant_type} for access token: ${e.response ? e.response.data : e.message}`);
        return { message: e.response ? e.response.data.message : e.message };
    }
};

const refreshAccessToken = async (req) => {
    const refreshTokenProof = {
        grant_type: 'refresh_token',
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        redirect_uri: REDIRECT_URL,
        refresh_token: req.session.refresh_token
    };
    return await exchangeForTokens(req, refreshTokenProof);
};

const getAccessToken = async (req) => {
    console.log("*************logging session ID = DATA from req header from getAccessToken() ");
    console.log(req.session);
    const tokenAge = Date.now() - req.session.token_timestamp;
    const tokenLifetime = req.session.expires_in * 1000;
    if (tokenAge >= tokenLifetime) {
        await refreshAccessToken(req);
    }
    return req.session.access_token;
};

const isAuthorized = (req) => {
    return !!req.session.refresh_token;
};

const getAccountInfo = async (accessToken) => {
    try {
        const headers = {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
        };
        const result = await axios.get('https://api.hubapi.com/account-info/v3/details', { headers });
        //console.log(result.data);
        authData.portalid = result.data.portalId;
        return result.data;
    } catch (e) {
        logger.error(`Unable to retrieve account info: ${e.message}`);
        return parseErrorResponse(e);
    }
};

const parseErrorResponse = (error) => {
    try {
        return JSON.parse(error.response.body);
    } catch (parseError) {
        logger.error(`Error parsing response: ${parseError.message}`);
        return { status: 'error', message: 'An error occurred', details: error.message };
    }
};

module.exports = {
    exchangeForTokens,
    getAccessToken,
    isAuthorized,
    getAccountInfo,
};
