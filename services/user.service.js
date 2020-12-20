const User = require("../models/user.model");
const UserDoc = require("../persistence/user.doc");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");
const responseMessage = require("../constants/api-response-messages");
const CryptoJS = require("crypto-js");

module.exports = {
  login: login,
  register: register
};

async function login(userDto) {
  const user = await User.findOne({ username: userDto.username });
  if (!user) {
    return responseMessage.USER.WRONG_USERNAME_OR_PASSWORD;
  }
  if (user === responseMessage.DATABASE.ERROR) {
    return responseMessage.DATABASE.ERROR;
  }
  try {
    const authenticated = await bcrypt.compare(decryptPassword(userDto.password), user.password);
    if (!authenticated) {
      return responseMessage.USER.WRONG_USERNAME_OR_PASSWORD;
    }
    const token = generateJwtToken(user);
    return token;

    // res.cookie("questland_token", token, { httpOnly: true });
    // return { username: user.username };
  } catch (err) {
    console.error(err);
    return responseMessage.USER.AUTHENTICATION_ERROR;
  }
}

async function register(userDto, res) {
  const user = User({
    username: userDto.username,
    password: userDto.password, // decryptPassword(userDto.password),
    email: userDto.email,
    firstname: userDto.firstname,
    lastname: userDto.lastname,
  });
  try {
    await user.save();
    return responseMessage.USER.SUCCESSFUL_REGISTRATION;
  } catch (err) {
    console.error(err);
    if (err.keyPattern.hasOwnProperty("username")) {
      res.status(400);
      return responseMessage.USER.USERNAME_TAKEN;
    } else if (err.keyPattern.hasOwnProperty("email")) {
      res.status(400);
      return responseMessage.USER.EMAIL_TAKEN;
    } else {
      res.status(500);
      return responseMessage.USER.UNSUCCESSFUL_REGISTRATION;
    }
  }
}

function decryptPassword(hash) {
  const bytes = CryptoJS.AES.decrypt(hash, process.env.PASSWORD_SECRET_KEY);
  return bytes.toString(CryptoJS.enc.Utf8);
}

function generateJwtToken(user) {
  return jwt.sign(
    {
      username: user.username,
      userId: user._id,
      userEmail: user.email
    },
    config.getJwtPrivateKey()
  );
}
