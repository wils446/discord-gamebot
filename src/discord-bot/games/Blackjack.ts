import { TextChannel, User } from 'discord.js';

class Blackjack {
  private channel: TextChannel;
  private decks: string[];
  private creator: User;
  private players: User[] = [];
  private playersCards: Record<string, string[]> = {};
  private playersScore: Record<string, number> = {};
  private playerWins: Record<string, number> = {};
  private dealerCards: string[] = [];
  private dealerScores = 0;
  private dealerWins = 0;
  private round = 0;
  private currentPlayer = 0;
  private isStarted = false;
  private timer: NodeJS.Timeout | null = null;
  private askTurnCountdown = 15;
  private askRoundCountdown = 30;
  private countdown = 0;
  private timerInterval: NodeJS.Timeout | null = null;

  constructor(user: User, channel: TextChannel) {
    this.channel = channel;
    this.creator = user;
    this.decks = this.generateDeckCards();

    this.players.push(user);
    this.playersCards[user.id] = [];
    this.playersScore[user.id] = 0;
    this.playerWins[user.id] = 0;
  }

  private generateDeckCards = (): string[] => {
    const cardsLabel = 'A 1 2 3 4 5 6 7 8 9 10 J Q K';

    return (
      cardsLabel +
      ' ' +
      cardsLabel +
      ' ' +
      cardsLabel +
      ' ' +
      cardsLabel
    ).split(' ');
  };

  public addPlayer = async (user: User) => {
    if (this.isStarted)
      return await this.channel.send(
        `<@${user.id}>, You can't join the game already started`,
      );

    this.players.push(user);
    this.playersCards[user.id] = [];
    this.playersScore[user.id] = 0;
    this.playerWins[user.id] = 0;
    await this.channel.send(`<@${user.id}> joined the game!!!`);
  };

  private dealCards = (user?: User) => {
    if (user) {
      this.playersCards[user.id] = [this.drawCard(), this.drawCard()];
      this.playersScore[user.id] = this.calculateScore(
        this.playersCards[user.id],
      );
    } else {
      this.players.forEach((player) => {
        this.playersCards[player.id] = [this.drawCard(), this.drawCard()];
        this.playersScore[player.id] = this.calculateScore(
          this.playersCards[player.id],
        );
      });

      this.dealerCards = [this.drawCard(), this.drawCard()];
      this.dealerScores = this.calculateScore(this.dealerCards);
    }
  };

  private drawCard = (): string => {
    const random = Math.floor(Math.random() * this.decks.length);

    return this.decks.splice(random, 1)[0];
  };

  private calculateScore = (cards: string[]): number => {
    let scores = 0;
    let aceNums = 0;

    cards.forEach((card) => {
      if (+card <= 10) scores += +card;
      else if (['J', 'Q', 'K'].includes(card)) scores += 10;
      else if (card === 'A') {
        scores += 11;
        aceNums += 1;
      }
    });

    while (scores > 21 && aceNums > 0) {
      scores -= 10;
      aceNums--;
    }

    return scores;
  };

  public showTable = async (show = false) => {
    const lines: string[] = [`Round : ${this.round}`];

    this.players.forEach((player) => {
      let line = `<@${player.id}> : ${this.playersCards[player.id].join(
        ',',
      )} (${this.playersScore[player.id]})`;
      if (this.isBusted(player)) line += ' **BUSTED!!!**';

      lines.push(line);
    });

    const line = show
      ? `Dealer : ${this.dealerCards.join(',')} (${this.dealerScores})`
      : `Dealer : ${this.dealerCards[0]}, [?] (?)`;

    lines.push(line);

    await this.channel.send(lines.join('\n'));
  };

  private isBusted = (user: User): boolean => {
    return this.playersScore[user.id] > 21;
  };

  private isBlackjack = (user: User): boolean => {
    return this.playersScore[user.id] === 21;
  };

  private askPlayer = async (user: User): Promise<void> => {
    this.clearTimer();
    this.countdown = this.askTurnCountdown;
    const msg = await this.channel.send(
      `<@${user.id}> Would you like to hit or stand? [${this.countdown}]`,
    );

    this.timer = setTimeout(async () => {
      await this.channel.send(
        `<@${user.id}> TIME OUT!!!, your automatically stand`,
      );
      if (this.timerInterval) clearInterval(this.timerInterval);
      await this.stand(user);
    }, this.askTurnCountdown * 1000);

    this.timerInterval = setInterval(async () => {
      this.countdown -= 1;
      await msg.edit(
        `<@${user.id}> Would you like to hit or stand? [${this.countdown}]`,
      );
    }, 1000);
  };

