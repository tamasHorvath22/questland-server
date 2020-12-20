const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const schemas = require('../constants/schemas');
const Schema = mongoose.Schema;

let userSchema = new Schema({
  username: { type : String, required: true, unique: true },
  password: { type : String, required: true },
  email: { type : String, unique: true, required: true },
  firstname: { type : String, required: true },
  lastname: { type : String, required: true }
}, { timestamps: true });

userSchema.pre('save', function (next) {
  const user = this;
  if (!user.isModified('password')) { return next() };
  bcrypt.hash(user.password, 10)
    .then((hashedPassword) => {
      user.password = hashedPassword;
      next();
  })
}, function (err) {
  next(err)
})

userSchema.methods.comparePassword = function(candidatePassword, next) {
  bcrypt.compare(candidatePassword, this.password, function (err, isMatch) {
    if(err) return next(err);
    next(null, isMatch)
  })
}

module.exports = mongoose.model(schemas.USER, userSchema);
