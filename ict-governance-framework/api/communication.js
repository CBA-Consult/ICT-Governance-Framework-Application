require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const express = require('express');
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken, requirePermission } = require('../middleware/auth');

const router = express.Router();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Get user's communication channels
router.get('/channels', async (req, res) => {
  try {
    const userId = req.user.id;
    const { channel_type, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT 
        cc.*,
        cm.role as user_role,
        cm.muted,
        u.username as created_by_username,
        (SELECT COUNT(*) FROM channel_memberships WHERE channel_id = cc.channel_id) as member_count,
        (SELECT COUNT(*) FROM channel_messages WHERE channel_id = cc.channel_id AND created_at > cm.joined_at) as unread_count
      FROM communication_channels cc
      JOIN channel_memberships cm ON cc.channel_id = cm.channel_id
      LEFT JOIN users u ON cc.created_by = u.id
      WHERE cm.user_id = $1 AND cm.left_at IS NULL AND cc.archived_at IS NULL
    `;

    const values = [userId];
    let paramCount = 1;

    if (channel_type) {
      paramCount++;
      query += ` AND cc.channel_type = $${paramCount}`;
      values.push(channel_type);
    }

    query += ` ORDER BY cc.updated_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    res.json(result.rows);
  } catch (error) {
    console.error('Error fetching communication channels:', error);
    res.status(500).json({ error: 'Failed to fetch communication channels' });
  }
});

// Create new communication channel
router.post('/channels', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const {
      channel_name,
      channel_type,
      description,
      is_private = false,
      initial_members = []
    } = req.body;

    if (!channel_name || !channel_type) {
      return res.status(400).json({ 
        error: 'Missing required fields: channel_name, channel_type' 
      });
    }

    const channelId = `CHAN-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    // Create channel
    const channelQuery = `
      INSERT INTO communication_channels (
        channel_id, channel_name, channel_type, description, is_private, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const channelResult = await client.query(channelQuery, [
      channelId, channel_name, channel_type, description, is_private, req.user.id
    ]);

    // Add creator as owner
    await client.query(`
      INSERT INTO channel_memberships (channel_id, user_id, role)
      VALUES ($1, $2, 'owner')
    `, [channelId, req.user.id]);

    // Add initial members
    for (const memberId of initial_members) {
      if (memberId !== req.user.id) {
        await client.query(`
          INSERT INTO channel_memberships (channel_id, user_id, role)
          VALUES ($1, $2, 'member')
        `, [channelId, memberId]);
      }
    }

    // Create welcome message
    const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
    await client.query(`
      INSERT INTO channel_messages (
        message_id, channel_id, sender_id, message_type, content
      ) VALUES ($1, $2, $3, 'system', $4)
    `, [
      messageId,
      channelId,
      req.user.id,
      `Welcome to ${channel_name}! This channel was created for ${description || 'team communication'}.`
    ]);

    await client.query('COMMIT');

    res.status(201).json({
      message: 'Communication channel created successfully',
      channel: channelResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating communication channel:', error);
    res.status(500).json({ error: 'Failed to create communication channel' });
  } finally {
    client.release();
  }
});

// Get channel details
router.get('/channels/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if user is a member of the channel
    const membershipQuery = `
      SELECT cm.*, cc.*, u.username as created_by_username
      FROM channel_memberships cm
      JOIN communication_channels cc ON cm.channel_id = cc.channel_id
      LEFT JOIN users u ON cc.created_by = u.id
      WHERE cm.channel_id = $1 AND cm.user_id = $2 AND cm.left_at IS NULL
    `;

    const membershipResult = await pool.query(membershipQuery, [id, userId]);

    if (membershipResult.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }

    // Get channel members
    const membersQuery = `
      SELECT 
        cm.*,
        u.username,
        u.first_name,
        u.last_name,
        u.email
      FROM channel_memberships cm
      JOIN users u ON cm.user_id = u.id
      WHERE cm.channel_id = $1 AND cm.left_at IS NULL
      ORDER BY cm.role DESC, u.first_name, u.last_name
    `;

    const membersResult = await pool.query(membersQuery, [id]);

    const channel = membershipResult.rows[0];
    channel.members = membersResult.rows;

    res.json(channel);
  } catch (error) {
    console.error('Error fetching channel details:', error);
    res.status(500).json({ error: 'Failed to fetch channel details' });
  }
});