  private askForNextRound = async () => {
    this.countdown = this.askRoundCountdown;
    const msg = await this.channel.send(
      `<@${this.creator.id}>, play another round? (yes/no) [${this.countdown}]`,
    );

    this.timer = setTimeout(async () => {
      await this.channel.send(
        `<@${this.creator.id}> time out, game destroy!!!`,
      );
      if (this.timerInterval) clearInterval(this.timerInterval);
      this.channel.client.blackjacks.delete(this.channel.guildId);
    }, this.askRoundCountdown * 1000);

    this.timerInterval = setInterval(async () => {
      this.countdown -= 1;
      await msg.edit(
        `<@${this.creator.id}>, play another round? (yes/no) [${this.countdown}]`,
      );
    }, 1000);
  };

  public hit = async (user: User) => {
    if (!this.isPlayerTurn(user)) return;

    this.playersCards[user.id].push(this.drawCard());
    this.playersScore[user.id] = this.calculateScore(
      this.playersCards[user.id],
    );

    if (this.isBusted(user)) {
      await this.channel.send(`**<@${user.id}> HAS GONE BUST!!!**`);
      this.endTurn();
    } else if (this.isBlackjack(user)) {
      await this.channel.send(`**<@${user.id}> GOT BLACKJACK!!!**`);
      this.endTurn();
    } else {
      await this.showTable();
      await this.askPlayer(user);
    }
  };

  public stand = async (user: User) => {
    if (this.isPlayerTurn(user)) await this.endTurn();
  };

  public startRound = async () => {
    this.round += 1;
    this.currentPlayer = 0;
    this.decks = this.generateDeckCards();
    this.dealCards();

    await this.showTable();
    await this.askPlayer(this.players[this.currentPlayer]);
  };

  private endTurn = async () => {
    this.currentPlayer += 1;

    if (this.currentPlayer >= this.players.length) {
      this.endRound();
    } else {
      await this.showTable();
      await this.askPlayer(this.players[this.currentPlayer]);
    }
  };

  private endRound = async () => {
    await this.dealerTurn();
    await this.showTable(true);

    if (this.dealerScores > 21) {
      const winners = this.players.map((player) => `<@${player.id}>`);

      await this.channel.send(
        `DEALER HAS GONE BUST! ${winners.join(' , ')} WIN!!!`,
      );
    } else {
      const winners = this.players.filter(
        (player) =>
          this.playersScore[player.id] > this.dealerScores &&
          !this.isBusted(player),
      );

      if (winners.length > 0) {
        winners.forEach((player) => (this.playerWins[player.id] += 1));

        await this.channel.send(
          `${winners.map((player) => `<@${player.id}>`).join(' , ')} WIN!!!`,
        );
      } else {
        const ties = this.players.filter(
          (player) => this.playersScore[player.id] === this.dealerScores,
        );

        if (ties.length > 0) {
          await this.channel.send(
            `${ties
              .map((player) => `<@${player.id}>`)
              .join(' , ')} TIE with dealer!`,
          );
        } else {
          this.dealerWins += 1;
          await this.channel.send('Dealer WIN!!!');
        }
      }
    }

    await this.askForNextRound();
  };

  public startGame = async () => {
    this.isStarted = true;
    await this.startRound();
  };

  private dealerTurn = async () => {
    while (this.shouldDealerHit()) {
      this.dealerCards.push(this.drawCard());
      this.dealerScores = this.calculateScore(this.dealerCards);
    }
  };

  private shouldDealerHit = () => {
    if (this.dealerScores < 17) return true;
    else if (this.dealerScores === 17) {
      if (this.dealerCards.includes('A')) return true;
    }

    return false;
  };

  public isPlayerTurn = (user: User): boolean => {
    return user.id === this.players[this.currentPlayer].id;
  };

  public isUserCreator = (user: User): boolean => this.creator.id === user.id;

  public isUserInGame = (user: User): boolean =>
    this.players.map((player) => player.id).includes(user.id);

  public isGameStart = (): boolean => this.isStarted;

  public getPlayers = (): Array<User> => this.players;

  public getChannel = (): TextChannel => this.channel;

  public clearTimer = () => {
    if (this.timer) clearTimeout(this.timer);
    if (this.timerInterval) clearInterval(this.timerInterval);
  };
}

export default Blackjack;
