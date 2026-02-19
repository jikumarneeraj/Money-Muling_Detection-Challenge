const http = require('http');
const fs = require('fs');
const path = require('path');

const boundary = '--------------------------' + Date.now().toString(16);
const filePath = path.join(__dirname, 'sample_transactions.csv');
const fileContent = fs.readFileSync(filePath);

const postDataStart = Buffer.from(
    `--${boundary}\r\n` +
    `Content-Disposition: form-data; name="file"; filename="sample_transactions.csv"\r\n` +
    `Content-Type: text/csv\r\n\r\n`
);
const postDataEnd = Buffer.from(`\r\n--${boundary}--\r\n`);

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/upload',
    method: 'POST',
    headers: {
        'Content-Type': 'multipart/form-data; boundary=' + boundary,
        'Content-Length': postDataStart.length + fileContent.length + postDataEnd.length
    }
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => { data += chunk; });
    res.on('end', () => {
        fs.writeFileSync(path.join(__dirname, 'output.json'), data);
        console.log('Output saved to output.json');
    });
});

req.on('error', (e) => {
    console.error(`Problem with request: ${e.message}`);
});

req.write(postDataStart);
req.write(fileContent);
req.write(postDataEnd);
req.end();
