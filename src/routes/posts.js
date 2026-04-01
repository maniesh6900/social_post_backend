import express from 'express';
import Post from '../models/Post.js';
import User from '../models/User.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', async (_req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate('author', 'username')
      .populate('likes.user', 'username')
      .populate('comments.user', 'username')
      .lean();

    const shaped = posts.map((p) => ({
      id: p._id,
      author: p.author?.username,
      content: p.content,
      image: p.image,
      likes: p.likes?.map((l) => l.user?.username).filter(Boolean) || [],
      comments: p.comments?.map((c) => ({
        user: c.user?.username,
        text: c.text,
        createdAt: c.createdAt
      })) || [],
      createdAt: p.createdAt
    }));

    res.json(shaped);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to load posts' });
  }
});

router.post('/', auth, async (req, res) => {
  const { content, image } = req.body;
  if (!content && !image) {
    return res.status(400).json({ message: 'Content or image required' });
  }
  try {
    const post = await Post.create({
      author: req.user.id,
      content,
      image
    });
    const populated = await post
      .populate('author', 'username')
      .then((p) => p.populate('comments.user likes.user', 'username'));
    res.status(201).json({
      id: populated._id,
      author: populated.author.username,
      content: populated.content,
      image: populated.image,
      likes: [],
      comments: [],
      createdAt: populated.createdAt
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Could not create post' });
  }
});

router.post('/:id/like', auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate('likes.user', 'username');
    if (!post) return res.status(404).json({ message: 'Post not found' });

    const already = post.likes.find((l) => l.user.equals(req.user.id));
    if (already) {
      post.likes = post.likes.filter((l) => !l.user.equals(req.user.id));
    } else {
      post.likes.push({ user: req.user.id });
    }
    await post.save();
    await post.populate('likes.user', 'username');

    res.json({
      id: post._id,
      likes: post.likes.map((l) => l.user.username),
      likeCount: post.likes.length
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to like' });
  }
});

router.post('/:id/comment', auth, async (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).json({ message: 'Comment text required' });
  try {
    const user = await User.findById(req.user.id, 'username');
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: 'Post not found' });

    post.comments.push({ user: req.user.id, text });
    await post.save();
    await post.populate('comments.user', 'username');

    res.status(201).json({
      id: post._id,
      comments: post.comments.map((c) => ({
        user: c.user.username,
        text: c.text,
        createdAt: c.createdAt
      })),
      commentCount: post.comments.length,
      newComment: { user: user.username, text }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to comment' });
  }
});

export default router;
