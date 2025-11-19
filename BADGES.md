# 🎨 Elysium Shield Badges

Show your users that your bot is protected by Elysium Shield! Use these official badges in your README, website, or bot info.

## Available Badges

### 🌈 Default (Gradient)
Best for most use cases - works on any background.

![Powered by Elysium Shield](https://elysium-online.xyz/images/badges/powered-by-shield.svg)

**Markdown:**
```markdown
[![Powered by Elysium Shield](https://elysium-online.xyz/images/badges/powered-by-shield.svg)](https://elysium-online.xyz/shield)
```

**HTML:**
```html
<a href="https://elysium-online.xyz/shield">
  <img src="https://elysium-online.xyz/images/badges/powered-by-shield.svg" alt="Powered by Elysium Shield">
</a>
```

---

### 🌙 Dark Theme
For light backgrounds (white, light gray, etc.)

![Powered by Elysium Shield - Dark](https://elysium-online.xyz/images/badges/powered-by-shield-dark.svg)

**Markdown:**
```markdown
[![Powered by Elysium Shield](https://elysium-online.xyz/images/badges/powered-by-shield-dark.svg)](https://elysium-online.xyz/shield)
```

---

### ☀️ Light Theme
For dark backgrounds (black, dark gray, etc.)

![Powered by Elysium Shield - Light](https://elysium-online.xyz/images/badges/powered-by-shield-light.svg)

**Markdown:**
```markdown
[![Powered by Elysium Shield](https://elysium-online.xyz/images/badges/powered-by-shield-light.svg)](https://elysium-online.xyz/shield)
```

---

## Usage Examples

### GitHub README

```markdown
# My Discord Bot

A powerful moderation bot with cross-server threat detection.

[![Powered by Elysium Shield](https://elysium-online.xyz/images/badges/powered-by-shield.svg)](https://elysium-online.xyz/shield)

## Features
- Advanced moderation
- Cross-server ban sharing
- Real-time threat detection
```

### Bot Website

```html
<!DOCTYPE html>
<html>
<head>
  <title>My Bot</title>
</head>
<body>
  <h1>Protected by Elysium Shield</h1>
  <a href="https://elysium-online.xyz/shield">
    <img src="https://elysium-online.xyz/images/badges/powered-by-shield.svg" 
         alt="Powered by Elysium Shield"
         width="200">
  </a>
</body>
</html>
```

### Discord Bot Info Command

```javascript
const { EmbedBuilder } = require('discord.js');

client.on('interactionCreate', async (interaction) => {
  if (interaction.commandName === 'botinfo') {
    const embed = new EmbedBuilder()
      .setTitle('🤖 Bot Information')
      .setDescription('A secure Discord bot with cross-server moderation')
      .addFields(
        { name: 'Servers', value: client.guilds.cache.size.toString(), inline: true },
        { name: 'Users', value: client.users.cache.size.toString(), inline: true }
      )
      .setFooter({ 
        text: '🛡️ Protected by Elysium Shield',
        iconURL: 'https://elysium-online.xyz/images/shield-icon.png'
      })
      .setColor('#667eea')
      .setTimestamp();
    
    await interaction.reply({ embeds: [embed] });
  }
});
```

### Discord Server Welcome Message

```javascript
client.on('guildMemberAdd', async (member) => {
  const welcomeChannel = member.guild.channels.cache.find(ch => ch.name === 'welcome');
  
  if (welcomeChannel) {
    const embed = new EmbedBuilder()
      .setTitle(`Welcome ${member.user.username}!`)
      .setDescription('This server is protected by Elysium Shield for your safety.')
      .setThumbnail(member.user.displayAvatarURL())
      .setFooter({ text: '🛡️ Protected by Elysium Shield' })
      .setColor('#667eea');
    
    await welcomeChannel.send({ embeds: [embed] });
  }
});
```

### Top.gg Bot Page

```markdown
## Security

This bot uses [Elysium Shield](https://elysium-online.xyz/shield) for advanced threat detection and cross-server moderation intelligence.

[![Powered by Elysium Shield](https://elysium-online.xyz/images/badges/powered-by-shield.svg)](https://elysium-online.xyz/shield)

**Features:**
- Real-time user verification
- Cross-server ban sharing
- AI-powered risk assessment
- Automatic threat detection
```

---

## Badge Guidelines

### ✅ When to Use

- You integrate Shield API into your Discord bot
- Your server uses Elysium for protection
- You're building tools that interact with Shield
- You want to show you prioritize security

### ❌ When NOT to Use

- You don't actually use Shield API
- You're a competitor service
- Your integration is not yet live

---

## Customization

### Sizing

**Small (for sidebars):**
```html
<img src="https://elysium-online.xyz/images/badges/powered-by-shield.svg" width="150">
```

**Medium (default):**
```html
<img src="https://elysium-online.xyz/images/badges/powered-by-shield.svg" width="200">
```

**Large (for headers):**
```html
<img src="https://elysium-online.xyz/images/badges/powered-by-shield.svg" width="250">
```

---

## Direct Links

- **Default:** `https://elysium-online.xyz/images/badges/powered-by-shield.svg`
- **Dark:** `https://elysium-online.xyz/images/badges/powered-by-shield-dark.svg`
- **Light:** `https://elysium-online.xyz/images/badges/powered-by-shield-light.svg`

All badges are SVG format for perfect scaling at any size.

---

## Questions?

- **Documentation:** [https://elysium-online.xyz/docs/shield](https://elysium-online.xyz/docs/shield)
- **Get API Key:** [https://elysium-online.xyz/profile](https://elysium-online.xyz/profile)
- **Support:** [Join our Discord](https://discord.gg/elysium)

---

**Thank you for using Elysium Shield! 🛡️**
