CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_lcv
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                nip,
                TRY_CAST(REPLACE(REPLACE(tahun, CHAR(160), ''), ',', '') AS INT) AS tahun_i,
                namapegawai,
                departemen,
                lcv_conflictofinterest,
                lcv_codeofconduct,
                lcv_laporgratifikasi,
                lcv_sosialisasi_lcv,
                lcv_lhkpn,
                training_isec,
                training_lcv,
                trainining_virtualdemoroomhsse,
                training_stressmanagement,
                training_fraudawareness,
                projectchapterbudaya,
                ROW_NUMBER() OVER (
                    PARTITION BY nip, tahun
                    ORDER BY reporting_year DESC, reporting_month DESC
                ) AS rn
            FROM app.lcv_monitoring
        )
        SELECT
            nip, tahun_i, namapegawai, departemen, lcv_conflictofinterest, lcv_codeofconduct,
            lcv_laporgratifikasi, lcv_sosialisasi_lcv, lcv_lhkpn, training_isec, training_lcv,
            trainining_virtualdemoroomhsse, training_stressmanagement, training_fraudawareness,
            projectchapterbudaya
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE 1: tahun must cast cleanly, since it's half the
        -- MERGE key. A NULL here would make the row unmatchable, causing
        -- a false delete + duplicate insert, same risk pattern as record_id
        -- in airms/i2aims.
        IF EXISTS (
            SELECT 1 FROM #src_final
            WHERE tahun_i IS NULL
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_lcv aborted: found tahun values that cannot be cast to INT after cleanup. Check app.lcv_monitoring for unexpected formats.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 2: confirm (nip, tahun) is unique after dedup.
        IF EXISTS (
            SELECT nip, tahun_i
            FROM #src_final
            GROUP BY nip, tahun_i
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_lcv aborted: duplicate (nip, tahun) found in source after dedup. Check app.lcv_monitoring for true duplicates.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 3: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.Monitoring_LCV) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_lcv aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.lcv_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.Monitoring_LCV AS target
        USING #src_final AS source
        ON  target.nip   = source.nip
        AND target.tahun = source.tahun_i

        WHEN MATCHED THEN
            UPDATE SET
                target.namapegawai                     = source.namapegawai,
                target.departemen                      = source.departemen,
                target.lcv_conflictofinterest          = source.lcv_conflictofinterest,
                target.lcv_codeofconduct               = source.lcv_codeofconduct,
                target.lcv_laporgratifikasi            = source.lcv_laporgratifikasi,
                target.lcv_sosialisasi_lcv             = source.lcv_sosialisasi_lcv,
                target.lcv_lhkpn                       = source.lcv_lhkpn,
                target.training_isec                   = source.training_isec,
                target.training_lcv                    = source.training_lcv,
                target.trainining_virtualdemoroomhsse  = source.trainining_virtualdemoroomhsse,
                target.training_stressmanagement       = source.training_stressmanagement,
                target.training_fraudawareness         = source.training_fraudawareness,
                target.projectchapterbudaya            = source.projectchapterbudaya

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                nip, tahun, namapegawai, departemen, lcv_conflictofinterest, lcv_codeofconduct,
                lcv_laporgratifikasi, lcv_sosialisasi_lcv, lcv_lhkpn, training_isec, training_lcv,
                trainining_virtualdemoroomhsse, training_stressmanagement, training_fraudawareness,
                projectchapterbudaya
            )
            VALUES (
                source.nip, source.tahun_i, source.namapegawai, source.departemen,
                source.lcv_conflictofinterest, source.lcv_codeofconduct, source.lcv_laporgratifikasi,
                source.lcv_sosialisasi_lcv, source.lcv_lhkpn, source.training_isec, source.training_lcv,
                source.trainining_virtualdemoroomhsse, source.training_stressmanagement,
                source.training_fraudawareness, source.projectchapterbudaya
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for lcv completed successfully.';
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