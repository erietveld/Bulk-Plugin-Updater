import '@servicenow/sdk/global'
import { RestApi } from '@servicenow/sdk/core'

// Scripted REST API wrapper for calling the global.plugin_updater subflow
// Provides clean REST interface between React frontend and ServiceNow subflow
// Endpoint: POST /api/x_snc_store_upda_1/install_updates
RestApi({
  $id: Now.ID['install_updates_api'],
  name: 'Install Updates API',
  service_id: 'install_updates',
  active: true,
  short_description: 'API for triggering application update installations via subflow',
  consumes: 'application/json',
  produces: 'application/json',
  routes: [{
    $id: Now.ID['install_updates_route'],
    name: 'Install Updates',
    method: 'POST',
    path: '/',
    script: `
(function process(request, response) {
    
    try {
        // Parse request body
        var requestBody = request.body;
        var data = requestBody.data || requestBody;
        
        // Validate input
        if (!data.apps) {
            response.setStatus(400);
            response.setBody({
                success: false,
                error: 'Missing required parameter: apps',
                message: 'Please provide comma-separated app sys_ids'
            });
            return;
        }
        
        var appVersions = data.apps.toString();
        
        // Validate apps parameter is not empty
        if (!appVersions || appVersions.trim() === '') {
            response.setStatus(400);
            response.setBody({
                success: false,
                error: 'Empty apps parameter',
                message: 'Apps parameter cannot be empty'
            });
            return;
        }
        
        // Count apps for tracking
        var appCount = appVersions.split(',').length;
        
        // Log the request for debugging
        gs.info('Install Updates API called with apps: ' + appVersions + ', count: ' + appCount);
        
        // Call the existing subflow using the same pattern as the UI page
        var inputs = {};
        inputs['apps'] = appVersions; // String - comma-separated sys_ids
        
        // Execute the subflow in foreground with inputs
        var result = sn_fd.FlowAPI.getRunner()
        //    .subflow('global.plugin_updater')
            .subflow('x_snc_store_upda_1.process_plugin_updates')
            .inForeground()
            .withInputs(inputs)
            .run();
            
        // Get outputs from subflow execution
        var outputs = result.getOutputs();
        var progressId = outputs['progress_id'];
        var statusMessage = outputs['status_message'];
        
        // Log success for debugging
        gs.info('Subflow executed successfully. Progress ID: ' + progressId + ', Status: ' + statusMessage);
        
        // Return success response with progress tracking info
        response.setStatus(200);
        response.setBody({
            success: true,
            progress_id: progressId,
            status_message: statusMessage || 'Installation process started',
            app_count: appCount,
            apps_requested: appVersions,
            timestamp: new GlideDateTime().toString()
        });
        
    } catch (ex) {
        // Handle any errors during subflow execution
        var errorMessage = ex.getMessage ? ex.getMessage() : ex.toString();
        
        // Log error for debugging
        gs.error('Install Updates API error: ' + errorMessage, ex);
        
        // Return error response
        response.setStatus(500);
        response.setBody({
            success: false,
            error: 'Subflow execution failed',
            message: errorMessage,
            timestamp: new GlideDateTime().toString()
        });
    }
    
})(request, response);
    `,
    authorization: true,
    authentication: true,
    active: true,
    short_description: 'Execute application updates via global.plugin_updater subflow'
  }],
  enforce_acl: []
})