/**
 * A realistic, self-contained Apex debug log used by the "Load sample" button
 * and the parser unit tests. Exercises: header/debug levels, USER_INFO, SOQL
 * with a table-scan explain, a query repeated three times inside a loop (the
 * N+1 signature), SOSL, DML, a managed-package namespace, a callout, an
 * exception, a LIMIT_USAGE_FOR_NS block with a CLOSE TO LIMIT flag, and a
 * truncation marker.
 */
export const SAMPLE_LOG_FILE_NAME = "sample-apex-debug.log";

export const SAMPLE_LOG = `60.0 APEX_CODE,DEBUG;APEX_PROFILING,NONE;CALLOUT,NONE;SOQL,FINE;DML,FINE;WORKFLOW,FINEST
Execute Anonymous: AccountService.dedupe();
12:31:07.0 (11244890)|USER_INFO|[EXTERNAL]|0055f000004CjQy|developer@syntaxfiddle.dev|Greenwich Mean Time|GMT+00:00
12:31:07.0 (11266095)|EXECUTION_STARTED
12:31:07.0 (11344971)|CODE_UNIT_STARTED|[EXTERNAL]|execute_anonymous_apex
12:31:07.0 (11598292)|SOQL_EXECUTE_BEGIN[9]|Aggregations:0|SELECT Id, Name FROM Account WHERE Industry = 'Banking'
12:31:07.0 (12391154)|SOQL_EXECUTE_END[9]|Rows:42
12:31:07.0 (12698812)|SOQL_EXECUTE_EXPLAIN[9]|TableScan:Account|Cardinality:42987
12:31:07.0 (12907451)|SOQL_EXECUTE_BEGIN[10]|Aggregations:0|SELECT Id FROM Contact WHERE Email != null
12:31:07.0 (13994794)|SOQL_EXECUTE_END[10]|Rows:12000
12:31:07.0 (14730946)|SOQL_EXECUTE_BEGIN[10]|Aggregations:0|SELECT Id FROM Contact WHERE Email != null
12:31:07.0 (15519716)|SOQL_EXECUTE_END[10]|Rows:12000
12:31:07.0 (15718390)|SOQL_EXECUTE_BEGIN[10]|Aggregations:0|SELECT Id FROM Contact WHERE Email != null
12:31:07.0 (16509572)|SOQL_EXECUTE_END[10]|Rows:12000
12:31:07.0 (16711180)|SOSL_EXECUTE_BEGIN[11]|FIND {"acme.com"} IN EMAIL FIELDS RETURNING Contact(Id, Name)
12:31:07.0 (17201985)|SOSL_EXECUTE_END[11]|Rows:17
12:31:07.0 (17402937)|USER_DEBUG|[3]|DEBUG|Matched 36,042 rows across accounts and contacts - deduplicating
12:31:07.0 (18080381)|DML_BEGIN[12]|Op:Update|Type:Contact|rows:9500
12:31:07.1 (35302111)|DML_END[12]
12:31:07.1 (35504013)|CALLOUT_REQUEST|[64]|System.HttpRequest.send()
12:31:07.1 (36598371)|CALLOUT_RESPONSE|[64]|System.HttpResponse[status=200]
12:31:07.1 (37405218)|ENTERING_MANAGED_PKG|npo01
12:31:07.1 (38432263)|DML_BEGIN[13]|Op:Insert|Type:npo01__Household__c|rows:1
12:31:07.2 (40752160)|DML_END[13]
12:31:07.2 (40883852)|EXCEPTION_THROWN|[7]|System.DmlException: Insert failed. First exception on row 0; first error: REQUIRED_FIELD_MISSING, [npo01__Household__c.Name]: Missing required field: Name
12:31:07.2 (41110024)|CODE_UNIT_FINISHED|execute_anonymous_apex
12:31:07.2 (41333199)|LIMIT_USAGE_FOR_NS|(default)|
  Number of SOQL queries: 4 out of 100
  Number of query rows: 36042 out of 50000
  Number of SOSL queries: 1 out of 20
  Number of DML statements: 2 out of 150
  Number of DML rows: 9501 out of 10000 ******* CLOSE TO LIMIT
  Maximum CPU time: 3124 out of 10000
  Maximum heap size: 2198304 out of 6000000
  Number of callouts: 1 out of 100
12:31:07.2 (41335677)|EXECUTION_FINISHED
*** Skipped 4194304 bytes of detailed log due to log size limit ***
`;
