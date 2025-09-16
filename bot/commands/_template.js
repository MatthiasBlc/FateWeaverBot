// Template command module. Copy this file and rename it to your command name.
// Usage: with prefix '!' you can trigger it by typing !<name>
export const command = {
  name: "template", // change this to your command name
  description: "Describe what this command does",
  async execute(client, message, args) {
    // Your logic here
    await message.reply(`Template executed with args: ${args.join(" ")}`);
  },
};

export default command;
