CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_abi
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                ref_wbs,
                wbs,
                TRY_CAST(REPLACE(REPLACE(nilai_usd,                 CHAR(160), ''), ',', '') AS FLOAT) AS nilai_usd_f,
                TRY_CAST(REPLACE(REPLACE(nilai_idr,                 CHAR(160), ''), ',', '') AS FLOAT) AS nilai_idr_f,
                TRY_CAST(REPLACE(REPLACE(nilai_percent,             CHAR(160), ''), ',', '') AS FLOAT) AS nilai_percent_f,
                TRY_CAST(REPLACE(REPLACE(commitment_nilai_idr,      CHAR(160), ''), ',', '') AS FLOAT) AS commitment_nilai_idr_f,
                TRY_CAST(REPLACE(REPLACE(commitment_percent_idr,    CHAR(160), ''), ',', '') AS FLOAT) AS commitment_percent_idr_f,
                TRY_CAST(REPLACE(REPLACE(sa_approved_ppn_idr,       CHAR(160), ''), ',', '') AS FLOAT) AS sa_approved_ppn_idr_f,
                TRY_CAST(REPLACE(REPLACE(sa_approved_ppn_percent,   CHAR(160), ''), ',', '') AS FLOAT) AS sa_approved_ppn_percent_f,
                TRY_CAST(REPLACE(REPLACE(actual_invoice_nilai_idr,  CHAR(160), ''), ',', '') AS FLOAT) AS actual_invoice_nilai_idr_f,
                TRY_CAST(REPLACE(REPLACE(actual_invoice_percent,    CHAR(160), ''), ',', '') AS FLOAT) AS actual_invoice_percent_f,
                TRY_CAST(REPLACE(REPLACE(sisa_anggaran_nilai_idr,   CHAR(160), ''), ',', '') AS FLOAT) AS sisa_anggaran_nilai_idr_f,
                TRY_CAST(REPLACE(REPLACE(sisa_anggaran_percent_idr, CHAR(160), ''), ',', '') AS FLOAT) AS sisa_anggaran_percent_idr_f,
                TRY_CAST(REPLACE(REPLACE(nilai_total_abi,           CHAR(160), ''), ',', '') AS FLOAT) AS nilai_total_abi_f,
                CAST(keterangan_1 AS VARCHAR(MAX)) AS keterangan_1_v,
                CAST(keterangan_2 AS VARCHAR(MAX)) AS keterangan_2_v,
                DATEFROMPARTS(reporting_year, reporting_month, 1) AS periodedata,
                ROW_NUMBER() OVER (
                    PARTITION BY ref_wbs, wbs, reporting_year, reporting_month
                    ORDER BY (SELECT NULL)
                ) AS rn
            FROM app.abi_monitoring
        )
        SELECT
            ref_wbs, wbs, nilai_usd_f, nilai_idr_f, nilai_percent_f,
            commitment_nilai_idr_f, commitment_percent_idr_f, sa_approved_ppn_idr_f,
            sa_approved_ppn_percent_f, actual_invoice_nilai_idr_f, actual_invoice_percent_f,
            sisa_anggaran_nilai_idr_f, sisa_anggaran_percent_idr_f, nilai_total_abi_f,
            keterangan_1_v, keterangan_2_v, periodedata
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        IF EXISTS (
            SELECT ref_wbs, wbs, periodedata
            FROM #src_final
            GROUP BY ref_wbs, wbs, periodedata
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_abi aborted: duplicate (ref_wbs, wbs, periodedata) found in source after dedup. Check app.abi_monitoring for true duplicates.', 16, 1);
            RETURN;
        END

        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.abi) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_abi aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.abi_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.abi AS target
        USING #src_final AS source
        ON  target.ref_wbs     = source.ref_wbs
        AND target.wbs         = source.wbs
        AND target.periodedata = source.periodedata

        WHEN MATCHED THEN
            UPDATE SET
                target.nilai_usd                 = source.nilai_usd_f,
                target.nilai_idr                 = source.nilai_idr_f,
                target.nilai_percent             = source.nilai_percent_f,
                target.commitment_nilai_idr      = source.commitment_nilai_idr_f,
                target.commitment_percent_idr    = source.commitment_percent_idr_f,
                target.sa_approved_ppn_idr       = source.sa_approved_ppn_idr_f,
                target.sa_approved_ppn_percent   = source.sa_approved_ppn_percent_f,
                target.actual_invoice_nilai_idr  = source.actual_invoice_nilai_idr_f,
                target.actual_invoice_percent    = source.actual_invoice_percent_f,
                target.sisa_anggaran_nilai_idr   = source.sisa_anggaran_nilai_idr_f,
                target.sisa_anggaran_percent_idr = source.sisa_anggaran_percent_idr_f,
                target.nilai_total_abi           = source.nilai_total_abi_f,
                target.keterangan_1              = source.keterangan_1_v,
                target.keterangan_2              = source.keterangan_2_v

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                ref_wbs, wbs, nilai_usd, nilai_idr, nilai_percent,
                commitment_nilai_idr, commitment_percent_idr, sa_approved_ppn_idr,
                sa_approved_ppn_percent, actual_invoice_nilai_idr, actual_invoice_percent,
                sisa_anggaran_nilai_idr, sisa_anggaran_percent_idr, nilai_total_abi,
                keterangan_1, keterangan_2, periodedata
            )
            VALUES (
                source.ref_wbs, source.wbs, source.nilai_usd_f, source.nilai_idr_f, source.nilai_percent_f,
                source.commitment_nilai_idr_f, source.commitment_percent_idr_f, source.sa_approved_ppn_idr_f,
                source.sa_approved_ppn_percent_f, source.actual_invoice_nilai_idr_f, source.actual_invoice_percent_f,
                source.sisa_anggaran_nilai_idr_f, source.sisa_anggaran_percent_idr_f, source.nilai_total_abi_f,
                source.keterangan_1_v, source.keterangan_2_v, source.periodedata
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for abi completed successfully.';
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