const { hashPassword, genSalt, genSaltSync } = require('./utils');

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
        // Register the combined handler for the POST route
        // this.server.post(route, combinedHandler);
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

    async registerUser(req, res) {
        const userData = req.body;
        const { username, email, password, ...additionalFields } = userData;

        if (!username || !password || !email) {
            return res.status(400).json({ error: 'Username, email, and password are required fields.' });
        }

        const usernameValidationError = !this.validateUsername(username);
        if (usernameValidationError) {
            return res.status(400).json({ error: usernameValidationError.message || 'Invalid username.' });
        }

        const emailValidationError = !this.validateEmail(email);
        if (emailValidationError) {
            return res.status(400).json({ error: emailValidationError.message || 'Invalid email.' });
        }

        const passwordValidationError = !this.validatePassword(password);
        if (passwordValidationError) {
            return res.status(400).json({ error: passwordValidationError.message || 'Invalid password.' });
        }

        const additionalFieldsValidationError = this.validateAdditionalFields(additionalFields);
        if (additionalFieldsValidationError) {
            return res.status(400).json({ error: additionalFieldsValidationError.message || 'Invalid additional fields.' });
        }

        try {
            const salt = process.env.USE_ASYNC ? await genSalt() : genSaltSync();
            const hashedPassword = process.env.USE_ASYNC
                ? await hashPassword(password, salt)
                : hashPassword(password, salt);

            const newUser = { username, email, password: await hashedPassword, ...additionalFields };
            this.storage.save(newUser, (err) => {
                if (err) {
                    console.error('Error saving data:', err);
                    res.status(500).json({ error: 'Internal Server Error' });
                } else {
                    console.log(newUser, 'newUser');
                    res.status(200).json({
                        message: 'Registration successful',
                        user: newUser,
                    });
                }
            });
        } catch (error) {
            console.error('Error during registration:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
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
