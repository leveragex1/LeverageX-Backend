const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../Models/userModel");

const signup = async (req, res) => {
    try {
        const { fullName, email, mobile, aadhaar, pan, password } = req.body;

        // Log incoming data for debugging
        console.log("Signup request data:", req.body);

        const user = await User.findOne({ email });
        if (user) {
            return res.status(409).json({ message: 'Email already exists, please login', success: false });
        }

        const userModel = new User({ fullName, email, mobile, aadhaar, pan, password });
        userModel.password = await bcrypt.hash(password, 10);
        await userModel.save();
        res.status(201).json({ message: "Signup successful", success: true });
    } catch (err) {
        console.error("Signup error:", err);  // Log the exact error
        res.status(500).json({ message: "Internal server error", success: false });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });  // Search by email
        const errorMsg = 'Auth failed, email or password is incorrect';
        if (!user) {
            return res.status(403)
                .json({ message: errorMsg, success: false });
        }

        const isPassEqual = await bcrypt.compare(password, user.password);
        if (!isPassEqual) {
            return res.status(403)
                .json({ message: errorMsg, success: false });
        }

        const jwtToken = jwt.sign(
            { email: user.email, _id: user._id },  // Include user ID in the token payload
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200)
            .json({
                message: "Login Success",
                success: true,
                jwtToken,
                userId: user._id,       // Return userId in the response
                email: user.email,      // Return email as well
                fullName: user.fullName // Include fullName in the response
            });
    } catch (err) {
        res.status(500)
            .json({
                message: "Internal server error",
                success: false
            });
    }
};


module.exports = {
    login,
    signup,
};
