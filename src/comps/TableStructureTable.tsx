import React from 'react'
import { FKDBColumnDef, FKDBColumnTypes } from '../interfaces';
import FKDBService from '../services/fkdbService';

interface TableStructureTablePropsDef{
    editableTableStructure:FKDBColumnDef[],
    setEditableTableStructure:React.Dispatch<React.SetStateAction<FKDBColumnDef[]|null>>,
    onUpdateTableStructureBtn:(e:React.MouseEvent)=>any,
}
// Displays the current table structure table
function TableStructureTable({editableTableStructure,setEditableTableStructure,onUpdateTableStructureBtn}:TableStructureTablePropsDef) {

    return (
        <table className="border p-2">
            <thead>
                <tr className="border">
                    <td className="border px-2 md:px-8 text-dark">Name</td>
                    <td className="border px-2 md:px-8 text-dark">Type</td>
                    <td className="border px-2 md:px-8 text-dark"></td>
                </tr>
            </thead>
            <tbody>
                {
                    editableTableStructure.map((colDef,i)=>(
                        <tr key={i} className="border">
                            <td className="border p-1">
                            <input disabled={colDef.name==="id"} type="text" className="text-sm md:text-sm p-0.5 disabled:opacity-70 disabled:cursor-not-allowed" placeholder="column name" value={colDef.name} onChange={(e)=>setEditableTableStructure(prev=>prev!.map((col,ii)=>ii===i?{...col,name:e.target.value}:col))} />
                            </td>
                            <td className="border p-1">
                            <select disabled={colDef.name==="id"} className="text-xs md:text-sm p-0.5 disabled:opacity-70 disabled:cursor-not-allowed" value={colDef.type} onChange={(e)=>setEditableTableStructure(prev=>prev!.map((col,ii)=>ii===i?{...col,type:e.target.value as FKDBColumnTypes}:col))}>
                                {
                                    ["string","number","boolean"].map((t,j)=>(
                                        <option value={t} key={j}>{t.toUpperCase()}</option>
                                    ))
                                }
                            </select>
                            </td>
                            <td className="border p-1" align="right">
                                {i>0&&<button onClick={()=>setEditableTableStructure(prev=>prev!.filter((col,i)=>col.name!==colDef.name))} disabled={colDef.name==="id"} className="p-1 text-error disabled:opacity-70 disabled:cursor-not-allowed"><i className="bi bi-x-lg"></i></button>}
                            </td>
                        </tr>
                    ))
                }
                <tr className="border">
                    <td className="p-2 border" colSpan={3} align="right">
                        <button onClick={()=>setEditableTableStructure(prev=>[...prev!,{id:FKDBService.getTableNewColumnID(prev!),name:"",type:"string"}])} className="p-1 text-sm text-info underline">+ Add column</button>
                        <button onClick={onUpdateTableStructureBtn} className="px-2 py-1 ml-2 text-sm text-lighter bg-primary rounded">Update structure</button>
                    </td>        
                </tr>
            </tbody>
        </table>
    );

}

export default TableStructureTable