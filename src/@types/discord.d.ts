import { DecoratedPrefixCommand } from 'src/discord-bot/explorers/prefix-command.explorer';
import Blackjack from 'src/discord-bot/games/Blackjack';
import { IPrefixCommand } from 'src/discord-bot/interfaces/prefix-command.interface';

declare module 'discord.js' {
  interface Client {
    prefixCommands: DecoratedPrefixCommand<IPrefixCommand>[];
    blackjacks: Map<string, Blackjack>;
  }
}
