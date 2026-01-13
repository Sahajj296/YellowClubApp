import { DEMO_AUTH } from '../config/env';

let enabled = false;

export const initAnalytics = () => {
  if (DEMO_AUTH) {
    enabled = false;
    return;
  }
  enabled = true;
};

export const trackEvent = (name: string, params?: Record<string, any>) => {
  if (DEMO_AUTH || !enabled) return;
  if (__DEV__) {
    console.log('[analytics]', name, params ?? {});
  }
};
