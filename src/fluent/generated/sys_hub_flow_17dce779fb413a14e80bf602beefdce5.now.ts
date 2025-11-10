import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['17dce779fb413a14e80bf602beefdce5'],
    table: 'sys_hub_flow',
    data: {
        access: 'public',
        active: false,
        attributes: 'labelCacheCleanUpExecuted=true',
        authored_on_release_version: 28100,
        callable_by_client_api: false,
        description: 'Store Updater flow',
        flow_priority: 'MEDIUM',
        internal_name: 'store_updater',
        label_cache: 'null',
        name: 'Store Updater',
        pre_compiled: false,
        run_as: 'user',
        sc_callable: false,
        show_draft_actions: false,
        show_triggered_flows: false,
        status: 'draft',
        sys_domain: 'global',
        sys_domain_path: '/',
        type: 'subflow',
        version: '2',
        version_record: 'ce5e2bfdfb413a14e80bf602beefdc76',
    },
})
Record({
    $id: Now.ID['13dce779fb413a14e80bf602beefdce7'],
    table: 'sys_flow_cat_variable_model',
    data: {
        id: '17dce779fb413a14e80bf602beefdce5',
        name: 'Store Updater',
    },
})
Record({
    $id: Now.ID['e1ed6b7dfb413a14e80bf602beefdc11'],
    table: 'sys_documentation',
    data: {
        element: 'applications',
        label: 'Applications',
        language: 'en',
        name: 'var__m_sys_hub_flow_input_17dce779fb413a14e80bf602beefdce5',
    },
})
Record({
    $id: Now.ID['29ed6b7dfb413a14e80bf602beefdc79'],
    table: 'sys_documentation',
    data: {
        element: 'status_message',
        label: 'Status Message',
        language: 'en',
        name: 'var__m_sys_hub_flow_output_17dce779fb413a14e80bf602beefdce5',
    },
})
Record({
    $id: Now.ID['aded6b7dfb413a14e80bf602beefdcb0'],
    table: 'sys_documentation',
    data: {
        element: 'progress_id',
        label: 'Progress ID',
        language: 'en',
        name: 'var__m_sys_hub_flow_output_17dce779fb413a14e80bf602beefdce5',
    },
})
Record({
    $id: Now.ID['d1ed2b7dfb413a14e80bf602beefdcf6'],
    table: 'sys_hub_flow_input',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes:
            'element_mapping_provider=com.glide.flow_design.action.data.FlowDesignVariableMapper,uiType=string,uiUniqueId=756c678d-02de-4b92-b388-d11037ff7d74',
        audit: 'false',
        calculation: `(function calculatedFieldValue(current) {

	// Add your code here
	return '';  // return the calculated value

})(current);`,
        display: 'false',
        dynamic_creation: 'false',
        element: 'applications',
        element_reference: 'false',
        function_field: 'false',
        internal_type: 'string',
        label: 'Applications',
        mandatory: 'true',
        max_length: '65000',
        model: '17dce779fb413a14e80bf602beefdce5',
        model_id: '17dce779fb413a14e80bf602beefdce5',
        model_table: 'sys_hub_flow',
        name: 'var__m_sys_hub_flow_input_17dce779fb413a14e80bf602beefdce5',
        order: '1',
        primary: 'false',
        read_only: 'false',
        reference_floats: 'false',
        spell_check: 'false',
        staged: 'false',
        table_reference: 'false',
        text_index: 'false',
        unique: 'false',
        use_dependent_field: 'false',
        use_dynamic_default: 'false',
        use_reference_qualifier: 'simple',
        virtual: 'false',
        virtual_type: 'script',
        xml_view: 'false',
    },
})
Record({
    $id: Now.ID['6ded6b7dfb413a14e80bf602beefdcac'],
    table: 'sys_hub_flow_output',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes:
            'element_mapping_provider=com.glide.flow_design.action.data.FlowDesignVariableMapper,uiType=string,uiUniqueId=8bf76967-1b32-449f-ab2b-a129dd0f42d8',
        audit: 'false',
        calculation: `(function calculatedFieldValue(current) {

	// Add your code here
	return '';  // return the calculated value

})(current);`,
        display: 'false',
        dynamic_creation: 'false',
        element: 'progress_id',
        element_reference: 'false',
        function_field: 'false',
        internal_type: 'string',
        label: 'Progress ID',
        mandatory: 'false',
        max_length: '65000',
        model: '17dce779fb413a14e80bf602beefdce5',
        model_id: '17dce779fb413a14e80bf602beefdce5',
        model_table: 'sys_hub_flow',
        name: 'var__m_sys_hub_flow_output_17dce779fb413a14e80bf602beefdce5',
        order: '1',
        primary: 'false',
        read_only: 'false',
        reference_floats: 'false',
        spell_check: 'false',
        staged: 'false',
        table_reference: 'false',
        text_index: 'false',
        unique: 'false',
        use_dependent_field: 'false',
        use_dynamic_default: 'false',
        use_reference_qualifier: 'simple',
        virtual: 'false',
        virtual_type: 'script',
        xml_view: 'false',
    },
})
Record({
    $id: Now.ID['eded6b7dfb413a14e80bf602beefdc73'],
    table: 'sys_hub_flow_output',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes:
            'element_mapping_provider=com.glide.flow_design.action.data.FlowDesignVariableMapper,uiType=string,uiUniqueId=34a08165-86e4-4a10-ace3-26d8df4f41a2',
        audit: 'false',
        calculation: `(function calculatedFieldValue(current) {

	// Add your code here
	return '';  // return the calculated value

})(current);`,
        display: 'false',
        dynamic_creation: 'false',
        element: 'status_message',
        element_reference: 'false',
        function_field: 'false',
        internal_type: 'string',
        label: 'Status Message',
        mandatory: 'false',
        max_length: '65000',
        model: '17dce779fb413a14e80bf602beefdce5',
        model_id: '17dce779fb413a14e80bf602beefdce5',
        model_table: 'sys_hub_flow',
        name: 'var__m_sys_hub_flow_output_17dce779fb413a14e80bf602beefdce5',
        order: '2',
        primary: 'false',
        read_only: 'false',
        reference_floats: 'false',
        spell_check: 'false',
        staged: 'false',
        table_reference: 'false',
        text_index: 'false',
        unique: 'false',
        use_dependent_field: 'false',
        use_dynamic_default: 'false',
        use_reference_qualifier: 'simple',
        virtual: 'false',
        virtual_type: 'script',
        xml_view: 'false',
    },
})
Record({
    $id: Now.ID['b55ee7fdfb413a14e80bf602beefdccc'],
    table: 'sys_hub_action_instance_v2',
    data: {
        action_type: '43400a1587003300663ca1bb36cb0b4b',
        flow: '17dce779fb413a14e80bf602beefdce5',
        order: '1',
        ui_id: '5b8fca0d-227b-4812-bcea-ef9bb48f3f6d',
        values: 'H4sIAAAAAAAA/+VWbWvbMBD+K0GfTZCbNO3ybaQUBn2BtvRLGUa25URMsT1JTpqG/ved3uwscdNkmJGxT8Z3J92ju+c56WWNWIrGCGdDjEl4fnmB8WCA8Wg0SEgYx4NREuP4/AsKUE7mFCJlIVSkViUF04LwqrYRmYApZbLkZPXsPKSnit4b2JMZ46mgORq/fA9QSQTspqhA4/WW61A4nMSUQ+gj5O49WTwtEM1nDDkKlvj/G7d04o2FSDWUQYDoq6J5SgFDRrikAZqTPCWqEKvaIihJ73PeGGYsV7Ab0sGvkr1BvsGZjssonCqh1lf/Rq5E1pxdEUUelagSVQkXasFKqMe6PmZdyJaaO/j4PWji33Q82Y5P6eaC8B3qndKMVFxN/ixneGzOM53THvC+VKyArqOB7guJuT9+wat5fmd7iWqEzy1ks56rDzhXSSg2LXVDdYdcu7LHWbF88N24ZrnB5Zy8SAiv/4hSgsWV0nVZoyyNMkZ5GrGcs1xngrZp+lBO55AhmpOyZPk0KkWxYGZXOMu8P+Xw0894sdS1YNO8TxJ98j4Qi/SvwX5lzM9EMF2FW9gGFgc64QyWunyRTAQrVbRk6ZSqJruPSgu1JPxHm98xLvKNMsdD7wGSKznhRMqm2EDT6Gela2BL76oXmUaZJQbFVzjBgrpCaQ4Y2SYXe2V7viVR2+gNvuzOj6MnxwEQfBXuNSN78eojVG502J6biN/Hx7V29O6sw9O7sxFyibsZIW0S35XgUQrclZam2r+jrOOJb2vzCfuHey+tUdjwDJocCSqhpHKD/SHGeFcBYWDNx8ngACxeBrfktfdQg2lF6JQAJKVTM5k2ZfCttjoNDDvTwPB0NeCb1XoD+Z51fAGdiho+E8Ll/tcbbmiWFHnKNMZNHXRwCxyAwNN/sgmhDZZ/QW7bbto28M+iDiWAT1cEnV8Ep8Lwg+b9fpIN44ZPdru/yHCT3DP8yWXfAuN4bX7bnjdm2dbzBv+fz5vTHNwAiHFgSGRbKItKmFIuooRX0jgEyaXdq8Mx//0XS/ooOjUQAAA=',
    },
})
Record({
    $id: Now.ID['e51e67bdfb413a14e80bf602beefdcd1'],
    table: 'sys_hub_flow_variable',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes:
            'element_mapping_provider=com.glide.flow_design.action.data.FlowDesignVariableMapper,uiType=string,uiUniqueId=d3226201-e3ff-4cd7-88d0-fa7d202fd460',
        audit: 'false',
        calculation: `(function calculatedFieldValue(current) {

	// Add your code here
	return '';  // return the calculated value

})(current);`,
        display: 'false',
        dynamic_creation: 'false',
        element: 'batch_manifest',
        element_reference: 'false',
        function_field: 'false',
        internal_type: 'string',
        label: 'Batch Manifest',
        mandatory: 'false',
        max_length: '65000',
        model: '17dce779fb413a14e80bf602beefdce5',
        model_id: '17dce779fb413a14e80bf602beefdce5',
        model_table: 'sys_hub_flow',
        name: 'var__m_sys_hub_flow_variable_17dce779fb413a14e80bf602beefdce5',
        order: '1',
        primary: 'false',
        read_only: 'false',
        reference_floats: 'false',
        spell_check: 'false',
        staged: 'false',
        table_reference: 'false',
        text_index: 'false',
        unique: 'false',
        use_dependent_field: 'false',
        use_dynamic_default: 'false',
        use_reference_qualifier: 'simple',
        virtual: 'false',
        virtual_type: 'script',
        xml_view: 'false',
    },
})
