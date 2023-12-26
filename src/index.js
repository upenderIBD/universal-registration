const RegistrationModule = require('./registration');
const bodyParser = require('body-parser');
const InMemoryStorage = require('./inMemoryStorage');

const inMemoryStorage = new InMemoryStorage();
const registrationModule = new RegistrationModule(inMemoryStorage);

registrationModule.use(bodyParser.json());
registrationModule.use(bodyParser.urlencoded({ extended: true }));

registrationModule.post('/register', (req, res) => {
    registrationModule.registerUser(req.body, (err, newUser) => {
        if (err) {
            console.error('Registration failed:', err.message);
            return res.status(500).json({ error: 'Registration failed' });
        } else {
            console.log('Registration successful:', newUser);
            res.status(200).json({ message: 'Registration successful', user: newUser });
        }
    });
});

module.exports = registrationModule;
