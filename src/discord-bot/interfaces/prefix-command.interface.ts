import { Message, MessagePayload, MessageReplyOptions } from 'discord.js';

export interface IPrefixCommand {
  prefixHandler(
    message: Message,
    args: string[],
  ): Promise<void | MessagePayload | MessageReplyOptions | string>;
}
