-- Third batch of draft sp_sync_* procedures — the "produksi splits".
-- app.produksi_monitoring is wide (one row per day, one column per
-- field/metric); these mart tables are long (one row per field per
-- metric per day), so each app row fans out into 2 mart rows (one per
-- field) for the first three procedures. Counts in Log Data will show
-- mart ~= 2x app for those — that's the transform working as intended,
-- not a bug.

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_gas_mmscfd
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.produksi_gas_mmscfd;

        INSERT INTO mart_pertamina.produksi_gas_mmscfd (periodedata, sandifield, jumlah, keterangan)
        SELECT p.tanggal, fd.idfield, p.donggi_prod, 'DONGGI'
        FROM app.produksi_monitoring p
        LEFT JOIN mart_pertamina.field fd ON fd.kode = 'DONGGI'
        WHERE p.donggi_prod IS NOT NULL
        UNION ALL
        SELECT p.tanggal, fm.idfield, p.matindok_prod, 'MATINDOK'
        FROM app.produksi_monitoring p
        LEFT JOIN mart_pertamina.field fm ON fm.kode = 'MATINDOK'
        WHERE p.matindok_prod IS NOT NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_operasi_bopd
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.produksi_operasi_bopd;

        INSERT INTO mart_pertamina.produksi_operasi_bopd (periodedata, sandifield, jumlah, keterangan)
        SELECT p.tanggal, fd.idfield, TRY_CAST(ROUND(p.op_donggi, 0) AS DECIMAL(38,0)), 'DONGGI'
        FROM app.produksi_monitoring p
        LEFT JOIN mart_pertamina.field fd ON fd.kode = 'DONGGI'
        WHERE p.op_donggi IS NOT NULL
        UNION ALL
        SELECT p.tanggal, fm.idfield, TRY_CAST(ROUND(p.op_matindok, 0) AS DECIMAL(38,0)), 'MATINDOK'
        FROM app.produksi_monitoring p
        LEFT JOIN mart_pertamina.field fm ON fm.kode = 'MATINDOK'
        WHERE p.op_matindok IS NOT NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- periodedata is NVARCHAR(50) here (not DATE like the others) and jumlah
-- is INT — matching mart_pertamina.produksi_pupo_sot_bopd's actual shape.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_pupo_sot_bopd
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.produksi_pupo_sot_bopd;

        INSERT INTO mart_pertamina.produksi_pupo_sot_bopd (periodedata, sandifield, jumlah, keterangan)
        SELECT CONVERT(NVARCHAR(50), p.tanggal, 23), TRY_CAST(fd.idfield AS INT), TRY_CAST(ROUND(p.pupo_sot_donggi, 0) AS INT), 'DONGGI'
        FROM app.produksi_monitoring p
        LEFT JOIN mart_pertamina.field fd ON fd.kode = 'DONGGI'
        WHERE p.pupo_sot_donggi IS NOT NULL
        UNION ALL
        SELECT CONVERT(NVARCHAR(50), p.tanggal, 23), TRY_CAST(fm.idfield AS INT), TRY_CAST(ROUND(p.pupo_sot_matindok, 0) AS INT), 'MATINDOK'
        FROM app.produksi_monitoring p
        LEFT JOIN mart_pertamina.field fm ON fm.kode = 'MATINDOK'
        WHERE p.pupo_sot_matindok IS NOT NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- app.produksi_monitoring doesn't split man-hours by field (only one
-- combined safe_man_hours_actl column), so sandifield stays NULL here —
-- there's nothing to join it against.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_safemanhours
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.safemanhours;

        INSERT INTO mart_pertamina.safemanhours (periodedata, sandifield, jumlah)
        SELECT p.tanggal, NULL, TRY_CAST(ROUND(p.safe_man_hours_actl, 0) AS INT)
        FROM app.produksi_monitoring p
        WHERE p.safe_man_hours_actl IS NOT NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- app.produksi_target has one row per period with two value columns
-- (target_dmf = GAS, target_kondensat = KONDENSAT); mart's produksi_target
-- is long-format (one row per period per jenis). jenis_target is
-- hardcoded to 'RKAP' because that's the only type the app currently
-- produces (see the original bug report this feature came from).
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_target
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.produksi_target;

        INSERT INTO mart_pertamina.produksi_target (periodedata, value, jenis_target, jenis)
        SELECT DATEFROMPARTS(t.reporting_year, t.reporting_month, 1), t.target_dmf, 'RKAP', 'GAS'
        FROM app.produksi_target t
        WHERE t.target_dmf IS NOT NULL
        UNION ALL
        SELECT DATEFROMPARTS(t.reporting_year, t.reporting_month, 1), t.target_kondensat, 'RKAP', 'KONDENSAT'
        FROM app.produksi_target t
        WHERE t.target_kondensat IS NOT NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO
