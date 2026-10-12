import type { ToolId } from '../core/model';
import { progress } from '../core/progress';
import { toolsOwned } from '../core/tools';
import { allChapters } from '../content';

/** The tools the player has now: the rewards of the mysteries solved (read from the save). */
export const ownedTools = (): ToolId[] => toolsOwned(allChapters(), (id) => progress.isMysterySolved(id));
