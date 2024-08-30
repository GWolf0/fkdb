import initialDB from "../assets/initialDB";
import { FKDBColumnDef, FKDBColumnTypes, FKDBCommandInfoDef, FKDBDef, FKDBPaginatedRowsDef, FKDBQueryResultDef, FKDBRowType, FKDBSelectResultDef, FKDBTableDef } from "../interfaces";
import FKDBLangService from "./fkdbLangService";

export default class FKDBService{
    static DB_NAME:string="db";
    static db:FKDBDef;
    static lastCMDInfo:FKDBCommandInfoDef|null=null;
    static cmdStartTime:number;

    // init
    static init(){
        FKDBService.db=FKDBService.loadDB();
    }

    // table ops
    // clear db
    static clearDB(preserveDefaultTables:boolean=false){
        FKDBService.beginCmd("clear db");
        FKDBService.db.tables=preserveDefaultTables?[...initialDB.tables]:[];
        FKDBService.saveDB();
        FKDBService.endCmd();
    }
    // get all tables
    static getAllTables():FKDBTableDef[]{
        FKDBService.beginCmd("get all tables");
        const res=[...FKDBService.db.tables];
        FKDBService.endCmd();
        return res;
    }
    // create table
    static createTable(name:string,columns:FKDBColumnDef[]):FKDBTableDef{
        FKDBService.beginCmd("create table");
        if(FKDBService.tableExists(name)){
            FKDBService.endCmd(false);
            return FKDBService.getTableByName(name)!;
        }
        const id:number=FKDBService.getTableNewID();
        let colID=1;
        const table:FKDBTableDef={id,lastInsertedID:0,name,columns:[{id:colID++,name:"id",type:"id"},...columns],rows:[]};
        FKDBService.db.tables.push(table);
        FKDBService.saveDB();
        FKDBService.endCmd();
        return table;
    }
    // check if table exists
    static tableExists(tableName:string):boolean{
        return FKDBService.getTableByName(tableName)!=undefined;
    }
    // drop table
    static dropTable(name:string){
        FKDBService.beginCmd("drop table");
        const tableIdx:number=FKDBService.getTableIdx(name);
        FKDBService.db.tables.splice(tableIdx,1);
        FKDBService.saveDB();
        FKDBService.endCmd();
    }
    // alter table
    static alterTable(name:string,columns:FKDBColumnDef[]):boolean{
        FKDBService.beginCmd("alter table");
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(name);
        if(table){
            let removedCols:FKDBColumnDef[]=[];
            let changedNames:FKDBColumnDef[]=[];
            let changedTypes:FKDBColumnDef[]=[];
            table.columns.forEach((col,i)=>{
                const newCol:FKDBColumnDef|undefined=columns.find((col2,j)=>col2.id===col.id);
                if(newCol){
                    if(col.name!==newCol.name){
                        changedNames.push(col);
                    }
                    if(col.type!==newCol.type){
                        changedTypes.push(newCol);
                    }
                }else{
                    removedCols.push(col);
                }
            });
            let addedCols:FKDBColumnDef[]=columns.filter((col,i)=>!table.columns.map((col2,j)=>col2.id).includes(col.id));
            // rename all rows key for changed names
            for(const changedName of changedNames){
                const newKey=columns.find((col,i)=>col.id===changedName.id);
                if(newKey){
                    for(const row of table.rows){
                        delete Object.assign(row,{[newKey.name]:row[changedName.name]})[changedName.name];
                    }
                }
            }
            // reassign default values for columns with changed types
            for(const changedType of changedTypes){
                const newVal:any=changedType.type==="string"?"":
                    changedType.type==="number"?0:
                    changedType.type==="boolean"?false:
                    changedType.type==="fid"?0:
                    "";
                for(const row of table.rows){
                    Object.assign(row,{[changedType.name]:newVal});
                }
            }
            // add the added columns to the rows
            for(const addedCol of addedCols){
                const newVal:any=addedCol.type==="string"?"":
                    addedCol.type==="number"?0:
                    addedCol.type==="boolean"?false:
                    addedCol.type==="fid"?0:
                    "";
                for(const row of table.rows){
                    Object.assign(row,{[addedCol.name]:newVal});
                }
            }
            // remove the removed columns from the rows
            for(const removedCol of removedCols){
                for(const row of table.rows){
                    delete row[removedCol.name];
                }
            }
            
            // assign new structure (columns) to the table
            table.columns=columns;
            FKDBService.saveDB();
            FKDBService.endCmd();
            return true;
        }
        FKDBService.endCmd(false);
        return false;
    }
    // get table strcutre
    static getTableStructure(name:string):FKDBColumnDef[]|null{
        FKDBService.beginCmd("table structure");
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(name);
        if(!table){
            FKDBService.endCmd(false);
            return null;
        }
        const res=table.columns;
        FKDBService.endCmd();
        return res;
    }

