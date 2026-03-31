import axios from "axios";


 const ApiManager = axios.create({
    baseURL:"https://hoog.ng/infiniteorder/api/Customers",
    responseType:"json",
    withCredentials:true,
});

export default ApiManager;