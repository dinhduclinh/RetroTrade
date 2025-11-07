const mongoose = require('mongoose');
const LifeTree = require('../../models/LifeTree.model');
const User = require('../../models/User.model');

const WATER_AMOUNT = 10;
const FERTILIZE_AMOUNT = 25;
const WATER_COOLDOWN_MS = 4 * 60 * 60 * 1000; // 4 hours
const FERTILIZE_COOLDOWN_MS = 24 * 60 * 60 * 1000; // 24 hours

async function getOrCreateTree(userId) {
  let tree = await LifeTree.findOne({ userId });
  if (!tree) {
    tree = await LifeTree.create({ userId, stage: 0, growth: 0 });
  }
  return tree;
}

function applyGrowth(tree, amount) {
  let growth = tree.growth + amount;
  let stage = tree.stage;
  if (stage >= 5) {
    if (growth > 100) growth = 100;
  } else if (growth >= 100) {
    stage = Math.min(stage + 1, 5);
    growth = stage >= 5 ? 100 : 0;
  }
  tree.growth = growth;
  tree.stage = stage;
  tree.lastCareAt = new Date();
}

function canWater(tree, now = Date.now()) {
  if (!tree.lastWaterAt) return { ok: true, retryAfterMs: 0 };
  const diff = now - new Date(tree.lastWaterAt).getTime();
  if (diff >= WATER_COOLDOWN_MS) return { ok: true, retryAfterMs: 0 };
  return { ok: false, retryAfterMs: WATER_COOLDOWN_MS - diff };
}

function canFertilize(tree, now = Date.now()) {
  if (!tree.lastFertilizeAt) return { ok: true, retryAfterMs: 0 };
  const diff = now - new Date(tree.lastFertilizeAt).getTime();
  if (diff >= FERTILIZE_COOLDOWN_MS) return { ok: true, retryAfterMs: 0 };
  return { ok: false, retryAfterMs: FERTILIZE_COOLDOWN_MS - diff };
}

function serializeTree(tree) {
  return {
    stage: tree.stage,
    growth: tree.growth,
    lastCareAt: tree.lastCareAt || null,
    createdAt: tree.createdAt || null,
    lastWaterAt: tree.lastWaterAt || null,
    lastFertilizeAt: tree.lastFertilizeAt || null,
  };
}

module.exports = {
  async state(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const user = await User.findById(userId).select('email points background');
      if (!user) return res.status(404).json({ success: false, message: 'User not found' });

      const tree = await getOrCreateTree(userId);
      return res.json({ success: true, data: { user, tree: serializeTree(tree) } });
    } catch (e) {
      console.error('Tree state error:', e);
      return res.status(500).json({ success: false, message: 'Failed to fetch state', error: e.message });
    }
  },

  async water(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const tree = await getOrCreateTree(userId);
      // DEV: disable cooldown for demo animation
      // const { ok, retryAfterMs } = canWater(tree);
      // if (!ok) return res.status(429).json({ success: false, message: 'Bạn đã tưới gần đây. Hãy thử lại sau.', retryAfterMs });

      applyGrowth(tree, WATER_AMOUNT);
      // DEV: do not set lastWaterAt to allow rapid actions
      // tree.lastWaterAt = new Date();
      await tree.save();
      return res.json({ success: true, data: serializeTree(tree) });
    } catch (e) {
      console.error('Tree water error:', e);
      return res.status(500).json({ success: false, message: 'Failed to water', error: e.message });
    }
  },

  async fertilize(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });

      const tree = await getOrCreateTree(userId);
      // DEV: disable cooldown for demo animation
      // const { ok, retryAfterMs } = canFertilize(tree);
      // if (!ok) return res.status(429).json({ success: false, message: 'Bạn đã bón phân gần đây. Hãy thử lại sau.', retryAfterMs });

      applyGrowth(tree, FERTILIZE_AMOUNT);
      // DEV: do not set lastFertilizeAt to allow rapid actions
      // tree.lastFertilizeAt = new Date();
      await tree.save();
      return res.json({ success: true, data: serializeTree(tree) });
    } catch (e) {
      console.error('Tree fertilize error:', e);
      return res.status(500).json({ success: false, message: 'Failed to fertilize', error: e.message });
    }
  },

  async updateBackground(req, res) {
    try {
      const userId = req.user?._id;
      if (!userId) return res.status(401).json({ success: false, message: 'Unauthorized' });
      const { background } = req.body || {};
      const allowed = ['village', 'zen', 'modern'];
      if (!allowed.includes(background)) return res.status(400).json({ success: false, message: 'Invalid background' });

      const user = await User.findByIdAndUpdate(userId, { background }, { new: true }).select('email points background');
      return res.json({ success: true, data: user });
    } catch (e) {
      console.error('Update background error:', e);
      return res.status(500).json({ success: false, message: 'Failed to update background', error: e.message });
    }
  }
};


