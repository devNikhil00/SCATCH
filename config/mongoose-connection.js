const mongoose = require('mongoose');
const config = require('config');

const dbgr = require('debug')('development:mongoose');

// Connect to the MongoDB database
mongoose
  .connect(`${config.get("MONGODB_URI")}/scatch`)
  .then(() => {
    dbgr('connected');        // Logs 'connected' if successful
  })
  .catch((err) => {
    dbgr(err);                // Logs error if connection fails
  });

module.exports = mongoose.connection;
