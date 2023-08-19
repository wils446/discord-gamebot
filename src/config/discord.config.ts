import { registerAs } from '@nestjs/config';

export const discordConfig = registerAs('discord', () => ({
  discordBotToken: process.env.DISCORD_BOT_TOKEN,
  prefix: process.env.DISCORD_BOT_PREFIX,
}));
