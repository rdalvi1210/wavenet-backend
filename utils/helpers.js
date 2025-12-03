
const mongoose = require('mongoose');
const User = require('../models/User');

function getFinancialYear(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = d.getMonth(); // 0-11

  let startYear;
  if (month >= 3) {
    startYear = year;
  } else {
    startYear = year - 1;
  }

  const endYear = startYear + 1;
  return `${startYear}-${endYear}`; // Example: "2024-2025"
}

function getPrefixForRole(role) {
  if (role === 'SUPERADMIN') return 'SA';
  if (role === 'ADMIN') return 'A';
  if (role === 'UNIT_MANAGER') return 'UM';
  return 'U';
}

async function generateUserId(role) {
  const prefix = getPrefixForRole(role);
  const count = await User.countDocuments({ role });
  const nextNumber = count + 1;
  return `${prefix}${nextNumber}`;
}

async function getVisibleUserIds(currentUser) {
  if (!currentUser) return [];

  const visibleIds = new Set();

  async function collectDescendants(startIds) {
    const queue = [...startIds];

    while (queue.length > 0) {
      const parentId = queue.shift();

      if (visibleIds.has(parentId.toString())) continue;

      visibleIds.add(parentId.toString());

      const children = await User.find({ createdBy: parentId }, { _id: 1 });
      const childIds = children.map((c) => c._id);

      for (const childId of childIds) {
        if (!visibleIds.has(childId.toString())) {
          queue.push(childId);
        }
      }
    }
  }

  const startSet = [currentUser._id];

  const extraStartIds = [];

  if (currentUser.adminGroup) {
    const adminsInSameGroup = await User.find(
      { adminGroup: currentUser.adminGroup },
      { _id: 1 }
    );
    adminsInSameGroup.forEach((u) => {
      extraStartIds.push(u._id);
    });
  }


  if (currentUser.unitManagerGroup) {
    const umsInSameGroup = await User.find(
      { unitManagerGroup: currentUser.unitManagerGroup },
      { _id: 1 }
    );
    umsInSameGroup.forEach((u) => {
      extraStartIds.push(u._id);
    });
  }


  const allStartIds = [...new Set([...startSet, ...extraStartIds])];


  await collectDescendants(allStartIds);


  return Array.from(visibleIds).map((id) => new mongoose.Types.ObjectId(id));
}

module.exports = {
  getFinancialYear,
  generateUserId,
  getVisibleUserIds,
};
