-- Fourth batch: PSAIMS Monitoring and the LCV training tables.
-- Confirmed by the user these ARE sourced from existing app modules
-- (zona_indicator / lcv_monitoring) under different mart-side names.

-- app.zona_indicator only tracks one set of monthly values (no plan vs
-- actual split), so this only fills realisasi_jan..dec — rencana_jan..dec,
-- kumulatif_rencana, kinerja, kinerja_keseluruhan, bulandata and elemen
-- have no source and stay NULL. Deduped by (elemen_psaims, program,
-- keterangan_program, pic) — that's the table's unique constraint — in
-- case the same indicator ever shows up for more than one reporting year.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_psaims_monitoring
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.psaims_monitoring;

        ;WITH ranked AS (
            SELECT
                z.ind_type, z.indicator, z.description, z.pic_name,
                z.jan, z.feb, z.mar, z.apr, z.may, z.jun, z.jul, z.aug, z.sep, z.oct, z.nov, z.dec,
                z.ytd, z.comment, z.reporting_year,
                ROW_NUMBER() OVER (PARTITION BY z.ind_type, z.indicator, z.description, z.pic_name ORDER BY z.reporting_year DESC) AS rn
            FROM app.zona_indicator z
        )
        INSERT INTO mart_pertamina.psaims_monitoring (
            elemen_psaims, program, keterangan_program, pic,
            realisasi_jan, realisasi_feb, realisasi_mar, realisasi_apr, realisasi_may, realisasi_jun,
            realisasi_jul, realisasi_aug, realisasi_sep, realisasi_oct, realisasi_nov, realisasi_dec,
            kumulatif_realisasi, keterangan, tahundata
        )
        SELECT
            ind_type, indicator, description, pic_name,
            jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, dec,
            ytd, comment, reporting_year
        FROM ranked WHERE rn = 1;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Populates lcv_karyawan, lcv_pelatihan, and lcv_pesertaPelatihan together
-- (all 3 Log Data rows for these point at this same procedure) — they're
-- FK-linked so they have to be rebuilt in this order in one transaction.
--
-- app.lcv_monitoring only tracks training completion as one Selesai/Belum
-- flag per training TYPE per employee, not per dated session, so:
--   - lcv_karyawan: one row per nip (latest reporting year wins — the
--     mart table's PK is nip alone, no year column)
--   - lcv_pelatihan: a fixed 5-row catalog, one per training type in
--     app.lcv_monitoring, with Jan 1 - Dec 31 of the latest reporting
--     year as a placeholder date range — there's no real per-session
--     date anywhere to source this from
--   - lcv_pesertaPelatihan: the 5 training flag columns unpivoted into
--     one participation row each
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_lcv_training
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        -- TRUNCATE is blocked on any table referenced by an FK constraint no
        -- matter how many rows the referencing table has, so lcv_karyawan/
        -- lcv_pelatihan (referenced by lcv_pesertaPelatihan) use DELETE
        -- instead — safe here since neither has an identity column to reset.
        TRUNCATE TABLE mart_pertamina.lcv_pesertaPelatihan;
        DELETE FROM mart_pertamina.lcv_karyawan;
        DELETE FROM mart_pertamina.lcv_pelatihan;

        SELECT
            nip, namapegawai, departemen, tahun_int AS tahun,
            lcv_conflictofinterest, lcv_codeofconduct, lcv_laporgratifikasi, lcv_sosialisasi_lcv, lcv_lhkpn,
            training_isec, training_lcv, trainining_virtualdemoroomhsse, training_stressmanagement, training_fraudawareness
        INTO #latest_lcv
        FROM (
            SELECT m.nip, m.namapegawai, m.departemen, TRY_CAST(m.tahun AS INT) AS tahun_int,
                   m.lcv_conflictofinterest, m.lcv_codeofconduct, m.lcv_laporgratifikasi, m.lcv_sosialisasi_lcv, m.lcv_lhkpn,
                   m.training_isec, m.training_lcv, m.trainining_virtualdemoroomhsse, m.training_stressmanagement, m.training_fraudawareness,
                   ROW_NUMBER() OVER (PARTITION BY m.nip ORDER BY TRY_CAST(m.tahun AS INT) DESC) AS rn
            FROM app.lcv_monitoring m
            WHERE m.nip IS NOT NULL
        ) ranked
        WHERE ranked.rn = 1;

        INSERT INTO mart_pertamina.lcv_karyawan (
            nip, namapegawai, departemen, tahun, lcv_conflictofinterest, lcv_codeofconduct, lcv_laporgratifikasi, lcv_sosialisasi_lcv, lcv_lhkpn
        )
        SELECT nip, namapegawai, departemen, tahun, lcv_conflictofinterest, lcv_codeofconduct, lcv_laporgratifikasi, lcv_sosialisasi_lcv, lcv_lhkpn
        FROM #latest_lcv;

        DECLARE @year INT = (SELECT MAX(tahun) FROM #latest_lcv);
        IF @year IS NULL SET @year = YEAR(GETDATE());

        INSERT INTO mart_pertamina.lcv_pelatihan (id_pelatihan, nama_pelatihan, tanggal_mulai, tanggal_selesai)
        VALUES
            (1, 'ISEC', DATEFROMPARTS(@year, 1, 1), DATEFROMPARTS(@year, 12, 31)),
            (2, 'LCV', DATEFROMPARTS(@year, 1, 1), DATEFROMPARTS(@year, 12, 31)),
            (3, 'Virtual Demo Room HSSE', DATEFROMPARTS(@year, 1, 1), DATEFROMPARTS(@year, 12, 31)),
            (4, 'Stress Management', DATEFROMPARTS(@year, 1, 1), DATEFROMPARTS(@year, 12, 31)),
            (5, 'Fraud Awareness', DATEFROMPARTS(@year, 1, 1), DATEFROMPARTS(@year, 12, 31));

        INSERT INTO mart_pertamina.lcv_pesertaPelatihan (nip, id_pelatihan, status_kehadiran)
        SELECT nip, 1, training_isec FROM #latest_lcv WHERE training_isec IS NOT NULL
        UNION ALL
        SELECT nip, 2, training_lcv FROM #latest_lcv WHERE training_lcv IS NOT NULL
        UNION ALL
        SELECT nip, 3, trainining_virtualdemoroomhsse FROM #latest_lcv WHERE trainining_virtualdemoroomhsse IS NOT NULL
        UNION ALL
        SELECT nip, 4, training_stressmanagement FROM #latest_lcv WHERE training_stressmanagement IS NOT NULL
        UNION ALL
        SELECT nip, 5, training_fraudawareness FROM #latest_lcv WHERE training_fraudawareness IS NOT NULL;

        DROP TABLE #latest_lcv;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        IF OBJECT_ID('tempdb..#latest_lcv') IS NOT NULL DROP TABLE #latest_lcv;
        THROW;
    END CATCH
END
GO
