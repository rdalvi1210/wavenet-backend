const mongoose = require('mongoose');

const adminGroupSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Group name is required'],
      trim: true,
      unique: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  {
    timestamps: true,
  }
);

const AdminGroup = mongoose.model('AdminGroup', adminGroupSchema);

module.exports = AdminGroup;
