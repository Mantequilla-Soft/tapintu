require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HIVE_API_URL = process.env.HIVE_API_URL || 'https://api.syncad.com';

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// API Routes

// Get the feed of posts from accounts followed by commentrewarder
app.get('/api/feed', async (req, res) => {
  try {
    // Step 1: Get list of accounts that commentrewarder follows
    const followingResponse = await axios.get(`${HIVE_API_URL}/hafsql/accounts/commentrewarder/following?limit=100`);
    const accounts = followingResponse.data;

    console.log(`Found ${accounts.length} accounts followed by commentrewarder`);

    // Step 2: Fetch latest posts from each account
    const allPosts = [];
    const seenPosts = new Set(); // Track unique posts by author/permlink
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    for (const account of accounts) {
      try {
        const blogResponse = await axios.post(HIVE_API_URL, {
          jsonrpc: '2.0',
          method: 'condenser_api.get_blog',
          params: { account, start_entry_id: 0, limit: 20, observer: '' },
          id: 1
        });

        const entries = blogResponse.data.result || [];
        
        // Filter posts that have commentrewarder as beneficiary AND are less than 7 days old
        for (const entry of entries) {
          const post = entry.comment;
          if (!post) continue;

          try {
            // Create unique identifier for the post
            const postId = `${post.author}/${post.permlink}`;
            
            // Skip if we've already seen this post
            if (seenPosts.has(postId)) continue;

            // Check if post is less than 7 days old
            const postDate = new Date(post.created);
            if (postDate < sevenDaysAgo) continue;

            const beneficiaries = post.beneficiaries || [];
            const hasCommentrewarder = beneficiaries.some(b => b.account === 'commentrewarder');
            
            if (hasCommentrewarder) {
              seenPosts.add(postId);
              allPosts.push(post);
            }
          } catch (e) {
            console.error(`Error checking beneficiaries for ${account}:`, e.message);
          }
        }
      } catch (error) {
        console.error(`Error fetching posts for ${account}:`, error.message);
      }
    }

    // Sort by created date, newest first
    allPosts.sort((a, b) => new Date(b.created) - new Date(a.created));

    console.log(`Returning ${allPosts.length} posts with commentrewarder beneficiary`);
    res.json(allPosts);
  } catch (error) {
    console.error('Error fetching feed:', error.message);
    res.status(500).json({ error: 'Failed to fetch feed' });
  }
});

// Get post details
app.get('/api/post/:author/:permlink', async (req, res) => {
  try {
    const { author, permlink } = req.params;
    
    const response = await axios.post(HIVE_API_URL, {
      jsonrpc: '2.0',
      method: 'condenser_api.get_content',
      params: [author, permlink],
      id: 1
    });

    res.json(response.data.result);
  } catch (error) {
    console.error('Error fetching post:', error.message);
    res.status(500).json({ error: 'Failed to fetch post' });
  }
});

// Serve main page
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Tapintu server running on http://localhost:${PORT}`);
});
