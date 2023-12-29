import { DependencyContainer, Lifecycle } from 'tsyringe';

import { IPostDBLoadMod } from "@spt-aki/models/external/IPostDBLoadMod";
import { DialogueController } from "@spt-aki/controllers/DialogueController";
import { LoadoutTerminalChatBot } from './LoadoutTerminalChatBot';
import { CommandHandler } from './CommandHandler';

class Mod implements IPostDBLoadMod {
	public postDBLoad(container: DependencyContainer): void {
        // We register and re-resolve the dependency so the container takes care of filling in the command dependencies
        container.register<CommandHandler>("CommandHandler", CommandHandler);
        container.register<LoadoutTerminalChatBot>("LoadoutTerminalChatBot", LoadoutTerminalChatBot);
        container.resolve<DialogueController>("DialogueController").registerChatBot(container.resolve<LoadoutTerminalChatBot>("LoadoutTerminalChatBot"));
	}
}

module.exports = {
	mod: new Mod()
}
