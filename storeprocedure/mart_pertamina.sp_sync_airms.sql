-- sp_sync_airms

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_airms
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                record_id,
                TRY_CAST(record_id AS INT)              AS record_id_int,
                date,
                asset_id,
                asset_name,
                area,
                TRY_CAST(availability      AS DECIMAL(18,2)) AS availability_d,
                TRY_CAST(reliability       AS DECIMAL(18,2)) AS reliability_d,
                TRY_CAST(mtbf              AS DECIMAL(18,2)) AS mtbf_d,
                TRY_CAST(mttr              AS DECIMAL(18,2)) AS mttr_d,
                wo_type,
                wo_status,
                TRY_CAST(maintenance_cost  AS DECIMAL(18,2)) AS maintenance_cost_d,
                downtime_type,
                TRY_CAST(downtime_hours    AS DECIMAL(18,2)) AS downtime_hours_d,
                TRY_CAST(lost_boe          AS DECIMAL(18,2)) AS lost_boe_d,
                TRY_CAST(health_index      AS DECIMAL(18,2)) AS health_index_d,
                ROW_NUMBER() OVER (
                    PARTITION BY record_id, date
                    ORDER BY reporting_year DESC, reporting_month DESC
                ) AS rn
            FROM app.airms_monitoring
        )
        SELECT
            record_id, record_id_int, date, asset_id, asset_name, area,
            availability_d, reliability_d, mtbf_d, mttr_d, wo_type, wo_status,
            maintenance_cost_d, downtime_type, downtime_hours_d, lost_boe_d, health_index_d
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE 1: record_id must cast cleanly, since it's half the
        -- MERGE key. A NULL here would make the row unmatchable, causing a
        -- false delete of the existing target row plus a duplicate NULL-keyed insert.
        IF EXISTS (
            SELECT 1 FROM #src_final
            WHERE record_id IS NOT NULL AND record_id_int IS NULL
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('sp_sync_airms aborted: found record_id values that cannot be cast to INT. Fix source data before syncing.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 2: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.airms) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('sp_sync_airms aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.airms_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.airms AS target
        USING #src_final AS source
        ON  target.Record_ID = source.record_id_int
        AND target.Date      = source.date

        WHEN MATCHED THEN
            UPDATE SET
                target.Asset_ID          = source.asset_id,
                target.Asset_Name        = source.asset_name,
                target.Area              = source.area,
                target.Availability      = source.availability_d,
                target.Reliability       = source.reliability_d,
                target.MTBF              = source.mtbf_d,
                target.MTTR              = source.mttr_d,
                target.WO_Type           = source.wo_type,
                target.WO_Status         = source.wo_status,
                target.Maintenance_Cost  = source.maintenance_cost_d,
                target.Downtime_Type     = source.downtime_type,
                target.Downtime_Hours    = source.downtime_hours_d,
                target.Lost_BOE          = source.lost_boe_d,
                target.Health_Index      = source.health_index_d

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                Record_ID, Date, Asset_ID, Asset_Name, Area,
                Availability, Reliability, MTBF, MTTR, WO_Type, WO_Status,
                Maintenance_Cost, Downtime_Type, Downtime_Hours, Lost_BOE, Health_Index
            )
            VALUES (
                source.record_id_int, source.date, source.asset_id, source.asset_name, source.area,
                source.availability_d, source.reliability_d, source.mtbf_d, source.mttr_d,
                source.wo_type, source.wo_status, source.maintenance_cost_d, source.downtime_type,
                source.downtime_hours_d, source.lost_boe_d, source.health_index_d
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT 'MERGE (Insert, Update, Delete) operation for airms completed successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END