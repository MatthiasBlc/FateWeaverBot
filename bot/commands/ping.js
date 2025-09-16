export const command = {
  name: "ping",
  description: "Replies with Pong 🏓",
  async execute(client, message, args) {
    await message.reply("Pong 🏓 !");
  },
};

export default command;
