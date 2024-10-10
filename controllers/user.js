const bcrypt = require('bcrypt');
const User = require('../models/User');

const auth = require("../auth");
const { errorHandler } = auth;

module.exports.registerUser = async (req, res) => {
    try {
        // Check if the email is in the right format
        if (!req.body.email.includes("@")) {
            return res.status(400).send({error: 'Email invalid'});
        }

        // Check if the mobile number has the correct number of characters
        else if (req.body.mobileNo.length !== 11) {
            return res.status(400).send({error: 'Mobile number invalid'});
        }

        // Check if the password has at least 8 characters
        else if (req.body.password.length < 8) {
            return res.status(400).send({error: 'Password must be at least 8 characters'});
        }

        // Check if the email already exists in the database
        const existingUser = await User.findOne({ email: req.body.email });
        console.log(existingUser)
        if (existingUser) {
            return res.status(400).send({error: 'Email already exists'});
        }

        // If all needed requirements are achieved
        const hashedPassword = bcrypt.hashSync(req.body.password, 10);

        let newUser = new User({
            firstName: req.body.firstName,
            lastName: req.body.lastName,
            email: req.body.email,
            password: hashedPassword,
            mobileNo: req.body.mobileNo
        });

        await newUser.save();
        return res.status(201).send({message: 'Registered successfully'});

    } catch (error) {
        return errorHandler(error, req, res);
    }
};

module.exports.loginUser = (req,res) => {

    if (req.body.email.includes("@")){
        return User.findOne({ email : req.body.email })
        .then(result => {
            if(result == null){
                return res.status(404).send({error: 'No email found'});
            } else {
                const isPasswordCorrect = bcrypt.compareSync(req.body.password, result.password);
                if (isPasswordCorrect) {
                    return res.status(200).send({ access : auth.createAccessToken(result), message: 'User logged in successfully'});
                } else {
                    return res.status(401).send({error: 'Email and password do not match'});
                }
            }
        })
        .catch(error => errorHandler(error, req, res));
    } else {
        return res.status(400).send({error: 'Email invalid'})
    }
};

module.exports.userDetails = (req, res) => {
    return User.findById(req.user.id)
    .then(user => {
        if (user){
            user.password = "";
            return res.status(200).send({user: user});
        } else {
            return res.status(404).send({error: "User not found"})
        }
    })
    .catch(error => errorHandler(error, req, res))
}

// Update User as Admin
module.exports.setUserAsAdmin = (req, res) => {
    // Ensure that only admins can perform this action
    if (!req.user.isAdmin) {
        return res.status(403).send({ error: 'Admin access required' });
    }

    console.log(req.user.isAdmin);
    // Find the user by ID and update their role to admin
    return User.findByIdAndUpdate(req.params.id, { isAdmin: true }, { new: true })
        .then(user => {
            if (user) {
                return res.status(200).send({ updatedUser: user });
            } else {
                return res.status(404).send({ error: 'User not found' });
            }
        })
        .catch(error => errorHandler(error, req, res));
};

module.exports.updatePassword = (req, res) => {
    const userId = req.user.id;  // Assuming `verify` middleware attaches `req.user`
    console.log(req.user)

    // Validate the new password
    if (req.body.newPassword.length < 8) {
        return res.status(400).send({ error: 'Password must be at least 8 characters' });
    }

    // Hash the new password
    const hashedPassword = bcrypt.hashSync(req.body.newPassword, 10);
    console.log(hashedPassword)

    // Update the user's password in the database
    return User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true })
        .then(user => {
            console.log(user)
            if (user) {
                return res.status(200).send({ message: 'Password reset successfully' });
            } 
            
            
            else {
                return res.status(404).send({ error: 'User not found' });
            }
        })
        .catch(error => errorHandler(error, req, res));
};

// module.exports.updatePassword = async (req, res) => {
//     try {
//         const {currentPassword, newPassword} = req.body;

//         const hashedPassword = bcrypt.hashSync(currentPassword, 10)
//         const userPassword = await User.findOne({password: hashedPassword});

//         // return User.findByIdAndUpdate()

//         console.log(hashedPassword)
//         console.log(newPassword)
//         console.log(userPassword)



//     } catch (error) {
        
//     }
// };