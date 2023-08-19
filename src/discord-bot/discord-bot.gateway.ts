import { Injectable, Logger } from '@nestjs/common';
import { Once, InjectDiscordClient } from '@discord-nestjs/core';
import { Client } from 'discord.js';
import Blackjack from './games/Blackjack';

@Injectable()
export class BotGateway {
  private readonly logger = new Logger(BotGateway.name);

  constructor(@InjectDiscordClient() private readonly client: Client) {}

  @Once('ready')
  onReady() {
    this.client.blackjacks = new Map<string, Blackjack>();
    this.logger.log(`Bot ${this.client.user.tag} was started!`);
  }
}
