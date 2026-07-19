const express = require('express');
const router = express.Router();

const roomController = require('../controllers/room.controller');
const auth = require('../middlewares/auth.middleware');
const role = require('../middlewares/role.middleware');
const validate = require('../middlewares/validate.middleware');
const roomSchema = require('../validations/room.schema');

// Public
router.get('/', roomController.getAllRooms);
router.get('/:id', roomController.getRoomById);

// Protected
router.post(
  '/',
  auth,
  role('owner'),
  validate(roomSchema.createRoomSchema),
  roomController.createRoom
);

router.put(
  '/:id',
  auth,
  role('owner'),
  validate(roomSchema.updateRoomSchema),
  roomController.updateRoom
);

router.delete(
  '/:id',
  auth,
  role('owner'),
  roomController.deleteRoom
);

module.exports = router;