// Get channel messages
router.get('/channels/:id/messages', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { limit = 50, offset = 0, before_message_id } = req.query;

    // Check if user is a member of the channel
    const membershipCheck = await pool.query(`
      SELECT 1 FROM channel_memberships 
      WHERE channel_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [id, userId]);

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }

    let query = `
      SELECT 
        cm.*,
        u.username,
        u.first_name,
        u.last_name,
        reply_msg.content as reply_to_content,
        reply_user.username as reply_to_username
      FROM channel_messages cm
      JOIN users u ON cm.sender_id = u.id
      LEFT JOIN channel_messages reply_msg ON cm.reply_to_message_id = reply_msg.message_id
      LEFT JOIN users reply_user ON reply_msg.sender_id = reply_user.id
      WHERE cm.channel_id = $1 AND cm.deleted_at IS NULL
    `;

    const values = [id];
    let paramCount = 1;

    if (before_message_id) {
      paramCount++;
      query += ` AND cm.created_at < (SELECT created_at FROM channel_messages WHERE message_id = $${paramCount})`;
      values.push(before_message_id);
    }

    query += ` ORDER BY cm.created_at DESC LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}`;
    values.push(limit, offset);

    const result = await pool.query(query, values);

    // Get reactions for each message
    const messageIds = result.rows.map(msg => msg.message_id);
    if (messageIds.length > 0) {
      const reactionsQuery = `
        SELECT 
          mr.*,
          u.username
        FROM message_reactions mr
        JOIN users u ON mr.user_id = u.id
        WHERE mr.message_id = ANY($1)
        ORDER BY mr.created_at
      `;

      const reactionsResult = await pool.query(reactionsQuery, [messageIds]);

      // Group reactions by message
      const reactionsByMessage = {};
      reactionsResult.rows.forEach(reaction => {
        if (!reactionsByMessage[reaction.message_id]) {
          reactionsByMessage[reaction.message_id] = [];
        }
        reactionsByMessage[reaction.message_id].push(reaction);
      });

      // Add reactions to messages
      result.rows.forEach(message => {
        message.reactions = reactionsByMessage[message.message_id] || [];
      });
    }

    res.json(result.rows.reverse()); // Return in chronological order
  } catch (error) {
    console.error('Error fetching channel messages:', error);
    res.status(500).json({ error: 'Failed to fetch channel messages' });
  }
});

// Send message to channel
router.post('/channels/:id/messages', async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { id } = req.params;
    const userId = req.user.id;
    const {
      content,
      message_type = 'text',
      reply_to_message_id,
      attachments = []
    } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    // Check if user is a member of the channel
    const membershipCheck = await client.query(`
      SELECT 1 FROM channel_memberships 
      WHERE channel_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [id, userId]);

    if (membershipCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this channel' });
    }

    const messageId = `MSG-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const insertQuery = `
      INSERT INTO channel_messages (
        message_id, channel_id, sender_id, message_type, content,
        reply_to_message_id, attachments
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;

    const result = await client.query(insertQuery, [
      messageId,
      id,
      userId,
      message_type,
      content,
      reply_to_message_id,
      JSON.stringify(attachments)
    ]);

    // Update channel's last activity
    await client.query(`
      UPDATE communication_channels 
      SET updated_at = NOW() 
      WHERE channel_id = $1
    `, [id]);

    await client.query('COMMIT');

    // Get the complete message with user info
    const messageQuery = `
      SELECT 
        cm.*,
        u.username,
        u.first_name,
        u.last_name
      FROM channel_messages cm
      JOIN users u ON cm.sender_id = u.id
      WHERE cm.message_id = $1
    `;

    const messageResult = await pool.query(messageQuery, [messageId]);

    res.status(201).json({
      message: 'Message sent successfully',
      message_data: messageResult.rows[0]
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  } finally {
    client.release();
  }
});

