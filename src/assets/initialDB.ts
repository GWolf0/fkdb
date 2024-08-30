import { FKDBDef } from "../interfaces";

const initialDB:FKDBDef={
    tables:[
        {
            id:1,
            lastInsertedID:5,
            name:"users",
            columns:[
                {id:1,name:"id",type:"id",},
                {id:2,name:"name",type:"string"},
                {id:3,name:"email",type:"string"},
                {id:4,name:"password",type:"string"}
            ],
            rows:[
                {id:1,name:"user1",email:"user1@email.com",password:"password123"},
                {id:2,name:"user2",email:"user2@email.com",password:"password123"},
                {id:3,name:"user3",email:"user3@email.com",password:"password123"},
                {id:4,name:"user4",email:"user4@email.com",password:"password123"},
                {id:5,name:"user5",email:"user5@email.com",password:"password123"},
            ]
        }
    ]
};

export default initialDB;
