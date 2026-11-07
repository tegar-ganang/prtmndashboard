CREATE OR ALTER PROCEDURE mart_pertamina.usp_MigrateProjectProgressSummary
AS
BEGIN
    -- Prevent extra result sets from interfering with SELECT statements
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Perform an UPSERT and DELETE using MERGE
        MERGE mart_pertamina.project_progress_summary AS target
        USING (
            SELECT 
                id, 
                CAST(CONVERT(BINARY(16), project_id) AS UNIQUEIDENTIFIER) AS project_id, 
                progress_date,
                actual_this_week,
                actual_cumulative,
                plan_this_week,
                plan_cumulative,
                variance_to_plan,
                CAST(created_at AS DATETIMEOFFSET) AS created_at, 
                CAST(updated_at AS DATETIMEOFFSET) AS updated_at  
            FROM app.project_progress_summary
        ) AS source
        ON target.id = source.id

        -- 1. If the ID exists in both tables, UPDATE the record
        WHEN MATCHED THEN
            UPDATE SET 
                target.project_id = source.project_id,
                target.progress_date = source.progress_date,
                target.actual_this_week = source.actual_this_week,
                target.actual_cumulative = source.actual_cumulative,
                target.plan_this_week = source.plan_this_week,
                target.plan_cumulative = source.plan_cumulative,
                target.variance_to_plan = source.variance_to_plan,
                target.updated_at = source.updated_at 

        -- 2. If the ID is new in the source, INSERT the record
        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                id, project_id, progress_date, actual_this_week, actual_cumulative,
                plan_this_week, plan_cumulative, variance_to_plan, created_at, updated_at
            )
            VALUES (
                source.id, source.project_id, source.progress_date, source.actual_this_week, source.actual_cumulative,
                source.plan_this_week, source.plan_cumulative, source.variance_to_plan, source.created_at, source.updated_at
            )
            
        -- 3. If the ID exists in the target but NOT in the source, DELETE the record
        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        COMMIT TRANSACTION;
        PRINT 'MERGE (Insert, Update, Delete) operation for project_progress_summary completed successfully.';
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;

        -- Output the error details for debugging
        DECLARE @ErrorMessage NVARCHAR(4000) = ERROR_MESSAGE();
        DECLARE @ErrorSeverity INT = ERROR_SEVERITY();
        DECLARE @ErrorState INT = ERROR_STATE();

        RAISERROR (@ErrorMessage, @ErrorSeverity, @ErrorState);
    END CATCH
END;
GO