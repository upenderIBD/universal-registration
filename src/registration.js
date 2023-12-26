const { hashPassword } = require('./utils');

class RegistrationModule {
    constructor(storage) {
        this.storage = storage;
        this.middleware = [];
        this.routes = []; 
    }

    use(middleware) {
        this.middleware.push(middleware);
    }

    post(route, handler) {
        const combinedHandler = async (req, res) => {
            try {
                for (const middleware of this.middleware) {
                    await middleware(req, res);
                }
                await handler(req, res);
            } catch (error) {
                console.error('Error:', error);
                res.status(500).json({ error: 'Internal Server Error' });
            }
        };
        this.routes.push({ method: 'post', path: route, handler: combinedHandler });
    }

    registerRoutes(app) {
        this.routes.forEach((route) => {
            const { method, path, handler } = route;
            app[method](path, async (req, res) => {
                try {
                    for (const middleware of this.middleware) {
                        await middleware(req, res);
                    }
                    await handler(req, res);
                } catch (error) {
                    console.error('Error:', error);
                    res.status(500).json({ error: 'Internal Server Error' });
                }
            });
        });
    }

    registerUser(userData, callback) {
        const { username, email, password, ...additionalFields } = userData;

        if (!username || !password || !email) {
            return callback(new Error('Username, email, and password are required fields.'));
        }

        const usernameValidationError = !this.validateUsername(username);
        if (usernameValidationError) {
            return callback(usernameValidationError);
        }

        const emailValidationError = !this.validateEmail(email);
        if (emailValidationError) {
            return callback(emailValidationError);
        }

        const passwordValidationError = !this.validatePassword(password);
        if (passwordValidationError) {
            return callback(passwordValidationError);
        }
        const additionalFieldsValidationError = this.validateAdditionalFields(additionalFields);
        if (additionalFieldsValidationError) {
            return callback(additionalFieldsValidationError);
        }

        const hashedPassword = hashPassword(password);

        const newUser = { username, email, password: hashedPassword, ...additionalFields };
        this.storage.save(newUser, (err) => {
            if (err) {
                console.error('Error saving data:', err);
                callback(err);
            } else {
                console.log(newUser, 'newUser');
                callback(null, newUser);
            }
        });
    }

    validateAdditionalFields(additionalFields) {
        const fieldValidations = {
            firstname: { validator: this.validateLength, params: { min: 1, max: 8 } },
            lastname: { validator: this.validateLength, params: { min: 1, max: 8 } },
            number: { validator: this.validatePhoneNumber, params: {} },
            gender: { validator: this.validateGender, params: {} },
            age: { validator: this.validateAge, params: {} },
            address: { validator: this.validateLength, params: { min: 1, max: 100 } },
            phoneNumber: { validator: this.validatePhoneNumber, params: {} },
        };

        for (const fieldName in additionalFields) {
            if (additionalFields.hasOwnProperty(fieldName)) {
                const validationFunction = this[`validate${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`];
                if (validationFunction) {
                    const fieldValidationResult = validationFunction(additionalFields[fieldName]);
                    if (!fieldValidationResult) {
                        return new Error(`Invalid ${fieldName}.`);
                    }
                } else if (fieldValidations[fieldName]) {
                    const { validator, params } = fieldValidations[fieldName];
                    if (!validator(additionalFields[fieldName], params)) {
                        return new Error(`Invalid ${fieldName}.`);
                    }
                }
            }
        }

        return null;
    }

    validateUsername(username) {
        return /^[a-zA-Z0-9]{8,}$/.test(username);
    }

    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validateLength(value, { min, max }) {
        return typeof value === 'string' && value.length >= min && value.length <= max;
    }

    validatePhoneNumber(number) {
        return /^\d{10}$/.test(number);
    }

    validateGender(gender) {
        return typeof gender === 'string' && ['male', 'female', 'other'].includes(gender.toLowerCase());
    }

    validatePassword(password) {
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/;
        return regex.test(password) && password.length >= 8;
    }

    validateFirstname(firstname) {
        return typeof firstname === 'string' && firstname.length >= 1 && firstname.length <= 8;
    }

    validateLastname(lastname) {
        return typeof lastname === 'string' && lastname.length >= 1 && lastname.length <= 8;
    }

    validateNumber(number) {
        return typeof number === 'number' && /^\d+$/.test(number);
    }

    validateAge(age) {
        const numericAge = parseInt(age, 10);
        return !isNaN(numericAge) && numericAge >= 18 && numericAge <= 100;
    }

    getValidationFunctions() {
        return Object.entries(Object.getPrototypeOf(this))
            .filter(([key, value]) => typeof value === 'function' && key.startsWith('validate'))
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    }
}

module.exports = RegistrationModule;
