import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['71fdae35fbc1f614e80bf602beefdcb9'],
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
        name: 'Available Updates',
        script: `(function executeQuery(v_table, v_query) {
  	// Result object to store application version information
  	var res = {};
  	// Version level mapping
  	var versionLevel = {
  		'major': 3,
  		'minor': 2,
  		'patch': 1,
  		'none': 0
  	};
  	// Ascending order of version levels
  	var versionLevelAscending = Object.keys(versionLevel).reverse();
  
  	// Function to get available versions for a given application Sys ID
  	var getAvailableVersion = function(appSysId) {
  		var vers = [];
  		var v = new GlideRecord('sys_app_version');
  		v.addQuery('source_app_id', '=', appSysId);
  		v.orderBy('version');
  		v.query();
  		while (v.next()) {
  			vers.push({
  				'sys_id': v.getUniqueValue(),
  				'name': v.getDisplayValue(),
  				'version': v.getValue('version'),
  				'publish_date': v.getValue('publish_date')
  			});
  		}
  		return vers;
  	};
  
  	// Function to compare current and available version and determine the difference level
  	var compareVersion = function(currentVer, availableVer) {
  		var currentVerParts = currentVer.split('.');
  		var availableVerParts = availableVer.split('.');
  		var diff = 'None';
  
  		if (currentVerParts[0] !== availableVerParts[0]) {
  			diff = 'Major';
  		} else if (currentVerParts[1] !== availableVerParts[1]) {
  			diff = 'Minor';
  		} else if (currentVerParts[2] !== availableVerParts[2]) {
  			diff = 'Patch';
  		} else {
  			diff = 'No';
  		}
  		return diff;
  	};
  
  	// Query active store apps with updates available
  	var storeAppVer = new GlideRecord('sys_store_app');
  	storeAppVer.addQuery('active', '=', true);
  	storeAppVer.addQuery('update_available', '=', true);
  	storeAppVer.query();
  
  	// Create scan finding for each store app
  	while (storeAppVer.next()) {
  		var cur = storeAppVer.getUniqueValue();
  		var availVersion = getAvailableVersion(cur);
  		for (var v in availVersion) {
  			var ver = availVersion[v];
  			var diff = compareVersion(storeAppVer.getValue('version'), ver.version).toLowerCase();
  
  			// Initialize result object for the current app if not already present
  			if (res.hasOwnProperty(cur) == false) {
  				var versionTemplate = {
  					'sys_id': null,
  					'application': null,
  					'level': null,
  					'available_version': null,
  					'installed_version': null,
  					'latest_major_version': null,
  					'latest_minor_version': null,
  					'latest_patch_version': null,
  					'major_count': 0,
  					'minor_count': 0,
  					'patch_count': 0
  				};
  				res[cur] = {
  					'major': Object.assign({}, versionTemplate),
  					'minor': Object.assign({}, versionTemplate),
  					'patch': Object.assign({}, versionTemplate),
  					'no': Object.assign({}, versionTemplate)
  				};
  			}
  
  			// Set version details for the detected difference level
  			res[cur][diff].sys_id = ver.sys_id;
  			res[cur][diff].application = cur;
  			res[cur][diff].level = diff;
  			res[cur][diff].available_version = ver.sys_id;
  			res[cur][diff].version = ver.version;
  			res[cur][diff].installed_version = storeAppVer.getValue('version');
  			if (diff == 'patch') {
  				res[cur][diff].latest_patch_version = ver.sys_id;
  				res[cur][diff].latest_minor_version = ver.sys_id;
  				res[cur][diff].latest_major_version = ver.sys_id;
  			}
  			if (diff == 'minor') {
  				res[cur][diff].latest_minor_version = ver.sys_id;
  				res[cur][diff].latest_major_version = ver.sys_id;
  			}
  			if (diff == 'major') {
  				res[cur][diff].latest_major_version = ver.sys_id;
  			}
  
  			// Set latest version level for each type
  			res[cur]['patch'].latest_version_level = diff;
  			res[cur]['minor'].latest_version_level = diff;
  			res[cur]['major'].latest_version_level = diff;
  
  			// Increment count for the detected difference level
  			res[cur]['patch'][diff + '_count']++;
  			res[cur]['minor'][diff + '_count']++;
  			res[cur]['major'][diff + '_count']++;
  
  			// Set display name for the version
  			res[cur][diff].name = storeAppVer.getDisplayValue() + ' - ' + ver.version;
  		}
  	}
  
  	// Post-process results to ensure all levels are set
  	for (var app in res) {
  		var lastLevel = res[app]['patch'];
  		for (var l in versionLevelAscending) {
  			var levelCheck = versionLevelAscending[l];
  			if (l > 0) {
  				if (gs.nil(res[app][levelCheck].application)) {
  					// If not set, copy from last level
  					//gs.addInfoMessage('checking - not set: ' + levelCheck);
  					res[app][levelCheck] = lastLevel;
  				} else {
  					// If set, update lastLevel
  					//gs.addInfoMessage('checking - set: ' + levelCheck);
  					lastLevel = res[app][levelCheck];
  				}
  			}
  		}
  
  		// Add each level's result to the output table
  		for (var lev in res[app]) {
  			res[app][lev].batch_level = lev;
  			if (!gs.nil(res[app][lev].available_version)) {
  				v_table.addRow(res[app][lev]);
  			}
  		}
  	}
  })(v_table, v_query);`,
        sys_domain: 'global',
        sys_domain_path: '/',
        table: 'x_snc_store_upda_1_st_available_updates',
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
