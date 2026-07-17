const http = require('http');

const data = JSON.stringify({
  text: "I completely reorganized my closet today because the clutter was driving me crazy. I had to create a whole new system with color-coded bins. Then I spent three hours reading a Wikipedia rabbit hole about the history of the Byzantine empire instead of calling my mom back like I told her I would. I just get so fascinated by systems of governance and how they fall apart."
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/analyze-text',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, res => {
  let result = '';
  res.on('data', d => { result += d; });
  res.on('end', () => { console.log(result); });
});

req.on('error', error => { console.error(error); });
req.write(data);
req.end();
