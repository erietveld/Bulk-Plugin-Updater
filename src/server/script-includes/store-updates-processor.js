// src/server/script-includes/store-updates-processor.js
// Enhanced Store Updates Processor - ServiceNow Script Include
// No imports needed - gs, GlideRecord are automatically available in ServiceNow server environment

var StoreUpdatesProcessor = Class.create();
StoreUpdatesProcessor.prototype = {
    
    /**
     * Initialize the Store Updates Processor
     */
    initialize: function() {
        this.VERSION_LEVELS = {
            'major': 3, 
            'minor': 2, 
            'patch': 1, 
            'none': 0
        };
        this.VERSION_LEVELS_ASCENDING = Object.keys(this.VERSION_LEVELS).reverse();
    },

    /**
     * Main entry point for virtual table - populates store updates data
     * @param {Object} v_table - Virtual table object
     * @param {Object} v_query - Query parameters
     */
    executeQuery: function(v_table, v_query) {
        var startTime = new Date().getTime();
        var errors = [];
        var processedApps = 0;
        
        try {
            gs.info('StoreUpdatesProcessor: Starting store updates scan');
            
            var results = this._processStoreApplications();
            processedApps = Object.keys(results).length;
            
            // Add rows to virtual table
            this._addRowsToVirtualTable(v_table, results);
            
            var endTime = new Date().getTime();
            var processingTime = endTime - startTime;
            
            gs.info('StoreUpdatesProcessor: Completed successfully. Apps: ' + processedApps + ', Time: ' + processingTime + 'ms');
            
        } catch (error) {
            gs.error('StoreUpdatesProcessor: Fatal error during execution: ' + error.message);
            gs.error('StoreUpdatesProcessor: Stack trace: ' + error.stack);
            errors.push(error.message);
        }
        
        return {
            success: errors.length === 0,
            processedApps: processedApps,
            errors: errors
        };
    },

    /**
     * Process all store applications and build update data
     * @returns {Object} Processed application data
     */
    _processStoreApplications: function() {
        var results = {};
        var storeAppVer = new GlideRecord('sys_store_app');
        
        try {
            storeAppVer.addQuery('active', true);
            storeAppVer.addQuery('update_available', true);
            storeAppVer.query();
            
            while (storeAppVer.next()) {
                try {
                    var appSysId = storeAppVer.getUniqueValue();
                    var availableVersions = this._getAvailableVersions(appSysId);
                    
                    if (availableVersions && availableVersions.length > 0) {
                        this._processAppVersions(results, storeAppVer, availableVersions);
                    }
                    
                } catch (appError) {
                    gs.warn('StoreUpdatesProcessor: Error processing app ' + storeAppVer.getDisplayValue() + ': ' + appError.message);
                }
            }
            
        } catch (queryError) {
            gs.error('StoreUpdatesProcessor: Error querying store applications: ' + queryError.message);
            throw queryError;
        }
        
        return this._finalizeResults(results);
    },

    /**
     * Get available versions for a store application
     * @param {String} appSysId - Application sys_id
     * @returns {Array} Array of version objects
     */
    _getAvailableVersions: function(appSysId) {
        var versions = [];
        
        try {
            var versionGR = new GlideRecord('sys_app_version');
            versionGR.addQuery('source_app_id', appSysId);
            versionGR.orderBy('version');
            versionGR.query();
            
            while (versionGR.next()) {
                versions.push({
                    'sys_id': versionGR.getUniqueValue(),
                    'name': versionGR.getDisplayValue(),
                    'version': versionGR.getValue('version'),
                    'publish_date': versionGR.getValue('publish_date')
                });
            }
            
        } catch (error) {
            gs.warn('StoreUpdatesProcessor: Error getting versions for app ' + appSysId + ': ' + error.message);
        }
        
        return versions;
    },

    /**
     * Process versions for a specific application
     * @param {Object} results - Results object to populate
     * @param {GlideRecord} storeAppVer - Store application record
     * @param {Array} availableVersions - Available versions array
     */
    _processAppVersions: function(results, storeAppVer, availableVersions) {
        var appSysId = storeAppVer.getUniqueValue();
        var installedVersion = storeAppVer.getValue('version');
        
        if (!results[appSysId]) {
            results[appSysId] = this._initializeAppResult();
        }
        
        for (var i = 0; i < availableVersions.length; i++) {
            var version = availableVersions[i];
            var updateType = this._compareVersions(installedVersion, version.version);
            
            if (updateType !== 'no') {
                this._updateResultForLevel(results[appSysId], updateType, {
                    storeApp: storeAppVer,
                    version: version,
                    installedVersion: installedVersion,
                    appSysId: appSysId
                });
            }
        }
    },

    /**
     * Initialize result structure for an application
     * @returns {Object} Initialized app result structure
     */
    _initializeAppResult: function() {
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
            'patch_count': 0,
            'latest_version_level': null,
            'batch_level': null,
            'name': null
        };
        
        return {
            'major': this._cloneObject(versionTemplate),
            'minor': this._cloneObject(versionTemplate),
            'patch': this._cloneObject(versionTemplate),
            'no': this._cloneObject(versionTemplate)
        };
    },

    /**
     * Update result object for a specific update level
     */
    _updateResultForLevel: function(appResult, updateType, data) {
        var level = appResult[updateType];
        
        level.sys_id = data.version.sys_id;
        level.application = data.appSysId;
        level.level = updateType;
        level.available_version = data.version.sys_id;
        level.installed_version = data.installedVersion;
        level.name = data.storeApp.getDisplayValue() + ' - ' + data.version.version;
        
        // Set latest version references
        if (updateType === 'patch') {
            level.latest_patch_version = data.version.sys_id;
            level.latest_minor_version = data.version.sys_id;
            level.latest_major_version = data.version.sys_id;
        } else if (updateType === 'minor') {
            level.latest_minor_version = data.version.sys_id;
            level.latest_major_version = data.version.sys_id;
        } else if (updateType === 'major') {
            level.latest_major_version = data.version.sys_id;
        }
        
        // Update counts for all levels
        appResult.patch[updateType + '_count']++;
        appResult.minor[updateType + '_count']++;
        appResult.major[updateType + '_count']++;
        
        // Set latest version level
        appResult.patch.latest_version_level = updateType;
        appResult.minor.latest_version_level = updateType;
        appResult.major.latest_version_level = updateType;
    },

    /**
     * Compare two version strings and determine update type
     * @param {String} currentVer - Current installed version
     * @param {String} availableVer - Available version
     * @returns {String} Update type: 'major', 'minor', 'patch', or 'no'
     */
    _compareVersions: function(currentVer, availableVer) {
        if (!currentVer || !availableVer) {
            return 'no';
        }
        
        var currentParts = currentVer.split('.');
        var availableParts = availableVer.split('.');
        
        // Ensure we have at least 3 parts for comparison
        while (currentParts.length < 3) currentParts.push('0');
        while (availableParts.length < 3) availableParts.push('0');
        
        if (currentParts[0] !== availableParts[0]) {
            return 'major';
        } else if (currentParts[1] !== availableParts[1]) {
            return 'minor';
        } else if (currentParts[2] !== availableParts[2]) {
            return 'patch';
        }
        
        return 'no';
    },

    /**
     * Finalize results by filling in missing data and setting batch levels
     */
    _finalizeResults: function(results) {
        for (var appId in results) {
            var appResult = results[appId];
            var lastLevel = appResult.patch;
            
            // Fill in missing levels with data from lower levels
            for (var i = 1; i < this.VERSION_LEVELS_ASCENDING.length; i++) {
                var levelName = this.VERSION_LEVELS_ASCENDING[i];
                
                if (!appResult[levelName].application) {
                    appResult[levelName] = this._cloneObject(lastLevel);
                } else {
                    lastLevel = appResult[levelName];
                }
            }
            
            // Set batch levels
            for (var level in appResult) {
                if (level !== 'no') {
                    appResult[level].batch_level = level;
                }
            }
        }
        
        return results;
    },

    /**
     * Add processed results to virtual table
     */
    _addRowsToVirtualTable: function(v_table, results) {
        var rowCount = 0;
        
        for (var appId in results) {
            var appResult = results[appId];
            
            for (var level in appResult) {
                if (level !== 'no' && appResult[level].available_version) {
                    v_table.addRow(appResult[level]);
                    rowCount++;
                }
            }
        }
        
        gs.info('StoreUpdatesProcessor: Added ' + rowCount + ' rows to virtual table');
    },

    /**
     * Utility function to clone an object
     */
    _cloneObject: function(obj) {
        var clone = {};
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) {
                clone[key] = obj[key];
            }
        }
        return clone;
    },

    type: 'StoreUpdatesProcessor'
};