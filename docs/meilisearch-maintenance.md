# Meilisearch note index maintenance

Misskey runs note reindexing and index clearing in the `searchIndexMaintenance` job queue. The CLI reads the server configuration and enqueues a job. A running Misskey queue worker executes it. The control panel can show the result under **Performance** or **Job Queue**.

A Meilisearch request may reach the server even when its response is lost. Before sending a write, the worker records a reservation in the job queue's Redis database. Misskey keeps it until Meilisearch reports a terminal task status. The reservation remains after the job fails if the submission or task result is unknown. Subsequent requests then return `SEARCH_INDEX_RECOVERY_REQUIRED`.

## Recover after an unverified write

1. Stop every Misskey process that runs queue workers and verify those processes have exited, including any stalled worker. Keep them stopped until recovery is complete.
2. In the job queue Redis database, inspect the `pending-mutation` hash for the `searchIndexMaintenance` queue. Its full key is `queue:searchIndexMaintenance:searchIndexMaintenance:pending-mutation`, with the configured job queue Redis key prefix and a colon prepended when present. The hash contains the Misskey `jobId` and, when recorded, the Meilisearch `taskUid`.
3. Verify that the submitted request has finished. Check the recorded task when its ID is available. For an unknown task ID, verify that any in-flight requests from the stopped workers have drained and that the target `<index prefix>---notes` has no related pending or processing tasks. Keep the reservation in place if the outcome remains uncertain. [Meilisearch tasks API](https://www.meilisearch.com/docs/reference/api/tasks)
4. Once the write is confirmed terminal or confirmed never submitted, remove that reservation hash from Redis and restart the queue workers. Review the resulting index before submitting another maintenance job.
