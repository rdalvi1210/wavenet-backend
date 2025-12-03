const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const USER_ROLES = ['SUPERADMIN', 'ADMIN', 'UNIT_MANAGER', 'USER'];

const userSchema = new mongoose.Schema(
  {
    // Basic identity fields
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password should be at least 6 characters long'],
      select: false,
    },


    role: {
      type: String,
      enum: USER_ROLES,
      default: 'USER',
    },

    userId: {
      type: String,
      unique: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    adminGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'AdminGroup',
      default: null,
    },

    unitManagerGroup: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UnitManagerGroup',
      default: null,
    },
  },
  {
    timestamps: true, // automatically store createdAt and updatedAt
  }
);

function getPrefixForRole(role) {
  if (role === 'SUPERADMIN') return 'SA';
  if (role === 'ADMIN') return 'A';
  if (role === 'UNIT_MANAGER') return 'UM';
  return 'U';
}

userSchema.pre('save', async function () {
  const user = this;

  if (user.isModified('password')) {
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    user.password = await bcrypt.hash(user.password, salt);
  }

  if (!user.isNew || user.userId) {
    return;
  }

  const prefix = getPrefixForRole(user.role);

  const count = await mongoose.model('User').countDocuments({ role: user.role });


  const nextNumber = count + 1;


  user.userId = `${prefix}${nextNumber}`;
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

module.exports = User;
