import { CrossScopePrivilege } from '@servicenow/sdk/core'

CrossScopePrivilege({
    $id: Now.ID['3d07bf31fb053a14e80bf602beefdc53'],
    operation: 'read',
    status: 'allowed',
    targetName: 'sys_progress_worker',
    targetScope: 'global',
    targetType: 'sys_db_object',
})
