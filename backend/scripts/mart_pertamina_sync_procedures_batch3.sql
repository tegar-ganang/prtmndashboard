-- Third batch of sync procedures - the produksi splits (app.produksi_monitoring / produksi_target ->
-- mart_pertamina.produksi_*, safemanhours). All six are copied from the `master` database (Farrel's
-- versions) and replace our earlier drafts. Rule: follow master; only add to it when something is missing.
-- Copied via OBJECT_DEFINITION; a mangled character in the source (a dash) was replaced by '-'.

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
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_operasi_bopd
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_unpivoted AS (
            SELECT tanggal, CAST(3 AS BIGINT) AS sandifield, op_target AS jumlah, 'TARGET' AS keterangan
            FROM app.produksi_monitoring

            UNION ALL

            SELECT tanggal, CAST(1 AS BIGINT), op_donggi, NULL
            FROM app.produksi_monitoring

            UNION ALL

            SELECT tanggal, CAST(2 AS BIGINT), op_matindok, NULL
            FROM app.produksi_monitoring
        ),
        src_dedup AS (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY tanggal, sandifield, ISNULL(keterangan, '')
                    ORDER BY (SELECT NULL)
                ) AS rn
            FROM src_unpivoted
        )
        SELECT tanggal, sandifield, jumlah, keterangan
        INTO #src_final
        FROM src_dedup
        WHERE rn = 1;

        IF EXISTS (
            SELECT tanggal, sandifield, ISNULL(keterangan, '')
            FROM #src_final
            GROUP BY tanggal, sandifield, ISNULL(keterangan, '')
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_operasi_bopd aborted: duplicate (tanggal, sandifield, keterangan) found after dedup. Check app.produksi_monitoring for conflicting values on the same date.', 16, 1);
            RETURN;
        END

        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.produksi_operasi_bopd) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_operasi_bopd aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.produksi_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.produksi_operasi_bopd AS target
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
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for produksi_operasi_bopd completed successfully.';
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
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_pupo_sot_bopd
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_unpivoted AS (
            SELECT tanggal, CAST(3 AS BIGINT) AS sandifield, pupo_sot_target AS jumlah, 'TARGET' AS keterangan
            FROM app.produksi_monitoring

            UNION ALL

            SELECT tanggal, CAST(1 AS BIGINT), pupo_sot_donggi, NULL
            FROM app.produksi_monitoring

            UNION ALL

            SELECT tanggal, CAST(2 AS BIGINT), pupo_sot_matindok, NULL
            FROM app.produksi_monitoring
        ),
        src_dedup AS (
            SELECT *,
                ROW_NUMBER() OVER (
                    PARTITION BY tanggal, sandifield, ISNULL(keterangan, '')
                    ORDER BY (SELECT NULL)
                ) AS rn
            FROM src_unpivoted
        )
        SELECT tanggal, sandifield, jumlah, keterangan
        INTO #src_final
        FROM src_dedup
        WHERE rn = 1;

        IF EXISTS (
            SELECT tanggal, sandifield, ISNULL(keterangan, '')
            FROM #src_final
            GROUP BY tanggal, sandifield, ISNULL(keterangan, '')
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_pupo_sot_bopd aborted: duplicate (tanggal, sandifield, keterangan) found after dedup. Check app.produksi_monitoring for conflicting values on the same date.', 16, 1);
            RETURN;
        END

        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.produksi_pupo_sot_bopd) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_produksi_pupo_sot_bopd aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.produksi_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.produksi_pupo_sot_bopd AS target
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
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for produksi_pupo_sot_bopd completed successfully.';
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
GO

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
GO

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
GO

-- sp_sync_produksi_target: copied from the `master` database (Farrel's version: MERGE + dedupe +
-- safety gates), replacing our earlier draft. Unpivots app.produksi_target's value columns
-- (target_dmf, target_gas_wpb, target_kondensat_rkap, target_kondensat_wpb) into 4 mart rows per
-- (year, month): jenis GAS/KONDENSAT x jenis_target RKAP/WP&B. The legacy target_kondensat column is unused.
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
GO
