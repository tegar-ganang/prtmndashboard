CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_lopa
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                s.field,
                s.function_no,
                s.function_name,
                s.function_description,
                s.final_element,
                s.recommendation,
                s.rrf_gap_value,
                s.rrf_gap_type,
                s.responsibility_pic,
                s.target_date,
                s.reminder_status,
                s.response_progress,
                s.status,
                s.evidence,
                s.completion_date,
                -- NO = trailing digits of FUNCTION_NO, e.g. 'LOPA-01' -> '01'
                CASE
                    WHEN PATINDEX('%[^0-9]%', REVERSE(c.fn_clean)) = 0
                        THEN NULLIF(c.fn_clean, '')
                    ELSE NULLIF(RIGHT(c.fn_clean, PATINDEX('%[^0-9]%', REVERSE(c.fn_clean)) - 1), '')
                END AS no_num,
                DATEFROMPARTS(s.reporting_year, s.reporting_month, 1) AS periodedata,
                ROW_NUMBER() OVER (
                    PARTITION BY s.function_no, DATEFROMPARTS(s.reporting_year, s.reporting_month, 1)
                    ORDER BY s.updated_at DESC
                ) AS rn
            FROM app.lopa_monitoring s
            CROSS APPLY (
                SELECT LTRIM(RTRIM(REPLACE(s.function_no, CHAR(160), ''))) AS fn_clean
            ) c
        )
        SELECT
            field, function_no, no_num, function_name, function_description, final_element,
            recommendation, rrf_gap_value, rrf_gap_type, responsibility_pic,
            target_date, reminder_status, response_progress, status, evidence,
            completion_date, periodedata
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE 1: key must be unique after dedup
        IF EXISTS (
            SELECT function_no, periodedata
            FROM #src_final
            GROUP BY function_no, periodedata
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_lopa aborted: duplicate (function_no, periodedata) found in source after dedup. Key assumption is invalid — check app.lopa_monitoring.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 2: refuse to wipe the mart when source is empty
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.lopa) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_lopa aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.lopa_monitoring source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.lopa AS target
        USING #src_final AS source
        ON  target.FUNCTION_NO = source.function_no
        AND target.PERIODEDATA = source.periodedata

        WHEN MATCHED THEN
            UPDATE SET
                target.NO                   = source.no_num,
                target.FUNCTION_NAME        = source.function_name,
                target.FUNCTION_DESCRIPTION = source.function_description,
                target.FINAL_ELEMENT        = source.final_element,
                target.RECOMMENDATION       = source.recommendation,
                target.RRF_GAP_VALUE        = source.rrf_gap_value,
                target.RRF_GAP_TYPE         = source.rrf_gap_type,
                target.RESPONSIBILITY_PIC   = source.responsibility_pic,
                target.TARGET_DATE          = source.target_date,
                target.REMINDER_STATUS      = source.reminder_status,
                target.RESPONSE_PROGRESS    = source.response_progress,
                target.STATUS               = source.status,
                target.EVIDENCE             = source.evidence,
                target.COMPLETION_DATE      = source.completion_date,
                target.FIELD                = source.field
                -- SANDI_FIELD intentionally not touched on update

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                NO, FUNCTION_NO, FUNCTION_NAME, FUNCTION_DESCRIPTION, FINAL_ELEMENT,
                RECOMMENDATION, RRF_GAP_VALUE, RRF_GAP_TYPE, RESPONSIBILITY_PIC,
                TARGET_DATE, REMINDER_STATUS, RESPONSE_PROGRESS, STATUS, EVIDENCE,
                COMPLETION_DATE, SANDI_FIELD, PERIODEDATA, FIELD
            )
            VALUES (
                source.no_num, source.function_no, source.function_name, source.function_description, source.final_element,
                source.recommendation, source.rrf_gap_value, source.rrf_gap_type, source.responsibility_pic,
                source.target_date, source.reminder_status, source.response_progress, source.status, source.evidence,
                source.completion_date, NULL, source.periodedata, source.field
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for lopa completed successfully.';
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