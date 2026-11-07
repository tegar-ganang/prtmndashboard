CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_target
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_unpivoted AS (
            SELECT reporting_year, reporting_month, target_dmf AS value,
                   'GAS' AS jenis, 'RKAP' AS jenis_target, created_at, updated_at
            FROM app.produksi_target

            UNION ALL

            SELECT reporting_year, reporting_month, target_gas_wpb AS value,
                   'GAS' AS jenis, 'WP&B' AS jenis_target, created_at, updated_at
            FROM app.produksi_target

            UNION ALL

            SELECT reporting_year, reporting_month, target_kondensat_rkap AS value,
                   'KONDENSAT' AS jenis, 'RKAP' AS jenis_target, created_at, updated_at
            FROM app.produksi_target

            UNION ALL

            SELECT reporting_year, reporting_month, target_kondensat_wpb AS value,
                   'KONDENSAT' AS jenis, 'WP&B' AS jenis_target, created_at, updated_at
            FROM app.produksi_target
        ),
        src_dedup AS (
            SELECT
                DATEFROMPARTS(reporting_year, reporting_month, 1) AS periodedata,
                value,
                jenis,
                jenis_target,
                created_at,
                updated_at,
                ROW_NUMBER() OVER (
                    PARTITION BY reporting_year, reporting_month, jenis, jenis_target
                    ORDER BY updated_at DESC
                ) AS rn
            FROM src_unpivoted
        )
        SELECT periodedata, value, jenis, jenis_target, created_at, updated_at
        INTO #src_final
        FROM src_dedup
        WHERE rn = 1;

        -- SAFETY GATE 1: confirm (periodedata, jenis, jenis_target) is unique
        -- after dedup.
        IF EXISTS (
            SELECT periodedata, jenis, jenis_target
            FROM #src_final
            GROUP BY periodedata, jenis, jenis_target
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_target aborted: duplicate (periodedata, jenis, jenis_target) found in source after dedup. Check app.produksi_target for true duplicate periods.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 2: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.produksi_target) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_target aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.produksi_target source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.produksi_target AS target
        USING #src_final AS source
        ON  target.periodedata  = source.periodedata
        AND target.jenis        = source.jenis
        AND target.jenis_target = source.jenis_target

        WHEN MATCHED THEN
            UPDATE SET
                target.value      = source.value,
                target.updated_at = source.updated_at
                -- created_at and id intentionally untouched on update

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (periodedata, value, jenis, jenis_target, created_at, updated_at)
            VALUES (source.periodedata, source.value, source.jenis,
                    source.jenis_target, source.created_at, source.updated_at)
            -- id excluded entirely — IDENTITY assigns it automatically

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for produksi_target completed successfully.';
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