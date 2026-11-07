-- CREATE
-- OR
-- ALTER PROCEDURE mart_pertamina.sp_sync_project AS BEGIN
-- SET
--     NOCOUNT ON;

-- MERGE mart_pertamina.project AS target USING (
--     SELECT
--         id AS project_id,
--         project_name,
--         operational_start_date AS start_date,
--         estimated_completion_date AS end_date,
--         pic AS pic_kerjasama
--     FROM
--         app.project
-- ) AS source ON target.project_id = source.project_id WHEN MATCHED THEN
-- UPDATE
-- SET
--     target.project_name = source.project_name,
--     target.start_date = source.start_date,
--     target.end_date = source.end_date,
--     target.pic_kerjasama = source.pic_kerjasama WHEN NOT MATCHED BY TARGET THEN INSERT (
--         project_id,
--         project_name,
--         start_date,
--         end_date,
--         pic_kerjasama
--     )
-- VALUES
--     (
--         source.project_id,
--         source.project_name,
--         source.start_date,
--         source.end_date,
--         source.pic_kerjasama
--     );

-- END;

CREATE OR ALTER PROCEDURE mart_pertamina.sp_sync_project
AS 
BEGIN
    -- Prevent extra result sets from interfering with SELECT statements
    SET NOCOUNT ON;

    BEGIN TRY
        BEGIN TRANSACTION;

        -- Perform an UPSERT and DELETE using MERGE
        MERGE mart_pertamina.project AS target 
        USING (
            SELECT
                -- Convert integer ID to deterministic UNIQUEIDENTIFIER
                CAST(CONVERT(BINARY(16), id) AS UNIQUEIDENTIFIER) AS project_id,
                project_name,
                operational_start_date AS start_date,
                estimated_completion_date AS end_date,
                pic AS pic_kerjasama
            FROM
                app.project
        ) AS source 
        ON target.project_id = source.project_id 
        
        -- 1. If the project_id exists in both tables, UPDATE the record
        WHEN MATCHED THEN
            UPDATE SET
                target.project_name = source.project_name,
                target.start_date = source.start_date,
                target.end_date = source.end_date,
                target.pic_kerjasama = source.pic_kerjasama 
                
        -- 2. If the project_id is new in the source, INSERT the record
        WHEN NOT MATCHED BY TARGET THEN 
            INSERT (
                project_id,
                project_name,
                start_date,
                end_date,
                pic_kerjasama
            )
            VALUES (
                source.project_id,
                source.project_name,
                source.start_date,
                source.end_date,
                source.pic_kerjasama
            )
            
        -- 3. If the project_id exists in the target but NOT in the source, DELETE the record
        WHEN NOT MATCHED BY SOURCE THEN 
            DELETE;

        COMMIT TRANSACTION;
        PRINT 'MERGE (Insert, Update, Delete) operation for project completed successfully.';
        
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
