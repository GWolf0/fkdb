export type FKDBColumnTypes="id"|"fid"|"string"|"number"|"boolean";

export interface FKDBColumnDef{
    id:number,
    name:string,
    type:FKDBColumnTypes,
    default?:any,
}
export type FKDBWithIDType={id:number};
export type FKDBRowType={[key:string]:any} & FKDBWithIDType;

export interface FKDBTableDef{
    id:number,
    lastInsertedID:number,
    name:string,
    columns:FKDBColumnDef[],
    rows:FKDBRowType[],
}

export interface FKDBDef{
    tables:FKDBTableDef[],
}

export interface FKDBSelectResultDef{
    rows:FKDBRowType[],
    limit:number,
    offset:number,
    rowsCount:number,
}
export interface FKDBPaginatedRowsDef{
    rows:FKDBRowType[],
    perPage:number,
    rowsCount:number,
    total:number,
    page:number,
    pagesCount:number,
    nextPage:number|null,
    prevPage:number|null,
}

export type FKDBQueryOptionsType="tableName";
export type FKDBCmdType="none"|"select"|"update"|"insert"|"delete";
export interface FKDBQueryResultDef{
    cmdType:FKDBCmdType,
    options:{[key:string]:any},
    selectResult?:FKDBSelectResultDef,
    success:boolean,
    errorMsg?:string,
}

export interface FKDBCommandInfoDef{
    name:string,
    time:number,
    success:boolean,
}
