CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_lcv_project_charter_budaya
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
                judul_project,
                ROW_NUMBER() OVER (
                    PARTITION BY tanggal, judul_project
                    ORDER BY reporting_year DESC, reporting_month DESC
                ) AS rn
            FROM app.lcv_project_charter_budaya
        )
        SELECT tanggal, judul_project
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.LCV_projectCharterBudaya) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_lcv_project_charter_budaya aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.lcv_project_charter_budaya source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.LCV_projectCharterBudaya AS target
        USING #src_final AS source
        ON  target.tanggal       = source.tanggal
        AND target.judul_project = source.judul_project

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (tanggal, judul_project)
            VALUES (source.tanggal, source.judul_project)

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Delete — no updatable columns) operation for lcv_project_charter_budaya completed successfully.';
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