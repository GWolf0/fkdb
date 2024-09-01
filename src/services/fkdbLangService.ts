/* Notes to self (for possible ambiguities)
    - the pointer is decremented each time a match failed.
    - the 'Pointer out of range' error is ignored because it is normal, as it is raised when the pointer is equals to the
    cmd length, ending the execution.
    - the optional matches don't raise errors
    - the FKDBQueryResultDef object contains the data needed to execute the adequate operation using the FKDBService.[cmdType]Query function
*/

import { FKDBQueryResultDef } from "../interfaces";

export default class FKDBLangService{
    static cmd:string;
    static p:number;
    static queryResult:FKDBQueryResultDef;

    static exec(cmd:string):FKDBQueryResultDef{
        FKDBLangService.cmd=cmd;
        FKDBLangService.p=0;
        FKDBLangService.queryResult={cmdType:"none",success:true,options:[]};
        console.log(`Attempt exec command '${cmd}'`);
        try{
            FKDBLangService.command();
        }catch(e){
            const err:Error=e as Error;
            // Ignore the error if it is 'pointer out of range' (means that pointer is >= cmd length)
            if(err.message!=="Pointer out of range"){
                console.log("_______________");
                console.info(`Error executing cmd: ${cmd}`);
                console.error(err.stack);
                console.error(err.message);
                console.log("_______________");
                FKDBLangService.queryResult.success=false;
                FKDBLangService.queryResult.errorMsg=err.message;
                // console.info(FKDBLangService.queryResult);
            }
        }finally{
            console.log('Query result:',FKDBLangService.queryResult);
            return FKDBLangService.queryResult;
        }
    }

    static error(msg:string){
        throw new Error(msg);
    }
    static expected(what:string){
        FKDBLangService.error(`Expected ${what} at position ${FKDBLangService.p} ${FKDBLangService.cmd[FKDBLangService.p]}`);
    }

    static char():string{
        const c=FKDBLangService.cmd[FKDBLangService.p++];
        if(!c)throw new Error(`Pointer out of range`);
        return c;
    }
    static term(optional:boolean=false):string{
        let c=FKDBLangService.char();
        let res="";
        while(new RegExp("[a-z0-9]+","gi").test(c)){
            res+=c;
            c=FKDBLangService.char();
        }
        FKDBLangService.p--;
        if(res===""&&!optional)FKDBLangService.expected("term");
        return res;
    }
    static num(optional:boolean=false):number{
        let c=FKDBLangService.char();
        let res="";
        while(new RegExp("[0-9]+","gi").test(c)){
            res+=c;
            c=FKDBLangService.char();
        }
        FKDBLangService.p--;
        if(res===""&&!optional)FKDBLangService.expected("number");
        return Number(res);
    }
    static str(optional:boolean=false):string{
        let c=FKDBLangService.char();
        let res="";
        if(c==="'"){
            do{
                res+=c;
                c=FKDBLangService.char();
            }while(c!=="'");
            res+="'";
        }
        FKDBLangService.p--;
        if(res===""&&!optional)FKDBLangService.expected("str");
        return res;
    }
    static operator(optional:boolean=false):string{
        let c=FKDBLangService.char();
        let res="";
        while(new RegExp("[.,><=!;]+","gi").test(c)){
            res+=c;
            c=FKDBLangService.char();
        }
        FKDBLangService.p--;
        if(res===""&&!optional)FKDBLangService.expected("operator");
        return res;
    }
    static whiteSpace(optional:boolean=false):string{
        let c=FKDBLangService.char();
        let res=c;
        if(res!==" "&&!optional)FKDBLangService.expected("white-space");
        return res;
    }

    static matchTerm(kw:string,optional:boolean=false):boolean{
        const res=FKDBLangService.term(optional);
        if(res!==kw&&!optional)FKDBLangService.expected(kw);
        if(res!==kw)FKDBLangService.p-=res.length+0;
        return res===kw;
    }
    static matchNumber(kw:number,optional:boolean=false):boolean{
        const res=FKDBLangService.num(optional);
        if(res!==kw&&!optional)FKDBLangService.expected(String(kw));
        if(res!==kw)FKDBLangService.p-=String(res).length+0;
        return res===kw;
    }
    static matchOperator(kw:string,optional:boolean=false):boolean{
        const res=FKDBLangService.operator(optional);
        if(res!==kw&&!optional)FKDBLangService.expected(kw);
        if(res!==kw)FKDBLangService.p-=res.length+0;
        return res===kw;
    }
    static matchWhiteSpace(optional:boolean=false):boolean{
        const res=FKDBLangService.whiteSpace(optional);
        if(res!==" ")FKDBLangService.p-=res.length+0;
        return res===" ";
    }

    static command(){
        FKDBLangService.select();
        FKDBLangService.matchOperator(";",true);
    }

    static select(){
        if(FKDBLangService.matchTerm("select")){
            FKDBLangService.matchWhiteSpace();
            FKDBLangService.matchTerm("from");
            FKDBLangService.matchWhiteSpace();
            const tableName:string=FKDBLangService.term();
            FKDBLangService.queryResult.cmdType="select";
            FKDBLangService.queryResult.options["tableName"]=tableName;
            if(FKDBLangService.matchWhiteSpace(true)){
                if(!FKDBLangService.where()){
                    FKDBLangService.p--; // return to whitespace
                }
            }
            if(FKDBLangService.matchWhiteSpace(true)){
                if(!FKDBLangService.offset()){
                    FKDBLangService.p--; // return to whitespace
                }
            }
            if(FKDBLangService.matchWhiteSpace(true)){
                FKDBLangService.limit();
            }
        }
    }
    static where():boolean{
        if(FKDBLangService.matchTerm("where",true)){
            FKDBLangService.matchWhiteSpace();
            FKDBLangService.condition();
            return true;
        }
        return false;
    }
    static condition(){
        let whereItems=[];
        let key=FKDBLangService.term();
        let op=FKDBLangService.operator();
        let val=FKDBLangService.term();
        whereItems.push({key,op,val});
        FKDBLangService.queryResult.options["whereItems"]=whereItems;
        while(FKDBLangService.matchOperator(",",true)){
            key=FKDBLangService.term();
            op=FKDBLangService.operator();
            val=FKDBLangService.term();
            whereItems.push({key,op,val});
            FKDBLangService.queryResult.options["whereItems"].push({key,op,val});
        }
    }
    static offset():boolean{
        if(FKDBLangService.matchTerm("offset",true)){
            FKDBLangService.matchWhiteSpace();
            const offsetValue:number=Number(FKDBLangService.term());
            FKDBLangService.queryResult.options["offset"]=offsetValue;
            return true;
        }
        return false;
    }
    static limit():boolean{
        if(FKDBLangService.matchTerm("limit",true)){
            FKDBLangService.matchWhiteSpace();
            const limitValue:number=Number(FKDBLangService.term());
            FKDBLangService.queryResult.options["limit"]=limitValue;
            return true;
        }
        return false;
    }

    // utils
    static getCurChar():string{return FKDBLangService.cmd[FKDBLangService.p];}

}
