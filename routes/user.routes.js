const express = require('express');
const router = express.Router();

const { getUsers, createUser, updateUserRole, deleteUsers } = require('../controllers/userController');
const { protect } = require('../middleware/auth');

router.use(protect);


router.get('/', getUsers);

router.post('/', createUser);

router.patch('/:id', updateUserRole);

router.delete('/', deleteUsers);

module.exports = router;
