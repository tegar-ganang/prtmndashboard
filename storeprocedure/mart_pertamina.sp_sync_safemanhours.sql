CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_safemanhours
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                tanggal,
                CAST(3 AS BIGINT) AS sandifield,
                CAST(ROUND(safe_man_hours_dmf, 0) AS INT) AS jumlah,
                ROW_NUMBER() OVER (
                    PARTITION BY tanggal
                    ORDER BY safe_man_hours_dmf DESC
                ) AS rn
            FROM app.produksi_monitoring
        )
        SELECT tanggal, sandifield, jumlah
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.safemanhours) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_safemanhours aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.produksi_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.safemanhours AS target
        USING #src_final AS source
        ON  target.periodedata = source.tanggal
        AND target.sandifield  = source.sandifield

        WHEN MATCHED THEN
            UPDATE SET
                target.jumlah = source.jumlah

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (periodedata, sandifield, jumlah)
            VALUES (source.tanggal, source.sandifield, source.jumlah)

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for safemanhours completed successfully.';
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