import { ToolError } from '../base.js';

var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
async function getMetadata(sequelize, provider, schema) {
  try {
    const query = getMetadataQuery(provider, schema);
    const [metadata] = await sequelize.query(query);
    const tableMap = /* @__PURE__ */ new Map();
    metadata.forEach(({ tableName, columnName, dataType }) => {
      if (!tableMap.has(tableName)) {
        tableMap.set(tableName, [
          `Table '${tableName}' with columns: ${columnName} (${dataType})`
        ]);
      } else {
        tableMap.get(tableName).push(`${columnName} (${dataType})`);
      }
    });
    return Array.from(tableMap.values()).map((columns) => columns.join(", ")).join("; ");
  } catch (error) {
    throw new ToolError(`Error initializing metadata: ${error}`, [], {
      isRetryable: false
    });
  }
}
__name(getMetadata, "getMetadata");
function getMetadataQuery(provider, schema) {
  const schemaName = schema ?? getDefaultSchema(provider);
  switch (provider) {
    case "mysql":
    case "mariadb":
      return `
          SELECT t.table_name AS tableName, c.column_name AS columnName, 
                 c.data_type AS dataType
          FROM information_schema.tables t
          JOIN information_schema.columns c ON t.table_name = c.table_name
          WHERE t.table_schema = DATABASE();
        `;
    case "postgres":
      return `
          SELECT t.table_name AS "tableName", c.column_name AS "columnName", 
                 c.data_type AS "dataType"
          FROM information_schema.tables t
          JOIN information_schema.columns c ON t.table_name = c.table_name
          WHERE t.table_schema = lower('${schemaName}');
        `;
    case "mssql":
      return `
          SELECT t.name AS tableName, c.name AS columnName,
                 ty.name AS dataType
           FROM sys.tables t
           JOIN sys.columns c ON t.object_id = c.object_id
           JOIN sys.types ty ON c.user_type_id = ty.user_type_id
           JOIN sys.schemas s ON t.schema_id = s.schema_id
           WHERE t.is_ms_shipped = 0 AND t.type = 'U'
                AND s.name = lower('${schemaName}');
        `;
    case "db2":
      return `
          SELECT t.tabname AS "tableName", c.colname AS "columnName", 
                 c.typename AS "dataType"
          FROM SYSCAT.TABLES t
          JOIN SYSCAT.COLUMNS c ON t.tabname = c.tabname
          WHERE t.tabschema = upper('${schemaName}');
        `;
    case "sqlite":
      return `
          SELECT tbl_name AS "tableName", name AS "columnName", type AS "dataType"
            FROM (
                SELECT name AS tbl_name
                FROM sqlite_master
                WHERE type = 'table'
            )
            JOIN pragma_table_xinfo(tbl_name);
        `;
    case "oracle":
      return `
          SELECT t.table_name AS "tableName", c.column_name AS "columnName", 
                 c.data_type AS "dataType"
          FROM all_tables t
          JOIN all_tab_columns c ON t.table_name = c.table_name
          WHERE t.owner = upper('${schemaName}');
        `;
    default:
      throw new ToolError(`Provider ${provider} is not supported`, [], {
        isFatal: true,
        isRetryable: false
      });
  }
}
__name(getMetadataQuery, "getMetadataQuery");
function getDefaultSchema(provider) {
  switch (provider) {
    case "postgres":
      return "public";
    case "mssql":
      return "dbo";
    case "db2":
    case "oracle":
      throw new ToolError(`Schema name is required for ${provider}`, [], {
        isRetryable: false,
        isFatal: true
      });
    default:
      return "";
  }
}
__name(getDefaultSchema, "getDefaultSchema");

export { getMetadata };
//# sourceMappingURL=metadata.js.map
//# sourceMappingURL=metadata.js.map