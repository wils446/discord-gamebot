import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DiscordBotModule } from './discord-bot/discord-bot.module';
import { ConfigModule } from '@nestjs/config';
import { discordConfig } from './config';

@Module({
  imports: [ConfigModule.forRoot({ load: [discordConfig] }), DiscordBotModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
