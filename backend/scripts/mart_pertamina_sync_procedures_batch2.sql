-- Second batch of draft sp_sync_* procedures — same reasoning as
-- mart_pertamina_sync_procedures.sql (none of these existed before either;
-- drafted from scratch by comparing app.* against mart_pertamina.* column
-- by column). Covers the modules added to mart_sync_job in migration
-- a1b2c3martsync4: field (dimension), HAZID, HAZOP, HSSE, both LCV tables,
-- ABI, ABO.

-- field_location -> mart_pertamina.field is a dimension table other synced
-- tables join against by field code (SANDI_FIELD / idfield) — unlike every
-- other proc here, this one does NOT truncate. mart.field.idfield is a
-- plain BIGINT (no IDENTITY), and other tables' FK-style lookups depend on
-- a code keeping the same idfield across runs, so this only inserts codes
-- that are new and refreshes the name for ones that already exist.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_field
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        DECLARE @next_id BIGINT = ISNULL((SELECT MAX(idfield) FROM mart_pertamina.field), 0) + 1;

        ;WITH numbered AS (
            SELECT fl.code, fl.name, ROW_NUMBER() OVER (ORDER BY fl.code) AS rn
            FROM app.field_location fl
            WHERE NOT EXISTS (SELECT 1 FROM mart_pertamina.field f WHERE f.kode = fl.code)
        )
        INSERT INTO mart_pertamina.field (idfield, namafield, kode)
        SELECT @next_id + rn - 1, name, code
        FROM numbered;

        UPDATE f
        SET f.namafield = fl.name
        FROM mart_pertamina.field f
        JOIN app.field_location fl ON fl.code = f.kode;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_hazid
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.hazid;

        INSERT INTO mart_pertamina.hazid (
            [NO], NODE_NO, REC_NO, NODE, GUIDEWORD, HAZARD, CONSEQUENCES, SAFEGUARD, RECOMMENDATION,
            LIKELIHOOD, SEVERITY, RISK, RESPONSIBILITY_PIC, [TYPE], TARGET_DATE, RESPONSE_PROGRESS,
            CATEGORY, SUB_CATEGORY, STATUS, EVIDENCE, COMPLETION_DATE, SANDI_FIELD, periodedata
        )
        SELECT
            NULL,   -- [NO]: app has a UUID id, not a display sequence number
            h.node_no, h.rec_no, h.node, h.guideword, h.hazard, h.consequences, h.safeguard, h.recommendation,
            h.likelihood, h.severity, h.risk, h.responsibility_pic, h.type, h.target_date, h.response_progress,
            h.category, h.sub_category, h.status, h.evidence, h.completion_date,
            f.idfield,
            DATEFROMPARTS(h.reporting_year, h.reporting_month, 1)
        FROM app.hazid_monitoring h
        LEFT JOIN mart_pertamina.field f ON f.kode = h.field;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_hazop
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.hazop;

        INSERT INTO mart_pertamina.hazop (
            [NO], REC_NO, NODE_NO, REC_NO_2, NODE, DEVIATION, POSSIBLE_CAUSE, CONSEQUENCES, SAFEGUARD,
            RECOMMENDATION, LIKELIHOOD, SEVERITY, RISK, RESPONSIBILITY_PIC, [TYPE], TARGET_DATE,
            RESPONSE_PROGRESS, CATEGORY, SUB_CATEGORY, STATUS, EVIDENCE, COMPLETION_DATE, SME,
            SANDI_FIELD, periodedata
        )
        SELECT
            NULL,   -- [NO]: no source
            h.rec_no, h.node_no,
            NULL,   -- REC_NO_2: app only has one rec_no field; mart's second column has no source
            h.node, h.deviation, h.possible_cause, h.consequences, h.safeguard,
            h.recommendation, h.likelihood, h.severity, h.risk, h.responsibility_pic, h.type, h.target_date,
            h.response_progress, h.category, h.sub_category, h.status, h.evidence, h.completion_date, h.sme,
            f.idfield,
            DATEFROMPARTS(h.reporting_year, h.reporting_month, 1)
        FROM app.hazop_monitoring h
        LEFT JOIN mart_pertamina.field f ON f.kode = h.field;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_hsse
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.hsse_izin_kerja;

        INSERT INTO mart_pertamina.hsse_izin_kerja (
            idizin, tanggal, idfield, jenis_izin_kerja, job_complete, jumlah_icc,
            status_dispensasi, jenis_deviasi, status_deviasi, tingkat_resiko, lokasi
        )
        SELECT
            h.id_izin, h.tanggal, f.idfield, h.jenis_izin_kerja, h.job_complete,
            TRY_CAST(h.jumlah_icc AS INT),
            h.status_dispensasi, h.jenis_deviasi, h.status_deviasi, h.tingkat_resiko, h.lokasi
        FROM app.hsse_monitoring h
        LEFT JOIN mart_pertamina.field f ON f.kode = h.field;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- mart_pertamina.LCV_projectCharterBudaya.id_project is an INT NOT NULL
