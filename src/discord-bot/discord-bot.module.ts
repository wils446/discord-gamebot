import { Module } from '@nestjs/common';
import { DiscordModule } from '@discord-nestjs/core';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GatewayIntentBits } from 'discord.js';
import { BotGateway } from './discord-bot.gateway';
import { DiscordCommands } from './commands';
import { DiscoveryModule } from '@nestjs/core';
import { explorers } from './explorers';

@Module({
  imports: [
    DiscoveryModule,
    ConfigModule,
    DiscordModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        token: configService.getOrThrow('discord.discordBotToken'),
        discordClientOptions: {
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessages,
          ],
        },
      }),
    }),
  ],
  providers: [BotGateway, ...DiscordCommands, ...explorers],
})
export class DiscordBotModule {}
