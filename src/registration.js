const { hashPassword } = require('./utils');

class RegistrationModule {
    constructor(storage) {
        this.storage = storage;
        this.middleware = [];
    }

    use(middleware) {
        this.middleware.push(middleware);
    }

    post(route, handler) {
        // Handle the registration logic here
        // You can apply middleware before the registration logic if needed
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

        // For simplicity, assume route is just a string
        console.log(`Registering POST route ${route}`);
        // Register the combined handler for the POST route
    }

    registerUser(userData, callback) {
        const { username, email, password, ...additionalFields } = userData;

        // Validate mandatory fields
        if (!username || !password || !email) {
            return callback(new Error('Username, email, and password are required fields.'));
        }

        // Validate username
        const usernameValidationError = !this.validateUsername(username);
        if (usernameValidationError) {
            return callback(usernameValidationError);
        }

        // Validate email
        const emailValidationError = !this.validateEmail(email);
        if (emailValidationError) {
            return callback(emailValidationError);
        }

        // Validate password
        const passwordValidationError = !this.validatePassword(password);
        if (passwordValidationError) {
            return callback(passwordValidationError);
        }
        // Validate additional fields
        const additionalFieldsValidationError = this.validateAdditionalFields(additionalFields);
        if (additionalFieldsValidationError) {
            return callback(additionalFieldsValidationError);
        }

        const hashedPassword = hashPassword(password);

        const newUser = { username, email, password: hashedPassword, ...additionalFields };
        this.storage.save(newUser, (err) => {
            callback(err, newUser);
        });
    }

    validateAdditionalFields(additionalFields) {
        // Define validation rules for additional fields
        const fieldValidations = {
            firstname: { validator: this.validateLength, params: { min: 1, max: 8 } },
            lastname: { validator: this.validateLength, params: { min: 1, max: 8 } },
            number: { validator: this.validatePhoneNumber, params: {} },
            gender: { validator: this.validateGender, params: {} },
            age: { validator: this.validateAge, params: {} },
            address: { validator: this.validateLength, params: { min: 1, max: 100 } },
            phoneNumber: { validator: this.validatePhoneNumber, params: {} },
        };

        // Validate each additional field based on the provided validation functions
        for (const fieldName in additionalFields) {
            if (additionalFields.hasOwnProperty(fieldName)) {
                // Check if a specific validation function exists for the field
                const validationFunction = this[`validate${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`];
                if (validationFunction) {
                    // Use the validation function
                    const fieldValidationResult = validationFunction(additionalFields[fieldName]);
                    if (!fieldValidationResult) {
                        return new Error(`Invalid ${fieldName}.`);
                    }
                } else if (fieldValidations[fieldName]) {
                    // Use a generic validation function for additional fields
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
        // Validate username here (e.g., minimum length, alphanumeric characters)
        // For simplicity, let's assume a minimum length of 8 characters and alphanumeric characters only
        return /^[a-zA-Z0-9]{8,}$/.test(username);
    }

    validateEmail(email) {
        // Validate email address using a simple regex
        // This is a basic example, and you may want to use a more robust email validation library
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    }

    validateLength(value, { min, max }) {
        // Validate length of the field
        return typeof value === 'string' && value.length >= min && value.length <= max;
    }

    validatePhoneNumber(number) {
        // Validate phone number (e.g., numeric, exactly 10 digits)
        return /^\d{10}$/.test(number);
    }

    validateGender(gender) {
        // Validate gender (e.g., specific values)
        return typeof gender === 'string' && ['male', 'female', 'other'].includes(gender.toLowerCase());
    }

    validatePassword(password) {
        // Validate password (e.g., minimum length, combination of characters)
        // For simplicity, let's assume a minimum length of 8 characters and a combination of characters
        const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]*$/;
        return regex.test(password) && password.length >= 8;
    }

    validateFirstname(firstname) {
        // Add your validation logic for fname (e.g., minimum length)
        return typeof firstname === 'string' && firstname.length >= 1 && firstname.length <= 8;
    }

    validateLastname(lastname) {
        // Add your validation logic for fname (e.g., minimum length)
        return typeof lastname === 'string' && lastname.length >= 1 && lastname.length <= 8;
    }

    validateNumber(number) {
        // Add your validation logic for number (e.g., numeric)
        return typeof number === 'string' && /^\d+$/.test(number);
    }

    validateAge(age) {
        // Add your validation logic for age (e.g., numeric, within a specific range)
        const numericAge = parseInt(age, 10);

        // Check if age is a number and within a specific range (e.g., between 18 and 100)
        return !isNaN(numericAge) && numericAge >= 18 && numericAge <= 100;
    }

    getValidationFunctions() {
        return Object.entries(Object.getPrototypeOf(this))
            .filter(([key, value]) => typeof value === 'function' && key.startsWith('validate'))
            .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
    }
}

module.exports = RegistrationModule;
