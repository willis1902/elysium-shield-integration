# 📚 Elysium Shield SDK - Usage Examples

Complete examples for integrating Shield into your Discord bot.

## Table of Contents

- [Basic Setup](#basic-setup)
- [Member Join Verification](#member-join-verification)
- [Automatic Action Reporting](#automatic-action-reporting)
- [Advanced: Smart Moderation](#advanced-smart-moderation)
- [Rate Limit Handling](#rate-limit-handling)
- [Error Recovery](#error-recovery)

---

## Basic Setup

### Initialize Shield in your bot

```javascript
const { Client, GatewayIntentBits } = require('discord.js');
const ShieldIntegration = require('./shieldIntegration');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

// Initialize Shield
const shield = new ShieldIntegration(process.env.SHIELD_API_KEY, {
  debug: process.env.NODE_ENV === 'development'
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);
  
  // Verify API key on startup
  const isValid = await shield.verifyApiKey();
  if (isValid) {
    console.log('✅ Shield API key verified');
  } else {
    console.error('❌ Invalid Shield API key!');
    process.exit(1);
  }
});

client.login(process.env.DISCORD_TOKEN);
```

---

## Member Join Verification

### Basic verification with logging

```javascript
client.on('guildMemberAdd', async (member) => {
  // Skip bots
  if (member.user.bot) return;
  
  try {
    const result = await shield.checkUser(member.user.id);
    
    console.log(`User ${member.user.tag} joined - Shield Check:`);
    console.log(`- Flagged: ${result.flagged}`);
    console.log(`- Trust Score: ${result.trustScore}`);
    console.log(`- Risk Level: ${result.riskLevel}`);
    
    if (result.flagged) {
      // Log to moderation channel
      const modChannel = member.guild.channels.cache.find(
        ch => ch.name === 'mod-logs'
      );
      
      if (modChannel) {
        await modChannel.send({
          embeds: [{
            title: '⚠️ Flagged User Joined',
            color: 0xff0000,
            fields: [
              { name: 'User', value: `${member.user.tag} (${member.user.id})`, inline: true },
              { name: 'Risk Level', value: result.riskLevel.toUpperCase(), inline: true },
              { name: 'Trust Score', value: result.trustScore.toString(), inline: true },
              { name: 'Action Count', value: result.actionCount.toString(), inline: true },
              { name: 'Recommendation', value: result.recommendation.action, inline: true },
              { name: 'Reason', value: result.recommendation.reason, inline: false }
            ],
            timestamp: new Date()
          }]
        });
      }
    }
  } catch (error) {
    console.error('Shield check failed:', error.message);
  }
});
```

### Automatic action based on risk level

```javascript
client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;
  
  try {
    const result = await shield.checkUser(member.user.id);
    
    // Take action based on risk level
    switch (result.riskLevel) {
      case 'critical':
        // Immediate ban
        await member.ban({ 
          reason: `Shield: ${result.recommendation.reason}` 
        });
        console.log(`🔨 Banned ${member.user.tag} (critical risk)`);
        break;
        
      case 'high':
        // Kick and notify moderators
        await member.kick({ 
          reason: `Shield: ${result.recommendation.reason}` 
        });
        console.log(`👢 Kicked ${member.user.tag} (high risk)`);
        break;
        
      case 'medium':
        // Add "suspicious" role for monitoring
        const suspiciousRole = member.guild.roles.cache.find(
          r => r.name === 'Suspicious'
        );
        if (suspiciousRole) {
          await member.roles.add(suspiciousRole);
          console.log(`👁️ Marked ${member.user.tag} as suspicious`);
        }
        break;
        
      case 'low':
        // Just log it
        console.log(`ℹ️ ${member.user.tag} has low risk flags`);
        break;
        
      default:
        // Clean user
        console.log(`✅ ${member.user.tag} passed Shield check`);
    }
  } catch (error) {
    console.error('Shield check failed:', error.message);
    // Don't block user if Shield is down
  }
});
```

---

## Automatic Action Reporting

### Report bans

```javascript
client.on('guildBanAdd', async (ban) => {
  try {
    // Get ban details
    const auditLogs = await ban.guild.fetchAuditLogs({
      type: 22, // MEMBER_BAN_ADD
      limit: 1
    });
    
    const banLog = auditLogs.entries.first();
    const moderator = banLog?.executor;
    
    // Report to Shield
    await shield.reportAction({
      userId: ban.user.id,
      guildId: ban.guild.id,
      actionType: 'ban',
      reason: ban.reason || 'No reason provided',
      moderatorId: moderator?.id || ban.guild.ownerId
    });
    
    console.log(`✅ Reported ban of ${ban.user.tag} to Shield`);
  } catch (error) {
    console.error('Failed to report ban:', error.message);
  }
});
```

### Report kicks

```javascript
client.on('guildMemberRemove', async (member) => {
  // Check if it was a kick (not a leave)
  const auditLogs = await member.guild.fetchAuditLogs({
    type: 20, // MEMBER_KICK
    limit: 1
  });
  
  const kickLog = auditLogs.entries.first();
  
  if (kickLog && kickLog.target.id === member.user.id) {
    try {
      await shield.reportAction({
        userId: member.user.id,
        guildId: member.guild.id,
        actionType: 'kick',
        reason: kickLog.reason || 'No reason provided',
        moderatorId: kickLog.executor.id
      });
      
      console.log(`✅ Reported kick of ${member.user.tag} to Shield`);
    } catch (error) {
      console.error('Failed to report kick:', error.message);
    }
  }
});
```

### Report timeouts

```javascript
client.on('guildMemberUpdate', async (oldMember, newMember) => {
  // Check if timeout was added
  if (!oldMember.communicationDisabledUntil && newMember.communicationDisabledUntil) {
    try {
      const auditLogs = await newMember.guild.fetchAuditLogs({
        type: 24, // MEMBER_UPDATE
        limit: 1
      });
      
      const timeoutLog = auditLogs.entries.first();
      
      await shield.reportAction({
        userId: newMember.user.id,
        guildId: newMember.guild.id,
        actionType: 'timeout',
        reason: timeoutLog?.reason || 'Timed out',
        moderatorId: timeoutLog?.executor?.id || newMember.guild.ownerId
      });
      
      console.log(`✅ Reported timeout of ${newMember.user.tag} to Shield`);
    } catch (error) {
      console.error('Failed to report timeout:', error.message);
    }
  }
});
```

---

## Advanced: Smart Moderation

### Context-aware moderation

```javascript
async function handleSuspiciousUser(member, shieldResult) {
  // Get user's account age
  const accountAge = Date.now() - member.user.createdTimestamp;
  const accountAgeDays = Math.floor(accountAge / (1000 * 60 * 60 * 24));
  
  // Combine Shield data with local context
  const isSuspicious = 
    shieldResult.flagged || 
    (accountAgeDays < 7 && shieldResult.trustScore < 0) ||
    (accountAgeDays < 1 && shieldResult.actionCount > 0);
  
  if (isSuspicious) {
    // Apply verification role
    const verificationRole = member.guild.roles.cache.find(
      r => r.name === 'Unverified'
    );
    
    if (verificationRole) {
      await member.roles.add(verificationRole);
      
      // Send verification message
      try {
        await member.send({
          embeds: [{
            title: '🛡️ Verification Required',
            description: 'Your account has been flagged for verification. Please complete the verification process in the server.',
            color: 0xffa500,
            fields: [
              { name: 'Account Age', value: `${accountAgeDays} days`, inline: true },
              { name: 'Trust Score', value: shieldResult.trustScore.toString(), inline: true }
            ]
          }]
        });
      } catch (error) {
        console.log('Could not DM user for verification');
      }
    }
  }
}

client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;
  
  try {
    const result = await shield.checkUser(member.user.id);
    await handleSuspiciousUser(member, result);
  } catch (error) {
    console.error('Error handling user:', error.message);
  }
});
```

---

## Rate Limit Handling

### Graceful rate limit handling

```javascript
async function checkUserWithRetry(userId, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await shield.checkUser(userId);
      return result;
    } catch (error) {
      if (error.statusCode === 429) {
        const retryAfter = error.rateLimit?.retryAfter || 60;
        console.log(`Rate limited. Retrying in ${retryAfter}s (attempt ${attempt}/${maxRetries})`);
        
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
        } else {
          throw new Error('Max retries reached');
        }
      } else {
        throw error;
      }
    }
  }
}

client.on('guildMemberAdd', async (member) => {
  try {
    const result = await checkUserWithRetry(member.user.id);
    // Handle result
  } catch (error) {
    console.error('Failed to check user after retries:', error.message);
  }
});
```

### Monitor rate limit usage

```javascript
async function monitorRateLimits() {
  try {
    const stats = await shield.getNetworkStats();
    
    if (stats.rateLimit) {
      const percentUsed = ((stats.rateLimit.limit - stats.rateLimit.remaining) / stats.rateLimit.limit) * 100;
      
      if (percentUsed > 80) {
        console.warn(`⚠️ Rate limit usage: ${percentUsed.toFixed(1)}% (${stats.rateLimit.remaining}/${stats.rateLimit.limit} remaining)`);
      }
    }
  } catch (error) {
    console.error('Failed to check rate limits:', error.message);
  }
}

// Check every 5 minutes
setInterval(monitorRateLimits, 5 * 60 * 1000);
```

---

## Error Recovery

### Fallback when Shield is unavailable

```javascript
async function safeCheckUser(userId) {
  try {
    return await shield.checkUser(userId);
  } catch (error) {
    console.error('Shield unavailable:', error.message);
    
    // Return safe default
    return {
      userId,
      flagged: false,
      trustScore: 0,
      riskLevel: 'unknown',
      actionCount: 0,
      recommendation: {
        action: 'none',
        reason: 'Shield service unavailable',
        confidence: 'low'
      }
    };
  }
}

client.on('guildMemberAdd', async (member) => {
  const result = await safeCheckUser(member.user.id);
  
  if (result.riskLevel === 'unknown') {
    console.log('⚠️ Shield unavailable, allowing user by default');
  } else if (result.flagged) {
    // Handle flagged user
  }
});
```

### Retry with exponential backoff

```javascript
async function retryWithBackoff(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      
      const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
      console.log(`Retry ${i + 1}/${maxRetries} after ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

// Usage
const result = await retryWithBackoff(() => shield.checkUser(userId));
```

---

## Complete Bot Example

```javascript
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const ShieldIntegration = require('./shieldIntegration');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildModeration
  ]
});

const shield = new ShieldIntegration(process.env.SHIELD_API_KEY);

client.once('ready', async () => {
  console.log(`✅ ${client.user.tag} is online`);
  
  const isValid = await shield.verifyApiKey();
  if (!isValid) {
    console.error('❌ Invalid Shield API key');
    process.exit(1);
  }
  
  console.log('🛡️ Shield protection enabled');
});

// Check users on join
client.on('guildMemberAdd', async (member) => {
  if (member.user.bot) return;
  
  try {
    const result = await shield.checkUser(member.user.id);
    
    if (result.riskLevel === 'critical') {
      await member.ban({ reason: `Shield: ${result.recommendation.reason}` });
      console.log(`🔨 Auto-banned ${member.user.tag} (critical risk)`);
    } else if (result.flagged) {
      // Notify moderators
      const modChannel = member.guild.channels.cache.find(ch => ch.name === 'mod-logs');
      if (modChannel) {
        await modChannel.send({
          embeds: [new EmbedBuilder()
            .setTitle('⚠️ Flagged User Joined')
            .setColor(0xff0000)
            .addFields(
              { name: 'User', value: `${member.user.tag}`, inline: true },
              { name: 'Risk', value: result.riskLevel, inline: true },
              { name: 'Action', value: result.recommendation.action, inline: true }
            )
            .setTimestamp()
          ]
        });
      }
    }
  } catch (error) {
    console.error('Shield check failed:', error.message);
  }
});

// Report bans
client.on('guildBanAdd', async (ban) => {
  try {
    const auditLogs = await ban.guild.fetchAuditLogs({ type: 22, limit: 1 });
    const banLog = auditLogs.entries.first();
    
    await shield.reportAction({
      userId: ban.user.id,
      guildId: ban.guild.id,
      actionType: 'ban',
      reason: ban.reason || 'No reason provided',
      moderatorId: banLog?.executor?.id || ban.guild.ownerId
    });
    
    console.log(`✅ Reported ban to Shield`);
  } catch (error) {
    console.error('Failed to report ban:', error.message);
  }
});

client.login(process.env.DISCORD_TOKEN);
```

---

**Need more help?** Check out the [main README](./README.md) or visit [our documentation](https://elysium-online.xyz/docs/shield).
