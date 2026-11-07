CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_moc
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                moc_number,
                CAST(change_desc AS VARCHAR(MAX)) AS change_desc_v,  -- cast to varchar(max) first; TEXT assignment below
                issued_date,
                done,
                moc_owner,
                last_updated,
                ongoing_step,
                pic,
                status,
                CASE
                    WHEN field = 'DONGGI'   THEN 1
                    WHEN field = 'MATINDOK' THEN 2
                    ELSE 99
                END AS idfield,
                ROW_NUMBER() OVER (
                    PARTITION BY moc_number
                    ORDER BY reporting_year DESC, reporting_month DESC
                ) AS rn
            FROM app.moc_monitoring
        )
        SELECT
            moc_number, change_desc_v, issued_date, done, moc_owner,
            last_updated, ongoing_step, pic, status, idfield
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.moc) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('sp_sync_moc aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.moc_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.moc AS target
        USING #src_final AS source
        ON target.moc_number = source.moc_number

        WHEN MATCHED THEN
            UPDATE SET
                target.change_desc   = source.change_desc_v,
                target.issued_date   = source.issued_date,
                target.done          = source.done,
                target.moc_owner     = source.moc_owner,
                target.last_updated  = source.last_updated,
                target.ongoing_step  = source.ongoing_step,
                target.pic           = source.pic,
                target.status        = source.status,
                target.idfield       = source.idfield

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                moc_number, change_desc, issued_date, done, moc_owner,
                last_updated, ongoing_step, pic, status, idfield
            )
            VALUES (
                source.moc_number, source.change_desc_v, source.issued_date, source.done, source.moc_owner,
                source.last_updated, source.ongoing_step, source.pic, source.status, source.idfield
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT 'MERGE (Insert, Update, Delete) operation for moc completed successfully.';
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