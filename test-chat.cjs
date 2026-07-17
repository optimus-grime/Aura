const http = require('http');

const data = JSON.stringify({
  report: { summary: "test report" },
  history: [],
  message: "why am I like this"
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/report-chat',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let result = '';
  res.on('data', d => { result += d; });
  res.on('end', () => { console.log("Status:", res.statusCode, "Body:", result); });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
