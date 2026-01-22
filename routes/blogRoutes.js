const express = require('express');
const router = express.Router();
const blogController = require('../controllers/blogController');
const { verifyAdmin } = require('../middleware/auth');

router.get('/', blogController.getBlogs);
router.get('/:slug', blogController.getBlogBySlug);
router.post('/', verifyAdmin, blogController.addBlog);
router.put('/:id', verifyAdmin, blogController.updateBlog);
router.delete('/:id', verifyAdmin, blogController.deleteBlog);

module.exports = router;
