CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_hazid
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                node_no,
                rec_no,
                node,
                guideword,
                hazard,
                consequences,
                safeguard,
                recommendation,
                likelihood,
                severity,
                risk,
                responsibility_pic,
                type,
                target_date,
                response_progress,
                category,
                sub_category,
                status,
                evidence,
                completion_date,
                CASE
                    WHEN field = 'DONGGI'   THEN 1
                    WHEN field = 'MATINDOK' THEN 2
                    ELSE 99
                END AS sandi_field,
                DATEFROMPARTS(reporting_year, reporting_month, 1) AS periodedata,
                ROW_NUMBER() OVER (
                    PARTITION BY node_no, rec_no, node
                    ORDER BY reporting_year DESC, reporting_month DESC
                ) AS rn
            FROM app.hazid_monitoring
        )
        SELECT
            node_no, rec_no, node, guideword, hazard, consequences, safeguard,
            recommendation, likelihood, severity, risk, responsibility_pic, type,
            target_date, response_progress, category, sub_category, status, evidence,
            completion_date, sandi_field, periodedata
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.hazid) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('sp_sync_hazid aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.hazid_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.hazid AS target
        USING #src_final AS source
        ON  target.NODE_NO = source.node_no
        AND target.REC_NO  = source.rec_no
        AND target.NODE    = source.node

        WHEN MATCHED THEN
            UPDATE SET
                target.GUIDEWORD          = source.guideword,
                target.HAZARD             = source.hazard,
                target.CONSEQUENCES       = source.consequences,
                target.SAFEGUARD          = source.safeguard,
                target.RECOMMENDATION     = source.recommendation,
                target.LIKELIHOOD         = source.likelihood,
                target.SEVERITY           = source.severity,
                target.RISK               = source.risk,
                target.RESPONSIBILITY_PIC = source.responsibility_pic,
                target.TYPE               = source.type,
                target.TARGET_DATE        = source.target_date,
                target.RESPONSE_PROGRESS  = source.response_progress,
                target.CATEGORY           = source.category,
                target.SUB_CATEGORY       = source.sub_category,
                target.STATUS             = source.status,
                target.EVIDENCE           = source.evidence,
                target.COMPLETION_DATE    = source.completion_date,
                target.SANDI_FIELD        = source.sandi_field,
                target.periodedata        = source.periodedata
                -- NO intentionally not touched on update

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                NO, NODE_NO, REC_NO, NODE, GUIDEWORD, HAZARD, CONSEQUENCES, SAFEGUARD,
                RECOMMENDATION, LIKELIHOOD, SEVERITY, RISK, RESPONSIBILITY_PIC, TYPE,
                TARGET_DATE, RESPONSE_PROGRESS, CATEGORY, SUB_CATEGORY, STATUS, EVIDENCE,
                COMPLETION_DATE, SANDI_FIELD, periodedata
            )
            VALUES (
                NULL, source.node_no, source.rec_no, source.node, source.guideword, source.hazard,
                source.consequences, source.safeguard, source.recommendation, source.likelihood,
                source.severity, source.risk, source.responsibility_pic, source.type,
                source.target_date, source.response_progress, source.category, source.sub_category,
                source.status, source.evidence, source.completion_date, source.sandi_field, source.periodedata
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT 'MERGE (Insert, Update, Delete) operation for hazid completed successfully.';
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END