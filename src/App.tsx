import { useEffect, useRef, useState } from "react"
import FKDBService from "./services/fkdbService";
import FKDBLangService from "./services/fkdbLangService";
import { FKDBColumnDef, FKDBColumnTypes, FKDBPaginatedRowsDef, FKDBRowType, FKDBSelectResultDef, FKDBTableDef } from "./interfaces";
import RowsTable from "./comps/RowsTable";
import NewRowInsertForm from "./comps/NewRowInsertForm";
import NewTableStructureForm from "./comps/NewTableStructureForm";
import TableStructureTable from "./comps/TableStructureTable";
import QueryResultsSection from "./comps/QueryResultsSection";

const maxRowsToShow:number=10;
export enum AppSection{records,structure,query};
export default function App(){
    const newRowFormRef=useRef<HTMLFormElement>(null);
    const newTableFormRef=useRef<HTMLFormElement>(null);

    // current section: records:selected table rows/ structure:selected table structure/ query:query results
    const [section,setSection]=useState<AppSection>(AppSection.records);
    // all tables names
    const [tables,setTables]=useState<string[]>([]);
    // selected table
    const [table,setTable]=useState<FKDBTableDef|null>(null);
    // selected table structure
    const [tableStructure,setTableStructure]=useState<FKDBColumnDef[]|null>(null);
    // paginated rows results
    const [paginatedRows,setPaginatedRows]=useState<FKDBPaginatedRowsDef|null>(null);
    // current for the current table rows result
    const [page,setPage]=useState<number>(1);
    // is fkdb service initialized
    const [initialized,setInitialized]=useState<boolean>(false);
    // selected rows from the result rows table
    const [selectedRows,setSelectedRows]=useState<number[]>([]);
    // check on useEffect to select/deselect all rows based on changed value
    const [selectAllRows,setSelectAllRows]=useState<boolean>(false);
    // if true then can change rows
    const [editMode,setEditMode]=useState<boolean>(false);
    // used to create new table, or to change the selected table structure
    const [editableTableStructure,setEditableTableStructure]=useState<FKDBColumnDef[]|null>(null);
    // toggle the new row insert form
    const [insertFormToggled,setInsertFormToggled]=useState<boolean>(false);
    // footer message
    const [footerMsg,setFooterMsg]=useState<string>("");

    // initial effect: init fkdb service and set the tables names
    useEffect(()=>{
        FKDBService.init();
        setTables(FKDBService.getTablesNames());
        setInitialized(true);
        // lang test
        // const cmd="select from users where id=5 offset 1 limit 5;";
        // const cmd="print'some text'";
        // FKDBLangService.exec(cmd);
    },[]);
    // on tables: set current table to first one, or if there was already a selected one then,
    // re-get the table and set it to the current table if it still exists
    useEffect(()=>{
        if(tables.length>0){
            if(table){
                const curTableName:string|undefined=tables.find(tableName=>tableName===table.name);
                if(curTableName){
                    const _table:FKDBTableDef|undefined=FKDBService.getTableByName(curTableName);
                    if(_table){
                        setTable(_table);
                    }
                }
            }else{
                setTable(FKDBService.getAllTables()[0]);
            }
        }
    },[tables]);
    // on table|page: get the table strucre and re-get the table rows result based on the current page
    useEffect(()=>{
        if(table){
            setTableStructure(FKDBService.getTableStructure(table.name));
            const _rows:FKDBSelectResultDef|null=FKDBService.select(table.name,null);
            if(_rows){
                const _paginatedRows:FKDBPaginatedRowsDef=FKDBService.paginateRows(_rows.rows,page,maxRowsToShow);
                setPaginatedRows(_paginatedRows);
            }
        }
    },[table,page]);
    // on tableStructure: if tableStructure is defined and current section is structure then re-set the editableTableStructure
    useEffect(()=>{
        if(tableStructure&&section===AppSection.structure){
            setEditableTableStructure([...tableStructure]);
        }
    },[tableStructure]);
    // on selectAllRows: select / deselect all rows
    useEffect(()=>{
        setSelectedRows(selectAllRows&&paginatedRows?paginatedRows.rows.map((r,i)=>r.id):[]);
    },[selectAllRows]);
    // on editMode: deselect all rows when editmode is false
    useEffect(()=>{
        if(!editMode)setSelectedRows([]);
    },[editMode]);

    // functions
    // on edit btn: toggle edit mode
    function onEditBtn(){
        if(selectedRows.length<1)return;
        setEditMode(prev=>!prev);
    }
    // on confirm edit selected rows btn: update the selected rows
    function onConfirmEditBtn(){
        if(!paginatedRows||!table)return;
        const editedRows:FKDBRowType[]=paginatedRows.rows.filter((r,i)=>selectedRows.includes(r.id));
        for(const row of editedRows){
            FKDBService.update(table.name,[{key:"id",op:"=",val:row.id}],{...row});
        }
        setEditMode(false);
    }
    // delete the selected rows
    function onDeleteBtn(){
        if(selectedRows.length<1)return;
        if(!confirm("Confirm delete rows?"))return;
        if(!paginatedRows||!table)return;
        const rowsToDelete:FKDBRowType[]=paginatedRows.rows.filter((r,i)=>selectedRows.includes(r.id));
        for(const row of rowsToDelete){
            FKDBService.delete(table.name,[{key:"id",op:"=",val:row.id}]);
        }
        setPaginatedRows(prev=>({...prev!,rows:prev!.rows.filter((r,i)=>!selectedRows.includes(r.id)), rowsCount:prev!.rowsCount-selectedRows.length, total:prev!.total-selectedRows.length}))
        setEditMode(false);
    }
    // on insert new row btn
    function onInsertBtn(e:React.MouseEvent){
        e.preventDefault();
        if(!newRowFormRef.current)return;
        const fd=new FormData(newRowFormRef.current);
        const values:FKDBRowType={id:-1};
        for(const col of tableStructure!){
            if(fd.has(col.name)){
                values[col.name]=col.type==="number"?Number(fd.get(col.name)):
                col.type==="string"?String(fd.get(col.name)):
                col.type==="boolean"?Boolean(fd.get(col.name)):
                String(fd.get(col.name));
            }else{
                if(col.type==="boolean")values[col.name]=false;
            }
        }
        const insertedRow:FKDBRowType|null=FKDBService.insert(table!.name,values);
        if(insertedRow){
            setPaginatedRows(prev=>({...prev!,rows:[...prev!.rows,insertedRow], rowsCount:prev!.rowsCount+1, total:prev!.total+1}));
        }
        // const _rows=FKDBService.select(table!.name,null);
        // if(_rows){
        //     const _paginatedRows=FKDBService.paginateRows(_rows.rows,page,maxRowsToShow)
        //     setPaginatedRows(_paginatedRows);
        //     if(_rows)setPage(_paginatedRows.pagesCount);
        // }
    }
    // on reset database btn
    function onResetDBBtn(){
        if(confirm("Confirm reset database, all tables will be deleted?")){
            const preserveDefaultTables=confirm("Would you like to preserve default tables?");
            FKDBService.clearDB(preserveDefaultTables);
            window.location.reload();
        }
    }
    // on switch current table: reset the page to 1
    function onSwitchTable(tableName:string){
        setPage(1);
        setTable(FKDBService.getTableByName(tableName)!);
    }
    // on delete a table
    function onDeleteTableBtn(tableIdx:number){
        if(confirm("Confirm delete table")){
            const tableName:string=tables[tableIdx];
            FKDBService.dropTable(tableName);
            window.location.reload();    
        }
    }
    // create new table intent: set the editableTableStructure to empty array, or to null if it wasn't to toggle action
    function onNewTableBtn(){
        setEditableTableStructure(prev=>prev==null?[]:null);
    }
    // when confirming the creation of the new table based on the editableTableStructure and the name from the form
    function onConfirmCreateTableBtn(){
        if(editableTableStructure&&newTableFormRef.current){
            const fd=new FormData(newTableFormRef.current);
            const tableName=fd.get("tableName");
            if(tableName){
                FKDBService.createTable(String(tableName),editableTableStructure);
            }
        }
        setEditableTableStructure(null);
        setTables(FKDBService.getTablesNames());
    }
    // on update the selected table strucrure based on the editableTableStructure
    function onUpdateTableStructureBtn(){
        if(table&&editableTableStructure&&confirm("Confirm update table structure, changed types will rewrite fields values!")){
            FKDBService.alterTable(table.name,editableTableStructure);
            setTables(FKDBService.getTablesNames());
            setSection(AppSection.records);
            setTableStructure(FKDBService.getTableStructure(table.name));
            setEditableTableStructure(null);
        }
    }

    // when switching section: make sure the set editableTableStructure to null if the targeted section != structure,
    // else if the tableStructure is defined then set the editableTableStructure to a copy of tableStructure because
    // it is used to show and edit the table structure
    function onSwitchSection(newSection:AppSection){
        if(newSection!==AppSection.structure){
            setEditableTableStructure(null);
        }else{
            if(tableStructure)setEditableTableStructure([...tableStructure]);
        }
        setSection(newSection);
    }

    return initialized?(
        <div className="w-screen h-screen flex flex-col md:flex-row bg-light gap-2 p-2">
            {/* // sidebar section */}
            <section className="md:h-full flex flex-col gap-2 border border-semitrans p-2" style={{minWidth:"256px"}}>
                <div className="p-2 bg-lighter rounded">
                    <div className="flex justify-between">
                        <p className="font-semibold text-dark">Tables ({tables.length})</p>
                        <button className="underline text-error text-sm p-1" onClick={onResetDBBtn}>Reset DB</button>
                    </div>
                    <hr />
                    {/* // tables names list */}
                    <ul className="my-4">
                        {
                            tables.map((tableName,i)=>(
                                <li key={i} className={`flex justify-between text-dark italic underline`}>
                                    <p onClick={()=>onSwitchTable(tableName)} className={`${table?.name===tableName?'text-primary':'text-dark'} hover:opacity-70 cursor-pointer`}>{tableName}</p>
                                    <button onClick={()=>onDeleteTableBtn(i)} className="p-0.5 text-error"><i className="bi bi-x"></i></button>
                                </li>
                            ))
                        }
                    </ul>
                    <hr className="" />
                    {section===AppSection.records&&
                        <button className={`underline ${editableTableStructure?'text-error':'text-info'} text-sm p-1 pl-0`} onClick={onNewTableBtn}>{editableTableStructure?'Cancel create table':'New table'}</button>
                    }
                    </div>
                {/* // display NewTableStructureForm to create new table */}
                {
                    editableTableStructure&&section===AppSection.records&&
                    <div className="p-2 bg-lighter rounded">
                        <NewTableStructureForm innerRef={newTableFormRef} onConfirmCreateTableBtn={onConfirmCreateTableBtn} editableTableStructure={editableTableStructure} setEditableTableStructure={setEditableTableStructure} />
                    </div>
                }
            </section>

            {/* // content section */}
            {table&&
            <section className="grow h-full flex flex-col gap-2 border border-semitrans p-2 overflow-hidden">
                {/* // sections header */}
                <div className="p-2 bg-lighter rounded flex items-center gap-2">
                    <button onClick={()=>onSwitchSection(AppSection.records)} className={`px-4 py-1 md:py-2 rounded bg-light ${section===AppSection.records?'text-primary opacity-100':'text-dark opacity-70'}`}>Records</button>
                    <button onClick={()=>onSwitchSection(AppSection.structure)} className={`px-4 py-1 md:py-2 rounded bg-light ${section===AppSection.structure?'text-primary opacity-100':'text-dark opacity-70'}`}>Structure</button>
                    <button onClick={()=>onSwitchSection(AppSection.query)} className={`px-4 py-1 md:py-2 rounded bg-light ${section===AppSection.query?'text-primary opacity-100':'text-dark opacity-70'}`}>Query</button>
                </div>

                {section===AppSection.records?
                // display the records section
                <div className="p-2 grow bg-lighter rounded overflow-y-auto">
                    <p className="text-info italic p-2 text-sm">showing {paginatedRows?.rowsCount} rows from {paginatedRows?.total} records</p>

                    <div className="w-full p-2 flex flex-col gap-4">
                        <div className="grow w-full overflow-x-auto">
                            {/* Display the rows table */}
                            {initialized&&tableStructure&&
                            <RowsTable paginatedRows={paginatedRows} setPaginatedRows={setPaginatedRows} tableStructure={tableStructure} editMode={editMode} selectAllRows={selectAllRows} setSelectAllRows={setSelectAllRows} selectedRows={selectedRows} setSelectedRows={setSelectedRows} />
                            }
                        </div>

                        <div className="flex items-center justify-between">
                            {/* // rows related actions */}
                            <div className="flex items-center gap-4">
                                <button onClick={onDeleteBtn} className="px-2 py-1 text-sm rounded bg-dark text-lighter disabled:opacity-70 disabled:cursor-not-allowed" disabled={selectedRows.length===0}>Delete</button>
                                <button onClick={onEditBtn} className="px-2 py-1 text-sm rounded bg-dark text-lighter disabled:opacity-70 disabled:cursor-not-allowed" disabled={selectedRows.length===0}>{editMode?'Cancel edit':'Edit'}</button>
                                {
                                    editMode&&
                                    <button onClick={onConfirmEditBtn} className="px-2 py-1 text-sm rounded bg-dark text-lighter disabled:opacity-70 disabled:cursor-not-allowed" disabled={selectedRows.length===0}>Confirm edit</button>
                                }
                            </div>
                            {/* // pagination */}
                            <div className="flex items-center gap-4">
                                <button className="px-2 py-1 text-sm underline text-dark disabled:opacity-70 disabled:cursor-not-allowed" disabled={paginatedRows?.prevPage==null} onClick={()=>setPage(page=>page-1)}>prev</button>
                                <p className="text-dark">{page}/{paginatedRows?.pagesCount}</p>
                                <button className="px-2 py-1 text-sm underline text-dark disabled:opacity-70 disabled:cursor-not-allowed" disabled={paginatedRows?.nextPage==null} onClick={()=>setPage(page=>page+1)}>next</button>
                            </div>
                        </div>
                    </div>

                </div>
                :section===AppSection.structure?
                // display table structure
                <div className="p-2 grow bg-lighter rounded overflow-y-auto">
                    {editableTableStructure&&
                    <TableStructureTable editableTableStructure={editableTableStructure} setEditableTableStructure={setEditableTableStructure} onUpdateTableStructureBtn={onUpdateTableStructureBtn} />
                    }
                </div>
                :
                // display query results section
                <QueryResultsSection />
                }

                {/* // new row insert */}
                {section===AppSection.records&&
                <div className="p-2 bg-lighter rounded">
                    <div className="flex items-center justify-between">
                        <p className="text-sm text-dark mb-2 italic">Insert new row</p>
                        <button className="p-1" onClick={()=>setInsertFormToggled(prev=>!prev)}><i className={`bi ${insertFormToggled?'bi-chevron-up':'bi-chevron-down'}`}></i></button>
                    </div>
                    {insertFormToggled&&tableStructure&&
                        <div className="overflow-x-auto">
                            {
                                <NewRowInsertForm tableStructure={tableStructure} innerRef={newRowFormRef} onInsertBtn={onInsertBtn} />
                            }
                        </div>
                    }
                </div>
                }

                {/* // footer */}
                <div className="flex items-center p-2 bg-lighter rounded" style={{height:'48px'}}>
                    <p className="text-info italic text-sm">{footerMsg}</p>
                </div>
            </section>
            }
        </div>
    ):
    (
        <div className="w-screen h-screen bg-light flex items-center justify-center">
            <p className="text-dark">Loading..</p>
        </div>
    );

}
