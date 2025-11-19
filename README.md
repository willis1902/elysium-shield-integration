# 🛡️ Elysium Shield Integration SDK

Official SDK for integrating Elysium Shield into your Discord bot. Get cross-server moderation intelligence, threat detection, and user verification with just a few lines of code.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

## 🌟 Features

- ✅ **Cross-Server Moderation** - Share threat intelligence across Discord servers
- ✅ **Real-time User Verification** - Check users when they join your server
- ✅ **Trust Score System** - AI-powered risk assessment
- ✅ **Action Reporting** - Contribute to the network and improve everyone's safety
- ✅ **Rate Limit Handling** - Built-in rate limit tracking with friendly formatting
- ✅ **Zero Dependencies** - Uses only Node.js built-in modules
- ✅ **TypeScript Ready** - Full JSDoc documentation

## 📦 Installation

### Option 1: Copy the SDK file

1. Download `shieldIntegration.js` from this repository
2. Place it in your project directory
3. Require it in your code:

```javascript
const ShieldIntegration = require('./shieldIntegration');
```

### Option 2: Clone the repository

```bash
git clone https://github.com/willis1902/elysium-shield-integration.git
cd elysium-shield-integration
```

## 🚀 Quick Start

### 1. Get an API Key

Visit [https://elysium-online.xyz/profile](https://elysium-online.xyz/profile) and create an API key with Shield permissions.

### 2. Initialize the SDK

```javascript
const ShieldIntegration = require('./shieldIntegration');

const shield = new ShieldIntegration('your-api-key-here', {
  debug: false, // Set to true for detailed logging
  apiUrl: 'https://elysium-online.xyz/api' // Optional: custom API URL
});
```

### 3. Check Users on Join

```javascript
client.on('guildMemberAdd', async (member) => {
  try {
    const result = await shield.checkUser(member.user.id);
    
    if (result.flagged) {
      console.log(`⚠️ Flagged user joined: ${member.user.tag}`);
      console.log(`Risk Level: ${result.riskLevel}`);
      console.log(`Recommendation: ${result.recommendation.action}`);
      
      // Take action based on risk level
      if (result.riskLevel === 'critical') {
        await member.ban({ reason: result.recommendation.reason });
      }
    }
  } catch (error) {
    console.error('Shield check failed:', error.message);
  }
});
```

### 4. Report Moderation Actions

```javascript
client.on('guildBanAdd', async (ban) => {
  try {
    await shield.reportAction({
      userId: ban.user.id,
      guildId: ban.guild.id,
      actionType: 'ban',
      reason: ban.reason || 'No reason provided',
      moderatorId: 'moderator-id-here'
    });
    
    console.log('✅ Ban reported to Shield network');
  } catch (error) {
    console.error('Failed to report action:', error.message);
  }
});
```

## 📚 API Reference

### Constructor

```javascript
new ShieldIntegration(apiKey, options)
```

**Parameters:**
- `apiKey` (string, required) - Your Shield API key
- `options` (object, optional)
  - `apiUrl` (string) - API base URL (default: `https://elysium-online.xyz/api`)
  - `timeout` (number) - Request timeout in ms (default: `10000`)
  - `debug` (boolean) - Enable debug logging (default: `false`)

---

### checkUser(userId)

Check if a user is flagged in the Shield system.

**Parameters:**
- `userId` (string) - Discord user ID

**Returns:** `Promise<Object>`

```javascript
{
  userId: '123456789',
  flagged: true,
  trustScore: -44,
  riskLevel: 'high', // 'none', 'low', 'medium', 'high', 'critical'
  actionCount: 6,
  categories: ['spam', 'harassment'],
  recommendation: {
    action: 'ban', // 'none', 'watch', 'warn', 'kick', 'ban'
    reason: 'Escalating violations - no improvement shown',
    confidence: 'high'
  },
  rateLimit: {
    limit: 30,
    remaining: 27,
    resetAt: '2025-11-19T15:37:01.000Z',
    resetTimestamp: 1763566621
  }
}
```

**Example:**

```javascript
const result = await shield.checkUser('123456789');

if (result.flagged) {
  console.log(`User is flagged: ${result.riskLevel} risk`);
  console.log(`Recommendation: ${result.recommendation.action}`);
}
```

---

### reportAction(actionData)

Report a moderation action to the Shield network.

**Requires:** API key with `shield:report_action` permission

**Parameters:**
- `actionData` (object)
  - `userId` (string, required) - Target user ID
  - `guildId` (string, required) - Guild ID where action occurred
  - `actionType` (string, required) - Action type: `ban`, `kick`, `timeout`, `mute`, `warn`, `unban`, `untimeout`, `unmute`, `remove_warning`
  - `reason` (string, required) - Reason for action
  - `moderatorId` (string, required) - Moderator user ID
  - `accountCreated` (string, optional) - Discord account creation date (ISO 8601)

**Returns:** `Promise<Object>`

```javascript
{
  success: true,
  message: 'Action reported successfully',
  data: {
    success: true,
    user: {
      userId: '123456789',
      trustScore: -100,
      riskLevel: 'critical',
      flagged: true,
      flags: ['repeat_offender'],
      actionCount: 11,
      serverCount: 2
    },
    action: {
      category: 'spam',
      confidence: 0.95,
      severity: 4
    }
  },
  rateLimit: { ... }
}
```

**Example:**

```javascript
await shield.reportAction({
  userId: '123456789',
  guildId: '987654321',
  actionType: 'ban',
  reason: 'Spam',
  moderatorId: '111222333'
});
```

---

### getNetworkStats()

Get Shield network statistics.

**Returns:** `Promise<Object>`

```javascript
{
  participatingServers: 10,
  totalUsers: 5,
  usersChecked: 5,
  threatsDetected: 0,
  actionsContributed: 49,
  rateLimit: { ... }
}
```

**Example:**

```javascript
const stats = await shield.getNetworkStats();
console.log(`Protected by ${stats.participatingServers} servers`);
console.log(`${stats.threatsDetected} threats detected`);
```

---

### verifyApiKey()

Verify your API key is valid.

**Returns:** `Promise<boolean>`

**Example:**

```javascript
const isValid = await shield.verifyApiKey();
if (!isValid) {
  console.error('Invalid API key!');
}
```

---

## 🔒 Rate Limiting

The SDK automatically tracks rate limits and includes them in every response:

```javascript
const result = await shield.checkUser(userId);

console.log('Rate Limit Info:');
console.log(`- Limit: ${result.rateLimit.limit} requests/minute`);
console.log(`- Remaining: ${result.rateLimit.remaining}`);
console.log(`- Resets at: ${result.rateLimit.resetAt}`);
```

**Rate Limits:**
- **Free Tier:** 30 requests/minute
- **Premium Tier:** 120 requests/minute

If you hit the rate limit (429 response), the error will include `retryAfter` (seconds to wait).

---

## 🎨 Show Your Support

Display the "Powered by Elysium Shield" badge on your bot's website or README!

### Markdown Badge

```markdown
[![Powered by Elysium Shield](https://elysium-online.xyz/images/badges/powered-by-shield.svg)](https://elysium-online.xyz/shield)
```

### HTML Badge

```html
<a href="https://elysium-online.xyz/shield">
  <img src="https://elysium-online.xyz/images/badges/powered-by-shield.svg" alt="Powered by Elysium Shield">
</a>
```

### Discord Embed

```javascript
const embed = new EmbedBuilder()
  .setFooter({ 
    text: '🛡️ Protected by Elysium Shield'
  });
```

---

## 🛠️ Error Handling

The SDK throws descriptive errors. Always wrap calls in try-catch:

```javascript
try {
  const result = await shield.checkUser(userId);
  // Handle result
} catch (error) {
  console.error('Shield error:', error.message);
  
  if (error.statusCode === 429) {
    console.log(`Rate limited. Retry after ${error.rateLimit.retryAfter}s`);
  } else if (error.statusCode === 403) {
    console.log('API key lacks required permissions');
  } else if (error.statusCode === 401) {
    console.log('Invalid API key');
  }
}
```

---

## 📖 Examples

See [EXAMPLES.md](./EXAMPLES.md) for complete integration examples including:
- Discord.js bot integration
- Member join verification
- Automatic ban reporting
- Rate limit handling
- Error recovery

---

## 🤝 Support

- **Documentation:** [https://elysium-online.xyz/docs/shield](https://elysium-online.xyz/docs/shield)
- **Discord:** [Join our server](https://discord.gg/elysium)
- **Issues:** [GitHub Issues](https://github.com/willis1902/elysium-shield-integration/issues)

---

## 📄 License

MIT License - see [LICENSE](./LICENSE) file for details.

---

## 🙏 Credits

Built with ❤️ by the Elysium Development Team

**Protect your community. Join the Shield network today.**
