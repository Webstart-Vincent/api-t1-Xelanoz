const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const recoveryPasswordSchema = new Schema({
  slug: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User' },  
});

const RecoveryPassword = mongoose.model('RecoveryPassword', recoveryPasswordSchema);

module.exports = { RecoveryPassword };
