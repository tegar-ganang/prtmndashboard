CREATE   PROCEDURE mart_pertamina.sp_sync_i2aims
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
                TRY_CAST(record_id AS BIGINT)                AS record_id_bi,
                CONVERT(VARCHAR(10), inspection_date, 23)    AS inspection_date_str,
                inspection_date,
                asset_id,
                asset_name,
                asset_type,
                area,
                sce_category,
                integrity_status,
                inspection_result,
                TRY_CAST(inspection_compliance AS FLOAT)         AS inspection_compliance_f,
                TRY_CAST(corrosion_rate        AS FLOAT)         AS corrosion_rate_f,
                TRY_CAST(remaining_life        AS FLOAT)         AS remaining_life_f,
                risk_rank,
                TRY_CAST(anomaly_count         AS INT)           AS anomaly_count_i,
                process_safety_event,
                TRY_CAST(barrier_health        AS DECIMAL(10,2)) AS barrier_health_d,
                recommendation_status,
                TRY_CAST(inspection_cost       AS INT)           AS inspection_cost_i,
                updated_at,
                ROW_NUMBER() OVER (
                    PARTITION BY record_id, inspection_date
                    ORDER BY updated_at DESC
                ) AS rn
            FROM app.i2aims_monitoring
        )
        SELECT
            record_id, record_id_bi, inspection_date_str, asset_id, asset_name, asset_type, area,
            sce_category, integrity_status, inspection_result, inspection_compliance_f,
            corrosion_rate_f, remaining_life_f, risk_rank, anomaly_count_i, process_safety_event,
            barrier_health_d, recommendation_status, inspection_cost_i
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE 1: record_id must cast cleanly, since it's half the
        -- MERGE key. If record_id turns out to be alphanumeric in real
        -- data, this will trip on every run — that's intentional, since
        -- letting a NULL key through causes a false delete + duplicate insert.
        IF EXISTS (
            SELECT 1 FROM #src_final
            WHERE record_id IS NOT NULL AND record_id_bi IS NULL
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('sp_sync_i2aims aborted: found record_id values that cannot be cast to BIGINT. record_id may be alphanumeric — confirm destination column type before proceeding.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 2: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.i2aims) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('sp_sync_i2aims aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.i2aims_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.i2aims AS target
        USING #src_final AS source
        ON  target.record_id       = source.record_id_bi
        AND target.inspection_date = source.inspection_date_str

        WHEN MATCHED THEN
            UPDATE SET
                target.asset_id               = source.asset_id,
                target.asset_name             = source.asset_name,
                target.asset_type             = source.asset_type,
                target.area                   = source.area,
                target.sce_category           = source.sce_category,
                target.integrity_status       = source.integrity_status,
                target.inspection_result      = source.inspection_result,
                target.inspection_compliance  = source.inspection_compliance_f,
                target.corrosion_rate         = source.corrosion_rate_f,
                target.remaining_life         = source.remaining_life_f,
                target.risk_rank              = source.risk_rank,
                target.anomaly_count          = source.anomaly_count_i,
                target.process_safety_event   = source.process_safety_event,
                target.barrier_health         = source.barrier_health_d,
                target.recommendation_status  = source.recommendation_status,
                target.inspection_cost        = source.inspection_cost_i

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                record_id, inspection_date, asset_id, asset_name, asset_type, area,
                sce_category, integrity_status, inspection_result, inspection_compliance,
                corrosion_rate, remaining_life, risk_rank, anomaly_count, process_safety_event,
                barrier_health, recommendation_status, inspection_cost
            )
            VALUES (
                source.record_id_bi, source.inspection_date_str, source.asset_id, source.asset_name,
                source.asset_type, source.area, source.sce_category, source.integrity_status,
                source.inspection_result, source.inspection_compliance_f, source.corrosion_rate_f,
                source.remaining_life_f, source.risk_rank, source.anomaly_count_i,
                source.process_safety_event, source.barrier_health_d, source.recommendation_status,
                source.inspection_cost_i
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT 'MERGE (Insert, Update, Delete) operation for i2aims completed successfully.';
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