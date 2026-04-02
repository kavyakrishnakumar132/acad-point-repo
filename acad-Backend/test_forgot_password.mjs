import http from 'http';
const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/auth/forgot-password/student',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
    },
};

const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    res.on('end', () => {
        console.log('Status code:', res.statusCode);
        console.log('Body:', data);
    });
});

req.on('error', (error) => {
    console.error(error);
});

req.write(JSON.stringify({
    id: 'SPT23CS049',
    email: 'mhhridhik@gmail.com'
}));
req.end();
