// ==============================================
// Group Controller (Beginner Friendly)
// ==============================================
// Handles creation of AdminGroup and UnitManagerGroup
// and adding members to these groups.

const AdminGroup = require('../models/AdminGroup');
const UnitManagerGroup = require('../models/UnitManagerGroup');
const User = require('../models/User');

async function createAdminGroup(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const group = await AdminGroup.create({ name });

    res.status(201).json({ message: 'Admin group created successfully.', group });
  } catch (err) {
    console.error('Create admin group error:', err.message);

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Admin group name already exists.' });
    }

    res.status(500).json({ message: 'Failed to create admin group.' });
  }
}

async function createUnitManagerGroup(req, res) {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Group name is required.' });
    }

    const group = await UnitManagerGroup.create({ name });

    res.status(201).json({ message: 'Unit manager group created successfully.', group });
  } catch (err) {
    console.error('Create unit manager group error:', err.message);

    if (err.code === 11000) {
      return res.status(400).json({ message: 'Unit manager group name already exists.' });
    }

    res.status(500).json({ message: 'Failed to create unit manager group.' });
  }
}

async function addAdminToGroup(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const group = await AdminGroup.findById(id);

    if (!group) {
      return res.status(404).json({ message: 'Admin group not found.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role !== 'ADMIN') {
      return res.status(400).json({ message: 'Only ADMIN users can be added to AdminGroup.' });
    }

    // Avoid duplicates
    if (!group.members.find((m) => m.toString() === user._id.toString())) {
      group.members.push(user._id);
    }

    // Update user's adminGroup reference
    user.adminGroup = group._id;

    await Promise.all([group.save(), user.save()]);

    res.status(200).json({ message: 'Admin added to group successfully.', group });
  } catch (err) {
    console.error('Add admin to group error:', err.message);
    res.status(500).json({ message: 'Failed to add admin to group.' });
  }
}

async function addUnitManagerToGroup(req, res) {
  try {
    const { id } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ message: 'userId is required.' });
    }

    const group = await UnitManagerGroup.findById(id);

    if (!group) {
      return res.status(404).json({ message: 'Unit manager group not found.' });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    if (user.role !== 'UNIT_MANAGER') {
      return res
        .status(400)
        .json({ message: 'Only UNIT_MANAGER users can be added to UnitManagerGroup.' });
    }

    if (!group.members.find((m) => m.toString() === user._id.toString())) {
      group.members.push(user._id);
    }

    user.unitManagerGroup = group._id;

    await Promise.all([group.save(), user.save()]);

    res.status(200).json({ message: 'Unit manager added to group successfully.', group });
  } catch (err) {
    console.error('Add unit manager to group error:', err.message);
    res.status(500).json({ message: 'Failed to add unit manager to group.' });
  }
}

module.exports = {
  createAdminGroup,
  createUnitManagerGroup,
  addAdminToGroup,
  addUnitManagerToGroup,
};
