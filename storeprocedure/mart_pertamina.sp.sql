CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_hsse_izin_kerja
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                id_izin,
                tanggal,
                CASE
                    WHEN field = 'DONGGI'   THEN 1
                    WHEN field = 'MATINDOK' THEN 2
                    ELSE 99
                END AS idfield,
                jenis_izin_kerja,
                job_complete,
                TRY_CAST(REPLACE(REPLACE(jumlah_icc, CHAR(160), ''), ',', '') AS INT) AS jumlah_icc_i,
                status_dispensasi,
                jenis_deviasi,
                status_deviasi,
                tingkat_resiko,
                CAST(lokasi AS NVARCHAR(MAX)) AS lokasi_n,
                ROW_NUMBER() OVER (
                    PARTITION BY id_izin, tanggal
                    ORDER BY (SELECT NULL)
                ) AS rn
            FROM app.hsse_monitoring
        )
        SELECT
            id_izin, tanggal, idfield, jenis_izin_kerja, job_complete, jumlah_icc_i,
            status_dispensasi, jenis_deviasi, status_deviasi, tingkat_resiko, lokasi_n
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE 1: confirm (id_izin, tanggal) is unique after dedup.
        -- No timestamp column exists to break ties on a true duplicate —
        -- this only catches duplicates surviving the arbitrary ROW_NUMBER pick.
        IF EXISTS (
            SELECT id_izin, tanggal
            FROM #src_final
            GROUP BY id_izin, tanggal
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_hsse_izin_kerja aborted: duplicate (id_izin, tanggal) found in source after dedup. Check app.hsse_monitoring for true duplicates.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 2: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.hsse_izin_kerja) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_hsse_izin_kerja aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.hsse_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.hsse_izin_kerja AS target
        USING #src_final AS source
        ON  target.idizin  = source.id_izin
        AND target.tanggal = source.tanggal

        WHEN MATCHED THEN
            UPDATE SET
                target.idfield            = source.idfield,
                target.jenis_izin_kerja   = source.jenis_izin_kerja,
                target.job_complete       = source.job_complete,
                target.jumlah_icc         = source.jumlah_icc_i,
                target.status_dispensasi  = source.status_dispensasi,
                target.jenis_deviasi      = source.jenis_deviasi,
                target.status_deviasi     = source.status_deviasi,
                target.tingkat_resiko     = source.tingkat_resiko,
                target.lokasi             = source.lokasi_n

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                idizin, tanggal, idfield, jenis_izin_kerja, job_complete, jumlah_icc,
                status_dispensasi, jenis_deviasi, status_deviasi, tingkat_resiko, lokasi
            )
            VALUES (
                source.id_izin, source.tanggal, source.idfield, source.jenis_izin_kerja,
                source.job_complete, source.jumlah_icc_i, source.status_dispensasi,
                source.jenis_deviasi, source.status_deviasi, source.tingkat_resiko, source.lokasi_n
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for hsse_izin_kerja completed successfully.';
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