    // rows ops
    // insert
    static insert(tableName:string,values:FKDBRowType):FKDBRowType|null{
        FKDBService.beginCmd("insert");
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(tableName);
        if(!table){
            FKDBService.endCmd(false);
            return null;
        }
        table.lastInsertedID++;
        let row:FKDBRowType={...values,id:table.lastInsertedID};
        table.rows.push(row);
        FKDBService.saveDB();
        const res=row;
        FKDBService.endCmd();
        return res;
    }
    // select
    static select(tableName:string,where:{key:string,op:string,val:any}[]|null=null,offset:number=0,limit:number=9999):FKDBSelectResultDef|null{
        FKDBService.beginCmd("select");
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(tableName);
        if(!table){
            FKDBService.endCmd(false);
            return null;
        }
        let rows:FKDBRowType[]=where?FKDBService.getFilteredRows(tableName,where):[...table.rows];
        const total=rows.length;
        limit=Math.min(total,limit);
        rows=rows.filter((r,i)=>i>=offset&&i<offset+limit);
        const res:FKDBSelectResultDef={rows,offset,limit,rowsCount:rows.length};
        FKDBService.endCmd();
        return res;
    }
    // update
    static update(tableName:string,where:{key:string,op:string,val:any}[],values:FKDBRowType):FKDBRowType[]|null{
        FKDBService.beginCmd("update");
        let rows:FKDBRowType[]=FKDBService.getFilteredRows(tableName,where);
        rows.forEach((r,i)=>{
            for(const [key,val] of Object.entries(values)){
                r[key]=val;
            }
        });
        FKDBService.saveDB();
        const res=rows;
        FKDBService.endCmd();
        return res;
    }
    // delete
    static delete(tableName:string,where:{key:string,op:string,val:any}[]):number{
        FKDBService.beginCmd("delete");
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(tableName);
        if(!table){
            FKDBService.endCmd(false);
            return 0;
        }
        let rows:FKDBRowType[]=FKDBService.getFilteredRows(tableName,where);
        const rowsIDs:number[]=rows.map((r,i)=>r.id);
        table.rows=table.rows.filter((r,i)=>!rowsIDs.includes(r.id));
        FKDBService.saveDB();
        const res=rows.length;
        FKDBService.endCmd();
        return res;
    }

    // other ops
    static count(tableName:string,where:{key:string,op:string,val:any}[]):number{
        FKDBService.beginCmd("count");
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(tableName);
        if(!table){
            FKDBService.endCmd(false);
            return 0;
        }
        let rows:FKDBRowType[]=FKDBService.getFilteredRows(tableName,where);
        const res=rows.length;
        FKDBService.endCmd();
        return res;
    }

    // queries
    static query(q:string):FKDBQueryResultDef{
        let res:FKDBQueryResultDef=FKDBLangService.exec(q);
        if(res.cmdType==="select"){
            res.selectResult=FKDBService.selectQuery(res);
        }
        return res;
    }
    static selectQuery(queryRes:FKDBQueryResultDef):FKDBSelectResultDef|undefined{
        if(queryRes.success){
            const tableName=queryRes.options["tableName"];
            const whereItems:{key:string,op:string,val:any}[]=Object.keys(queryRes.options).includes("whereItems")?queryRes.options["whereItems"]:[];
            const offset:number=Object.keys(queryRes.options).includes("offset")?queryRes.options["offset"]:0;
            const limit:number=Object.keys(queryRes.options).includes("limit")?queryRes.options["limit"]:9999;
            const selectRes:FKDBSelectResultDef|null=FKDBService.select(tableName,whereItems,offset,limit);
            return selectRes||undefined;
        }else{
            return undefined;
        }
    }

