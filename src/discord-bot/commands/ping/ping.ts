import { Injectable } from '@nestjs/common';
import { IPrefixCommand } from 'src/discord-bot/interfaces/prefix-command.interface';
import { Message } from 'discord.js';
import { PrefixCommand } from 'src/discord-bot/decorators';

@PrefixCommand({
  name: 'ping',
  aliases: ['p'],
})
@Injectable()
export class PingCommand implements IPrefixCommand {
  async prefixHandler(
    message: Message<boolean>,
    args: string[],
  ): Promise<string | void> {
    return 'ping🏓';
  }
}
