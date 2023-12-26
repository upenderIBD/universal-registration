const RegistrationModule = require('./registration');
const bodyParser = require('body-parser');
const InMemoryStorage = require('./inMemoryStorage');

const inMemoryStorage = new InMemoryStorage();
const registrationModule = new RegistrationModule(inMemoryStorage);

registrationModule.use(bodyParser.json());
registrationModule.use(bodyParser.urlencoded({ extended: true }));

registrationModule.post('/register', (req, res) => {
    registrationModule.registerUser(req.body, res);
});

module.exports = registrationModule;
