import React from 'react'
import { FKDBColumnDef, FKDBColumnTypes } from '../interfaces';
import FKDBService from '../services/fkdbService';

interface NewTableStructureFormPropsDef{
    innerRef:React.RefObject<HTMLFormElement>,
    editableTableStructure:FKDBColumnDef[],
    setEditableTableStructure:React.Dispatch<React.SetStateAction<FKDBColumnDef[]|null>>,
    onConfirmCreateTableBtn:(e:React.MouseEvent)=>any,
}
// Displays the new Table structure form
function NewTableStructureForm({innerRef,editableTableStructure,setEditableTableStructure,onConfirmCreateTableBtn}:NewTableStructureFormPropsDef) {

    return (
        <form ref={innerRef}>
            <div className="w-full">
                <input className="p-1 w-full rounded" type="text" name="tableName" placeholder="table name" />
            </div>
            <div className="w-full flex flex-col gap-2 border p-2 mt-2">
                {
                    editableTableStructure.map((colDef,i)=>(
                        <div className="flex gap-1" key={i}>
                            <div className="grow">
                                <input type="text" className="text-sm md:text-sm p-0.5" placeholder="column name" value={colDef.name} onChange={(e)=>setEditableTableStructure(prev=>prev!.map((col,ii)=>ii===i?{...col,name:e.target.value}:col))} />
                            </div>
                            <div className="grow">
                                <select className="text-xs md:text-sm p-0.5" value={colDef.type} onChange={(e)=>setEditableTableStructure(prev=>prev!.map((col,ii)=>ii===i?{...col,type:e.target.value as FKDBColumnTypes}:col))}>
                                    {
                                        ["string","number","boolean"].map((t,j)=>(
                                            <option value={t} key={j}>{t.toUpperCase()}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            <button type="button" className="text-sm text-error p-1" onClick={()=>setEditableTableStructure(prev=>prev!.filter((col,ii)=>ii!==i))}><i className="bi bi-x-lg"></i></button>
                        </div>
                    ))
                }
                <button type="button" className="w-full p-1 bg-light text-dark border border-dark rounded text-sm my-2" onClick={()=>setEditableTableStructure(prev=>[...prev!,{id:FKDBService.getTableNewColumnID(prev!),name:"",type:"string"}])}>New column</button>
            </div>
            <div className="w-full py-2 flex justify-end">
                <button type="submit" onClick={onConfirmCreateTableBtn} className="px-4 py-1 bg-primary text-lighter text-sm rounded">Create</button>
            </div>
        </form>
    );

}

export default NewTableStructureForm;