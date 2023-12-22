const axios = require('axios');

const registrationData = {
  "username": "testuser",
	"email":"test@gmail.com",
  "password": "testPassword@12",
	"fname":"xyz",
	"number":12345678
};

// Adjust the URL based on your server configuration
const registrationEndpoint = 'http://localhost:3000/register';

axios.post(registrationEndpoint, registrationData)
  .then(response => {
    console.log('User registration successful:', response.data);
  })
  .catch(error => {
    console.error('User registration failed:', error.message);
  });
