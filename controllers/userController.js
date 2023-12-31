const User = require("../models/user");
const crypto = require("crypto");

const getUsers = async (req, res, next) => {
    try {
        const users = await User.find({});

        res.status(200).setHeader("Content-Type", "application/json").json(users);
    } catch (err) {
        throw new Error(`Error retrieving users: ${err.message}`);
    }
};

const postUser = async (req, res, next) => {
    try {
        const user = await User.create(req.body);

        sendTokenResponse(user, 201, res);
    } catch (err) {
        throw new Error(`Error creating user: ${err.message}`);
    }
};

const deleteUsers = async (req, res, next) => {
    try {
        await User.deleteMany();

        res.status(200).setHeader("Content-Type", "application/json").json({
            success: true,
            msg: "delete all users",
        });
    } catch (err) {
        throw new Error(`Error deleting users: ${err.message}`);
    }
};

const getUser = async (req, res, next) => {
    try {
        const user = await User.findById(req.params.userId);

        res.status(200).setHeader("Content-Type", "application/json").json(user);
    } catch (err) {
        throw new Error(`Error getting user(s) with id: ${req.params.userId}, ${err.message}`);
    }
};

const updateUser = async (req, res, next) => {
    try {
        const user = await User.findByIdAndUpdate(
            req.params.userId,
            {
                $set: req.body,
            },
            {
                new: true,
            }
        );

        res.status(200).setHeader("Content-Type", "application/json").json(user);
    } catch (err) {
        throw new Error(`Error updating user(s) with id: ${req.params.userId}, ${err.message}`);
    }
};

const deleteUser = async (req, res, next) => {
    try {
        await User.findByIdAndDelete(req.params.userId);
        console.log(req.params.userId);
    } catch (err) {
        throw new Error(`Error deleting user(s) with id: ${req.params.userId}, ${err.message}`);
    }
    res.status(200)
        .setHeader("Content-Type", "application/json")
        .json({
            success: true,
            msg: `delete user id: ${req.params.userId}`,
        });
};

const login = async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) throw new Error("Please provide a email and password");

    const user = await User.findOne({ email }).select("+password");

    if (!user) throw new Error("Invalid Credentials!");

    const isMatch = await user.matchPassword(password);

    if (!isMatch) throw new Error("Invalid Credentials!");

    sendTokenResponse(user, 200, res);
};

const forgotPassword = async (req, res, next) => {
    const user = await User.findOne({ email: req.body.email });

    if (!user) throw new Error("No user found");

    const resetToken = user.getResetPasswordToken();

    try {
        await user.save({ validateBeforeSave: false });

        res.status(200)
            .setHeader("Content-Tpye", "application/json")
            .json({ success: true, msg: `Password has been reset with token ${resetToken}` });
    } catch (err) {
        user.resetPasswordToken = undefined;
        user.resetPasswordExpire = undefined;

        await user.save({ validateBeforeSave: false });

        throw new Error("Failed to save new password");
    }
};

const resetPassword = async (req, res, next) => {
    const resetPasswordToken = crypto.createHash("sha256").update(req.query.resetToken).digest("hex");

    const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) throw new Error("Invalid token");

    user.password = req.body.password;
    user.resetPasswordExpire = undefined;
    user.resetPasswordToken = undefined;

    await user.save();

    sendTokenResponse(user, 200, res);
};

const updatePassword = async (req, res, next) => {
    const user = await User.findById(req.user.id).select("+password");

    const passwordMatches = await user.matchPassword(req.body.password);

    if (!passwordMatches) throw new Error("Password is incorrect");

    user.password = req.body.newPassword;

    await user.save();

    sendTokenResponse(user, 200, res);
};

const logout = async (req, res, next) => {
    res.status(200)
        .cookie("token", "none", {
            expires: new Date(Date.now() + 10 * 1000),
            httpOnly: true,
        })
        .json({ success: true, msg: "Successfully logged out!" });

    await user.save();
};

const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const options = {
        // expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE * 24 * 60 * 60 * 1000),
        // expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRE ),
        expires: new Date(Date.now() + 60 * 1000),
        httpOnly: true,
    };

    if (process.env.NODE_ENV === "production") {
        options.secure = true;
    }

    const filteredUser = {
        lastName: user.lastName,
        firstName: user.firstName,
        email: user.email,
        admin: user.admin,
    };

    res.status(statusCode)
        .cookie("token", token, options)
        .json({ status: statusCode, token: token, success: true, filteredUser: filteredUser });
};

module.exports = {
    getUsers,
    postUser,
    deleteUsers,
    getUser,
    updateUser,
    deleteUser,
    login,
    forgotPassword,
    resetPassword,
    updatePassword,
    logout,
};
