const mongoose = require('mongoose');
const User = require('../models/User');
const { getVisibleUserIds } = require('../utils/helpers');

function canCreateRole(creatorRole, newUserRole) {
  if (creatorRole === 'SUPERADMIN' && newUserRole === 'ADMIN') return true;
  if (creatorRole === 'ADMIN' && newUserRole === 'UNIT_MANAGER') return true;
  if (creatorRole === 'UNIT_MANAGER' && newUserRole === 'USER') return true;
  return false;
}

function canUpdateToRole(actorRole, targetNewRole) {
  return canCreateRole(actorRole, targetNewRole);
}

async function getUsers(req, res) {
  try {
    const { search, role } = req.query;

    const visibleIds = await getVisibleUserIds(req.user);

    const filter = { _id: { $in: visibleIds } };

    if (role) {
      filter.role = role;
    }

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { name: regex },
        { email: regex },
        { userId: regex }
      ];
    }

    const users = await User.find(filter).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (err) {
    console.error('Get users error:', err.message);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch users.' 
    });
  }
}

async function createUser(req, res) {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password || !role) {
      return res.status(400).json({ message: 'Name, email, password and role are required.' });
    }

    // Role creation rules
    if (!canCreateRole(req.user.role, role)) {
      return res.status(403).json({
        message:
          'You are not allowed to create this type of user. Check role creation rules.',
      });
    }

    const user = await User.create({
      name,
      email,
      password,
      role,
      createdBy: req.user._id,
    });

    res.status(201).json({
      message: 'User created successfully.',
      user,
    });
  } catch (err) {
    console.error('Create user error:', err.message);

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email or userId already exists.' });
    }

    res.status(500).json({ message: 'Failed to create user.' });
  }
}

async function updateUserRole(req, res) {
  try {
    const { id } = req.params;
    const { role: newRole } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id.' });
    }

    if (!newRole) {
      return res.status(400).json({ message: 'New role is required.' });
    }

    const visibleIds = await getVisibleUserIds(req.user);

    if (!visibleIds.map((x) => x.toString()).includes(id)) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to manage this user.' });
    }

    if (!canUpdateToRole(req.user.role, newRole)) {
      return res.status(403).json({ message: 'You cannot set this role.' });
    }

    const user = await User.findByIdAndUpdate(
      id,
      { role: newRole },
      { new: true, runValidators: true }
    );

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    res.status(200).json({ message: 'User role updated successfully.', user });
  } catch (err) {
    console.error('Update user error:', err.message);
    res.status(500).json({ message: 'Failed to update user.' });
  }
}

async function deleteUsers(req, res) {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: 'Array of user ids is required.' });
    }

    const visibleIds = await getVisibleUserIds(req.user);
    const visibleSet = new Set(visibleIds.map((x) => x.toString()));

    const deletableIds = ids.filter((id) => visibleSet.has(id));

    if (deletableIds.length === 0) {
      return res
        .status(403)
        .json({ message: 'You are not allowed to delete any of the specified users.' });
    }

    const result = await User.deleteMany({ _id: { $in: deletableIds } });

    res.status(200).json({
      message: 'Users deleted successfully (only those you had permission for).',
      deletedCount: result.deletedCount,
    });
  } catch (err) {
    console.error('Delete users error:', err.message);
    res.status(500).json({ message: 'Failed to delete users.' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUserRole,
  deleteUsers,
};
