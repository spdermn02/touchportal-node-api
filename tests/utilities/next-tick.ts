export const nextTick = (): Promise<void> => new Promise((resolve) => process.nextTick(resolve));
