CREATE OR ALTER PROCEDURE mart_pertamina.usp_MigrateProjectProgressData
AS
BEGIN
    -- Prevent extra result sets from interfering with SELECT statements
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Perform an UPSERT and DELETE using MERGE
        MERGE mart_pertamina.project_progress_v2 AS target
        USING (
            SELECT 
                -- Convert integer IDs to deterministic UNIQUEIDENTIFIERs
                id,
                project_id,
                periode_data,
                item_no, 
                description,
                wf,
                previous_week_plan,
                previous_week_actual,
                previous_week_variance,
                this_week_plan,
                this_week_actual,
                this_week_variance,
                to_date_plan,
                to_date_actual,
                to_date_variance,
                remarks,
                CAST(created_at AS DATETIMEOFFSET) AS created_at,
                CAST(updated_at AS DATETIMEOFFSET) AS updated_at
            FROM app.project_progress
        ) AS source
        ON target.id = source.id

        -- 1. If the ID exists in both tables, UPDATE the record
        WHEN MATCHED THEN
            UPDATE SET 
                target.project_id = source.project_id,
                target.periode_data = source.periode_data,
                target.item_no = source.item_no,
                target.description = source.description,
                target.wf = source.wf,
                target.previous_week_plan = source.previous_week_plan,
                target.previous_week_actual = source.previous_week_actual,
                target.previous_week_variance = source.previous_week_variance,
                target.this_week_plan = source.this_week_plan,
                target.this_week_actual = source.this_week_actual,
                target.this_week_variance = source.this_week_variance,
                target.to_date_plan = source.to_date_plan,
                target.to_date_actual = source.to_date_actual,
                target.to_date_variance = source.to_date_variance,
                target.remarks = source.remarks,
                target.updated_at = source.updated_at 

        -- 2. If the ID is new in the source, INSERT the record
        WHEN NOT MATCHED BY TARGET THEN
            INSERT (
                id, project_id, periode_data, item_no, description, wf,
                previous_week_plan, previous_week_actual, previous_week_variance,
                this_week_plan, this_week_actual, this_week_variance,
                to_date_plan, to_date_actual, to_date_variance, remarks,
                created_at, updated_at
            )
            VALUES (
                source.id, source.project_id, source.periode_data, source.item_no, source.description, source.wf,
                source.previous_week_plan, source.previous_week_actual, source.previous_week_variance,
                source.this_week_plan, source.this_week_actual, source.this_week_variance,
                source.to_date_plan, source.to_date_actual, source.to_date_variance, source.remarks,
                source.created_at, source.updated_at
            )

        -- 3. If the ID exists in the target but NOT in the source, DELETE the record
        WHEN NOT MATCHED BY SOURCE THEN
            DELETE;

        COMMIT TRANSACTION;
        PRINT 'MERGE (Insert, Update, Delete) operation for project_progress_v2 completed successfully.';
        
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
