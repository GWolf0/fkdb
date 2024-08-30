import React, { useEffect, useMemo, useRef, useState } from 'react'
import { FKDBPaginatedRowsDef, FKDBQueryResultDef, FKDBSelectResultDef } from '../interfaces';
import FKDBLangService from '../services/fkdbLangService';
import FKDBService from '../services/fkdbService';

const rowsPerPage=10;
interface QueryResultsSectionPropsDef{

}
function QueryResultsSection({}:QueryResultsSectionPropsDef){
    const queryInputRef=useRef<HTMLInputElement>(null);

    const [query,setQuery]=useState<string>("");
    const [paginatedRows,setpaginatedRows]=useState<FKDBPaginatedRowsDef|null>(null);
    const [page,setPage]=useState<number>(1);
    const [errorMsg,setErrorMsg]=useState<string>("");
    const colsNames:string[]=useMemo(()=>{
        if(!paginatedRows||paginatedRows.rows.length<1)return [];
        return Object.keys(paginatedRows.rows[0]);
    },[paginatedRows]);

    useEffect(()=>{
        if(queryInputRef.current)queryInputRef.current.focus();
        setErrorMsg("");
        if(query!==""){
            const queryResult:FKDBQueryResultDef=FKDBService.query(query);
            if(queryResult.success&&queryResult.selectResult){
                const _paginatedRows=FKDBService.paginateRows(queryResult.selectResult.rows,page,rowsPerPage);
                setpaginatedRows(_paginatedRows);
            }else{
                setErrorMsg(`Error executing the query! | ${queryResult.errorMsg}`);
            }
        }
    },[query,page]);

    // useEffect(()=>{
    //     if(queryInputRef.current)queryInputRef.current.focus();
    //     setErrorMsg("");
    //     if(query!==""){
    //         const queryResult:FKDBSelectResultDef|null=FKDBService.selectQuery(query);
    //         if(queryResult){
    //             const _paginatedRows=FKDBService.paginateRows(queryResult.rows,page,rowsPerPage);
    //             setpaginatedRows(_paginatedRows);
    //         }else{
    //             setErrorMsg("Error executing the query!");
    //         }
    //     }
    // },[query,page]);

    // functions
    function onQueryBtn(){
        if(queryInputRef.current){
            if(!queryInputRef.current.value.endsWith(";"))queryInputRef.current.value=queryInputRef.current.value+";";
            setQuery(queryInputRef.current.value);
        }
    }

    return (
        <div className="p-2 grow bg-lighter rounded overflow-y-auto">
            <div className='rounded overflow-hidden flex border border-semitrans'>
                <input ref={queryInputRef} type="text" className='basis-0 grow p-2 text-sm text-dark outline-none' placeholder='ex: select from users where id=1 offset 0 limit 1;' onKeyDown={(e)=>{if(e.key==="Enter")onQueryBtn()}} />
                <button onClick={onQueryBtn} className='p-2 bg-primary text-lighter text-sm hover:opacity-70'>query</button>
            </div>

            {errorMsg!==""&&
                <div className='w-full p-2 mt-2'>
                    <p className='text-sm text-error'>{errorMsg}</p>
                </div>
            }

            <div className='w-full p-2 mt-2'>
                <p className='text-sm text-info'>{paginatedRows?paginatedRows.rows.length:0} rows</p>
            </div>

            <div className='overflow-x-auto w-full mt-2'>
                {paginatedRows&&colsNames.length>0&&
                <table className="border p-2">
                    <thead>
                        <tr className="border">
                            {
                            colsNames.map((col,i)=>(
                                <th className="border px-2 md:px-8 text-dark" key={i}>{col}</th>
                            ))
                            }
                        </tr>
                    </thead>
                    <tbody>
                        {
                            paginatedRows!.rows.map((row,i)=>(    
                                <tr key={i}>
                                    {
                                        colsNames.map((col,j)=>(
                                            <td className="border p-1 text-dark text-sm" key={j}>
                                                <p>{String(row[col])}</p>
                                            </td>
                                        ))
                                    }
                                </tr>
                            ))
                        }
                    </tbody>
                </table>
                }
            </div>

            {/* // pagination */}
            {paginatedRows&&
            <div className="flex items-center justify-end gap-4 mt-4">
                <button className="px-2 py-1 text-sm underline text-dark disabled:opacity-70 disabled:cursor-not-allowed" disabled={paginatedRows?.prevPage==null} onClick={()=>setPage(page=>page-1)}>prev</button>
                <p className="text-dark">{page}/{paginatedRows?.pagesCount}</p>
                <button className="px-2 py-1 text-sm underline text-dark disabled:opacity-70 disabled:cursor-not-allowed" disabled={paginatedRows?.nextPage==null} onClick={()=>setPage(page=>page+1)}>next</button>
            </div>
            }
        </div>
    )
}

export default QueryResultsSection