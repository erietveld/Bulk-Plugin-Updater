import '@servicenow/sdk/global'
import { ApplicationMenu, Record } from '@servicenow/sdk/core'

// Create the main application menu
export const batchPluginUpdaterMenu = ApplicationMenu({
    $id: Now.ID['batch_plugin_updater_menu'],
    title: 'Batch Plugin Updater',
    hint: 'Manage and deploy ServiceNow plugin updates in batch operations',
    description: 'A comprehensive application for managing store plugin updates with an intuitive dashboard interface',
    active: true,
    order: 100,
})

// Create the main dashboard module
export const dashboardModule = Record({
    $id: Now.ID['batch_plugin_updater_dashboard'],
    table: 'sys_app_module',
    data: {
        title: 'Store Updates Dashboard',
        application: batchPluginUpdaterMenu.$id,
        link_type: 'DIRECT',
        query: 'x_snc_store_upda_1_plugin_updater.do',
        hint: 'Interactive dashboard for managing plugin updates',
        description: 'Main dashboard interface for viewing and managing store plugin updates',
        active: true,
        order: 100,
    },
})

// Create a separator for configuration items
export const configSeparator = Record({
    $id: Now.ID['batch_plugin_config_separator'],
    table: 'sys_app_module',
    data: {
        title: 'Configuration',
        application: batchPluginUpdaterMenu.$id,
        link_type: 'SEPARATOR',
        active: true,
        order: 200,
    },
})

// Create a module to view the store updates table
export const storeUpdatesTable = Record({
    $id: Now.ID['batch_plugin_store_updates_table'],
    table: 'sys_app_module',
    data: {
        title: 'Store Updates Records',
        application: batchPluginUpdaterMenu.$id,
        link_type: 'LIST',
        name: 'x_snc_store_upda_1_store_updates',
        hint: 'View and manage store update records',
        description: 'List view of all store update records in the system',
        active: true,
        order: 300,
    },
})