import ApiManager from "./ApiManager";

export const user_login = async data =>{
    try {
        const result = await ApiManager("/login.php",{
            method:"POST",
            headers:{
                'content-type':"application/json"
            },
            data:data,
        });
        return result;
    } catch (error) {
        return error.response.data;
        
    }
};

export const userEmail_login = async data =>{
    try {
        const result = await ApiManager("/loginWithEmail.php",{
            method:"POST",
            headers:{
                'content-type':"application/json"
            },
            data:data,
        });
        return result;
    } catch (error) {
        return error.response.data;
        
    }
};