// Add reaction to message
router.post('/messages/:messageId/reactions', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = req.user.id;
    const { reaction_type } = req.body;

    if (!reaction_type) {
      return res.status(400).json({ error: 'Reaction type is required' });
    }

    // Check if user has access to the message (via channel membership)
    const accessCheck = await pool.query(`
      SELECT 1 
      FROM channel_messages cm
      JOIN channel_memberships cmb ON cm.channel_id = cmb.channel_id
      WHERE cm.message_id = $1 AND cmb.user_id = $2 AND cmb.left_at IS NULL
    `, [messageId, userId]);

    if (accessCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied to this message' });
    }

    // Add or update reaction
    const upsertQuery = `
      INSERT INTO message_reactions (message_id, user_id, reaction_type)
      VALUES ($1, $2, $3)
      ON CONFLICT (message_id, user_id, reaction_type) DO NOTHING
      RETURNING *
    `;

    const result = await pool.query(upsertQuery, [messageId, userId, reaction_type]);

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Reaction already exists' });
    }

    res.status(201).json({
      message: 'Reaction added successfully',
      reaction: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding reaction:', error);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
});

// Remove reaction from message
router.delete('/messages/:messageId/reactions/:reactionType', async (req, res) => {
  try {
    const { messageId, reactionType } = req.params;
    const userId = req.user.id;

    const deleteQuery = `
      DELETE FROM message_reactions 
      WHERE message_id = $1 AND user_id = $2 AND reaction_type = $3
      RETURNING *
    `;

    const result = await pool.query(deleteQuery, [messageId, userId, reactionType]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Reaction not found' });
    }

    res.json({ message: 'Reaction removed successfully' });
  } catch (error) {
    console.error('Error removing reaction:', error);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
});

// Add member to channel
router.post('/channels/:id/members', requirePermission('communication.manage'), async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id, role = 'member' } = req.body;
    const currentUserId = req.user.id;

    if (!user_id) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    // Check if current user has permission to add members
    const permissionCheck = await pool.query(`
      SELECT role FROM channel_memberships 
      WHERE channel_id = $1 AND user_id = $2 AND left_at IS NULL
    `, [id, currentUserId]);

    if (permissionCheck.rows.length === 0 || 
        !['owner', 'admin'].includes(permissionCheck.rows[0].role)) {
      return res.status(403).json({ error: 'Insufficient permissions to add members' });
    }

    // Add member
    const insertQuery = `
      INSERT INTO channel_memberships (channel_id, user_id, role)
      VALUES ($1, $2, $3)
      ON CONFLICT (channel_id, user_id) 
      DO UPDATE SET left_at = NULL, role = $3, joined_at = NOW()
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [id, user_id, role]);

    res.status(201).json({
      message: 'Member added successfully',
      membership: result.rows[0]
    });
  } catch (error) {
    console.error('Error adding channel member:', error);
    res.status(500).json({ error: 'Failed to add channel member' });
  }
});

// Leave channel
router.delete('/channels/:id/members/me', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const updateQuery = `
      UPDATE channel_memberships 
      SET left_at = NOW()
      WHERE channel_id = $1 AND user_id = $2 AND left_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Channel membership not found' });
    }

    res.json({ message: 'Left channel successfully' });
  } catch (error) {
    console.error('Error leaving channel:', error);
    res.status(500).json({ error: 'Failed to leave channel' });
  }
});

// Mute/unmute channel
router.patch('/channels/:id/mute', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const { muted } = req.body;

    const updateQuery = `
      UPDATE channel_memberships 
      SET muted = $1
      WHERE channel_id = $2 AND user_id = $3 AND left_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(updateQuery, [muted, id, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Channel membership not found' });
    }

    res.json({ 
      message: `Channel ${muted ? 'muted' : 'unmuted'} successfully`,
      membership: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating channel mute status:', error);
    res.status(500).json({ error: 'Failed to update channel mute status' });
  }
});

module.exports = router;