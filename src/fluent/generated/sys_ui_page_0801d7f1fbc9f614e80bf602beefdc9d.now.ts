import { UiPage } from '@servicenow/sdk/core'

UiPage({
    $id: Now.ID['0801d7f1fbc9f614e80bf602beefdc9d'],
    category: 'general',
    endpoint: 'x_snc_store_upda_1_install_updates.do',
    html: `<?xml version="1.0" encoding="utf-8" ?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">
    <g:evaluate var="jvar_reload_now" jelly="true">
        var progressWorker = new GlideRecord('sys_progress_worker');
        progressWorker.addQuery('sys_id', '=', jelly.sysparm_pworker_sysid);
        progressWorker.query();

        var reloadNow = false;

        if(progressWorker.getRowCount() == 0)
        {
            reloadNow = true;
        } else {
            progressWorker.next();
            if(progressWorker.getValue('state') == 'starting')
            {
                reloadNow = true;
            }
        }
        reloadNow;
    </g:evaluate>
    <g:evaluate>
        var remaining_msg = '';
        var remaining_apps = {};
        var remaining_app_count = 0;
        var hasApps = false;
        var apps = new GlideAggregate('sys_app_version'); // 
        apps.addQuery('sys_id', 'IN', '\${sysparm_app_versions}');
        apps.addAggregate('COUNT');
        apps.query();
        if(apps.next())
        {
            remaining_app_count = parseInt(apps.getAggregate('COUNT'));
        }
        if(remaining_app_count)
        {
            remaining_msg = gs.getMessage('Installation of {0} apps has been scheduled, {1} remaining to install.', [ \${sysparm_app_count}, remaining_app_count.toFixed(0) ]);
        }
        var completed_msg = gs.getMessage('{0} apps have been installed.', [ \${sysparm_app_count} ]);
    </g:evaluate>
    <g:ui_form>
        <input type="hidden" name="reloadNow" id="reloadNow" value="\${jvar_reload_now}" />
    </g:ui_form>
    <h3>
        <j:if test='\${remaining_app_count > 0}'>
            \${remaining_msg}
        </j:if>

        <j:if test='\${remaining_app_count == 0}'>
            \${completed_msg}
        </j:if>
    </h3>
    <j:if test='\${sysparm_message}'>
        \${sysparm_message}<br /><br />
    </j:if>
    <g:ui_form>
        <table cellpadding="0" cellspacing="0" width="500px">
            <g:ui_progress_worker worker_id="\${sysparm_pworker_sysid}" show_cancel="false" rows="grow"/>
        </table>
    </g:ui_form>
</j:jelly>`,
    clientScript: `if(gel('reloadNow').value == 'true') {
    location.reload();
}`,
    processingScript: `var gr = new GlideRecord('sys_progress_worker');
gr.addQuery('sys_id', '=', sysparm_pworker_sysid);
gr.query();

gr.next();

gs.addInfoMessage(gr.getValue('state'));
if (gr.getValue('state') == 'starting' || gr.getValue('state') == 'running') {

    var wait = 3;
    if(gr.getValue('state') == 'running')
    {
        wait = 15;
    }
    var pm = new GlideProgressMonitor(sysparm_pworker_sysid);
    pm.waitForCompletionOrTimeout(wait);
    var redirect = "x_snc_app_updater_installing_updates.do?sysparm_pworker_sysid=" + sysparm_pworker_sysid;
    response.sendRedirect(redirect);
}`,
})
