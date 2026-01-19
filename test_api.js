const https = require('https');

const apiKey = '5a2c019593f0756cdd691da44658808655a061a7';
const url = `https://api.themoviedb.org/3/authentication?api_key=${apiKey}`;

const req = https.get(url, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('STATUS:' + res.statusCode);
        console.log('BODY:' + data);
        process.exit(0);
    });
});

req.on('error', (err) => {
    console.log('ERROR:' + err.message);
    process.exit(1);
});

setTimeout(() => {
    console.log('TIMEOUT');
    process.exit(1);
}, 10000);
