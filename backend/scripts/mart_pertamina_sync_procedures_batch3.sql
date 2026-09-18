-- Third batch of draft sp_sync_* procedures — the "produksi splits".
-- app.produksi_monitoring is wide (one row per day, one column per
-- field/metric); these mart tables are long (one row per field per
-- metric per day), so each app row fans out into several mart rows.
--
-- Full column -> mart mapping (matches Template - Produksi.xlsx exactly):
--   produksi_pupo_sot_bopd  <- kolom B-E (Target, Real, Donggi, Matindok)
--   produksi_operasi_bopd   <- kolom F-I (Target, Real, Donggi, Matindok)
--   produksi_gas_mmscfd     <- kolom J-W (7 metrik x Donggi/Matindok)
--   produksi_oil_bbls       <- kolom X-AA (Processed Water, Water Injection,
--                              Closing Stock, ACTL)
--   safemanhours            <- kolom AB (satu-satunya kolom Safe Man Hours
--                              di template; safe_man_hours_actl BUKAN
--                              sumber yang benar — lihat catatan di bawah)
--
-- Target/Real (pupo_sot, operasi) dan ACTL/Processed Water/dst (oil_bbls)
-- tidak dipecah per field di template, jadi sandifield NULL untuk baris-baris
-- itu — sama seperti pola yang sudah dipakai safemanhours.

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_gas_mmscfd
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.produksi_gas_mmscfd;

        -- keterangan sekarang menyimpan NAMA METRIK (bukan nama field lagi —
        -- field-nya ada di sandifield via join), supaya ke-7 metrik per field
        -- (Prod, Own Use, Sales, Main Flare, Acid Flare, Venting CO2, Losses)
        -- bisa dibedakan satu sama lain.
        INSERT INTO mart_pertamina.produksi_gas_mmscfd (periodedata, sandifield, jumlah, keterangan)
        SELECT p.tanggal, fd.idfield, v.jumlah, v.keterangan
        FROM app.produksi_monitoring p
        LEFT JOIN mart_pertamina.field fd ON fd.kode = 'DONGGI'
        CROSS APPLY (VALUES
            (p.donggi_prod,        'PROD'),
            (p.donggi_own_use,     'OWN_USE'),
            (p.donggi_sales,       'SALES'),
            (p.donggi_main_flare,  'MAIN_FLARE'),
            (p.donggi_acid_flare,  'ACID_FLARE'),
            (p.donggi_venting_co2, 'VENTING_CO2'),
            (p.donggi_losses,      'LOSSES')
        ) v(jumlah, keterangan)
        WHERE v.jumlah IS NOT NULL
        UNION ALL
        SELECT p.tanggal, fm.idfield, v.jumlah, v.keterangan
        FROM app.produksi_monitoring p
        LEFT JOIN mart_pertamina.field fm ON fm.kode = 'MATINDOK'
        CROSS APPLY (VALUES
            (p.matindok_prod,        'PROD'),
            (p.matindok_own_use,     'OWN_USE'),
            (p.matindok_sales,       'SALES'),
            (p.matindok_main_flare,  'MAIN_FLARE'),
            (p.matindok_acid_flare,  'ACID_FLARE'),
            (p.matindok_venting_co2, 'VENTING_CO2'),
            (p.matindok_losses,      'LOSSES')
        ) v(jumlah, keterangan)
        WHERE v.jumlah IS NOT NULL;

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
        WHERE p.op_matindok IS NOT NULL
        UNION ALL
        SELECT p.tanggal, NULL, TRY_CAST(ROUND(p.op_target, 0) AS DECIMAL(38,0)), 'TARGET'
        FROM app.produksi_monitoring p
        WHERE p.op_target IS NOT NULL
        UNION ALL
        SELECT p.tanggal, NULL, TRY_CAST(ROUND(p.op_real, 0) AS DECIMAL(38,0)), 'REAL'
        FROM app.produksi_monitoring p
        WHERE p.op_real IS NOT NULL;

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
        WHERE p.pupo_sot_matindok IS NOT NULL
        UNION ALL
        SELECT CONVERT(NVARCHAR(50), p.tanggal, 23), NULL, TRY_CAST(ROUND(p.pupo_sot_target, 0) AS INT), 'TARGET'
        FROM app.produksi_monitoring p
        WHERE p.pupo_sot_target IS NOT NULL
        UNION ALL
        SELECT CONVERT(NVARCHAR(50), p.tanggal, 23), NULL, TRY_CAST(ROUND(p.pupo_sot_real, 0) AS INT), 'REAL'
        FROM app.produksi_monitoring p
        WHERE p.pupo_sot_real IS NOT NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Kolom X-AA di template (merge X1:AA1 = "BBLS - DONGGI MATINDOK FIELD")
-- adalah 1 angka gabungan Donggi+Matindok per metrik, bukan per field —
-- sama seperti Target/Real di atas, sandifield tetap NULL.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_produksi_oil_bbls
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.produksi_oil_bbls;

        INSERT INTO mart_pertamina.produksi_oil_bbls (periodedata, sandifield, jumlah, keterangan)
        SELECT p.tanggal, NULL, p.bbls_processed_water, 'PROCESSED_WATER'
        FROM app.produksi_monitoring p
        WHERE p.bbls_processed_water IS NOT NULL
        UNION ALL
        SELECT p.tanggal, NULL, p.bbls_water_injection, 'WATER_INJECTION'
        FROM app.produksi_monitoring p
        WHERE p.bbls_water_injection IS NOT NULL
        UNION ALL
        SELECT p.tanggal, NULL, p.bbls_closing_stock, 'CLOSING_STOCK'
        FROM app.produksi_monitoring p
        WHERE p.bbls_closing_stock IS NOT NULL
        UNION ALL
        SELECT p.tanggal, NULL, p.bbls_actl, 'ACTL'
        FROM app.produksi_monitoring p
        WHERE p.bbls_actl IS NOT NULL;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END
GO

-- Sumber diganti dari safe_man_hours_actl -> safe_man_hours_dmf.
-- Alasan: kolom AA di template ("ACTL") ternyata bagian grup BBLS
-- (lihat sp_sync_produksi_oil_bbls di atas), BUKAN Safe Man Hours.
-- safe_man_hours_actl adalah hasil salah petakan lama; kolom AB
-- (safe_man_hours_dmf, "SAFE MAN HOURS | DONGGI MATINDOK FIELD") adalah
-- satu-satunya kolom Safe Man Hours yang benar-benar ada di template.
CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_safemanhours
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRY
        BEGIN TRANSACTION;

        TRUNCATE TABLE mart_pertamina.safemanhours;

        INSERT INTO mart_pertamina.safemanhours (periodedata, sandifield, jumlah)
        SELECT p.tanggal, NULL, TRY_CAST(ROUND(p.safe_man_hours_dmf, 0) AS INT)
        FROM app.produksi_monitoring p
        WHERE p.safe_man_hours_dmf IS NOT NULL;

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
