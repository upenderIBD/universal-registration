const RegistrationModule = require('./registration');
const bodyParser = require('body-parser');
const InMemoryStorage = require('./inMemoryStorage');

const inMemoryStorage = new InMemoryStorage();
const registrationModule = new RegistrationModule(inMemoryStorage);

// Adding body-parser middleware
registrationModule.use(bodyParser.json());
registrationModule.use(bodyParser.urlencoded({ extended: true }));

// Handling registration route
registrationModule.post('/register', (req, res) => {
    registrationModule.registerUser(req.body, (err, newUser) => {
        if (err) {
            return res.status(500).json({ error: 'Registration failed' });
        }

        res.json({ message: 'Registration successful', user: newUser });
    });
});

module.exports = registrationModule;
