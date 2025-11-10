import { Table, ChoiceColumn, ReferenceColumn, IntegerColumn, StringColumn } from '@servicenow/sdk/core'

export const x_snc_store_upda_1_st_available_updates = Table({
    allowWebServiceAccess: true,
    index: [
        {
            name: 'index',
            unique: false,
            element: 'application',
        },
        {
            name: 'index2',
            unique: false,
            element: 'available_version',
        },
        {
            name: 'index3',
            unique: false,
            element: 'latest_major_version',
        },
        {
            name: 'index4',
            unique: false,
            element: 'latest_minor_version',
        },
        {
            name: 'index5',
            unique: false,
            element: 'latest_patch_version',
        },
    ],
    label: 'Available Updates',
    name: 'x_snc_store_upda_1_st_available_updates',
    schema: {
        batch_level: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Batch Level',
        }),
        latest_minor_version: ReferenceColumn({
            label: 'Latest Minor Version',
            referenceTable: 'sys_app_version',
        }),
        latest_major_version: ReferenceColumn({
            label: 'Latest Major Version',
            referenceTable: 'sys_app_version',
        }),
        patch_count: IntegerColumn({
            label: 'Avail. Patches',
        }),
        level: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Level',
        }),
        latest_patch_version: ReferenceColumn({
            label: 'Latest Patch Version',
            referenceTable: 'sys_app_version',
        }),
        minor_count: IntegerColumn({
            label: 'Avail. Minor',
        }),
        installed_version: StringColumn({
            label: 'Installed Version',
            maxLength: 20,
        }),
        major_count: IntegerColumn({
            label: 'Avail. Major',
        }),
        available_version: ReferenceColumn({
            label: 'Available Version',
            referenceTable: 'sys_app_version',
        }),
        name: StringColumn({
            label: 'Name',
            maxLength: 100,
        }),
        application: ReferenceColumn({
            label: 'Application',
            referenceTable: 'sys_store_app',
        }),
        latest_version_level: ChoiceColumn({
            dropdown: 'dropdown_with_none',
            label: 'Latest Version Level',
        }),
    },
    scriptableTable: true,
})
