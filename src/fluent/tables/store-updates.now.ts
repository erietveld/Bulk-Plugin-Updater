import '@servicenow/sdk/global'
import { Table, StringColumn, IntegerColumn, ReferenceColumn, ChoiceColumn } from '@servicenow/sdk/core'

// Store Updates Remote Table
// Purpose: Track available ServiceNow Store updates with version information and batch processing levels
export const x_snc_store_upda_1_store_updates = Table({
    name: 'x_snc_store_upda_1_store_updates',
    label: 'Store Updates',
    schema: {
        // Application reference to Store Application
        application: ReferenceColumn({
            label: 'Application',
            referenceTable: 'sys_store_app',
            mandatory: true,
        }),

        // Available update counts
        major_count: IntegerColumn({
            label: 'Avail. Major',
            default: '0',
        }),

        minor_count: IntegerColumn({
            label: 'Avail. Minor',
            default: '0',
        }),

        patch_count: IntegerColumn({
            label: 'Avail. Patches',
            default: '0',
        }),

        // Available version reference
        available_version: ReferenceColumn({
            label: 'Available Version',
            referenceTable: 'sys_app_version',
        }),

        // Batch processing level
        batch_level: ChoiceColumn({
            label: 'Batch Level',
            choices: {
                low: { label: 'Low', sequence: 0 },
                medium: { label: 'Medium', sequence: 1 },
                high: { label: 'High', sequence: 2 },
                critical: { label: 'Critical', sequence: 3 },
            },
            dropdown: 'dropdown_with_none',
        }),

        // Installed version (string format)
        installed_version: StringColumn({
            label: 'Installed Version',
            maxLength: 100,
        }),

        // Latest version references
        latest_major_version: ReferenceColumn({
            label: 'Latest Major Version',
            referenceTable: 'sys_app_version',
        }),

        latest_minor_version: ReferenceColumn({
            label: 'Latest Minor Version',
            referenceTable: 'sys_app_version',
        }),

        latest_patch_version: ReferenceColumn({
            label: 'Latest Patch Version',
            referenceTable: 'sys_app_version',
        }),

        // Version level choices
        latest_version_level: ChoiceColumn({
            label: 'Latest Version Level',
            choices: {
                major: { label: 'Major', sequence: 0 },
                minor: { label: 'Minor', sequence: 1 },
                patch: { label: 'Patch', sequence: 2 },
            },
            dropdown: 'dropdown_with_none',
        }),

        level: ChoiceColumn({
            label: 'Level',
            choices: {
                development: { label: 'Development', sequence: 0 },
                testing: { label: 'Testing', sequence: 1 },
                staging: { label: 'Staging', sequence: 2 },
                production: { label: 'Production', sequence: 3 },
            },
            dropdown: 'dropdown_with_none',
        }),

        // Application name (for display and search)
        name: StringColumn({
            label: 'Name',
            maxLength: 200,
            mandatory: true,
        }),
    },

    // Table configuration
    display: 'name',
    extensible: false,
    allowWebServiceAccess: true,
    actions: ['read', 'update', 'delete', 'create'],
    audit: true,
    textIndex: true,

    // Make this a scriptable/remote table for ServiceNow Store integration
    scriptableTable: true,
})
