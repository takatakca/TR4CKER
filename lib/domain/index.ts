// TR4CKER hooks: Food Hub direct delivery orders create their delivery; cron drops old positions and links.
import type { AppHooks } from '../hooks';
import { fromFoodHub, sweep } from './deliveries';

export const hooks: AppHooks = {
  async onSuiteEvent(e) {
    if (e.type === 'order.created') await fromFoodHub(e.data?.order);
  },
  async tick() { return sweep(); },
};
