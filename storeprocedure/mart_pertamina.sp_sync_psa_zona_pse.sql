CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_psa_zona_pse
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                no,
                zona,
                field_area,
                lokasi,
                unit_detail,
                short_description,
                event_issue_category,
                activity,
                type_location,
                date_start,
                time_start,
                barrier_prevent,
                barrier_mitigate,
                lopc_released,
                lopc_duration_hour,
                lopc_flammable_gas_kg,
                lopc_gas_one_hour_kg,
                liquid_hc_type,
                lopc_hc_liquid_barrel,
                lopc_hc_liquid_one_hour_kg,
                toxic_type,
                lopc_toxic_kg,
                lopc_toxic_one_hour_kg,
                other_type,
                lopc_other_kg,
                lopc_other_one_hour_kg,
                injured_worker,
                affect_3rd_party,
                number_injured_person,
                number_fatality,
                fire_explosion,
                damage_fire_explosion_usd,
                relief_device,
                effect_relief_device,
                pse_tier,
                causal_1_desc, causal_1_category, causal_1_sub_category,
                causal_2_desc, causal_2_category, causal_2_sub_category,
                causal_3_desc, causal_3_category, causal_3_sub_category,
                barrier_1_desc, barrier_1_category, barrier_1_sub_category,
                barrier_2_desc, barrier_2_category, barrier_2_sub_category,
                barrier_3_desc, barrier_3_category, barrier_3_sub_category,
                remarks,
                CASE
                    WHEN UPPER(LTRIM(RTRIM(field_area))) = 'DGI' THEN 1
                    ELSE 2
                END AS idfield,
                ROW_NUMBER() OVER (
                    PARTITION BY no, zona, field_area
                    ORDER BY (SELECT NULL)
                ) AS rn
            FROM app.zona_pse_list
        )
        SELECT *
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE 1: confirm (no, zona, field_area) is unique after
        -- dedup. No timestamp column exists to break ties on a true
        -- duplicate — this only catches duplicates surviving the arbitrary pick.
        IF EXISTS (
            SELECT no, zona, field_area
            FROM #src_final
            GROUP BY no, zona, field_area
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_psa_zona_pse aborted: duplicate (no, zona, field_area) found in source after dedup. Check app.zona_pse_list for true duplicates.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 2: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.psa_zona_pse) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_psa_zona_pse aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.zona_pse_list source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.psa_zona_pse AS target
        USING #src_final AS source
        ON  target.no         = source.no
        AND target.zona        = source.zona
        AND target.field_area  = source.field_area

        WHEN MATCHED THEN
            UPDATE SET
                target.lokasi                                                  = source.lokasi,
                target.unit_detail                                             = source.unit_detail,
                target.short_description                                       = source.short_description,
                target.event_issue_category                                    = source.event_issue_category,
                target.activity                                                = source.activity,
                target.type_location                                           = source.type_location,
                target.date_start                                              = source.date_start,
                target.time_start                                              = source.time_start,
                target.barrier_prevent                                         = source.barrier_prevent,
                target.barrier_mitigate                                        = source.barrier_mitigate,
                target.lopc_released                                           = source.lopc_released,
                target.lopc_duration_hour                                      = source.lopc_duration_hour,
                target.lopc_flammable_gas_kg                                   = source.lopc_flammable_gas_kg,
                target.lopc_gas_in_any_hour_periode_kg                         = source.lopc_gas_one_hour_kg,
                target.liquid_hc_type_material                                 = source.liquid_hc_type,
                target.lopc_hc_liquid_barrel                                   = source.lopc_hc_liquid_barrel,
                target.lopc_hc_liquid_in_any_one_hour_periode_kg               = source.lopc_hc_liquid_one_hour_kg,
                target.toxic_type_material                                     = source.toxic_type,
                target.lopc_toxic_kg                                           = source.lopc_toxic_kg,
                target.lopc_toxic_in_any_one_hour_periode_kg                   = source.lopc_toxic_one_hour_kg,
                target.other_type_material                                     = source.other_type,
                target.lopc_other_kg                                           = source.lopc_other_kg,
                target.lopc_other_in_any_one_hour_periode_kg                   = source.lopc_other_one_hour_kg,
                target.injured_worker                                          = source.injured_worker,
                target.affect_3rd_party                                        = source.affect_3rd_party,
                target.number_injured_person                                   = source.number_injured_person,
                target.number_fatality                                         = source.number_fatality,
                target.fire_explosion                                          = source.fire_explosion,
                target.damage_by_fire_explosion_usd                            = source.damage_fire_explosion_usd,
                target.relief_device_upset_emission                            = source.relief_device,
                target.effect_to_discharge_point_of_relief_device_upset_emission = source.effect_relief_device,
                target.pse_tier                                                = source.pse_tier,
                target.causal_factor_direct_cause_1_description                = source.causal_1_desc,
                target.category                                                = source.causal_1_category,
                target.sub_category                                            = source.causal_1_sub_category,
                target.causal_factor_direct_cause_2_description                = source.causal_2_desc,
                target.category_1                                              = source.causal_2_category,
                target.sub_category_1                                          = source.causal_2_sub_category,
                target.causal_factor_direct_cause_3_description                = source.causal_3_desc,
                target.category_2                                              = source.causal_3_category,
                target.sub_category_2                                          = source.causal_3_sub_category,
                target.barrier_1_failure_description                           = source.barrier_1_desc,
                target.category_3                                              = source.barrier_1_category,
                target.sub_category_3                                          = source.barrier_1_sub_category,
                target.barrier_2_failure_description                           = source.barrier_2_desc,
                target.category_4                                              = source.barrier_2_category,
                target.sub_category_4                                          = source.barrier_2_sub_category,
                target.barrier_3_failure_description                           = source.barrier_3_desc,
                target.category_5                                              = source.barrier_3_category,
                target.sub_category_5                                          = source.barrier_3_sub_category,
                target.remarks                                                 = source.remarks,
                target.idfield                                                 = source.idfield
                -- treshold_tier_*_logic, lopc_tier_logic, injury_tier_logic,
                -- damage_tier_logic, relief_correction_logic intentionally
                -- left untouched on update — confirmed placeholder, logic TBD

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                no, zona, field_area, lokasi, unit_detail, short_description,
                event_issue_category, activity, type_location, date_start, time_start,
                barrier_prevent, barrier_mitigate, lopc_released, lopc_duration_hour,
                lopc_flammable_gas_kg, lopc_gas_in_any_hour_periode_kg,
                liquid_hc_type_material, lopc_hc_liquid_barrel,
                lopc_hc_liquid_in_any_one_hour_periode_kg, toxic_type_material,
                lopc_toxic_kg, lopc_toxic_in_any_one_hour_periode_kg,
                other_type_material, lopc_other_kg, lopc_other_in_any_one_hour_periode_kg,
                injured_worker, affect_3rd_party, number_injured_person, number_fatality,
                fire_explosion, damage_by_fire_explosion_usd, relief_device_upset_emission,
                effect_to_discharge_point_of_relief_device_upset_emission, pse_tier,
                causal_factor_direct_cause_1_description, category, sub_category,
                causal_factor_direct_cause_2_description, category_1, sub_category_1,
                causal_factor_direct_cause_3_description, category_2, sub_category_2,
                barrier_1_failure_description, category_3, sub_category_3,
                barrier_2_failure_description, category_4, sub_category_4,
                barrier_3_failure_description, category_5, sub_category_5,
                remarks,
                treshold_tier_1_logic, treshold_tier_2_logic,
                treshold_tier_1_logic_1, treshold_tier_2_logic_1,
                treshold_tier_1_logic_2, treshold_tier_2_logic_2,
                treshold_tier_1_logic_3, treshold_tier_2_logic_3,
                lopc_tier_logic, injury_tier_logic, damage_tier_logic,
                relief_correction_logic,
                idfield
            )
            VALUES (
                source.no, source.zona, source.field_area, source.lokasi, source.unit_detail,
                source.short_description, source.event_issue_category, source.activity,
                source.type_location, source.date_start, source.time_start,
                source.barrier_prevent, source.barrier_mitigate, source.lopc_released,
                source.lopc_duration_hour, source.lopc_flammable_gas_kg, source.lopc_gas_one_hour_kg,
                source.liquid_hc_type, source.lopc_hc_liquid_barrel, source.lopc_hc_liquid_one_hour_kg,
                source.toxic_type, source.lopc_toxic_kg, source.lopc_toxic_one_hour_kg,
                source.other_type, source.lopc_other_kg, source.lopc_other_one_hour_kg,
                source.injured_worker, source.affect_3rd_party, source.number_injured_person,
                source.number_fatality, source.fire_explosion, source.damage_fire_explosion_usd,
                source.relief_device, source.effect_relief_device, source.pse_tier,
                source.causal_1_desc, source.causal_1_category, source.causal_1_sub_category,
                source.causal_2_desc, source.causal_2_category, source.causal_2_sub_category,
                source.causal_3_desc, source.causal_3_category, source.causal_3_sub_category,
                source.barrier_1_desc, source.barrier_1_category, source.barrier_1_sub_category,
                source.barrier_2_desc, source.barrier_2_category, source.barrier_2_sub_category,
                source.barrier_3_desc, source.barrier_3_category, source.barrier_3_sub_category,
                source.remarks,
                NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL,
                source.idfield
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for psa_zona_pse completed successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        DECLARE @ErrorMessage NVARCHAR(4000) = '[ERROR] ' + ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ISNULL(NULLIF(ERROR_STATE(), 0), 1);

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END