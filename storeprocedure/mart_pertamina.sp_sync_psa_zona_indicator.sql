CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_psa_zona_indicator
AS
BEGIN
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        IF OBJECT_ID('tempdb..#src_final') IS NOT NULL
            DROP TABLE #src_final;

        ;WITH src_base AS (
            SELECT
                reporting_year,
                ind_type,
                LOWER(
                    REPLACE(
                        REPLACE(
                            REPLACE(
                                REPLACE(LTRIM(RTRIM(indicator)), ' ', '_'),
                                '-', '_'
                            ),
                            '/', '_'
                        ),
                        '&', 'and'
                    )
                ) AS indicator,
                unit,
                description,
                basis,
                pic_name,
                LOWER(LTRIM(RTRIM(pic_email))) AS pic_email,
                jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, [dec],
                ytd,
                comment,
                ROW_NUMBER() OVER (
                    PARTITION BY
                        reporting_year,
                        ind_type,
                        LOWER(
                            REPLACE(
                                REPLACE(
                                    REPLACE(
                                        REPLACE(LTRIM(RTRIM(indicator)), ' ', '_'),
                                        '-', '_'
                                    ),
                                    '/', '_'
                                ),
                                '&', 'and'
                            )
                        ),
                        LOWER(LTRIM(RTRIM(pic_email)))
                    ORDER BY (SELECT NULL)
                ) AS rn
            FROM app.zona_indicator
        )
        SELECT
            reporting_year, ind_type, indicator, unit, description, basis, pic_name,
            pic_email, jan, feb, mar, apr, may, jun, jul, aug, sep, oct, nov, [dec], ytd, comment
        INTO #src_final
        FROM src_base
        WHERE rn = 1;

        -- SAFETY GATE 1: confirm the key is unique after dedup. No
        -- timestamp/audit column exists in the source to break ties, so
        -- ROW_NUMBER() above picks an arbitrary survivor on a true
        -- duplicate — this gate only catches duplicates surviving that pick.
        IF EXISTS (
            SELECT reporting_year, ind_type, indicator, pic_email
            FROM #src_final
            GROUP BY reporting_year, ind_type, indicator, pic_email
            HAVING COUNT(*) > 1
        )
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_psa_zona_indicator aborted: duplicate (reporting_year, ind_type, indicator, pic_email) found in source after dedup. Check app.zona_indicator for true duplicates.', 16, 1);
            RETURN;
        END

        -- SAFETY GATE 2: refuse to run if source looks suspiciously empty
        -- while target has data.
        IF (SELECT COUNT(*) FROM #src_final) = 0
           AND (SELECT COUNT(*) FROM mart_pertamina.psa_zona_indicator) > 0
        BEGIN
            ROLLBACK TRANSACTION;
            RAISERROR('[ERROR] sp_sync_psa_zona_indicator aborted: source returned 0 rows while target is non-empty. Refusing to delete entire mart — check app.zona_indicator source/extract.', 16, 1);
            RETURN;
        END

        MERGE mart_pertamina.psa_zona_indicator AS target
        USING #src_final AS source
        ON  target.tahun_data = source.reporting_year
        AND target.ind_type   = source.ind_type
        AND ISNULL(target.indicator, '') = ISNULL(source.indicator, '')
        AND ISNULL(LOWER(LTRIM(RTRIM(target.pic_email))), '') = ISNULL(source.pic_email, '')

        WHEN MATCHED AND (
               ISNULL(target.unit, '')        <> ISNULL(source.unit, '')
            OR ISNULL(target.description, '') <> ISNULL(source.description, '')
            OR ISNULL(target.basis, '')       <> ISNULL(source.basis, '')
            OR ISNULL(target.pic_name, '')    <> ISNULL(source.pic_name, '')
            OR ISNULL(target.january, 0)      <> ISNULL(source.jan, 0)
            OR ISNULL(target.february, 0)     <> ISNULL(source.feb, 0)
            OR ISNULL(target.march, 0)        <> ISNULL(source.mar, 0)
            OR ISNULL(target.april, 0)        <> ISNULL(source.apr, 0)
            OR ISNULL(target.may, 0)          <> ISNULL(source.may, 0)
            OR ISNULL(target.june, 0)         <> ISNULL(source.jun, 0)
            OR ISNULL(target.july, 0)         <> ISNULL(source.jul, 0)
            OR ISNULL(target.august, 0)       <> ISNULL(source.aug, 0)
            OR ISNULL(target.september, 0)    <> ISNULL(source.sep, 0)
            OR ISNULL(target.october, 0)      <> ISNULL(source.oct, 0)
            OR ISNULL(target.november, 0)     <> ISNULL(source.nov, 0)
            OR ISNULL(target.december, 0)     <> ISNULL(source.[dec], 0)
            OR ISNULL(target.ytd, 0)          <> ISNULL(source.ytd, 0)
            OR ISNULL(target.comment, '')     <> ISNULL(source.comment, '')
        ) THEN
            UPDATE SET
                target.unit        = source.unit,
                target.description = source.description,
                target.basis       = source.basis,
                target.pic_name    = source.pic_name,
                target.january     = source.jan,
                target.february    = source.feb,
                target.march       = source.mar,
                target.april       = source.apr,
                target.may         = source.may,
                target.june        = source.jun,
                target.july        = source.jul,
                target.august      = source.aug,
                target.september   = source.sep,
                target.october     = source.oct,
                target.november    = source.nov,
                target.december    = source.[dec],
                target.ytd         = source.ytd,
                target.comment     = source.comment

        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                ind_type, indicator, unit, description, basis, pic_name, pic_email,
                january, february, march, april, may, june, july, august,
                september, october, november, december, ytd, comment, tahun_data
            )
            VALUES (
                source.ind_type, source.indicator, source.unit, source.description,
                source.basis, source.pic_name, source.pic_email,
                source.jan, source.feb, source.mar, source.apr, source.may, source.jun,
                source.jul, source.aug, source.sep, source.oct, source.nov, source.[dec],
                source.ytd, source.comment, source.reporting_year
            )

        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        DROP TABLE #src_final;

        COMMIT TRANSACTION;
        PRINT '[SUCCESS] MERGE (Insert, Update, Delete) operation for psa_zona_indicator completed successfully.';
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