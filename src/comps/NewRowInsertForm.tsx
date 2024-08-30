import React from 'react'
import { FKDBColumnDef } from '../interfaces';

interface NewRowInsertFormPropsDef{
    tableStructure:FKDBColumnDef[],
    innerRef:React.RefObject<HTMLFormElement>,
    onInsertBtn:(e:React.MouseEvent)=>any,
}
// Displays the new row insertion form
function NewRowInsertForm({tableStructure,innerRef,onInsertBtn}:NewRowInsertFormPropsDef) {

    return (
        <form ref={innerRef}>
            <div className="flex flex-col md:flex-row md:items-center gap-2">
                {
                    tableStructure.map((colDef,i)=>{
                        return (
                            <div key={i}>
                                {
                                    colDef.type==="string"?
                                        <input type="text" name={colDef.name} className="w-full md:w-min p-1 rounded text-dark bg-transparent border" placeholder={colDef.name} />
                                    :colDef.type==="number"?
                                        <input type="number" name={colDef.name} className="w-full md:w-min p-1 rounded text-dark bg-transparent border" placeholder={colDef.name} />
                                    :colDef.type==="boolean"?
                                        <label htmlFor={colDef.name} className='text-dark'>
                                            <input type="checkbox" name={colDef.name} className="mr-1 w-full md:w-min p-1 rounded text-dark bg-transparent border" placeholder={colDef.name} />
                                            {colDef.name}
                                        </label>
                                    :
                                        <></>
                                }
                            </div>
                        )
                    })
                }
            </div>
            <div className="w-full py-2 flex justify-end">
                <button type="submit" onClick={onInsertBtn} className="px-4 py-1 bg-primary text-lighter text-sm rounded">Insert</button>
            </div>
        </form>
    );

}

export default NewRowInsertForm