// src/fluent/ui-pages/store-updates-dashboard.now.ts
// Architecture.md Section 4.5: Pattern 2A Implementation  
// FIXED: Use import instead of Now.include() to prevent MIME type error
// Following ServiceNow-Optimized Data Architecture (Hybrid Pattern)

import '@servicenow/sdk/global';
import { UiPage } from '@servicenow/sdk/core';
import dashboardPage from '../../client/index.html';

export const store_updates_dashboard = UiPage({
  $id: Now.ID['store-updates-dashboard'],
  endpoint: 'x_snc_store_upda_1_plugin_updater.do',
  direct: true,
  html: dashboardPage
});