    // utils
    // relations
    static getRowsRelations(tableName:string,rows:FKDBRowType[]):{[refrencedTable:string]:any[]}{
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(tableName);
        if(!table)return {};
        const fids:string[]=FKDBService.getTableForeignIds(tableName);
        let relations:{[refrencedTable:string]:any[]}={};
        for(const fid of fids){
            const referencedTable:string=fid.split("_")[0];
            relations[referencedTable]=[];
            for(const row of rows){
                const idVal:number=Number(row[fid]);
                const referencedRowRes:FKDBSelectResultDef|null=FKDBService.select(referencedTable,[{key:"id",op:"=",val:idVal}]);
                if(referencedRowRes&&referencedRowRes.rows.length===1){
                    relations[referencedTable].push(referencedRowRes.rows[0]);
                }else{
                    relations[referencedTable].push(null);
                }
            }
        }
        return relations;
    }
    // get foreign ids
    static getTableForeignIds(tableName:string):string[]{
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(tableName);
        if(!table)return [];
        return table.columns.filter((colDef,i)=>colDef.type==="fid").map((colDef,i)=>colDef.name);
    }
    // paginate rows
    static paginateRows(rows:FKDBRowType[],page:number=1,perPage:number=2):FKDBPaginatedRowsDef{
        const total=rows.length;
        const pagesCount=Math.ceil(total/perPage);
        const takeFromIdx:number=Math.ceil(perPage*(page-1));
        rows=[...rows.filter((r,i)=>i>=takeFromIdx&&i<takeFromIdx+perPage)];
        const rowsCount=rows.length;
        const prevPage=page>1?page-1:null;
        const nextPage=page<pagesCount?page+1:null;
        const res:FKDBPaginatedRowsDef={rows,rowsCount,total,perPage,page,prevPage,nextPage,pagesCount};
        return res;
    }
    // merge rows horizontaly
    static mergeRowsHoriz(rows:FKDBRowType[][]):FKDBRowType[]{
        let merged:FKDBRowType[]=[]
        for(let y=0;y<rows.length;y++){
            merged.push({id:0});
            for(let x=0;x<rows[y].length;x++){
                merged[y]={...merged[y],...rows[y][x]};
            }
            merged[y].id=rows[0][0].id;
        }
        return merged;
        // return rows1.map((row,i)=>({...row,...rows2[i]}));
    }
    // get new table id
    static getTableNewID():number{
        return FKDBService.db.tables.length+1;
    }
    // get table idx
    static getTableIdx(name:string):number{
        return FKDBService.db.tables.findIndex((t,i)=>t.name===name);
    }
    // get table by name
    static getTableByName(name:string):FKDBTableDef|undefined{
        return FKDBService.db.tables.find((t,i)=>t.name===name)
    }
    // get table filtered rows
    static getFilteredRows(tableName:string,where:{key:string,op:string,val:any}[]):FKDBRowType[]{
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(tableName);
        if(!table)return [];
        return table.rows.filter((r,i)=>{
            const rowKeys:string[]=Object.keys(r);
            for(let {key,op,val} of where){
                if(!rowKeys.includes(key))continue;
                const rowVal=r[key];
                // convert val to equivalent type
                if(typeof rowVal==="number")val=Number(val);
                else if(typeof rowVal==="boolean")val=val==="true";
                if(op==="="&&rowVal!==val){
                    return false;
                }else if((op===">"&&rowVal<=val) || (op===">="&&rowVal<val)){
                    return false;
                }else if((op==="<"&&rowVal>=val) || (op==="<="&&rowVal>val)){
                    return false;
                }
            }
            return true;
        });
    }
    // get tables names
    static getTablesNames():string[]{
        FKDBService.beginCmd("tables names");
        const res=FKDBService.db.tables.map((t,i)=>t.name);
        FKDBService.endCmd();
        return res;
    }
    // get table columns names
    static getTableColumnsNames(tableName:string,_table?:FKDBTableDef):string[]{
        FKDBService.beginCmd("table columns names");
        let table:FKDBTableDef|undefined=_table||FKDBService.getTableByName(tableName);
        if(!table){
            FKDBService.endCmd(false);
            return [];
        }
        const res=table.columns.map((c,i)=>c.name);
        FKDBService.endCmd();
        return res;
    }
    // get table new Columns id
    static getTableNewColumnID(structure:FKDBColumnDef[]):number{
        return structure.reduce((prev,cur,arr)=>{if(cur.id>prev)return cur.id;else return prev},0)+1;
    }

    // log utils
    // table to table data
    static getTableRowsAsTabularData(tableName:string,rows:FKDBRowType[]|null=null):string[][]{
        let data:string[][]=[]
        let table:FKDBTableDef|undefined=FKDBService.getTableByName(tableName);
        if(!table)return data;
        const columnsNames:string[]=FKDBService.getTableColumnsNames(tableName,table);
        data.push([...columnsNames]);
        const _rows:FKDBRowType[]=rows||[...table.rows];
        for(let i=0;i<_rows.length;i++){
            data.push([]);
            const row:FKDBRowType=_rows[i];
            // const values:[key:string,value:any][]=Object.entries(row);
            for(const [key,value] of Object.entries(row)){
                data[data.length-1].push(String(value));
            }
        }
        return data;
    }

    // saving/loading
    static loadDB():FKDBDef{
        const savedDB:string|null=localStorage.getItem(FKDBService.DB_NAME);
        return savedDB!=null?JSON.parse(savedDB) as FKDBDef:JSON.parse(JSON.stringify(initialDB));
    }
    static saveDB(){
        localStorage.setItem(FKDBService.DB_NAME,JSON.stringify(FKDBService.db));
    }

    // others
    static beginCmd(cmdName:string){
        FKDBService.cmdStartTime=new Date().valueOf();
        FKDBService.lastCMDInfo={name:cmdName,time:0,success:true};
    }
    static endCmd(success:boolean=true){
        const elapsed=new Date().valueOf()-FKDBService.cmdStartTime;
        FKDBService.lastCMDInfo!.time=elapsed;
        FKDBService.lastCMDInfo!.success=success;
    }

}