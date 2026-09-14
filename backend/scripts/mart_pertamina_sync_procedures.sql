-- Draft sp_sync_*/usp_Migrate* stored procedures for mart_pertamina.
--
-- These did not exist anywhere (prod included) — confirmed empty
-- Procedures node under mart_pertamina in prod. Written from scratch by
-- comparing app.* (source, this repo's models) against mart_pertamina.*
-- (destination, scripts/mart_pertamina_schema.sql) column by column.
--
-- Pattern: most mart_pertamina tables have no natural key to MERGE/upsert
-- against, so each procedure does a full refresh (TRUNCATE + INSERT SELECT)
-- inside a transaction. Columns with no source in app.* are left NULL and
-- commented — someone with the real business rules should fill those in
-- later; this is a starting point, not a certified-correct ETL.
--
-- Run with: run this file's contents against the target database, after
-- scripts/mart_pertamina_schema.sql has been applied.

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_project
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.project;

        INSERT INTO mart_pertamina.project (project_id, project_name, start_date, end_date, pic_pertamina, pic_kerjasama, project_type)
        SELECT
            p.id,
            p.project_name,
            p.operational_start_date,
            p.estimated_completion_date,
            p.pic,             -- app only has one PIC field, no pertamina/kerjasama split
            NULL,               -- no source for pic_kerjasama
            NULL                -- no source for project_type (project_priority is a different concept)
        FROM app.project p;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.usp_MigrateProjectProgressData
AS
BEGIN
    SET NOCOUNT ON;
    -- Target: mart_pertamina.project_progress_v2, NOT mart_pertamina.project_progress.
    -- project_progress_v2's columns match app.project_progress exactly
    -- (UUID project_id, item_no) — the plain project_progress table has an
    -- unrelated shape (bigint project_id, activities_id) from an older design.
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.project_progress_v2;

        INSERT INTO mart_pertamina.project_progress_v2 (
            id, project_id, periode_data, item_no, description, wf,
            previous_week_plan, previous_week_actual, previous_week_variance,
            this_week_plan, this_week_actual, this_week_variance,
            to_date_plan, to_date_actual, to_date_variance,
            remarks, created_at, updated_at
        )
        SELECT
            pp.id, pp.project_id, pp.periode_data, pp.item_no, pp.description, pp.wf,
            pp.previous_week_plan, pp.previous_week_actual, pp.previous_week_variance,
            pp.this_week_plan, pp.this_week_actual, pp.this_week_variance,
            pp.to_date_plan, pp.to_date_actual, pp.to_date_variance,
            pp.remarks, pp.created_at, pp.updated_at
        FROM app.project_progress pp;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.usp_MigrateProjectProgressSummary
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.project_progress_summary;

        INSERT INTO mart_pertamina.project_progress_summary (
            id, project_id, progress_date, actual_this_week, actual_cumulative,
            plan_this_week, plan_cumulative, variance_to_plan, created_at, updated_at
        )
        SELECT
            s.id, s.project_id, s.progress_date, s.actual_this_week, s.actual_cumulative,
            s.plan_this_week, s.plan_cumulative, s.variance_to_plan, s.created_at, s.updated_at
        FROM app.project_progress_summary s;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_psa_zona_indicator
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.psa_zona_indicator;

        INSERT INTO mart_pertamina.psa_zona_indicator (
            ind_type, indicator, unit, description, basis, pic_name, pic_email,
            january, february, march, april, may, june, july, august, september, october, november, december,
            ytd, comment, tahun_data
        )
        SELECT
            z.ind_type, z.indicator, z.unit, z.description, z.basis, z.pic_name, z.pic_email,
            TRY_CAST(z.jan AS INT), TRY_CAST(z.feb AS INT), TRY_CAST(z.mar AS INT), TRY_CAST(z.apr AS INT),
            TRY_CAST(z.may AS INT), TRY_CAST(z.jun AS INT), TRY_CAST(z.jul AS INT), TRY_CAST(z.aug AS INT),
            TRY_CAST(z.sep AS INT), TRY_CAST(z.oct AS INT), TRY_CAST(z.nov AS INT), TRY_CAST(z.dec AS INT),
            z.ytd, z.comment, CAST(z.reporting_year AS VARCHAR(255))
        FROM app.zona_indicator z;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- New procedure — the original script referenced sp_sync_psa_zona_indicator
-- twice, once for PSA Zona Indicator and again for PSA Zona PSE List, but
-- those are two different tables with two different shapes. This one is
-- the actual sync for zona_pse_list -> psa_zona_pse.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_psa_zona_pse
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.psa_zona_pse;

        INSERT INTO mart_pertamina.psa_zona_pse (
            [no], zona, field_area, lokasi, unit_detail, short_description, event_issue_category,
            activity, type_location, date_start, time_start,
            barrier_prevent, barrier_mitigate, lopc_released,
            lopc_duration_hour, lopc_flammable_gas_kg, lopc_gas_in_any_hour_periode_kg,
            liquid_hc_type_material, lopc_hc_liquid_barrel, lopc_hc_liquid_in_any_one_hour_periode_kg,
            toxic_type_material, lopc_toxic_kg, lopc_toxic_in_any_one_hour_periode_kg,
            other_type_material, lopc_other_kg, lopc_other_in_any_one_hour_periode_kg,
            injured_worker, affect_3rd_party, number_injured_person, number_fatality,
            fire_explosion, damage_by_fire_explosion_usd,
            relief_device_upset_emission, effect_to_discharge_point_of_relief_device_upset_emission, pse_tier,
            causal_factor_direct_cause_1_description, category, sub_category,
            causal_factor_direct_cause_2_description, category_1, sub_category_1,
            causal_factor_direct_cause_3_description, category_2, sub_category_2,
            barrier_1_failure_description, category_3, sub_category_3,
            barrier_2_failure_description, category_4, sub_category_4,
            barrier_3_failure_description, category_5, sub_category_5,
            remarks, idfield
        )
        SELECT
            z.no, z.zona, z.field_area, z.lokasi, z.unit_detail, z.short_description, z.event_issue_category,
            z.activity, z.type_location, z.date_start, z.time_start,
            z.barrier_prevent, z.barrier_mitigate, z.lopc_released,
            TRY_CAST(z.lopc_duration_hour AS INT), TRY_CAST(z.lopc_flammable_gas_kg AS INT), TRY_CAST(z.lopc_gas_one_hour_kg AS INT),
            z.liquid_hc_type, TRY_CAST(z.lopc_hc_liquid_barrel AS INT), TRY_CAST(z.lopc_hc_liquid_one_hour_kg AS INT),
            z.toxic_type, TRY_CAST(z.lopc_toxic_kg AS INT), TRY_CAST(z.lopc_toxic_one_hour_kg AS INT),
            z.other_type, TRY_CAST(z.lopc_other_kg AS INT), TRY_CAST(z.lopc_other_one_hour_kg AS INT),
            z.injured_worker, z.affect_3rd_party, z.number_injured_person, z.number_fatality,
            z.fire_explosion, TRY_CAST(z.damage_fire_explosion_usd AS INT),
            z.relief_device, z.effect_relief_device, TRY_CAST(z.pse_tier AS INT),
            z.causal_1_desc, z.causal_1_category, z.causal_1_sub_category,
            z.causal_2_desc, z.causal_2_category, z.causal_2_sub_category,
            z.causal_3_desc, z.causal_3_category, z.causal_3_sub_category,
            z.barrier_1_desc, z.barrier_1_category, z.barrier_1_sub_category,
            z.barrier_2_desc, z.barrier_2_category, z.barrier_2_sub_category,
            z.barrier_3_desc, z.barrier_3_category, z.barrier_3_sub_category,
            z.remarks,
            NULL  -- idfield: needs mart_pertamina.field seeded with code->id mapping first; zona_pse_list has no field code column to join on anyway
        FROM app.zona_pse_list z;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_mit
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.mit;

        INSERT INTO mart_pertamina.mit (
            area, noregistration_lokasi, noregistration_jenismit, noregistration_kategori,
            noregistration_tahun, noregistration_no, mitdeclarationdate, mittitleasset,
            integritythreats, possiblescenario, consequences, availablesafeguardcontrol,
            currentrisk_likelihood, currentrisk_severity, currentrisk_risk,
            rec_no, recommendationaction, pic, targetclosing, remarks,
            progresspercent, overallprogresspercent,
            residualriskassessmentdate, residualrisk_likelihood, residualrisk_severity, residualrisk_risk,
            targetriskafterimplementedrecommendation_likelihood, targetriskafterimplementedrecommendation_severity, targetriskafterimplementedrecommendation_risk,
            mitstatus, evidence, closingdate
        )
        SELECT
            m.area, m.reg_lokasi, m.reg_jenis_mit, m.reg_kategori,
            TRY_CAST(m.reg_tahun AS INT), TRY_CAST(m.reg_no AS INT),
            CONVERT(NVARCHAR(50), m.mit_declaration_date, 23), m.mit_title_asset,
            m.integrity_threats, m.possible_scenario, m.consequences, m.available_safeguard,
            TRY_CAST(m.current_likelihood AS INT), TRY_CAST(m.current_severity AS INT), TRY_CAST(m.current_risk_rating AS INT),
            m.rec_no, m.recommendation_action, m.pic, CONVERT(NVARCHAR(50), m.target_closing, 23), m.remarks,
            NULL, NULL,                            -- progresspercent/overallprogresspercent: no source in app
            NULL, NULL, NULL, NULL,                -- residual risk: app only tracks current + target risk, no "residual" stage
            TRY_CAST(m.target_likelihood AS INT), TRY_CAST(m.target_severity AS INT), TRY_CAST(m.target_risk_rating AS INT),
            m.mit_status, m.evidence_path, CONVERT(NVARCHAR(50), m.closing_date, 23)
        FROM app.mit_monitoring m;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_lopa
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.lopa;

        INSERT INTO mart_pertamina.lopa (
            [NO], FUNCTION_NO, FUNCTION_NAME, FUNCTION_DESCRIPTION, FINAL_ELEMENT, RECOMMENDATION,
            RRF_GAP_VALUE, RRF_GAP_TYPE, RESPONSIBILITY_PIC, TARGET_DATE, REMINDER_STATUS,
            RESPONSE_PROGRESS, STATUS, EVIDENCE, COMPLETION_DATE, SANDI_FIELD, periodedata, field
        )
        SELECT
            NULL,   -- [NO]: app has a UUID id, not a display sequence number
            l.function_no, l.function_name, l.function_description, l.final_element, l.recommendation,
            l.rrf_gap_value, l.rrf_gap_type, l.responsibility_pic, l.target_date, l.reminder_status,
            l.response_progress, l.status, l.evidence, l.completion_date,
            f.idfield,
            DATEFROMPARTS(l.reporting_year, l.reporting_month, 1),
            l.field
        FROM app.lopa_monitoring l
        LEFT JOIN mart_pertamina.field f ON f.kode = l.field;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_moc
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.moc;

        INSERT INTO mart_pertamina.moc (
            moc_number, change_desc, issued_date, done, moc_owner, last_updated, ongoing_step, pic, status, idfield
        )
        SELECT
            mo.moc_number, mo.change_desc, mo.issued_date, mo.done, mo.moc_owner, mo.last_updated,
            mo.ongoing_step, mo.pic, mo.status, f.idfield
        FROM app.moc_monitoring mo
        LEFT JOIN mart_pertamina.field f ON f.kode = mo.field;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_airms
AS
BEGIN
    SET NOCOUNT ON;
    -- Record_ID is mart_pertamina.airms's NOT NULL primary key; app.record_id
    -- is a nullable free-text string, so rows without a valid integer are
    -- skipped (can't insert NULL into a NOT NULL PK) rather than failing
    -- the whole sync.
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.airms;

        INSERT INTO mart_pertamina.airms (
            Record_ID, [Date], Asset_ID, Asset_Name, Area, Availability, Reliability, MTBF, MTTR,
            WO_Type, WO_Status, Maintenance_Cost, Downtime_Type, Downtime_Hours, Lost_BOE, Health_Index
        )
        SELECT
            TRY_CAST(a.record_id AS INT),
            a.date, LEFT(a.asset_id, 20), LEFT(a.asset_name, 100), LEFT(a.area, 50),
            TRY_CAST(a.availability AS DECIMAL(5,2)), TRY_CAST(a.reliability AS DECIMAL(5,2)),
            TRY_CAST(a.mtbf AS DECIMAL(10,2)), TRY_CAST(a.mttr AS DECIMAL(5,1)),
            LEFT(a.wo_type, 30), LEFT(a.wo_status, 20), TRY_CAST(a.maintenance_cost AS DECIMAL(15,2)),
            LEFT(a.downtime_type, 20), TRY_CAST(a.downtime_hours AS DECIMAL(8,2)),
            TRY_CAST(a.lost_boe AS DECIMAL(12,2)), TRY_CAST(a.health_index AS DECIMAL(5,2))
        FROM app.airms_monitoring a
        WHERE TRY_CAST(a.record_id AS INT) IS NOT NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_i2aims
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.i2aims;

        INSERT INTO mart_pertamina.i2aims (
            record_id, inspection_date, asset_id, asset_name, asset_type, area, sce_category,
            integrity_status, inspection_result, inspection_compliance, corrosion_rate, remaining_life,
            risk_rank, anomaly_count, process_safety_event, barrier_health, recommendation_status, inspection_cost
        )
        SELECT
            TRY_CAST(i.record_id AS BIGINT),
            CONVERT(VARCHAR(255), i.inspection_date, 23),
            i.asset_id, i.asset_name, i.asset_type, i.area, i.sce_category,
            i.integrity_status, i.inspection_result,
            TRY_CAST(i.inspection_compliance AS FLOAT), TRY_CAST(i.corrosion_rate AS FLOAT), TRY_CAST(i.remaining_life AS FLOAT),
            i.risk_rank, TRY_CAST(i.anomaly_count AS INT), i.process_safety_event,
            TRY_CAST(i.barrier_health AS INT), i.recommendation_status, TRY_CAST(i.inspection_cost AS INT)
        FROM app.i2aims_monitoring i;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
