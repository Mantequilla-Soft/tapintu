require('dotenv').config();
const express = require('express');
const axios = require('axios');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Fallback API nodes - will try each until one works
// Both nodes support HAF functions
const HIVE_API_NODES = [
  'https://api.hive.blog',
  process.env.HIVE_API_URL || 'https://api.syncad.com'
];

// Helper function to try API calls with fallbacks
async function callHiveAPI(params) {
  for (let i = 0; i < HIVE_API_NODES.length; i++) {
    try {
      const response = await axios.post(HIVE_API_NODES[i], params, { timeout: 10000 });
      console.log(`API call successful using node: ${HIVE_API_NODES[i]}`);
      return response;
    } catch (error) {
      console.warn(`Node ${HIVE_API_NODES[i]} failed (attempt ${i + 1}/${HIVE_API_NODES.length}):`, error.message);
      if (i === HIVE_API_NODES.length - 1) {
        throw error; // Last node failed, throw error
      }
    }
  }
}

// Middleware
app.use(express.json());
app.use(express.static('public'));
app.use('/assets', express.static('assets'));

// API Routes

// Get the feed of posts from accounts followed by commentrewarder (Server-Sent Events stream)
app.get('/api/feed', async (req, res) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');

  try {
    // Step 1: Get list of accounts that commentrewarder follows using condenser_api
    let followingData = [];
    
    // Try to fetch following list from each node using condenser_api.get_following
    for (const node of HIVE_API_NODES) {
      try {
        const followingResponse = await axios.post(node, {
          jsonrpc: '2.0',
          method: 'condenser_api.get_following',
          params: ['commentrewarder', null, 'blog', 100],
          id: 1
        }, { timeout: 10000 });
        
        followingData = followingResponse.data.result || [];
        console.log(`Following list fetched from ${node}. Found ${followingData.length} accounts`);
        break;
      } catch (error) {
        console.warn(`Could not fetch following list from ${node}:`, error.message);
      }
    }
    
    if (!followingData || followingData.length === 0) {
      console.error('Could not fetch following list from any node');
      res.write('data: {"done": true, "posts": []}\n\n');
      res.end();
      return;
    }
    
    // Extract account names from the result
    const accounts = followingData.map(f => f.following);

    // Step 2: Fetch latest posts from each account and stream them
    const seenPosts = new Set(); // Track unique posts by author/permlink
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const allPosts = [];
    
    for (const account of accounts) {
      try {
        const blogResponse = await callHiveAPI({
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
              
              // Sort and stream the latest posts as they're found
              allPosts.sort((a, b) => new Date(b.created) - new Date(a.created));
              
              // Send the post via SSE
              res.write(`data: ${JSON.stringify({done: false, post: post})}\n\n`);
            }
          } catch (e) {
            console.error(`Error checking beneficiaries for ${account}:`, e.message);
          }
        }
      } catch (error) {
        console.error(`Error fetching posts for ${account}:`, error.message);
      }
    }

    // Signal completion
    res.write('data: {"done": true, "totalPosts": ' + allPosts.length + '}\n\n');
    res.end();
    
    console.log(`Streamed ${allPosts.length} posts with commentrewarder beneficiary`);
  } catch (error) {
    console.error('Error fetching feed:', error.message);
    res.write('data: {"done": true, "error": true, "posts": []}\n\n');
    res.end();
  }
});

// Get post details
app.get('/api/post/:author/:permlink', async (req, res) => {
  try {
    const { author, permlink } = req.params;
    
    const response = await callHiveAPI({
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
