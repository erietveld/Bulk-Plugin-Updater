import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['b55a5a79fb8db614e80bf602beefdc57'],
    description: 'Default access control on x_snc_store_upda_1_st_available_updates',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'create',
    roles: ['x_snc_store_upda_1.available_updates_user'],
    table: 'x_snc_store_upda_1_st_available_updates',
})
