import { Record } from '@servicenow/sdk/core'

Record({
    $id: Now.ID['241b3817fb0d72105543f4c69eefdce5'],
    table: 'sys_documentation',
    data: {
        element: 'apps',
        label: 'Applications',
        language: 'en',
        name: 'var__m_sys_hub_flow_input_981b3817fb0d72105543f4c69eefdc57',
    },
})
Record({
    $id: Now.ID['2c1b7817fb0d72105543f4c69eefdc02'],
    table: 'sys_documentation',
    data: {
        element: 'status_message',
        label: 'Status Message',
        language: 'en',
        name: 'var__m_sys_hub_flow_output_981b3817fb0d72105543f4c69eefdc57',
    },
})
Record({
    $id: Now.ID['a81b3817fb0d72105543f4c69eefdcf0'],
    table: 'sys_documentation',
    data: {
        element: 'progress_id',
        label: 'Progress ID',
        language: 'en',
        name: 'var__m_sys_hub_flow_output_981b3817fb0d72105543f4c69eefdc57',
    },
})
Record({
    $id: Now.ID['941b3817fb0d72105543f4c69eefdc5c'],
    table: 'sys_flow_cat_variable_model',
    data: {
        id: '981b3817fb0d72105543f4c69eefdc57',
        name: 'Copy of Plugin Updater',
    },
})
Record({
    $id: Now.ID['a01b3817fb0d72105543f4c69eefdcdf'],
    table: 'sys_hub_flow_input',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes:
            'element_mapping_provider=com.glide.flow_design.action.data.FlowDesignVariableMapper,uiType=string,uiTypeLabel=String,uiUniqueId=2f87da3c-f077-4108-9df1-821a45ea18dc',
        audit: 'false',
        calculation: `(function calculatedFieldValue(current) {

	// Add your code here
	return '';  // return the calculated value

})(current);`,
        display: 'false',
        dynamic_creation: 'false',
        element: 'apps',
        element_reference: 'false',
        function_field: 'false',
        internal_type: 'string',
        label: 'Applications',
        mandatory: 'true',
        max_length: '8000',
        model: '981b3817fb0d72105543f4c69eefdc57',
        model_id: '981b3817fb0d72105543f4c69eefdc57',
        model_table: 'sys_hub_flow',
        name: 'var__m_sys_hub_flow_input_981b3817fb0d72105543f4c69eefdc57',
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
    $id: Now.ID['681b3817fb0d72105543f4c69eefdcea'],
    table: 'sys_hub_flow_output',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes:
            'element_mapping_provider=com.glide.flow_design.action.data.FlowDesignVariableMapper,uiType=string,uiTypeLabel=String,uiUniqueId=79c0b774-7b89-4c5e-89e2-eb5099acb3aa',
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
        max_length: '8000',
        model: '981b3817fb0d72105543f4c69eefdc57',
        model_id: '981b3817fb0d72105543f4c69eefdc57',
        model_table: 'sys_hub_flow',
        name: 'var__m_sys_hub_flow_output_981b3817fb0d72105543f4c69eefdc57',
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
    $id: Now.ID['e01b3817fb0d72105543f4c69eefdcf2'],
    table: 'sys_hub_flow_output',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes:
            'element_mapping_provider=com.glide.flow_design.action.data.FlowDesignVariableMapper,uiType=string,uiTypeLabel=String,uiUniqueId=2767f2b6-f277-478d-85af-70e9744cde51',
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
        max_length: '8000',
        model: '981b3817fb0d72105543f4c69eefdc57',
        model_id: '981b3817fb0d72105543f4c69eefdc57',
        model_table: 'sys_hub_flow',
        name: 'var__m_sys_hub_flow_output_981b3817fb0d72105543f4c69eefdc57',
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
    $id: Now.ID['601b7817fb0d72105543f4c69eefdc1c'],
    table: 'sys_hub_action_instance_v2',
    data: {
        action_type: '43400a1587003300663ca1bb36cb0b4b',
        action_type_parent: 'd1c56ec50b30030085c083eb37673a50',
        compiled_snapshot: '43400a1587003300663ca1bb36cb0b4b',
        flow: '981b3817fb0d72105543f4c69eefdc57',
        order: '1',
        ui_id: 'b276c5b2-8a5b-4fb8-bf69-c3b2f5eb7eb8',
        values: 'H4sIAAAAAAAA/+VXTWvjMBD9K8ZnE+wmTbu9lZRCoR/Qll5KEbIsJ2IV2SvJSdOQ/74jS3aM42YTcKFlj5oZSW9m3hvLr2ufJf6Ff56OwhBHp+dnYTgchuF4PCQ4iuPhmMRhPIr9wBd4TiFS45hTWC4wL8xarRTCeY4WVCqWCfAkTOUcr15cwGWec0awBqf3UgeRGeOJpMK/eH0L/BxLOF1T6V+sW65D4XEcUw6hzw5fC65e5fUSlT5ru21u8+6tI5OJgRIGPn3XVCQUMKSYKxr4cywSrDO5qi2S4uRB8K1hxoSGE30T/K7YB9x7Hpq4lEJWhFpfvUSuXtacXmGNn7QsiC6kCyWzjBGqbD0SmuKC60nTZgMeclNju8WmbXdnvJiLe1sOvz6gag9YCgUgaG4SNchdGunTLFs+ViivmShr4pw8I5jXK6y1ZHGhDZ61Tzmdw0FoDrRgYopymS1YuRmwzAdTDotByrMlXKrYVAwwMcAHUFc8uAb7VWl+wZKZLO7gGNgMgBgHhiDbQpUVsizlAhFeqNIhsVD2LH8TGGJOOFZqmzmUHP0pDG5bB5cxskUzW4hkub6EIxbUJbcJDlLIabilHMlEwgwK1ZIJS27u12tVxCb5AaSlNptdveyJ7FM0JeJKNJMm5K40nHx2bLddBzj5RL3JB/L4SQKCy7+ffo5XhC3BP2RBzvaS7HTLJ5VJjWwtG7pwo7ilAWc9ju8HQKn4/mAY6sWrz9A5uqeM8qTra3FtHK2vxcn/+bX4lmQHQAmy3WOCM1F++gHoV6kg3D9qf7V4VtKr8W0wNqzIrg6wpzPv42glHACnUsIT3O09WzwdEKu5X1KmPfMroxPAsDcBDE/6EcC6TrMuZEfNq9ee6WYV/2HicTseKNjYEG26BHbUndGxd55sdgU8PErBTbJZz9UnnOv5WfiJIoOvHAEz2OruQ1a/aMmSKdXb26uoJNNLzH93+R3jUNWoMr0veGKO9sp2HG0lCkpBkipoXvONGcEzaXeGRIE1HzdCDsBSleMOv3uPNZhOhG6MgNLptOxNc47c1FZH8lGPD8dv+yWtmtWpwapnP+LPrD8hvP0FwjkU4Y8QAAA=',
    },
})
Record({
    $id: Now.ID['6c1b7817fb0d72105543f4c69eefdc1f'],
    table: 'sys_hub_action_instance_v2',
    data: {
        action_type: '89f446ebc3031010ca199a038a40dd7b',
        action_type_parent: '468535e3c3031010ca199a038a40dd3d',
        compiled_snapshot: '89f446ebc3031010ca199a038a40dd7b',
        flow: '981b3817fb0d72105543f4c69eefdc57',
        order: '3',
        ui_id: 'c6e9a576-8209-466c-9a5e-dca4ed266510',
        values: 'H4sIAAAAAAAA/+2W227bOBCGX8XQteXoQJ18l3UQIEXbFHGbvegWwogaxlzQkipSTl0j796RJZ9yWgdIgwV2Lzkakv/8M5+krytL5tbYYrlgLMSM+47vOq7DwU0ScPwYmJPnEbeGVgFzpMwMDJ+llYKCYgtQTRtcrYQqb9MF1BIyhaMuaQ6FFKjN3R2l5lLTpuX18Tv4TKq8xsIaf/02tCqoSYDB2hqv7j06tgIFGSpK/aO9a/CpK+GxssyyamN/63Kzet9vfTe9/Eihss5bIe7Qwh8GixxJgQClcWhRCTmYsl5aY1M3FKgR8stCLbcZM1kYOspqc39o+ZOuYo7jtJkCqSiO3dPtMu2968LiDAxM6WxumrpP5bNSctSdHTkKaJSZ7Me6hMvKSCppvcW0tve7S9XMi4+dEdb2gE2rKNJoEoFVW2mrvS9ETGfl7dVG5bks1qb0D1XJQW1XYEwts8a0elZWIz8fONyt73mMCud0G81EVcniJq3qciHXN5Dg+ehG0WK0HqIctbwpRsDb6kbkPozOKX62Dl/3E/aBjqHN7WVfCvm9wYt2asKAJcxNwA4SjjbzvMSOwyi0IXJcEQdJkmSxdTe09FJPFGi9M4m6k35v2hI7y3pz0s7fdguvZWVOSdQCex/uhj1uzrPDGnu7ueQ1tsdKUCkoCXoPuoi56HoIIvMcAYETBMwXjIcJosi5iB9CN6n/PE8nF5Oz9JTzsqFWvpSyI4RvKJtslQ9Oe+VP19QTtyPgELurvXjPnvda7PneIXnU6q2sxxCclEWB61Eb/NU4jhcO7leK+vUx3Vf1BryKKULNZ+cSVdt26v2TDO/37BDk/a69Cc1J7Llh5nKb3veuzSIM7YShY3uZyIUIXB5G3u+gOXkWCthNviy0gXacmlrtkTwzptLjkxNea9PkshxprBc0CHZR3o7InpOHKB+z5YVo/3MVG7Qv+jIGX67eP1lcj7SmoSlu7vE83QR7mP3Xgjn+j35Ity4fErj1+U3wCyATCY8yO+EMbMY8ZoPrM5s+opB4ji/cjP8G/LI4cTMWuY5gvkeDi14UcHoN5CIKI8yC3YRCJdMF1lqW+z+vD+F6MTtHSNiwc/rpYnC91fCosJeQw54np4/8j86/HJ08CfKIvk+2G6KwmYDMzhxBP6MRMBH4bpwL/xXR+fYLIPFFLfgNAAA=',
    },
})
Record({
    $id: Now.ID['9c1b3817fb0d72105543f4c69eefdc75'],
    table: 'sys_hub_flow_variable',
    data: {
        active: 'true',
        array: 'false',
        array_denormalized: 'false',
        attributes:
            'element_mapping_provider=com.glide.flow_design.action.data.FlowDesignVariableMapper,uiType=string,uiTypeLabel=String,uiUniqueId=70aafde9-0c47-484e-adb0-f483cc07e260',
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
        max_length: '8000',
        model: '981b3817fb0d72105543f4c69eefdc57',
        model_id: '981b3817fb0d72105543f4c69eefdc57',
        model_table: 'sys_hub_flow',
        name: 'var__m_sys_hub_flow_variable_981b3817fb0d72105543f4c69eefdc57',
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
    $id: Now.ID['641b7817fb0d72105543f4c69eefdc0a'],
    table: 'sys_hub_flow_logic_instance_v2',
    data: {
        block: '5b91773dfb813a14e80bf602beefdcfd',
        flow: '981b3817fb0d72105543f4c69eefdc57',
        flow_variables_assigned: 'batch_manifest',
        logic_definition: '4f787d1e0f9b0010ecf0cc52ff767ea0',
        order: '2',
        ui_id: 'f6059c89-6d01-4263-9ab5-782f5212e37e',
        values: 'H4sIAAAAAAAA/+1XTW/bOBD9KwJPDuwYSuzW3vSUbVAgwHYLtNleqkAYkUObCE2qJOXUNfzfOxQl203Toou97MG6yHycjzePQw28ZbYJdRP8nb32Xi0Mu/p0P2LKRIx+b5kS7IqxETOwQvpVQeDLcgVGSfSB8DXoBpOJUL7WsPl4QPhSaeGwi1qDoyABHbvaPtlqs0zENJeT6oWs5hcTuJjiPK/ky/yyQpSCyxkF1FChJtM/I43s7YHGz+iFTR1xH5wyi279VxfkQw9aJyKpixHDLwGNQGIjQXscMQolIFi32SMOQbwz+gAslQmp3BV88eor5ZvneR4tJVKFvBNjvyw7oRIsbyAAUWl4aNxeN6s4+qSNQAmNDq+PsWTwrg7KmuQSoNK9t9XNyvydFGH7AEfn0ngigXUsNXLvCpEflvbxfc/yjTKtKt2mthz0fgWBtKuaEPlsWaPunsickB+ERo0rykgHVNeElLWza9VmIdKr8ULTYiy1fSR2sRvHwGOFYzoCGL8h/KaFP4JTsdy3FIacY7p/jPrc4G1so1kOIAX+cZ7z6ex8Op/iOYgqP5fT+YTzfIaXL3O2GzG/8a81eH8Qik6o/NzEMpNsnUBl0ji6cKfqcE2k1uRCZ4Y9FmV40nyE/Mqebo7LathoCyIrmjyfpNflbFu07Vywq6wg7azD7Lqus9Tzt8YH0BpdwUa0bSydQbLsdkjXDNagdFSIEpAT+kw6u8rCErM2XvKtgT/AIrl/SqlfFSbS0tbWPaecsEe6rDiQomwPorwoS7J4KJu6dMjp9vhx/zZ0gwZnZ0UozLYwGT1KDmK44TAFxCw/Sxvdfnx6GYbf6TDac4o2u/R63pQkUyLJkIBsmP0O3QWmazFIXt42ju4ntVVJ4VroLBt2OZJo8QOSEpGVVhxig7Zbx2SfZ1mwCFJvr2xLLcZJF4rCOaQG9gFFuUbn26D/tZw+0HOF/A7bo+b6tzRujmbB4Dj1bp+ZDvT5xPcHG4f0UTQ9wVdst9vdx5mT7v9pQp0m1GlCnSbUaUKdJtT/a0IJ5CoWdhdb/Lb/NxU3NnRxFD+GHq17iF+UA7b7Bi7TcwGXDQAA',
    },
})
Record({
    $id: Now.ID['a41b7817fb0d72105543f4c69eefdc1a'],
    table: 'sys_hub_flow_logic_instance_v2',
    data: {
        block: '9b91b73dfb813a14e80bf602beefdc02',
        flow: '981b3817fb0d72105543f4c69eefdc57',
        logic_definition: 'df4e1945c3e232002841b63b12d3ae3e',
        order: '4',
        outputs_assigned: 'progress_id,status_message',
        ui_id: '08d4a2b2-6a38-421b-9c6b-f4790d57ef25',
        values: 'H4sIAAAAAAAA/+1VTU/bQBD9K2jPceQ4jj9yQyAkJChVoVxQZY13x8mK9dp414E0yn/vbOyYtNBKKD1VvWWeZ3beezOjbFjV2rq15q46NUYuNJs/bJiGEtmc1U21aNCYTAo2YitQrUM3Gx5hCrM48pLAT70wirhHMXqCQ4giiKLZxB8fFG+3VC6kqRWs7497hS+lEg06mt9GrIaGmFps2HzDpKYfGtSV1I/U4E0yiZizMJ360yKfFXkymcIkxMTPi8gPcsRCcDGhKgU5Kkr93Lc+uTwn9F1L7Lp2oLGN1Is+vurLb/dg1QhHcDJi+GJRCyQeBSiDI1aCFmCrZj0gDYK40eoVWJKsTk0JL0Z+p36J7/sus0DSxrH7OoRZb3QHF+dggai03LYN7m2pJEfTuSKwgFbZs0OsS7iprax0V2IhV/vqSrWl/tTZwYYH9nMlpDVEAmsn1XHvhRS3y+r5y57lhdQ7V/qPquKghggseZe31vHZsFbe/WJzh7wxGhWW1DEroa4JyWhWK7nrQqTL8UJRMC5U9Uzs3KqPgTuFYxoBjC8IP9/B99BIJ/eanqFi1+6rlk8tXroFilPu53EcenGe0NZyWtgkxcDDfOanKfB8CsC2I2bW5kyBMa9G0YSyp9bJ7GzrDco6j10Jb2RtT4nUCnsvtqPhGI0F25qspOWDBX78Hn+uP+Ik33no2Kvk4k9XyeHgKm933U+uBxt+Z89HbjP4f5v/wm0GcRQXQR55RRDHXhgnwktmUHixj2kchlzgbPIXb9Ntr3b/nd1kVj23YXhcGpJw57DLgzyxppWV/BB6rppHJ/4V2/4A9uDRtZkHAAA=',
    },
})
