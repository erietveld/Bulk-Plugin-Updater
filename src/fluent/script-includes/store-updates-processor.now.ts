// src/fluent/script-includes/store-updates-processor.now.ts
import '@servicenow/sdk/global';
import { ScriptInclude } from '@servicenow/sdk/core';

export const storeUpdatesProcessor = ScriptInclude({
  $id: Now.ID['store-updates-processor'],
  name: 'StoreUpdatesProcessor',
  script: Now.include('../../server/script-includes/store-updates-processor.js'),
  apiName: 'x_snc_store_upda_1.StoreUpdatesProcessor',
  accessibleFrom: 'package_private',
  description: 'Enhanced processor for ServiceNow Store updates with comprehensive error handling and performance optimization',
  active: true
});