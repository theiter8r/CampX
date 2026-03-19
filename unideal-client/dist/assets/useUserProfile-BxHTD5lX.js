import{v as r,I as s,o as u}from"./index-afO8EdP7.js";function n(){const{isSignedIn:e}=r();return s({queryKey:["userProfile"],queryFn:()=>u.get("/api/users/me"),enabled:!!e})}export{n as u};
