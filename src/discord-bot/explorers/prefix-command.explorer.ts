import { Logger } from '@nestjs/common';
import { InstanceWrapper } from '@nestjs/core/injector/instance-wrapper';
import { IPrefixCommand } from '../interfaces/prefix-command.interface';
import { PREFIX_COMMAND, PrefixCommandOptions } from '../decorators';
import { DiscoveryService } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { InjectDiscordClient } from '@discord-nestjs/core';
import { Client } from 'discord.js';

export type DecoratedPrefixCommand<T> = {
  instanceWrapper: InstanceWrapper<T>;
  options: PrefixCommandOptions;
};

export class PrefixCommandExplorer {
  private readonly logger = new Logger(PrefixCommandExplorer.name);

  constructor(
    private discoveryService: DiscoveryService,
    private configService: ConfigService,
    @InjectDiscordClient() private discordClient: Client,
  ) {}

  onModuleInit() {
    const providers = this.discoveryService.getProviders();
    const prefixCommands = this.getCommandPrefix(providers);

    this.registerCommandPrefix(prefixCommands);
  }

  private getCommandPrefix(
    providers: InstanceWrapper[],
  ): DecoratedPrefixCommand<IPrefixCommand>[] {
    const prefixCommands = providers.reduce((val, i) => {
      if (!i.instance || typeof i.instance !== 'object') return val;
      const options = Reflect.getMetadata(PREFIX_COMMAND, i.instance);
      if (!options) return val;

      val.push({ instanceWrapper: i, options });
      return val;
    }, [] as DecoratedPrefixCommand<IPrefixCommand>[]);

    return prefixCommands;
  }

  private registerCommandPrefix(
    commands: DecoratedPrefixCommand<IPrefixCommand>[],
  ) {
    const prefix = this.configService.getOrThrow('discord.prefix');
    this.discordClient.prefixCommands = commands;

    this.discordClient.on('messageCreate', async (message) => {
      if (
        !message.cleanContent.startsWith(prefix) ||
        message.author.bot ||
        !message.guild
      )
        return;

      const args = message.cleanContent.slice(prefix.length).trim().split(/ +/);
      const commandName = args.shift().toLocaleLowerCase();

      const command = commands.find(
        (c) =>
          c.options.name === commandName ||
          c.options.aliases.includes(commandName),
      );

      if (!command) return;

      try {
        const reply = await command.instanceWrapper.instance.prefixHandler(
          message,
          args,
        );
        if (reply) message.reply(reply);
      } catch (err) {
        message.channel.send(
          `Something went wrong : ${(err as Error).message}`,
        );
      }
    });

    for (const command of commands) {
      this.logger.log(
        `Register ${command.options.name} prefix command handler`,
      );
    }
  }
}
