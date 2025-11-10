import { UiAction } from '@servicenow/sdk/core'

UiAction({
    $id: Now.ID['a003bf71fbc13a14e80bf602beefdc4f'],
    table: 'x_snc_store_upda_1_st_available_updates',
    name: 'Install Updates',
    list: {
        showListChoice: true,
        showBannerButton: true,
    },
    client: {
        isClient: true,
        isUi11Compatible: true,
        onClick: 'openModalWithSelectedRecords()',
    },
    workspace: {
        clientScriptV2: `function onClick(g_form) {

}`,
    },
    messages: [],
    script: `function openModalWithSelectedRecords() {
    var selectedRecords = g_list.getChecked();
    if (selectedRecords.length == 0) {
        gs.addErrorMessage('Please select at least one record.');
        return;
    }
    var sysIds = selectedRecords;
    var dialogClass = GlideModal ? GlideModal : GlideDialogWindow;
    var dialog = new dialogClass('x_snc_store_upda_1_updates_to_install');
    dialog.setTitle('Selected Apps');
    dialog.setSize(600, 400);
    dialog.setPreference('sysparm_app_versions', sysIds);
    dialog.render();
}`,
    showUpdate: true,
    showInsert: false,
    isolateScript: true,
    condition: 'gs.hasRole("admin")',
})
