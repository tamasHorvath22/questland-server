const dotenv = require("dotenv");
dotenv.config();

module.exports = {
  getDbConnectionString: function () {
    return `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.7oybl.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
  },

  getServerDetails: function () {
    return { BASE_URL: process.env.BASE_URL, PORT: process.env.PORT };
  },

  getJwtPrivateKey: function () {
    return process.env.ACCESS_JWT_PRIVATE_KEY;
  },

  getAccessTokenLife: function () {
    return process.env.ACCESS_JWT_PRIVATE_KEY_LIFE;
  },

  getRefreshJwtPrivateKey: function () {
    return process.env.REFRESH_JWT_PRIVATE_KEY;
  },

  getRefreshTokenLife: function () {
    return process.env.REFRESH_JWT_PRIVATE_KEY_LIFE;
  },

  getJwtPublicKey: function () {
    return process.env.JWT_PUBLIC_KEY;
  },
};
