import TouchPortalClient from './client';

const TouchPortalAPI: { Client: typeof TouchPortalClient } = {
  Client: TouchPortalClient
};

export * from './types';
export default TouchPortalAPI;
