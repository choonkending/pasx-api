const fs = require('fs');
const readline = require('readline');
const google = require('googleapis');
const googleAuth = require('google-auth-library');

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly'];
const TOKEN_DIR = (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/';
const TOKEN_PATH = TOKEN_DIR + 'sheets.googleapis.com-pasx.json';
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

function fetchData(callback) {
  fs.readFile('client_secret.json', (err, content) => {
    if (err) {
      console.log("Error loading client secret file: " + err);
      return;
    }

    authorize(JSON.parse(content), getResults(callback));
  });
}

function authorize(credentials, callback) {
  const { client_secret, client_id, redirect_uris } = credentials.installed;
  const auth = new googleAuth();
  const oauth2Client = new auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the code from that page here: ', code => {
    rl.close();
    oauth2Client.getToken(code, (err, token) => {
      if (err) {
        console.log('Error while trying to retrieve access token', err);
        return;
      }

      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    })
  });
}

function storeToken(token) {
  try {
    fs.mkdirSync(TOKEN_DIR);
  } catch (err) {
    if (err.code != 'EEXIST') {
      throw err;
    }
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token));
  console.log('Token stored to ' + TOKEN_PATH);
}

function getResults(callback) {
  return function (auth) {
    const sheets = google.sheets('v4');
    sheets.spreadsheets.values.get({
      auth: auth,
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A2:B7'
    }, (err, response) => {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }

      const rows = response.values;
      if (rows.length == 0) {
        console.log('No data found');
      } else {
        callback(rows);
      }
    });

  };
}

module.exports = fetchData;