-- primary key; app.lcv_project_charter_budaya.id_project is free-text and
-- not guaranteed unique, so rows without a valid, unique integer are
-- dropped (keeping only the most recent by tanggal per id) instead of
-- failing the whole sync on a PK violation.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_lcv_project_charter_budaya
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.LCV_projectCharterBudaya;

        ;WITH ranked AS (
            SELECT
                TRY_CAST(c.id_project AS INT) AS id_project,
                c.tanggal,
                c.judul_project,
                ROW_NUMBER() OVER (PARTITION BY TRY_CAST(c.id_project AS INT) ORDER BY c.tanggal DESC) AS rn
            FROM app.lcv_project_charter_budaya c
            WHERE TRY_CAST(c.id_project AS INT) IS NOT NULL
              AND c.tanggal IS NOT NULL
              AND c.judul_project IS NOT NULL
        )
        INSERT INTO mart_pertamina.LCV_projectCharterBudaya (id_project, tanggal, judul_project)
        SELECT id_project, tanggal, judul_project
        FROM ranked
        WHERE rn = 1;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_lcv_monitoring
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.Monitoring_LCV;

        INSERT INTO mart_pertamina.Monitoring_LCV (
            namapegawai, nip, departemen, lcv_conflictofinterest, lcv_codeofconduct, lcv_laporgratifikasi,
            lcv_sosialisasi_lcv, lcv_lhkpn, training_isec, training_lcv, trainining_virtualdemoroomhsse,
            training_stressmanagement, training_fraudawareness, projectchapterbudaya, tahun
        )
        SELECT
            m.namapegawai, m.nip, m.departemen, m.lcv_conflictofinterest, m.lcv_codeofconduct, m.lcv_laporgratifikasi,
            m.lcv_sosialisasi_lcv, m.lcv_lhkpn, m.training_isec, m.training_lcv, m.trainining_virtualdemoroomhsse,
            m.training_stressmanagement, m.training_fraudawareness, m.projectchapterbudaya,
            TRY_CAST(m.tahun AS INT)
        FROM app.lcv_monitoring m;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_abi
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.abi;

        INSERT INTO mart_pertamina.abi (
            ref_wbs, wbs, nilai_usd, nilai_idr, nilai_percent, commitment_nilai_idr, commitment_percent_idr,
            sa_approved_ppn_idr, sa_approved_ppn_percent, actual_invoice_nilai_idr, actual_invoice_percent,
            sisa_anggaran_nilai_idr, sisa_anggaran_percent_idr, nilai_total_abi, keterangan_1, keterangan_2,
            periodedata
        )
        SELECT
            a.ref_wbs, a.wbs,
            TRY_CAST(a.nilai_usd AS FLOAT), TRY_CAST(a.nilai_idr AS FLOAT), TRY_CAST(a.nilai_percent AS FLOAT),
            TRY_CAST(a.commitment_nilai_idr AS FLOAT), TRY_CAST(a.commitment_percent_idr AS FLOAT),
            TRY_CAST(a.sa_approved_ppn_idr AS FLOAT), TRY_CAST(a.sa_approved_ppn_percent AS FLOAT),
            TRY_CAST(a.actual_invoice_nilai_idr AS FLOAT), TRY_CAST(a.actual_invoice_percent AS FLOAT),
            TRY_CAST(a.sisa_anggaran_nilai_idr AS FLOAT), TRY_CAST(a.sisa_anggaran_percent_idr AS FLOAT),
            TRY_CAST(a.nilai_total_abi AS FLOAT), a.keterangan_1, a.keterangan_2,
            DATEFROMPARTS(a.reporting_year, a.reporting_month, 1)
        FROM app.abi_monitoring a;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- mart_pertamina.abo has no periodedata column at all (unlike abi) — not
-- an omission, it's just not part of that table's shape. flag is only
-- NVARCHAR(4) in mart but the app column is wider, so truncate defensively
-- (same reasoning as AIRMS's LEFT(...) calls) instead of letting a longer
-- value crash the whole sync.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_abo
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.abo;

        INSERT INTO mart_pertamina.abo (
            no_rk, jenis_kerangka_anggaran,
            anggaranwpb_osf_nilai_usd, anggaranwpb_osf_nilai_idr, anggaranwpb_osf_percent,
            commitment_spk_ppn_nilai_idr, commitment_spk_ppn_percent,
            sa_approved_ppn_nilai_usd, sa_approved_ppn_percent_usd, sa_approved_ppn_nilai_idr, sa_approved_ppn_percent_idr,
            actual_invoice_nilai_usd, actual_invoice_percent_usd, actual_invoice_nilai_idr, actual_invoice_percent_idr,
            sisa_anggaran_nilai_usd, sisa_anggaran_percent_usd, sisa_anggaran_nilai_idr, sisa_anggaran_percent_idr,
            flag
        )
        SELECT
            b.no_rk, b.jenis_kerangka_anggaran,
            TRY_CAST(b.anggaranwpb_osf_nilai_usd AS FLOAT), TRY_CAST(b.anggaranwpb_osf_nilai_idr AS FLOAT), TRY_CAST(b.anggaranwpb_osf_percent AS FLOAT),
            TRY_CAST(b.commitment_spk_ppn_nilai_idr AS FLOAT), TRY_CAST(b.commitment_spk_ppn_percent AS FLOAT),
            TRY_CAST(b.sa_approved_ppn_nilai_usd AS FLOAT), TRY_CAST(b.sa_approved_ppn_percent_usd AS FLOAT),
            TRY_CAST(b.sa_approved_ppn_nilai_idr AS FLOAT), TRY_CAST(b.sa_approved_ppn_percent_idr AS FLOAT),
            TRY_CAST(b.actual_invoice_nilai_usd AS FLOAT), TRY_CAST(b.actual_invoice_percent_usd AS FLOAT),
            TRY_CAST(b.actual_invoice_nilai_idr AS FLOAT), TRY_CAST(b.actual_invoice_percent_idr AS FLOAT),
            TRY_CAST(b.sisa_anggaran_nilai_usd AS FLOAT), TRY_CAST(b.sisa_anggaran_percent_usd AS FLOAT),
            TRY_CAST(b.sisa_anggaran_nilai_idr AS FLOAT), TRY_CAST(b.sisa_anggaran_percent_idr AS FLOAT),
            LEFT(b.flag, 4)
        FROM app.abo_monitoring b;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
