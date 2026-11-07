CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_gas_mmscfd
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_unpivoted AS (
            -- DONGGI (sandifield = 1)
            SELECT tanggal, CAST(1 AS BIGINT) AS sandifield, donggi_prod AS jumlah, 'PROD' AS keterangan
            FROM app.produksi_monitoring WHERE donggi_prod IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(1 AS BIGINT), donggi_own_use, 'OWN USE'
            FROM app.produksi_monitoring WHERE donggi_own_use IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(1 AS BIGINT), donggi_sales, 'SALES'
            FROM app.produksi_monitoring WHERE donggi_sales IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(1 AS BIGINT), donggi_main_flare, 'MAIN FLARE'
            FROM app.produksi_monitoring WHERE donggi_main_flare IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(1 AS BIGINT), donggi_acid_flare, 'ACID FLARE'
            FROM app.produksi_monitoring WHERE donggi_acid_flare IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(1 AS BIGINT), donggi_venting_co2, 'VENTING CO2'
            FROM app.produksi_monitoring WHERE donggi_venting_co2 IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(1 AS BIGINT), donggi_losses, 'LOSSES'
            FROM app.produksi_monitoring WHERE donggi_losses IS NOT NULL

            UNION ALL

            -- MATINDOK (sandifield = 2)
            SELECT tanggal, CAST(2 AS BIGINT), matindok_prod, 'PROD'
            FROM app.produksi_monitoring WHERE matindok_prod IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(2 AS BIGINT), matindok_own_use, 'OWN USE'
            FROM app.produksi_monitoring WHERE matindok_own_use IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(2 AS BIGINT), matindok_sales, 'SALES'
            FROM app.produksi_monitoring WHERE matindok_sales IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(2 AS BIGINT), matindok_main_flare, 'MAIN FLARE'
            FROM app.produksi_monitoring WHERE matindok_main_flare IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(2 AS BIGINT), matindok_acid_flare, 'ACID FLARE'
            FROM app.produksi_monitoring WHERE matindok_acid_flare IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(2 AS BIGINT), matindok_venting_co2, 'VENTING CO2'
            FROM app.produksi_monitoring WHERE matindok_venting_co2 IS NOT NULL
            UNION ALL
            SELECT tanggal, CAST(2 AS BIGINT), matindok_losses, 'LOSSES'
            FROM app.produksi_monitoring WHERE matindok_losses IS NOT NULL
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
            RAISERROR('[ERROR] sp_sync_produksi_gas_mmscfd aborted: duplicate (tanggal, sandifield, keterangan) found after dedup. Check app.produksi_monitoring for conflicting values on the same date.', 16, 1);
            RETURN;
        END

        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.produksi_gas_mmscfd) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_gas_mmscfd aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.produksi_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.produksi_gas_mmscfd AS target
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
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for produksi_gas_mmscfd completed successfully.';
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