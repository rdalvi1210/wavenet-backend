const mongoose = require('mongoose');

const unitManagerGroupSchema = new mongoose.Schema(
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

const UnitManagerGroup = mongoose.model('UnitManagerGroup', unitManagerGroupSchema);

module.exports = UnitManagerGroup;
