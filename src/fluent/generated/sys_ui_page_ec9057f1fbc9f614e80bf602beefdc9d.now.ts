import { UiPage } from '@servicenow/sdk/core'

UiPage({
    $id: Now.ID['ec9057f1fbc9f614e80bf602beefdc9d'],
    category: 'general',
    endpoint: 'x_snc_store_upda_1_updates_to_install.do',
    html: `<?xml version="1.0" encoding="utf-8"?>
<j:jelly trim="false" xmlns:j="jelly:core" xmlns:g="glide" xmlns:j2="null" xmlns:g2="null">
  <g:evaluate>var apps = new GlideAggregate("x_snc_store_upda_1_st_available_updates");
        apps.addQuery('available_version', 'IN', '\${sysparm_app_versions}');
        apps.groupBy('name');
        apps.groupBy('level');
        apps.orderBy('level');
        apps.orderBy('name');
        apps.setGroup(true);
        apps.query();</g:evaluate>
  <h3>\${gs.getMessage('The following applications will be upgraded:')}</h3>
  <ul>
    <j:while test="\${apps.next()}">
      <li>\${apps.getValue('name')} - \${apps.getValue('level')}</li>
    </j:while>
  </ul>
  <g:ui_form>
    <input type="hidden" name="app_versions" value="\${sysparm_app_versions}"></input>
    <input type="hidden" name="app_count" value="\${apps.getRowCount()}"></input>
    <div class="form-group pull-right" style="padding-right: 20px;">
      <g:dialog_buttons_ok_cancel ok="return actionOK()" cancel="return onCancel()" ok_text="\${gs.getMessage('Install Updates')}" ok_id="ok_button" cancel_type="button"></g:dialog_buttons_ok_cancel>
    </div>
  </g:ui_form>
</j:jelly>`,
    processingScript: `UpBegin();
function UpBegin() {
        var progress_id = '-1';
        var status_message = '';

        try {
            var inputs = {};
            inputs['apps'] = app_versions; // String 
            var result = sn_fd.FlowAPI.getRunner().subflow('global.plugin_updater').inForeground().withInputs(inputs).run();
            var outputs = result.getOutputs();
            progress_id = outputs['progress_id'];
            status_message = outputs['status_message'];

        } catch (ex) {
            var message = ex.getMessage();
            status_message = message;
            gs.addErrorMessage(progress_id + ' - ' + message);
        }
    //var session = gs.getSession();
    //var URL = session.getUrlOnStack();
    var URL = 'x_snc_store_upda_1_install_updates.do?';
    URL += "&sysparm_pworker_sysid=" + progress_id + "&sysparm_message=" + status_message;
    URL += "&sysparm_app_count=" + app_count;
    URL += "&sysparm_app_versions=" + app_versions;
    response.sendRedirect(URL);
}`,
})
