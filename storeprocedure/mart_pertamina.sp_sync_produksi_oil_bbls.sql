CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_oil_bbls
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_unpivoted AS (
            SELECT tanggal, CAST(3 AS BIGINT) AS sandifield, bbls_processed_water AS jumlah, 'PROCESSED & PRODUCED WATER' AS keterangan
            FROM app.produksi_monitoring
            WHERE bbls_processed_water IS NOT NULL

            UNION ALL

            SELECT tanggal, CAST(3 AS BIGINT), bbls_water_injection, 'WATER INJECTION'
            FROM app.produksi_monitoring
            WHERE bbls_water_injection IS NOT NULL

            UNION ALL

            SELECT tanggal, CAST(3 AS BIGINT), bbls_closing_stock, 'CLOSING STOCK'
            FROM app.produksi_monitoring
            WHERE bbls_closing_stock IS NOT NULL

            UNION ALL

            SELECT tanggal, CAST(3 AS BIGINT), bbls_actl, 'ACTL'
            FROM app.produksi_monitoring
            WHERE bbls_actl IS NOT NULL
        ),
        src_dedup AS (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY tanggal, sandifield, keterangan
                    ORDER BY (SELECT NULL)
                ) AS rn
            FROM src_unpivoted
        )
        SELECT tanggal, sandifield, jumlah, keterangan
        INTO #src_final
        FROM src_dedup
        WHERE rn = 1;

        IF EXISTS (
            SELECT tanggal, sandifield, keterangan
            FROM #src_final
            GROUP BY tanggal, sandifield, keterangan
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_oil_bbls aborted: duplicate (tanggal, sandifield, keterangan) found after dedup. Check app.produksi_monitoring for conflicting values on the same date.', 16, 1);
            RETURN;
        END

        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.produksi_oil_bbls) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_oil_bbls aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.produksi_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.produksi_oil_bbls AS target
        USING #src_final AS source
        ON  target.periodedata = source.tanggal
        AND target.sandifield  = source.sandifield
        AND ISNULL(target.keterangan, '') = ISNULL(source.keterangan, '')

        WHEN MATCHED THEN
            UPDATE SET target.jumlah = source.jumlah

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (periodedata, sandifield, jumlah, keterangan)
            VALUES (source.tanggal, source.sandifield, source.jumlah, source.keterangan)

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for produksi_oil_bbls completed successfully.';
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