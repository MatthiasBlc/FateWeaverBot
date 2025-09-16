export const command = {
  name: "help",
  description: "List all available commands",
  async execute(client, message) {
    const names = client.commands ? Array.from(client.commands.keys()) : [];
    const content = names.length
      ? `Available commands: ${names.map((n) => `\`${n}\``).join(", ")}`
      : "No commands registered.";
    await message.reply(content);
  },
};

export default command;
