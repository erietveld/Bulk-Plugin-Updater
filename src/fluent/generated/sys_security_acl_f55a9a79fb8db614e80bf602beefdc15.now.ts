import { Acl } from '@servicenow/sdk/core'

Acl({
    $id: Now.ID['f55a9a79fb8db614e80bf602beefdc15'],
    description: 'Default access control on x_snc_store_upda_1_st_available_updates',
    localOrExisting: 'Existing',
    type: 'record',
    operation: 'write',
    roles: ['x_snc_store_upda_1.available_updates_user'],
    table: 'x_snc_store_upda_1_st_available_updates',
})
