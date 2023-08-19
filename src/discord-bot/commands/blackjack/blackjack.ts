import { Injectable } from '@nestjs/common';
import { Message, TextChannel } from 'discord.js';
import { PrefixCommand } from 'src/discord-bot/decorators';
import { IPrefixCommand } from 'src/discord-bot/interfaces/prefix-command.interface';
import {
  commandInstruction,
  commands,
  gameCreated,
  gameStart,
  playerTurn,
} from './commandRequirements';
import { Blackjack } from 'src/discord-bot/games';
import { ConfigService } from '@nestjs/config';

@PrefixCommand({
  name: 'blackjack',
  aliases: ['b'],
})
@Injectable()
export class BlackjackCommand implements IPrefixCommand {
  constructor(private configService: ConfigService) {}

  async prefixHandler(
    message: Message<boolean>,
    args: string[],
  ): Promise<string | void> {
    const prefix = this.configService.getOrThrow('discord.prefix');
    let subCommandName = args.shift();

    if (!subCommandName || !commands.includes(subCommandName))
      subCommandName = 'help';

    const isGameCreated = message.client.blackjacks.has(message.guildId!);

    if (gameCreated.includes(subCommandName) && !isGameCreated) {
      await message.author.send('game has not created!');
      return;
    }

    const blackjack = message.client.blackjacks.get(
      message.guildId!,
    ) as Blackjack;

    // return if user not in game and message is not on game channel text
    if (
      gameStart.includes(subCommandName) &&
      (!blackjack?.isUserInGame(message.author) ||
        message.channelId !== blackjack.getChannel().id)
    )
      return;

    // return if user use gameStart command and game has not started
    if (gameStart.includes(subCommandName) && !blackjack?.isGameStart()) {
      await message.author.send('game has not started');
      return;
    }

    // return if user use playerTurn command and its not message author turn
    if (
      playerTurn.includes(subCommandName) &&
      !blackjack.isPlayerTurn(message.author)
    ) {
      message.author.send("It's not your turn to play");
      return;
    }

    switch (subCommandName) {
      case 'help': {
        const lines = [];

        for (const key in commandInstruction) {
          lines.push(
            `${prefix}b \`${key}\` - ${
              commandInstruction[key as keyof typeof commandInstruction]
            }`,
          );
        }

        await message.reply(lines.join('\n'));
        break;
      }
      case 'create': {
        if (isGameCreated) {
          let messageText = 'Game already created';

          if (message.channelId !== blackjack.getChannel().id)
            messageText += `, check on ${message.guild?.channels.cache
              .get(blackjack.getChannel().id)
              ?.toString()}`;

          await message.reply(messageText);
          return;
        }

        const newBlackjack = new Blackjack(
          message.author,
          message.channel as TextChannel,
        );
        message.client.blackjacks.set(message.guildId!, newBlackjack);
        await message.channel.send(
          `<@${message.author.id}> create a blackjack game!!!`,
        );
        break;
      }
      case 'join': {
        if (blackjack.isUserInGame(message.author)) {
          await message.reply('you already in game');
          return;
        }
        blackjack.addPlayer(message.author);
        break;
      }
      case 'lobby': {
        const lines = ['Lobby : '];
        blackjack
          .getPlayers()
          .forEach((player, index) =>
            lines.push(`${index + 1}. ${player.username}`),
          );

        await message.channel.send(lines.join('\n'));
        break;
      }
      case 'start': {
        if (blackjack.isUserCreator(message.author)) {
          await blackjack.startGame();
        }
        break;
      }
      case 'hit': {
        await blackjack.clearTimer();
        await blackjack.hit(message.author);
        break;
      }
      case 'stand': {
        await blackjack.clearTimer();
        blackjack.stand(message.author);
        break;
      }
      case 'show': {
        await blackjack.showTable();
        break;
      }
      case 'yes': {
        await blackjack.clearTimer();
        await blackjack.startRound();
        break;
      }
      case 'no': {
        await blackjack.clearTimer();
        message.client.blackjacks.delete(message.guildId!);
        await message.channel.send('Game destroy!');
        break;
      }
      default:
        break;
    }
  }
}
