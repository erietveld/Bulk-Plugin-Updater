import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['965049f8fb49f6d0e80bf602beefdca3'],
    table: 'sys_script_vtable',
    data: {
        active: 'true',
        advanced: 'false',
        cache_empty_query_results: 'true',
        cache_isolation_level: 'USER',
        cache_strategy: 'CACHE_BY_QUERY',
        cache_ttl: '0',
        delete_script: `(function executeDelete(v_record) {
     // Parameters:
     //      v_record - a map of field names and values containing (among others) the
     //              sys_id of the record that needs to be deleted on the remote system
     //          v_record.<field_name>                  - fields in the remote table GlideRecord
     //          v_record.setLastErrorMessage(message)   - signal an error
 
     // Sample code:
     //  try {
     //      update-external-system;
     //      if (there-was-an-error) {
     //          var message = ...;
     //          v_record.setLastErrorMessage(message);
     //      }
     //  } catch (ex) {
     //      var message = ex.getMessage();
     //      v_record.setLastErrorMessage(message);
     //  }
  })(v_record);`,
        editable: 'false',
        enhanced_capacity: 'false',
        insert_script: `(function executeInsert(v_record) {
     // Parameters:
     //      v_record is a map of field names and values containing the sys_id of the
     //              record and the fields that need to be inserted in the record on the
     //              remote system (source of data)
     
     //          v_record.<field_name>                   - fields in the remote table GlideRecord
     //          v_record.setLastErrorMessage(message)   - signal an error
 
     // Sample code:
     //  try {
     //      update-external-system;
     //      if (there-was-an-error) {
     //          var message = ...;
     //          v_record.setLastErrorMessage(message);
     //      }
     //  } catch (ex) {
     //      var message = ex.getMessage();
     //      v_record.setLastErrorMessage(message);
     //  }
  })(v_record);`,
        name: 'Store Updates',
        script: `// DEBUG VERSION - sys_script_vtable script
(function executeQuery(v_table, v_query) {
    try {
        gs.info('Store_updates: Virtual table script started');
        
        // Test 1: Check if Script Include exists
        try {
            var testProcessor = new x_snc_store_upda_1.StoreUpdatesProcessor();
            gs.info('Store_updates: Script Include found and instantiated');
        } catch (e) {
            gs.error('Store_updates: Failed to instantiate Script Include: ' + e.message);
            gs.error('Store_updates: Available in x_snc_store_upda_1: ' + Object.keys(x_snc_store_upda_1));
            return;
        }
        
        // Test 2: Check if method exists
        if (typeof testProcessor.executeQuery === 'function') {
            gs.info('Store_updates: executeQuery method found');
            testProcessor.executeQuery(v_table, v_query);
        } else {
            gs.error('Store_updates: executeQuery method not found. Available methods: ' + Object.keys(testProcessor));
        }
        
        gs.info('Store_updates: Virtual table script completed');
        
    } catch (error) {
        gs.error('Store_updates: Virtual table script error: ' + error.message);
        gs.error('Store_updates: Stack trace: ' + error.stack);
    }
})(v_table, v_query);`,
        sys_domain: 'global',
        sys_domain_path: '/',
        table: 'x_snc_store_upda_1_store_updates',
        update_script: `(function executeUpdate(v_record, v_changed_fields) {
     // Parameters:
     //    v_record - a map of field names and values containing the sys_id of the record
     //          v_record.<field_name>                   - fields in the remote table GlideRecord
     //          v_record.setLastErrorMessage(message)   - signal an error
     //    v_changed_fields - a map of field names and values containing the sys_id of the
     //          v_changed_fields.<field_name>           - changed fields in the remote table GlideRecord
 
     // Sample code:
     //  try {
     //      update-external-system;
     //      if (there-was-an-error) {
     //          var message = ...;
     //          v_record.setLastErrorMessage(message);
     //      }
     //  } catch (ex) {
     //      var message = ex.getMessage();
     //      v_record.setLastErrorMessage(message);
     //  }
  })(v_record, v_changed_fields);`,
    },
})
