const User = require("../models/user.model");
const GoogleUser = require("../models/google.user.model");
const RegisterTokenDoc = require("../persistence/register.token.doc");
const UserTransaction = require("../persistence/user.transaction");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");
const responseMessage = require("../constants/api-response-messages");
const CryptoJS = require("crypto-js");

module.exports = {
  login: login,
  register: register,
  handleAuthUser: handleAuthUser
};

async function handleAuthUser(userDto) {
  let user = await GoogleUser.findOne({ nickname: userDto.nickname });
  if (!user) {
    let savedToken = await RegisterTokenDoc.getById(userDto.token);
    if (savedToken === responseMessage.DATABASE.ERROR) {
      return responseMessage.DATABASE.ERROR;
    }
    if (!savedToken) {
      return responseMessage.REGISTER.TOKEN_ERROR;
    }
    const newUser = GoogleUser({
      nickname: userDto.nickname,
      firstName: userDto.firstName,
      lastName: userDto.lastName,
      role: savedToken.role,
      studentData: savedToken.studentData
    });
    user = await UserTransaction.registerUserDeleteToken(newUser, savedToken);
    if (!user) {
      return responseMessage.REGISTER.TOKEN_ERROR;
    }
  }
  const token = generateServerJwtToken(user);
  return token;
}

function generateServerJwtToken(user) {
  const realmId = user.studentData ? user.studentData.realmId : null;
  const studentId = user.studentData ? user.studentData.studentId : null;
  return jwt.sign({
    userId: user._id,
    nickname: user.nickname,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    realmId: realmId,
    studentId: studentId
  },
  config.getJwtPrivateKey());
}

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

  } catch (err) {
    console.error(err);
    return responseMessage.USER.AUTHENTICATION_ERROR;
  }
}

async function register(userDto) {
  // if no token set as env variable, the reg process is over
  if (!process.env.REGISTER_TOKEN) {
    return responseMessage.REGISTER.NOT_SUCCESS;
  }
  const token = decryptPassword(userDto.token);
  if (process.env.REGISTER_TOKEN !== token) {
    return responseMessage.REGISTER.TOKEN_ERROR;
  }
  const user = User({
    username: userDto.username,
    password: decryptPassword(userDto.password)
  });
  try {
    await user.save();
    return responseMessage.REGISTER.SUCCESS;
  } catch (err) {
    console.error(err);
    if (err.keyPattern.username) {
      return responseMessage.REGISTER.USERNAME_TAKEN;
    } else {
      return responseMessage.REGISTER.NOT_SUCCESS;
    }
    // else if (err.keyPattern.hasOwnProperty("email")) {
    //   return responseMessage.USER.EMAIL_TAKEN;
    // }
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
      userId: user._id
    },
    config.getJwtPrivateKey()
  );
}
