import React from 'react'
import { FKDBColumnDef, FKDBPaginatedRowsDef, FKDBSelectResultDef } from '../interfaces';

interface RowsTablePropsDef{
    tableStructure:FKDBColumnDef[],
    paginatedRows:FKDBPaginatedRowsDef|null;
    setPaginatedRows:React.Dispatch<React.SetStateAction<FKDBPaginatedRowsDef|null>>;
    editMode:boolean,
    selectAllRows:boolean,
    setSelectAllRows:React.Dispatch<React.SetStateAction<boolean>>;
    selectedRows:number[],
    setSelectedRows:React.Dispatch<React.SetStateAction<number[]>>;
}
// Displays the current table rows
function RowsTable({paginatedRows,setPaginatedRows,tableStructure,editMode,selectAllRows,setSelectAllRows,selectedRows,setSelectedRows}:RowsTablePropsDef) {

    return (
        <table className="border p-2">
            <thead>
                <tr className="border">
                    <th className="border px-2 md:px-8">
                        <input disabled={editMode} type="checkbox" checked={selectAllRows} onChange={(e)=>setSelectAllRows(prev=>!prev)} />
                    </th>
                    {
                    tableStructure!.map((col,i)=>(
                        <th className="border px-2 md:px-8 text-dark" key={i}>{col.name}</th>
                    ))
                    }
                </tr>
            </thead>
            <tbody>
                {
                    paginatedRows!.rows.map((row,i)=>(    
                        <tr key={i}>
                            <td className="border p-1 text-dark text-sm">
                                <input disabled={editMode} type="checkbox" checked={selectedRows.includes(row.id)} onChange={(e)=>setSelectedRows(prev=>{
                                    if(selectedRows.includes(row.id))return prev.filter((id,_)=>id!==row.id);
                                    else return [...selectedRows,row.id];
                                })} />
                            </td>
                            {
                                tableStructure.map((col,j)=>(
                                    <td className="border p-1 text-dark text-sm" key={j}>
                                        {
                                            editMode&&selectedRows.includes(row.id)&&tableStructure![j].type==="number"?
                                            <input type="number" value={row[col.name]} onChange={(e)=>{
                                                setPaginatedRows(prev=>({...prev!,rows:prev!.rows.map((r,k)=>k===i?{...r,[col.name]:Number(e.target.value)}:r)}))
                                            }} />
                                            :editMode&&selectedRows.includes(row.id)&&tableStructure![j].type==="string"?
                                            <input type="text" value={row[col.name]} onChange={(e)=>{
                                                setPaginatedRows(prev=>({...prev!,rows:prev!.rows.map((r,k)=>k===i?{...r,[col.name]:String(e.target.value)}:{...r})}))
                                            }} />
                                            :editMode&&selectedRows.includes(row.id)&&tableStructure![j].type==="boolean"?
                                            <input type="checkbox" checked={row[col.name]} onChange={(e)=>{
                                                setPaginatedRows(prev=>({...prev!,rows:prev!.rows.map((r,k)=>k===i?{...r,[col.name]:Boolean(e.target.value)}:r)}))
                                            }} />
                                            :
                                            <p>{String(row[col.name])}</p>
                                        }
                                    </td>
                                ))
                            }
                        </tr>
                    ))
                }
            </tbody>
        </table>
    );

}

export default RowsTable