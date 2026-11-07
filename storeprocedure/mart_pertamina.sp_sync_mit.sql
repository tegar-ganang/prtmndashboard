CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_mit
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        ;WITH src_ranked AS (
            SELECT
                area,
                reg_lokasi,
                reg_jenis_mit,
                reg_kategori,
                TRY_CAST(reg_tahun AS INT)              AS reg_tahun_int,
                TRY_CAST(reg_no    AS INT)              AS reg_no_int,
                CONVERT(NVARCHAR(10), mit_declaration_date, 23) AS mit_declaration_date_str,
                mit_title_asset,
                integrity_threats,
                possible_scenario,
                consequences,
                CAST(available_safeguard AS NVARCHAR(MAX)) AS available_safeguard_n,
                TRY_CAST(current_likelihood   AS INT)   AS current_likelihood_int,
                TRY_CAST(current_severity     AS INT)   AS current_severity_int,
                TRY_CAST(current_risk_rating  AS INT)   AS current_risk_rating_int,
                rec_no,
                recommendation_action,
                pic,
                CONVERT(VARCHAR(10), target_closing, 23) AS target_closing_str,
                remarks,
                TRY_CAST(target_likelihood   AS INT)    AS target_likelihood_int,
                TRY_CAST(target_severity     AS INT)    AS target_severity_int,
                TRY_CAST(target_risk_rating  AS INT)    AS target_risk_rating_int,
                mit_status,
                evidence_path,
                CONVERT(VARCHAR(10), closing_date, 23)  AS closing_date_str,
                ROW_NUMBER() OVER (
                    PARTITION BY reg_lokasi, reg_jenis_mit, reg_kategori, reg_tahun, reg_no, rec_no
                    ORDER BY reporting_year DESC, reporting_quarter DESC, updated_at DESC
                ) AS rn
            FROM app.mit_monitoring
        )
        MERGE mart_pertamina.mit AS target
        USING (
            SELECT * FROM src_ranked WHERE rn = 1
        ) AS source
        ON  target.noregistration_lokasi   = source.reg_lokasi
        AND target.noregistration_jenismit = source.reg_jenis_mit
        AND target.noregistration_kategori = source.reg_kategori
        AND target.noregistration_tahun    = source.reg_tahun_int
        AND target.noregistration_no       = source.reg_no_int
        AND target.rec_no                  = source.rec_no

        WHEN MATCHED THEN
            UPDATE SET
                target.area                        = source.area,
                target.mitdeclarationdate           = source.mit_declaration_date_str,
                target.mittitleasset                = source.mit_title_asset,
                target.integritythreats             = source.integrity_threats,
                target.possiblescenario             = source.possible_scenario,
                target.consequences                 = source.consequences,
                target.availablesafeguardcontrol    = source.available_safeguard_n,
                target.currentrisk_likelihood       = source.current_likelihood_int,
                target.currentrisk_severity         = source.current_severity_int,
                target.currentrisk_risk             = source.current_risk_rating_int,
                target.recommendationaction         = source.recommendation_action,
                target.pic                          = source.pic,
                target.targetclosing                = source.target_closing_str,
                target.remarks                      = source.remarks,
                target.targetriskafterimplementedrecommendation_likelihood = source.target_likelihood_int,
                target.targetriskafterimplementedrecommendation_severity   = source.target_severity_int,
                target.targetriskafterimplementedrecommendation_risk       = source.target_risk_rating_int,
                target.mitstatus                    = source.mit_status,
                target.evidence                     = source.evidence_path,
                target.closingdate                  = source.closing_date_str
                -- residualrisk_*, progresspercent, overallprogresspercent intentionally
                -- NOT listed here -> existing values in the mart are left untouched.

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                area, noregistration_lokasi, noregistration_jenismit, noregistration_kategori,
                noregistration_tahun, noregistration_no, mitdeclarationdate, mittitleasset,
                integritythreats, possiblescenario, consequences, availablesafeguardcontrol,
                currentrisk_likelihood, currentrisk_severity, currentrisk_risk,
                rec_no, recommendationaction, pic, targetclosing, remarks,
                progresspercent, overallprogresspercent,
                residualriskassessmentdate, residualrisk_likelihood, residualrisk_severity, residualrisk_risk,
                targetriskafterimplementedrecommendation_likelihood,
                targetriskafterimplementedrecommendation_severity,
                targetriskafterimplementedrecommendation_risk,
                mitstatus, evidence, closingdate
            )
            VALUES (
                source.area, source.reg_lokasi, source.reg_jenis_mit, source.reg_kategori,
                source.reg_tahun_int, source.reg_no_int, source.mit_declaration_date_str, source.mit_title_asset,
                source.integrity_threats, source.possible_scenario, source.consequences, source.available_safeguard_n,
                source.current_likelihood_int, source.current_severity_int, source.current_risk_rating_int,
                source.rec_no, source.recommendation_action, source.pic, source.target_closing_str, source.remarks,
                NULL, NULL,                                   -- progresspercent, overallprogresspercent
                NULL, NULL, NULL, NULL,                       -- residualriskassessmentdate, residualrisk_*
                source.target_likelihood_int, source.target_severity_int, source.target_risk_rating_int,
                source.mit_status, source.evidence_path, source.closing_date_str
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        COMMIT TRANSACTION;
        PRINT 'MERGE (Insert, Update, Delete) operation for mit completed successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END