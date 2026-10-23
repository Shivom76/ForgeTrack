import UserCard from "../components/UserCard";
import {useState, useEffect} from "react";
import {api} from "../lib/api";

export default function UserPage(){
    const [users,setUsers]=useState([])
    const [error,setError]=useState("")

    useEffect(()=>{
        api("/users",{})
        .then((res)=>{
            setUsers(res.data)
        }).catch((err)=>{
            setError(err.message)
        })
    },[])

    return(
        <div>
            <h1>Users</h1>
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-30">
                {users.map((u)=>(
                    <UserCard heading={u.name} content={u.role} />
                ))}
            </div>
        </div>
    )
}