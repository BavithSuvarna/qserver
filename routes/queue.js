const express = require('express');
const router = express.Router();
const Queue = require('../models/Queue');

// ✅ Join Queue
router.post('/join', async (req, res) => {
  try {
    const newUser = new Queue({
      name: req.body.name,
      phone: req.body.phone,
      status: 'waiting',
      isCurrent: false,
      joinedAt: new Date()
    });
    const savedUser = await newUser.save();
    res.json(savedUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to join queue' });
  }
});

// ✅ Get Queue Lists
router.get('/', async (req, res) => {
  try {
    const queue = await Queue.find({
      status: { $in: ['waiting', 'called'] }
    }).sort({ joinedAt: 1 });

    const notArrived = await Queue.find({ status: 'not_arrived' });

    res.json({ queue, notArrived });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch queue' });
  }
});

// ✅ Call Next
router.post('/call-next', async (req, res) => {
  try {
    // If someone is already called, return them
    const currentUser = await Queue.findOne({ status: 'called', isCurrent: true });
    if (currentUser) return res.json(currentUser);

    // Else, call the first person waiting
    const nextUser = await Queue.findOneAndUpdate(
      { status: 'waiting' },
      { $set: { status: 'called', isCurrent: true } },
      { new: true, sort: { joinedAt: 1 } }
    );

    if (!nextUser) return res.json({ empty: true });

    res.json(nextUser);
  } catch (err) {
    res.status(500).json({ error: 'Failed to call next' });
  }
});

// ✅ Mark as Served
router.post('/mark-served/:id', async (req, res) => {
  try {
    await Queue.findByIdAndUpdate(req.params.id, {
      $set: { status: 'served', isCurrent: false }
    });
    res.json({ message: 'Marked as served' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark as served' });
  }
});

// ✅ Mark as Not Arrived
router.post('/not-arrived/:id', async (req, res) => {
  try {
    await Queue.findByIdAndUpdate(req.params.id, {
      $set: { status: 'not_arrived', isCurrent: false }
    });
    res.json({ message: 'Moved to not arrived' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to move to not arrived' });
  }
});

// ✅ Rejoin Queue
router.post('/rejoin/:id', async (req, res) => {
  try {
    await Queue.findByIdAndUpdate(req.params.id, {
      $set: {
        status: 'waiting',
        isCurrent: false,
        joinedAt: new Date()
      }
    });
    res.json({ message: 'Rejoined queue' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to rejoin queue' });
  }
});

// ✅ Exit Queue
router.delete('/exit/:id', async (req, res) => {
  try {
    await Queue.findByIdAndDelete(req.params.id);
    res.json({ message: 'Exited queue' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to exit queue' });
  }
});

module.exports = router;