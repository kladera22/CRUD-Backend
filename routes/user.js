const express = require("express");
const router = express.Router();
const { getUsers, postUser, deleteUsers, getUser, updateUser, deleteUser, login, logout } = require("../controllers/userController");

const reqRecievedLogger = require("../middlewares/reqRecievedLogger");
const { userValidator } = require("../middlewares/utils/validators");

router.route("/").get(reqRecievedLogger, getUsers).post(reqRecievedLogger, userValidator, postUser).delete(reqRecievedLogger, deleteUsers);

router.route("/login").post(reqRecievedLogger, login);

router.route("/logout").get(reqRecievedLogger, logout);

router.route("/:userId").get(reqRecievedLogger, getUser).patch(reqRecievedLogger, updateUser).delete(reqRecievedLogger, deleteUser);

module.exports = router;
